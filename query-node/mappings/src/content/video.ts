/*
eslint-disable @typescript-eslint/naming-convention
*/
import { DatabaseManager, EventContext, StoreContext } from '@joystream/hydra-common'
import { VideoMetadata } from '@joystream/metadata-protobuf'
import { VideoId } from '@joystream/types/augment'
import {
  Channel,
  ChannelAssetsDeletedByModeratorEvent,
  NftIssuedEvent,
  StorageDataObject,
  Video,
  VideoAssetsDeletedByModeratorEvent,
  VideoDeletedByModeratorEvent,
  VideoDeletedEvent,
  VideoVisibilitySetByModeratorEvent,
} from 'query-node/dist/model'
import { In } from 'typeorm'
import { Content } from '../../generated/types'
import { deserializeMetadata, genericEventFields, inconsistentState, logger } from '../common'
import { getAllManagers } from '../derivedPropertiesManager/applications'
import { createNft } from './nft'
import {
  convertContentActor,
  convertContentActorToChannelOrNftOwner,
  processVideoMetadata,
  unsetAssetRelations,
  videoRelationsForCounters,
} from './utils'

/// //////////////// Video //////////////////////////////////////////////////////

export async function content_VideoCreated(ctx: EventContext & StoreContext): Promise<void> {
  const { store, event } = ctx
  // read event data
  const [actor, channelId, videoId, videoCreationParameters] = new Content.VideoCreatedEvent(event).params

  // load channel
  const channel = await store.get(Channel, {
    where: { id: channelId.toString() },
    relations: ['category', 'ownerMember', 'ownerCuratorGroup'],
  })

  // ensure channel exists
  if (!channel) {
    return inconsistentState('Trying to add video to non-existing channel', channelId)
  }

  const video = new Video({
    id: videoId.toString(),
    channel,
    isCensored: false,
    isFeatured: false,
    createdInBlock: event.blockNumber,
    createdAt: new Date(event.blockTimestamp),
    updatedAt: new Date(event.blockTimestamp),
  })
  // deserialize & process metadata
  if (videoCreationParameters.meta.isSome) {
    const metadata = deserializeMetadata(VideoMetadata, videoCreationParameters.meta.unwrap()) || {}
    await processVideoMetadata(ctx, video, metadata, videoCreationParameters.assets.unwrapOr(undefined))
  }

  // save video
  await store.save<Video>(video)

  if (videoCreationParameters.auto_issue_nft.isSome) {
    const issuanceParameters = videoCreationParameters.auto_issue_nft.unwrap()
    const nft = await createNft(store, video, issuanceParameters, event.blockNumber)

    const nftIssuedEvent = new NftIssuedEvent({
      ...genericEventFields(event),

      contentActor: await convertContentActor(store, actor),
      video,
      royalty: nft.creatorRoyalty,
      metadata: nft.metadata,
      // prepare Nft owner (handles fields `ownerMember` and `ownerCuratorGroup`)
      ...(await convertContentActorToChannelOrNftOwner(store, actor)),
    })

    await store.save<NftIssuedEvent>(nftIssuedEvent)
  }

  await getAllManagers(store).videos.onMainEntityCreation(video)

  // emit log event
  logger.info('Video has been created', { id: videoId })
}

export async function content_VideoUpdated(ctx: EventContext & StoreContext): Promise<void> {
  const { event, store } = ctx
  // read event data
  const [actor, videoId, videoUpdateParameters] = new Content.VideoUpdatedEvent(event).params

  // load video
  const video = await store.get(Video, {
    where: { id: videoId.toString() },
    relations: [...videoRelationsForCounters, 'license', 'channel.ownerMember', 'channel.ownerCuratorGroup'],
  })

  // ensure video exists
  if (!video) {
    return inconsistentState('Non-existing video update requested', videoId)
  }

  // prepare changed metadata
  const newMetadataBytes = videoUpdateParameters.new_meta.unwrapOr(null)

  // update metadata if it was changed
  if (newMetadataBytes) {
    const newMetadata = deserializeMetadata(VideoMetadata, newMetadataBytes) || {}
    await processVideoMetadata(ctx, video, newMetadata, videoUpdateParameters.assets_to_upload.unwrapOr(undefined))
  }

  // create nft if requested
  const issuanceParameters = videoUpdateParameters.auto_issue_nft.unwrapOr(null)
  if (issuanceParameters) {
    const nft = await createNft(store, video, issuanceParameters, event.blockNumber)

    // update the video
    video.nft = nft

    const nftIssuedEvent = new NftIssuedEvent({
      ...genericEventFields(event),

      contentActor: await convertContentActor(store, actor),
      video,
      royalty: nft.creatorRoyalty,
      metadata: nft.metadata,
      // prepare Nft owner (handles fields `ownerMember` and `ownerCuratorGroup`)
      ...(await convertContentActorToChannelOrNftOwner(store, actor)),
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
  logger.info('Video has been updated', { id: videoId })
}

export async function content_VideoDeleted({ store, event }: EventContext & StoreContext): Promise<void> {
  // read event data
  const [, videoId] = new Content.VideoDeletedEvent(event).params

  await deleteVideo(store, videoId)

  // common event processing - second

  const videoDeletedEvent = new VideoDeletedEvent({
    ...genericEventFields(event),

    videoId: Number(videoId),
  })

  await store.save<VideoDeletedEvent>(videoDeletedEvent)
}

export async function content_VideoAssetsDeletedByModerator({
  store,
  event,
}: EventContext & StoreContext): Promise<void> {
  const [actor, videoId, dataObjectIds, areNftAssets, rationale] = new Content.VideoAssetsDeletedByModeratorEvent(
    event
  ).params

  const assets = await store.getMany(StorageDataObject, {
    where: {
      id: In(Array.from(dataObjectIds).map((item) => item.toString())),
    },
  })

  await Promise.all(assets.map((a) => unsetAssetRelations(store, a)))
  logger.info('Video assets have been removed', { ids: dataObjectIds })

  // common event processing - second

  const videoAssetsDeletedByModeratorEvent = new VideoAssetsDeletedByModeratorEvent({
    ...genericEventFields(event),

    // load video
    videoId: videoId.toNumber(),
    assetIds: Array.from(dataObjectIds).map((item) => Number(item)),
    rationale: rationale.toHuman() as string,
    actor: await convertContentActor(store, actor),
    areNftAssets: areNftAssets.valueOf(),
  })

  await store.save<VideoAssetsDeletedByModeratorEvent>(videoAssetsDeletedByModeratorEvent)
}

export async function content_VideoDeletedByModerator({ store, event }: EventContext & StoreContext): Promise<void> {
  // read event data
  const [actor, videoId, rationale] = new Content.VideoDeletedByModeratorEvent(event).params

  await deleteVideo(store, videoId)

  // common event processing - second

  const videoDeletedByModeratorEvent = new VideoDeletedByModeratorEvent({
    ...genericEventFields(event),

    videoId: Number(videoId),
    rationale: rationale.toHuman() as string,
    actor: await convertContentActor(store, actor),
  })

  await store.save<VideoDeletedByModeratorEvent>(videoDeletedByModeratorEvent)
}

export async function content_VideoVisibilitySetByModerator({
  store,
  event,
}: EventContext & StoreContext): Promise<void> {
  // read event data
  const [actor, videoId, isCensored, rationale] = new Content.VideoVisibilitySetByModeratorEvent(event).params

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

  // common event processing - second

  const videoVisibilitySetByModeratorEvent = new VideoVisibilitySetByModeratorEvent({
    ...genericEventFields(event),

    videoId: videoId.toNumber(),
    isHidden: isCensored.isTrue,
    rationale: rationale.toHuman() as string,
    actor: await convertContentActor(store, actor),
  })

  await store.save<VideoVisibilitySetByModeratorEvent>(videoVisibilitySetByModeratorEvent)
}

async function deleteVideo(store: DatabaseManager, videoId: VideoId) {
  // load video
  const video = await store.get(Video, {
    where: { id: videoId.toString() },
    relations: [...videoRelationsForCounters],
  })

  // ensure video exists
  if (!video) {
    return inconsistentState('Non-existing video deletion requested', videoId)
  }

  // update video active counters
  await getAllManagers(store).videos.onMainEntityDeletion(video)

  // remove video
  await store.remove<Video>(video)

  // emit log event
  logger.info('Video has been deleted', { id: videoId })
}
