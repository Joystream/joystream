/*
eslint-disable @typescript-eslint/naming-convention
*/
import { DatabaseManager, EventContext, StoreContext } from '@joystream/hydra-common'
import { generateAppActionCommitment } from '@joystream/js/utils'
import { AppAction, AppActionMetadata, ContentMetadata, IAppAction, IVideoMetadata } from '@joystream/metadata-protobuf'
import { DecodedMetadataObject } from '@joystream/metadata-protobuf/types'
import { integrateMeta } from '@joystream/metadata-protobuf/utils'
import { ChannelId, DataObjectId, VideoId } from '@joystream/types/primitives'
import { BaseModel } from '@joystream/warthog'
import { BTreeSet } from '@polkadot/types'
import {
  PalletContentPermissionsContentActor as ContentActor,
  PalletContentVideoCreationParametersRecord as VideoCreationParameters,
  PalletContentVideoUpdateParametersRecord as VideoUpdateParameters,
} from '@polkadot/types/lookup'
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
  StorageDataObject,
  Video,
  VideoAssetsDeletedByModeratorEvent,
  VideoDeletedByModeratorEvent,
  VideoDeletedEvent,
  VideoReactedEvent,
  VideoReaction,
  VideoReactionsCountByReactionType,
  VideoReactionsPreferenceEvent,
  VideoSubtitle,
  VideoVisibilitySetByModeratorEvent,
} from 'query-node/dist/model'
import { FindOptionsWhere, In } from 'typeorm'
import {
  Content_VideoAssetsDeletedByModeratorEvent_V1001 as VideoAssetsDeletedByModeratorEvent_V1001,
  Content_VideoCreatedEvent_V1001 as VideoCreatedEvent_V1001,
  Content_VideoDeletedByModeratorEvent_V1001 as VideoDeletedByModeratorEvent_V1001,
  Content_VideoDeletedEvent_V1001 as VideoDeletedEvent_V1001,
  Content_VideoUpdatedEvent_V1001 as VideoUpdatedEvent_V1001,
  Content_VideoVisibilitySetByModeratorEvent_V1001 as VideoVisibilitySetByModeratorEvent_V1001,
} from '../../generated/types'
import { RelationsArr, bytesToString, deserializeMetadata, genericEventFields, getByIdOrFail, logger } from '../common'
import { getAllManagers } from '../derivedPropertiesManager/applications'
import { createNft } from './nft'
import {
  convertContentActor,
  convertContentActorToChannelOrNftOwner,
  processAppActionMetadata,
  processVideoMetadata,
  u8aToBytes,
  unsetAssetRelations,
  videoRelationsForCounters,
} from './utils'

interface ContentCreatedEventData {
  contentActor: ContentActor
  channelId: ChannelId
  contentId: VideoId // eventually this would be generic `Content` type in runtime
  contentCreationParameters: VideoCreationParameters
  newDataObjectIds: BTreeSet<DataObjectId>
}

interface ContentUpdatedEventData {
  contentActor: ContentActor
  contentId: VideoId // eventually this would be generic `Content` type in runtime
  contentUpdateParameters: VideoUpdateParameters
  newDataObjectIds: BTreeSet<DataObjectId>
}

/// //////////////// Video //////////////////////////////////////////////////////

export async function content_ContentCreated(ctx: EventContext & StoreContext): Promise<void> {
  const { store, event } = ctx
  // read event data
  const [contentActor, channelId, contentId, contentCreationParameters, newDataObjectIds] = new VideoCreatedEvent_V1001(
    event
  ).params
  const { meta } = contentCreationParameters

  const contentCreatedEventData: ContentCreatedEventData = {
    contentActor,
    channelId,
    contentId,
    contentCreationParameters,
    newDataObjectIds,
  }

  // load channel
  const channel = await getByIdOrFail(store, Channel, channelId.toString(), ['ownerMember', 'ownerCuratorGroup'])

  // deserialize & process metadata
  const appAction = meta.isSome ? deserializeMetadata(AppAction, meta.unwrap(), { skipWarning: true }) : undefined
  // Content Creation Preference
  // 1. metadata == `VideoMetadata` || undefined -> create Video
  // 1. metadata == `PlaylistMetadata` -> create Playlist (Not Supported Yet)
  if (appAction) {
    await processCreateVideoMessage(ctx, channel, appAction, contentCreatedEventData)
  } else {
    const contentMetadata = meta.isSome ? deserializeMetadata(ContentMetadata, meta.unwrap()) : undefined
    await processCreateVideoMessage(ctx, channel, contentMetadata?.videoMetadata ?? undefined, contentCreatedEventData)
  }
}

export async function processCreateVideoMessage(
  ctx: EventContext & StoreContext,
  channel: Channel,
  metadata: DecodedMetadataObject<IAppAction> | DecodedMetadataObject<IVideoMetadata> | undefined,
  contentCreatedEventData: ContentCreatedEventData
): Promise<void> {
  const { store, event } = ctx
  const { contentActor, contentId, contentCreationParameters, newDataObjectIds } = contentCreatedEventData

  const video = new Video({
    id: contentId.toString(),
    channel,
    isCensored: false,
    createdInBlock: event.blockNumber,
    isCommentSectionEnabled: true,
    isReactionFeatureEnabled: true,
    videoStateBloatBond: contentCreationParameters.expectedVideoStateBloatBond,
    commentsCount: 0,
    reactionsCount: 0,
  })

  if (metadata && 'appId' in metadata) {
    const contentMetadataBytes = u8aToBytes(metadata.rawAction)
    const videoMetadata = deserializeMetadata(ContentMetadata, contentMetadataBytes)?.videoMetadata ?? {}
    const appActionMetadataBytes = metadata.metadata ? u8aToBytes(metadata.metadata) : undefined

    const expectedCommitment = generateAppActionCommitment(
      channel.totalVideosCreated,
      channel.id,
      AppAction.ActionType.CREATE_VIDEO,
      AppAction.CreatorType.CHANNEL,
      contentCreationParameters.assets.toU8a(),
      metadata.rawAction ? contentMetadataBytes : undefined,
      appActionMetadataBytes
    )
    await processAppActionMetadata(ctx, video, metadata, expectedCommitment, (entity) => {
      if ('entryApp' in entity && appActionMetadataBytes) {
        const appActionMetadata = deserializeMetadata(AppActionMetadata, appActionMetadataBytes)

        appActionMetadata?.videoId && integrateMeta(entity, { ytVideoId: appActionMetadata.videoId }, ['ytVideoId'])
      }
      return processVideoMetadata(ctx, entity, videoMetadata, newDataObjectIds)
    })
  } else if (metadata) {
    await processVideoMetadata(ctx, video, metadata as DecodedMetadataObject<IVideoMetadata>, newDataObjectIds)
  }

  // save video
  await store.save<Video>(video)
  channel.totalVideosCreated += 1
  await store.save<Channel>(channel)

  if (contentCreationParameters.autoIssueNft.isSome) {
    const issuanceParameters = contentCreationParameters.autoIssueNft.unwrap()
    const nft = await createNft(store, video, issuanceParameters, event.blockNumber)

    const nftIssuedEvent = new NftIssuedEvent({
      ...genericEventFields(event),

      contentActor: await convertContentActor(store, contentActor),
      video,
      videoCategory: nft.videoCategory,
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

export async function content_ContentUpdated(ctx: EventContext & StoreContext): Promise<void> {
  const { store, event } = ctx
  // read event data
  const [contentActor, contentId, contentUpdateParameters, newDataObjectIds] = new VideoUpdatedEvent_V1001(event).params
  const { newMeta } = contentUpdateParameters

  const contentUpdatedEventData: ContentUpdatedEventData = {
    contentActor,
    contentId,
    contentUpdateParameters,
    newDataObjectIds,
  }

  // TODO: remove this after we have Playlist feature since
  // TODO: we would then check if it is a Video or Playlist

  // load video
  const video = await getByIdOrFail(store, Video, contentId.toString(), [
    ...videoRelationsForCounters,
    'license',
    'channel.ownerMember',
    'channel.ownerCuratorGroup',
    'nft',
    'mediaMetadata',
    'mediaMetadata.encoding',
  ] as RelationsArr<Video>)

  const appAction = newMeta.isSome ? deserializeMetadata(AppAction, newMeta.unwrap(), { skipWarning: true }) : undefined
  if (appAction) {
    const contentMetadataBytes = u8aToBytes(appAction.rawAction)
    const videoMetadata = deserializeMetadata(ContentMetadata, contentMetadataBytes)?.videoMetadata
    await processUpdateVideoMessage(ctx, video, videoMetadata ?? undefined, contentUpdatedEventData)
  } else {
    const contentMetadata = newMeta.isSome ? deserializeMetadata(ContentMetadata, newMeta.unwrap()) : undefined
    await processUpdateVideoMessage(ctx, video, contentMetadata?.videoMetadata || undefined, contentUpdatedEventData)
  }
}

export async function processUpdateVideoMessage(
  ctx: EventContext & StoreContext,
  video: Video,
  metadata: DecodedMetadataObject<IVideoMetadata> | undefined,
  contentUpdatedEventData: ContentUpdatedEventData
): Promise<void> {
  const { store, event } = ctx
  const { contentActor, contentId, contentUpdateParameters, newDataObjectIds } = contentUpdatedEventData

  if (metadata) {
    await processVideoMetadata(ctx, video, metadata, newDataObjectIds)
  }

  // create nft if requested
  const issuanceParameters = contentUpdateParameters.autoIssueNft.unwrapOr(null)
  if (issuanceParameters) {
    const nft = await createNft(store, video, issuanceParameters, event.blockNumber)

    // update the video
    video.nft = nft

    const nftIssuedEvent = new NftIssuedEvent({
      ...genericEventFields(event),

      contentActor: await convertContentActor(store, contentActor),
      video,
      videoCategory: nft.videoCategory,
      royalty: nft.creatorRoyalty,
      metadata: nft.metadata,
      // prepare Nft owner (handles fields `ownerMember` and `ownerCuratorGroup`)
      ...(await convertContentActorToChannelOrNftOwner(store, contentActor)),
    })

    await store.save<NftIssuedEvent>(nftIssuedEvent)
  }

  // update video active counters
  await getAllManagers(store).videos.onMainEntityUpdate(video)

  // save video
  await store.save<Video>(video)

  // emit log event
  logger.info('Video has been updated', { id: contentId })
}

export async function content_ContentDeleted({ store, event }: EventContext & StoreContext): Promise<void> {
  // read event data
  const [actor, contentId] = new VideoDeletedEvent_V1001(event).params

  await deleteVideo(store, contentId)

  // common event processing - second

  const videoDeletedEvent = new VideoDeletedEvent({
    ...genericEventFields(event),

    videoId: contentId.toNumber(),
    actor: await convertContentActor(store, actor),
  })

  await store.save<VideoDeletedEvent>(videoDeletedEvent)
}

export async function content_VideoAssetsDeletedByModerator({
  store,
  event,
}: EventContext & StoreContext): Promise<void> {
  const [actor, videoId, dataObjectIds, areNftAssets, rationale] = new VideoAssetsDeletedByModeratorEvent_V1001(event)
    .params

  const assets = await store.getMany(StorageDataObject, {
    where: {
      id: In(Array.from(dataObjectIds).map((item) => item.toString())),
    },
  })

  for (const asset of assets) {
    await unsetAssetRelations(store, asset)
  }
  logger.info('Video assets have been removed', { ids: dataObjectIds })

  // common event processing - second

  const videoAssetsDeletedByModeratorEvent = new VideoAssetsDeletedByModeratorEvent({
    ...genericEventFields(event),

    // load video
    videoId: videoId.toNumber(),
    assetIds: Array.from(dataObjectIds).map((item) => Number(item)),
    rationale: bytesToString(rationale),
    actor: await convertContentActor(store, actor),
    areNftAssets: areNftAssets.valueOf(),
  })

  await store.save<VideoAssetsDeletedByModeratorEvent>(videoAssetsDeletedByModeratorEvent)
}

export async function content_VideoDeletedByModerator({ store, event }: EventContext & StoreContext): Promise<void> {
  // read event data
  const [actor, videoId, rationale] = new VideoDeletedByModeratorEvent_V1001(event).params

  await deleteVideo(store, videoId)

  // common event processing - second

  const videoDeletedByModeratorEvent = new VideoDeletedByModeratorEvent({
    ...genericEventFields(event),

    videoId: Number(videoId),
    rationale: bytesToString(rationale),
    actor: await convertContentActor(store, actor),
  })

  await store.save<VideoDeletedByModeratorEvent>(videoDeletedByModeratorEvent)
}

export async function content_VideoVisibilitySetByModerator({
  store,
  event,
}: EventContext & StoreContext): Promise<void> {
  // read event data
  const [actor, videoId, isCensored, rationale] = new VideoVisibilitySetByModeratorEvent_V1001(event).params

  // load video
  const video = await getByIdOrFail(store, Video, videoId.toString(), [...videoRelationsForCounters])

  // update video
  video.isCensored = isCensored.isTrue

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
    rationale: bytesToString(rationale),
    actor: await convertContentActor(store, actor),
  })

  await store.save<VideoVisibilitySetByModeratorEvent>(videoVisibilitySetByModeratorEvent)
}

async function deleteVideo(store: DatabaseManager, videoId: VideoId) {
  // load video
  const video = await getByIdOrFail(store, Video, videoId.toString(), [...videoRelationsForCounters])

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
  const referencingEntities: { new (): BaseModel & { video: Partial<Video> } }[] = [
    VideoSubtitle,
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
    referencingEntities.map(async (entity) => await loadReferencingEntities(store, entity, videoId))
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
