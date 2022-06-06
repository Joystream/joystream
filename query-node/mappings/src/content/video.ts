/*
eslint-disable @typescript-eslint/naming-convention
*/
import { DatabaseManager, EventContext, StoreContext } from '@joystream/hydra-common'
import { In, getManager } from 'typeorm'
import { Content } from '../../generated/types'
import { deserializeMetadata, EntityType, genericEventFields, inconsistentState, logger } from '../common'
import {
  processVideoMetadata,
  videoRelationsForCounters,
  convertContentActorToChannelOrNftOwner,
  convertContentActor,
} from './utils'
import {
  Channel,
  NftIssuedEvent,
  Video,
  VideoCategory,
  CommentReaction,
  Comment,
  VideoReaction,
  VideoReactionsCountByReactionType,
  CommentReactionsCountByReactionId,
  VideoReactedEvent,
  CommentReactedEvent,
  CommentCreatedEvent,
  CommentTextUpdatedEvent,
  CommentDeletedEvent,
  CommentModeratedEvent,
  CommentPinnedEvent,
  VideoReactionsPreferenceEvent,
} from 'query-node/dist/model'
import { VideoMetadata, VideoCategoryMetadata } from '@joystream/metadata-protobuf'
import { integrateMeta } from '@joystream/metadata-protobuf/utils'
import _ from 'lodash'
import { createNft } from './nft'
import { getAllManagers } from '../derivedPropertiesManager/applications'

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
    isCommentSectionEnabled: true,
    isReactionFeatureEnabled: true,
    commentsCount: 0,
    reactionsCount: 0,
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

  // TODO: remove manual deletion of referencing records after
  // TODO: https://github.com/Joystream/hydra/issues/490 has been implemented

  await removeVideoReferencingRelations(store, videoId.toString())

  // remove video
  await store.remove<Video>(video)

  // emit log event
  logger.info('Video has been deleted', { id: videoId })
}

async function removeVideoReferencingRelations(store: DatabaseManager, videoId: string): Promise<void> {
  const loadReferencingEntities = async <T>(store: DatabaseManager, entityType: EntityType<T>, videoId: string) => {
    return await store.getMany(entityType, {
      where: { video: { id: videoId } },
    })
  }

  /**
   * Referencing Entities
   */
  // get referencing CommentReaction
  const referencingCommentReactions = await loadReferencingEntities(store, CommentReaction, videoId)
  // get referencing VideoReaction
  const referencingVideoReactions = await loadReferencingEntities(store, VideoReaction, videoId)
  // get referencing VideoReactionsCountByReactionType
  const referencingVideoReactionsCountByReactionTypes = await loadReferencingEntities(
    store,
    VideoReactionsCountByReactionType,
    videoId
  )
  // get referencing CommentReactionsCountByReactionId
  const referencingCommentReactionsCountByReactionIds = await loadReferencingEntities(
    store,
    CommentReactionsCountByReactionId,
    videoId
  )
  // get referencing Comments
  const referencingComments = await loadReferencingEntities(store, Comment, videoId)

  /**
   * Referencing Event Entities
   */
  // referencing VideoReactedEvent
  const referencingVideoReactedEvents = await loadReferencingEntities(store, VideoReactedEvent, videoId)
  // referencing CommentReactedEvent
  const referencingCommentReactedEvents = await loadReferencingEntities(store, CommentReactedEvent, videoId)
  // referencing CommentCreatedEvent
  const referencingCommentCreatedEvents = await loadReferencingEntities(store, CommentCreatedEvent, videoId)
  // referencing CommentTextUpdatedEvent
  const referencingCommentTextUpdatedEvents = await loadReferencingEntities(store, CommentTextUpdatedEvent, videoId)
  // referencing CommentDeletedEvent
  const referencingCommentDeletedEvents = await loadReferencingEntities(store, CommentDeletedEvent, videoId)
  // referencing CommentModeratedEvent
  const referencingCommentModeratedEvents = await loadReferencingEntities(store, CommentModeratedEvent, videoId)
  // referencing CommentPinnedEvent
  const referencingCommentPinnedEvents = await loadReferencingEntities(store, CommentPinnedEvent, videoId)
  // referencing VideoReactionsPreferenceEvent
  const referencingVideoReactionsPreferenceEvents = await loadReferencingEntities(
    store,
    VideoReactionsPreferenceEvent,
    videoId
  )

  const removeRelations = async <T>(store: DatabaseManager, entities: T[]) => {
    await Promise.all(entities.map(async (r) => await store.remove<T>(r)))
  }

  // remove referencing records
  await removeRelations(store, referencingCommentReactions)
  await removeRelations(store, referencingVideoReactions)
  await removeRelations(store, referencingVideoReactionsCountByReactionTypes)
  await removeRelations(store, referencingCommentReactionsCountByReactionIds)
  await removeRelations(store, referencingVideoReactedEvents)
  await removeRelations(store, referencingCommentReactedEvents)
  await removeRelations(store, referencingCommentCreatedEvents)
  await removeRelations(store, referencingCommentTextUpdatedEvents)
  await removeRelations(store, referencingCommentDeletedEvents)
  await removeRelations(store, referencingCommentModeratedEvents)
  await removeRelations(store, referencingCommentPinnedEvents)
  await removeRelations(store, referencingVideoReactionsPreferenceEvents)

  // first delete all replies (where parentCommentId!==null), then top level comments
  for (const comment of referencingComments) {
    // find all comments(replies) where `comment` is parent comment
    const replies = await store.getMany(Comment, { where: { parentComment: { id: comment.id } } })
    await Promise.all(replies.map(async (r) => await store.remove<Comment>(r)))
    // remove comment
    await store.remove<Comment>(comment)
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
