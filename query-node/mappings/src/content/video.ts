/*
eslint-disable @typescript-eslint/naming-convention
*/
import { EventContext, StoreContext } from '@joystream/hydra-common'
import { In } from 'typeorm'
import { Content } from '../../generated/types'
import { deserializeMetadata, genericEventFields, inconsistentState, logger } from '../common'
import {
  processVideoMetadata,
  videoRelationsForCounters,
  convertContentActorToChannelOrNftOwner,
  convertContentActor,
  processPlaylistMetadata,
} from './utils'
import {
  Channel,
  NftIssuedEvent,
  Playlist,
  PlaylistCreatedEvent,
  PlaylistDeletedEvent,
  PlaylistUpdatedEvent,
  PlaylistVideo,
  Video,
  VideoCategory,
} from 'query-node/dist/model'
import {
  VideoCategoryMetadata,
  ContentMetadata,
  IVideoMetadata,
  IPlaylistMetadata,
  VideoMetadata,
  IContentMetadata,
} from '@joystream/metadata-protobuf'
import { integrateMeta, isSet } from '@joystream/metadata-protobuf/utils'
import _ from 'lodash'
import { createNft } from './nft'
import { getAllManagers } from '../derivedPropertiesManager/applications'
import { DecodedMetadataObject } from '@joystream/metadata-protobuf/types'
import * as joystreamTypes from '@joystream/types/augment/all/types'
import { ChannelId } from '@joystream/types/common'
import { VideoId } from '@joystream/types/content'

interface ContentCreatedEventData {
  contentActor: joystreamTypes.ContentActor
  channelId: ChannelId
  contentId: VideoId // eventually this would be generic `Content` type in runtime
  contentCreationParameters: joystreamTypes.VideoCreationParameters
}

interface ContentUpdatedEventData {
  contentActor: joystreamTypes.ContentActor
  contentId: VideoId // eventually this would be generic `Content` type in runtime
  contentUpdateParameters: joystreamTypes.VideoUpdateParameters
}

export async function content_VideoCategoryCreated({ store, event }: EventContext & StoreContext): Promise<void> {
  // read event data
  const [, videoCategoryId, videoCategoryCreationParameters] = new Content.VideoCategoryCreatedEvent(event).params

  // read metadata
  const metadata = (await deserializeMetadata(VideoCategoryMetadata, videoCategoryCreationParameters.meta)) || {}

  // create new video category
  const videoCategory = new VideoCategory({
    // main data
    id: videoCategoryId.toString(),
    videos: [],
    createdInBlock: event.blockNumber,
    activeVideosCounter: 0,

    // fill in auto-generated fields
    createdAt: new Date(event.blockTimestamp),
    updatedAt: new Date(event.blockTimestamp),
  })
  integrateMeta(videoCategory, metadata, ['name'])

  // save video category
  await store.save<VideoCategory>(videoCategory)

  // emit log event
  logger.info('Video category has been created', { id: videoCategoryId })
}

export async function content_VideoCategoryUpdated({ store, event }: EventContext & StoreContext): Promise<void> {
  // read event data
  const [, videoCategoryId, videoCategoryUpdateParameters] = new Content.VideoCategoryUpdatedEvent(event).params

  // load video category
  const videoCategory = await store.get(VideoCategory, {
    where: { id: videoCategoryId.toString() },
  })

  // ensure video category exists
  if (!videoCategory) {
    return inconsistentState('Non-existing video category update requested', videoCategoryId)
  }

  // read metadata
  const newMeta = deserializeMetadata(VideoCategoryMetadata, videoCategoryUpdateParameters.new_meta) || {}
  integrateMeta(videoCategory, newMeta, ['name'])

  // set last update time
  videoCategory.updatedAt = new Date(event.blockTimestamp)

  // save video category
  await store.save<VideoCategory>(videoCategory)

  // emit log event
  logger.info('Video category has been updated', { id: videoCategoryId })
}

export async function content_VideoCategoryDeleted({ store, event }: EventContext & StoreContext): Promise<void> {
  // read event data
  const [, videoCategoryId] = new Content.VideoCategoryDeletedEvent(event).params

  // load video category
  const videoCategory = await store.get(VideoCategory, {
    where: { id: videoCategoryId.toString() },
  })

  // ensure video category exists
  if (!videoCategory) {
    return inconsistentState('Non-existing video category deletion requested', videoCategoryId)
  }

  // remove video category
  await store.remove<VideoCategory>(videoCategory)

  // emit log event
  logger.info('Video category has been deleted', { id: videoCategoryId })
}

/// //////////////// Video //////////////////////////////////////////////////////

export async function content_ContentCreated(ctx: EventContext & StoreContext): Promise<void> {
  const { store, event } = ctx
  // read event data
  const [contentActor, channelId, contentId, contentCreationParameters] = new Content.VideoCreatedEvent(event).params
  const { meta } = contentCreationParameters

  const contentCreatedEventData: ContentCreatedEventData = {
    contentActor,
    channelId,
    contentId,
    contentCreationParameters,
  }

  // load channel
  const channel = await store.get(Channel, {
    where: { id: channelId.toString() },
    relations: ['category', 'ownerMember', 'ownerCuratorGroup'],
  })

  // ensure channel exists
  if (!channel) {
    return inconsistentState('Trying to add video to non-existing channel', channelId)
  }

  // deserialize & process metadata
  const metadata = meta.isSome
    ? deserializeMetadata(ContentMetadata, meta.unwrap()) || deserializeMetadata(VideoMetadata, meta.unwrap())
    : undefined

  const asContentMetadata = metadata as DecodedMetadataObject<IContentMetadata> | undefined

  // Content Creation Preference
  // 1. metadata == `PlaylistMetadata` -> create Playlist
  // 2. metadata == `VideoMetadata` || undefined -> create Video

  if (asContentMetadata && asContentMetadata.playlistMetadata) {
    await processCreatePlaylistMessage(ctx, channel, asContentMetadata.playlistMetadata, contentCreatedEventData)
    return
  }

  await processCreateVideoMessage(
    ctx,
    channel,
    asContentMetadata?.videoMetadata || (metadata as DecodedMetadataObject<IVideoMetadata>),
    contentCreatedEventData
  )
}

export async function processCreateVideoMessage(
  ctx: EventContext & StoreContext,
  channel: Channel,
  metadata: DecodedMetadataObject<IVideoMetadata> | undefined,
  contentCreatedEventData: ContentCreatedEventData
): Promise<void> {
  const { store, event } = ctx
  const { contentActor, contentId, contentCreationParameters } = contentCreatedEventData

  const video = new Video({
    id: contentId.toString(),
    channel,
    isCensored: false,
    isFeatured: false,
    createdInBlock: event.blockNumber,
    createdAt: new Date(event.blockTimestamp),
    updatedAt: new Date(event.blockTimestamp),
  })

  if (metadata) {
    await processVideoMetadata(ctx, video, metadata, contentCreationParameters.assets.unwrapOr(undefined))
  }

  // save video
  await store.save<Video>(video)

  if (contentCreationParameters.auto_issue_nft.isSome) {
    const issuanceParameters = contentCreationParameters.auto_issue_nft.unwrap()
    const nft = await createNft(store, video, issuanceParameters, event.blockNumber)

    const nftIssuedEvent = new NftIssuedEvent({
      ...genericEventFields(event),

      contentActor: await convertContentActor(store, contentActor),
      video,
      royalty: nft.creatorRoyalty,
      metadata: nft.metadata,
      // prepare Nft owner (handles fields `ownerMember` and `ownerCuratorGroup`)
      ...(await convertContentActorToChannelOrNftOwner(store, contentActor)),
    })

    await store.save<NftIssuedEvent>(nftIssuedEvent)
  }

  await getAllManagers(store).videos.onMainEntityCreation(video)

  // emit log event
  logger.info('Video has been created', { id: contentId })
}

export async function processCreatePlaylistMessage(
  ctx: EventContext & StoreContext,
  channel: Channel,
  metadata: DecodedMetadataObject<IPlaylistMetadata>,
  contentCreatedEventData: ContentCreatedEventData
): Promise<void> {
  const { store, event } = ctx
  const { contentActor, contentId, contentCreationParameters } = contentCreatedEventData

  const playlist = new Playlist({
    id: contentId.toString(),
    channel,
    createdAt: new Date(event.blockTimestamp),
    updatedAt: new Date(event.blockTimestamp),
  })

  await processPlaylistMetadata(ctx, playlist, metadata, contentCreationParameters.assets.unwrapOr(undefined))

  // save playlist
  await store.save<Playlist>(playlist)

  // common event processing

  // TODO: uncomment after https://github.com/Joystream/hydra/issues/490 has been implemented

  // const playlistCreatedEvent = new PlaylistCreatedEvent({
  //   ...genericEventFields(event),

  //   playlist,
  //   contentActor: await convertContentActor(store, contentActor),
  // })

  // await store.save<PlaylistCreatedEvent>(playlistCreatedEvent)
}

export async function content_ContentUpdated(ctx: EventContext & StoreContext): Promise<void> {
  const { store, event } = ctx
  // read event data
  const [contentActor, contentId, contentUpdateParameters] = new Content.VideoUpdatedEvent(event).params
  const { new_meta } = contentUpdateParameters

  const contentUpdatedEventData: ContentUpdatedEventData = {
    contentActor,
    contentId,
    contentUpdateParameters,
  }

  // load video
  const video = await store.get(Video, {
    where: { id: contentId.toString() },
    relations: [...videoRelationsForCounters, 'license', 'channel.ownerMember', 'channel.ownerCuratorGroup'],
  })

  if (video) {
    const videoMetadata = new_meta.isSome
      ? deserializeMetadata(ContentMetadata, new_meta.unwrap())?.videoMetadata ||
        deserializeMetadata(VideoMetadata, new_meta.unwrap())
      : undefined

    await processUpdateVideoMessage(ctx, video, videoMetadata || undefined, contentUpdatedEventData)
    return
  }

  // load playlist
  const playlist = await store.get(Playlist, {
    where: { id: contentId.toString() },
  })

  if (playlist) {
    const playlistMetadata = new_meta.isSome
      ? deserializeMetadata(ContentMetadata, new_meta.unwrap())?.playlistMetadata
      : undefined

    await processUpdatePlaylistMessage(ctx, playlist, playlistMetadata || undefined, contentUpdatedEventData)
    return
  }

  inconsistentState('Non-existing content update requested', contentId)
}

export async function processUpdateVideoMessage(
  ctx: EventContext & StoreContext,
  video: Video,
  metadata: DecodedMetadataObject<IVideoMetadata> | undefined,
  contentUpdatedEventData: ContentUpdatedEventData
): Promise<void> {
  const { store, event } = ctx
  const { contentActor, contentId, contentUpdateParameters } = contentUpdatedEventData

  if (metadata)
    await processVideoMetadata(ctx, video, metadata, contentUpdateParameters.assets_to_upload.unwrapOr(undefined))

  // create nft if requested
  const issuanceParameters = contentUpdateParameters.auto_issue_nft.unwrapOr(null)
  if (issuanceParameters) {
    const nft = await createNft(store, video, issuanceParameters, event.blockNumber)

    // update the video
    video.nft = nft

    const nftIssuedEvent = new NftIssuedEvent({
      ...genericEventFields(event),

      contentActor: await convertContentActor(store, contentActor),
      video,
      royalty: nft.creatorRoyalty,
      metadata: nft.metadata,
      // prepare Nft owner (handles fields `ownerMember` and `ownerCuratorGroup`)
      ...(await convertContentActorToChannelOrNftOwner(store, contentActor)),
    })

    await store.save<NftIssuedEvent>(nftIssuedEvent)
  }

  // set last update time
  video.updatedAt = new Date(event.blockTimestamp)

  // update video active counters
  await getAllManagers(store).videos.onMainEntityUpdate(video)

  // save video
  await store.save<Video>(video)

  // emit log event
  logger.info('Video has been updated', { id: contentId })
}

export async function processUpdatePlaylistMessage(
  ctx: EventContext & StoreContext,
  playlist: Playlist,
  metadata: DecodedMetadataObject<IPlaylistMetadata> | undefined,
  contentUpdatedEventData: ContentUpdatedEventData
): Promise<void> {
  const { store, event } = ctx
  const { contentActor, contentId, contentUpdateParameters } = contentUpdatedEventData

  if (metadata)
    await processPlaylistMetadata(ctx, playlist, metadata, contentUpdateParameters.assets_to_upload.unwrapOr(undefined))

  // save playlist
  await store.save<Playlist>(playlist)

  // common event processing

  // TODO: uncomment after https://github.com/Joystream/hydra/issues/490 has been implemented

  // const playlistUpdatedEvent = new PlaylistUpdatedEvent({
  //   ...genericEventFields(event),

  //   playlist,
  //   contentActor: await convertContentActor(store, contentActor),
  // })

  // await store.save<PlaylistUpdatedEvent>(playlistUpdatedEvent)
}

export async function content_ContentDeleted({ store, event }: EventContext & StoreContext): Promise<void> {
  // read event data
  const [contentActor, contentId] = new Content.VideoDeletedEvent(event).params

  // load video
  const video = await store.get(Video, {
    where: { id: contentId.toString() },
    relations: [...videoRelationsForCounters],
  })

  // load playlist
  const playlist = await store.get(Playlist, {
    where: { id: contentId.toString() },
  })

  if (video) {
    // update video active counters
    await getAllManagers(store).videos.onMainEntityDeletion(video)

    // remove video
    await store.remove<Video>(video)

    // emit log event
    logger.info('Video has been deleted', { id: contentId })
  } else if (playlist) {
    // TODO: remove following block after https://github.com/Joystream/hydra/issues/490 has been implemented

    // first remove all PlaylistVideo records referencing the deleted playlist
    const playlistVideos = await store.getMany(PlaylistVideo, { where: { playlist: { id: playlist.id } } })
    for (const video of playlistVideos) {
      await store.remove<PlaylistVideo>(video)
    }

    // remove playlist
    await store.remove<Playlist>(playlist)

    // common event processing

    const playlistDeletedEvent = new PlaylistDeletedEvent({
      ...genericEventFields(event),

      deletedPlaylistId: contentId.toString(),
      contentActor: await convertContentActor(store, contentActor),
    })

    await store.save<PlaylistDeletedEvent>(playlistDeletedEvent)
  } else {
    inconsistentState('Non-existing content(video or playlist) deletion requested', contentId)
  }
}

export async function content_VideoCensorshipStatusUpdated({
  store,
  event,
}: EventContext & StoreContext): Promise<void> {
  // read event data
  const [, videoId, isCensored] = new Content.VideoCensorshipStatusUpdatedEvent(event).params

  // load video
  const video = await store.get(Video, {
    where: { id: videoId.toString() },
    relations: [...videoRelationsForCounters],
  })

  // ensure video exists
  if (!video) {
    return inconsistentState('Non-existing video censoring requested', videoId)
  }

  // update video
  video.isCensored = isCensored.isTrue

  // set last update time
  video.updatedAt = new Date(event.blockTimestamp)

  // update video active counters
  await getAllManagers(store).videos.onMainEntityUpdate(video)

  // save video
  await store.save<Video>(video)

  // emit log event
  logger.info('Video censorship status has been updated', { id: videoId, isCensored: isCensored.isTrue })
}

export async function content_FeaturedVideosSet({ store, event }: EventContext & StoreContext): Promise<void> {
  // read event data
  const [, videoIds] = new Content.FeaturedVideosSetEvent(event).params

  // load old featured videos
  const existingFeaturedVideos = await store.getMany(Video, { where: { isFeatured: true } })

  // comparsion utility
  const isSame = (videoIdA: string) => (videoIdB: string) => videoIdA === videoIdB

  // calculate diff sets
  const videosToRemove = existingFeaturedVideos.filter(
    (existingFV) => !videoIds.map((videoId) => videoId.toString()).some(isSame(existingFV.id))
  )
  const videoIdsToAdd = videoIds.filter(
    (videoId) => !existingFeaturedVideos.map((existingFV) => existingFV.id).some(isSame(videoId.toString()))
  )

  // mark previously featured videos as not-featured
  await Promise.all(
    videosToRemove.map(async (video) => {
      video.isFeatured = false
      // set last update time
      video.updatedAt = new Date(event.blockTimestamp)

      await store.save<Video>(video)
    })
  )

  // read previously not-featured videos that are meant to be featured
  const videosToAdd = await store.getMany(Video, {
    where: {
      id: In(videoIdsToAdd.map((item) => item.toString())),
    },
  })

  if (videosToAdd.length !== videoIdsToAdd.length) {
    // Do not throw, as this is not validated by the runtime
    console.warn(
      'Non-existing video(s) in featuredVideos set:',
      _.difference(
        videoIdsToAdd.map((v) => v.toString()),
        videosToAdd.map((v) => v.id)
      )
    )
  }

  // mark previously not-featured videos as featured
  await Promise.all(
    videosToAdd.map(async (video) => {
      video.isFeatured = true

      // set last update time
      video.updatedAt = new Date(event.blockTimestamp)

      await store.save<Video>(video)
    })
  )

  // emit log event
  const addedVideoIds = videosToAdd.map((v) => v.id)
  const removedVideoIds = videosToRemove.map((v) => v.id)
  logger.info('Featured videos have been updated', { addedVideoIds, removedVideoIds })
}
