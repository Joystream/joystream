/*
eslint-disable @typescript-eslint/naming-convention
*/
import { DatabaseManager, EventContext, StoreContext } from '@joystream/hydra-common'
import { VideoMetadata } from '@joystream/metadata-protobuf'
import { BaseModel } from '@joystream/warthog'
import { FindOptionsWhere } from 'typeorm'
import {
  Channel,
  Comment,
  CommentCreatedEvent,
  CommentDeletedEvent,
  CommentModeratedEvent,
  CommentPinnedEvent,
  CommentReactedEvent,
  CommentReaction,
  CommentReactionsCountByReactionId,
  CommentTextUpdatedEvent,
  NftIssuedEvent,
  Video,
  VideoReactedEvent,
  VideoReaction,
  VideoReactionsCountByReactionType,
  VideoReactionsPreferenceEvent,
} from 'query-node/dist/model'
import { Content } from '../../generated/types'
import { deserializeMetadata, genericEventFields, inconsistentState, logger } from '../common'
import { getAllManagers } from '../derivedPropertiesManager/applications'
import { createNft } from './nft'
import {
  convertContentActor,
  convertContentActorToChannelOrNftOwner,
  processVideoMetadata,
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

  if (videoCreationParameters.autoIssueNft.isSome) {
    const issuanceParameters = videoCreationParameters.autoIssueNft.unwrap()
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
  const newMetadataBytes = videoUpdateParameters.newMeta.unwrapOr(null)

  // update metadata if it was changed
  if (newMetadataBytes) {
    const newMetadata = deserializeMetadata(VideoMetadata, newMetadataBytes) || {}
    await processVideoMetadata(ctx, video, newMetadata, videoUpdateParameters.assetsToUpload.unwrapOr(undefined))
  }

  // create nft if requested
  const issuanceParameters = videoUpdateParameters.autoIssueNft.unwrapOr(null)
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
  const loadReferencingEntities = async <T extends BaseModel & { video: Partial<Video> }>(
    store: DatabaseManager,
    entityType: { new (): T },
    videoId: string
  ) => {
    return await store.getMany(entityType, {
      where: { video: { id: videoId } } as FindOptionsWhere<T>,
    })
  }

  const removeRelations = async <T>(store: DatabaseManager, entities: T[]) => {
    await Promise.all(entities.map(async (r) => await store.remove<T>(r)))
  }

  // Entities in the list should be removed in the order. i.e. all `Comment` relations
  // should be removed in the last after all other referencing relations has been removed
  const referencingEntities: typeof BaseModel[] = [
    CommentReaction,
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
    Comment,
  ]

  const referencingRecords = await Promise.all(
    referencingEntities.map(async (entity) => await loadReferencingEntities(store, entity as any, videoId))
  )

  // beacuse of parentComment references among comments, their deletion must be handled saperately
  const referencingComments = referencingRecords.pop()!

  // remove all referencing records except comments
  for (const records of referencingRecords) {
    await removeRelations(store, records)
  }

  // first delete all replies (where parentCommentId!==null), then top level comments
  for (const comment of referencingComments) {
    // find all comments(replies) where `comment` is parent comment
    const replies = await store.getMany(Comment, { where: { parentComment: { id: comment.id } } })
    await Promise.all(replies.map(async (r) => await store.remove<Comment>(r)))
    // remove comment
    await store.remove<Comment>(comment)
  }
}
