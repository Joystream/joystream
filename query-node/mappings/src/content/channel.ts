/*
eslint-disable @typescript-eslint/naming-convention
*/
import { DatabaseManager, EventContext, StoreContext, SubstrateEvent } from '@joystream/hydra-common'
import {
  AppAction,
  ChannelMetadata,
  ChannelModeratorRemarked,
  ChannelOwnerRemarked,
  IMakeChannelPayment,
} from '@joystream/metadata-protobuf'
import { ChannelId, DataObjectId, MemberId } from '@joystream/types/primitives'
import { BTreeMap, BTreeSet, createType, u64 } from '@polkadot/types'
import {
  Channel,
  ChannelAssetsDeletedByModeratorEvent,
  ChannelDeletedByModeratorEvent,
  ChannelFundsWithdrawnEvent,
  ChannelNftCollectors,
  ChannelPaymentMadeEvent,
  ChannelPayoutsUpdatedEvent,
  ChannelRewardClaimedAndWithdrawnEvent,
  ChannelRewardClaimedEvent,
  ChannelVisibilitySetByModeratorEvent,
  Collaborator,
  ContentActor,
  ContentActorCurator,
  ContentActorMember,
  CuratorGroup,
  DataObjectTypeChannelPayoutsPayload,
  MemberBannedFromChannelEvent,
  Membership,
  MetaprotocolTransactionSuccessful,
  PaymentContextChannel,
  PaymentContextVideo,
  StorageBag,
  StorageDataObject,
  Video,
} from 'query-node/dist/model'
import { FindOptionsWhere, In } from 'typeorm'
import {
  bytesToString,
  deserializeMetadata,
  genericEventFields,
  getMemberById,
  inconsistentState,
  invalidMetadata,
  logger,
  saveMetaprotocolTransactionErrored,
  saveMetaprotocolTransactionSuccessful,
  unexpectedData,
  unwrap,
} from '../common'
import {
  processBanOrUnbanMemberFromChannelMessage,
  processModerateCommentMessage,
  processPinOrUnpinCommentMessage,
  processVideoReactionsPreferenceMessage,
} from './commentAndReaction'
import {
  convertChannelOwnerToMemberOrCuratorGroup,
  convertContentActor,
  mapAgentPermission,
  processAppActionMetadata,
  processChannelMetadata,
  u8aToBytes,
  unsetAssetRelations,
} from './utils'
// Joystream types
import { generateAppActionCommitment } from '@joystream/js/utils'
import { DecodedMetadataObject } from '@joystream/metadata-protobuf/types'
import { BaseModel } from '@joystream/warthog'
import { AccountId32, Balance } from '@polkadot/types/interfaces'
import { PalletContentIterableEnumsChannelActionPermission } from '@polkadot/types/lookup'
import BN from 'bn.js'
import {
  Content_ChannelAgentRemarkedEvent_V1001 as ChannelAgentRemarkedEvent_V1001,
  Content_ChannelAssetsDeletedByModeratorEvent_V1001 as ChannelAssetsDeletedByModeratorEvent_V1001,
  Content_ChannelAssetsRemovedEvent_V1001 as ChannelAssetsRemovedEvent_V1001,
  Content_ChannelCreatedEvent_V1001 as ChannelCreatedEvent_V1001,
  Content_ChannelCreatedEvent_V2002 as ChannelCreatedEvent_V2002,
  Content_ChannelDeletedByModeratorEvent_V1001 as ChannelDeletedByModeratorEvent_V1001,
  Content_ChannelDeletedEvent_V1001 as ChannelDeletedEvent_V1001,
  Content_ChannelFundsWithdrawnEvent_V1001 as ChannelFundsWithdrawnEvent_V1001,
  Content_ChannelOwnerRemarkedEvent_V1001 as ChannelOwnerRemarkedEvent_V1001,
  Content_ChannelPayoutsUpdatedEvent_V2001 as ChannelPayoutsUpdatedEvent_V2001,
  Content_ChannelRewardClaimedAndWithdrawnEvent_V1001 as ChannelRewardClaimedAndWithdrawnEvent_V1001,
  Content_ChannelRewardUpdatedEvent_V2001 as ChannelRewardUpdatedEvent_V2001,
  Content_ChannelUpdatedEvent_V1001 as ChannelUpdatedEvent_V1001,
  Content_ChannelUpdatedEvent_V2002 as ChannelUpdatedEvent_V2002,
  Content_ChannelVisibilitySetByModeratorEvent_V1001 as ChannelVisibilitySetByModeratorEvent_V1001,
} from '../../generated/types'

export async function content_ChannelCreated(ctx: EventContext & StoreContext): Promise<void> {
  const { store, event, block } = ctx

  if (block.runtimeVersion.specVersion < 2002) {
    return 
  }

  // read event data
  const [channelId, { owner, dataObjects, channelStateBloatBond }, channelCreationParameters, rewardAccount] = new ChannelCreatedEvent_V2002(event).params

  // prepare channel owner (handles fields `ownerMember` and `ownerCuratorGroup`)
  const channelOwner = await convertChannelOwnerToMemberOrCuratorGroup(store, owner)

  // create entity
  const channel = new Channel({
    // main data
    id: channelId.toString(),
    isCensored: false,
    videos: [],
    createdInBlock: event.blockNumber,
    activeVideosCounter: 0,
    ...channelOwner,
    rewardAccount: rewardAccount.toString(),
    channelStateBloatBond: channelStateBloatBond.amount,
    totalVideosCreated: 0,
  })

  // deserialize & process metadata
  if (channelCreationParameters.meta.isSome) {
    const storageBag = await store.get(StorageBag, { where: { id: `dynamic:channel:${channelId.toString()}` } })

    if (!storageBag) {
      inconsistentState(`storageBag for channel ${channelId} does not exist`)
    }

    const appAction = deserializeMetadata(AppAction, channelCreationParameters.meta.unwrap(), { skipWarning: true })

    if (appAction) {
      const channelMetadataBytes = u8aToBytes(appAction.rawAction)
      const channelMetadata = deserializeMetadata(ChannelMetadata, channelMetadataBytes)
      const creatorType = channel.ownerMember ? AppAction.CreatorType.MEMBER : AppAction.CreatorType.CURATOR_GROUP
      const creatorId = (channel.ownerMember ? channel.ownerMember.id : channel.ownerCuratorGroup?.id) ?? ''
      const expectedCommitment = generateAppActionCommitment(
        // Note: Curator channels not supported yet
        channelOwner.ownerMember?.totalChannelsCreated ?? -1,
        creatorId,
        AppAction.ActionType.CREATE_CHANNEL,
        creatorType,
        channelCreationParameters.assets.toU8a(),
        channelMetadataBytes.toU8a(true),
        appAction.metadata || new Uint8Array()
      )
      await processAppActionMetadata(ctx, channel, appAction, expectedCommitment, (entity: Channel) =>
        processChannelMetadata(ctx, entity, channelMetadata ?? {}, dataObjects)
      )
    } else {
      const channelMetadata = deserializeMetadata(ChannelMetadata, channelCreationParameters.meta.unwrap()) ?? {}
      await processChannelMetadata(ctx, channel, channelMetadata, dataObjects)
    }
  }

  // save entity
  await store.save<Channel>(channel)
  if (channelOwner.ownerMember) {
    channelOwner.ownerMember.totalChannelsCreated += 1
    await store.save<Membership>(channelOwner.ownerMember)
  }
  // update channel permissions
  await updateChannelAgentsPermissions(store, channel, channelCreationParameters.collaborators)

  // emit log event
  logger.info('Channel has been created', { id: channel.id })
}

export async function content_ChannelUpdated(ctx: EventContext & StoreContext): Promise<void> {
  const { store, event, block } = ctx

  if (block.runtimeVersion.specVersion < 2002) {
    return 
  }

  // read event data
  const [, channelId, channelUpdateParameters, newDataObjects] = new ChannelUpdatedEvent_V2002(event).params


  // load channel
  const channel = await store.get(Channel, {
    where: { id: channelId.toString() },
  })

  // ensure channel exists
  if (!channel) {
    return inconsistentState('Non-existing channel update requested', channelId)
  }

  // prepare changed metadata
  const newMetadataBytes = channelUpdateParameters.newMeta.unwrapOr(null)

  //  update metadata if it was changed
  if (newMetadataBytes) {
    const storageBag = await store.get(StorageBag, { where: { id: `dynamic:channel:${channelId.toString()}` } })

    if (!storageBag) {
      inconsistentState(`storageBag for channel ${channelId} does not exist`)
    }

    const newMetadata = deserializeMetadata(AppAction, newMetadataBytes, { skipWarning: true })

    if (newMetadata) {
      const channelMetadataBytes = u8aToBytes(newMetadata.rawAction)
      const channelMetadata = deserializeMetadata(ChannelMetadata, channelMetadataBytes)
      await processChannelMetadata(ctx, channel, channelMetadata ?? {}, newDataObjects)
    } else {
      const realNewMetadata = deserializeMetadata(ChannelMetadata, newMetadataBytes)
      await processChannelMetadata(ctx, channel, realNewMetadata ?? {}, newDataObjects)
    }
  }

  // save channel
  await store.save<Channel>(channel)

  // update channel permissions
  if (channelUpdateParameters.collaborators.isSome) {
    await updateChannelAgentsPermissions(store, channel, channelUpdateParameters.collaborators.unwrap())
  }

  // emit log event
  logger.info('Channel has been updated', { id: channel.id })
}

export async function content_ChannelAssetsRemoved({ store, event }: EventContext & StoreContext): Promise<void> {
  const [, , dataObjectIds] = new ChannelAssetsRemovedEvent_V1001(event).params

  await deleteChannelAssets(store, [...dataObjectIds])
}

export async function content_ChannelAssetsDeletedByModerator({
  store,
  event,
}: EventContext & StoreContext): Promise<void> {
  const [actor, channelId, dataObjectIds, rationale] = new ChannelAssetsDeletedByModeratorEvent_V1001(event).params

  await deleteChannelAssets(store, [...dataObjectIds])

  // common event processing - second

  const channelAssetsDeletedByModeratorEvent = new ChannelAssetsDeletedByModeratorEvent({
    ...genericEventFields(event),
    actor: await convertContentActor(store, actor),
    channelId: channelId.toNumber(),
    assetIds: Array.from(dataObjectIds).map((item) => Number(item)),
    rationale: bytesToString(rationale),
  })

  await store.save<ChannelAssetsDeletedByModeratorEvent>(channelAssetsDeletedByModeratorEvent)
}

async function deleteChannelAssets(store: DatabaseManager, dataObjectIds: DataObjectId[]) {
  const assets = await store.getMany(StorageDataObject, {
    where: {
      id: In(Array.from(dataObjectIds).map((item) => item.toString())),
    },
  })

  for (const asset of assets) {
    await unsetAssetRelations(store, asset)
  }

  logger.info('Channel assets have been removed', { ids: dataObjectIds })
}

export async function content_ChannelDeleted({ store, event }: EventContext & StoreContext): Promise<void> {
  const [, channelId] = new ChannelDeletedEvent_V1001(event).params
  await removeChannel(store, channelId)
}

export async function content_ChannelDeletedByModerator({ store, event }: EventContext & StoreContext): Promise<void> {
  const [actor, channelId, rationale] = new ChannelDeletedByModeratorEvent_V1001(event).params
  await removeChannel(store, channelId)

  // common event processing - second

  const channelDeletedByModeratorEvent = new ChannelDeletedByModeratorEvent({
    ...genericEventFields(event),

    rationale: bytesToString(rationale),
    actor: await convertContentActor(store, actor),
    channelId: channelId.toNumber(),
  })

  await store.save<ChannelDeletedByModeratorEvent>(channelDeletedByModeratorEvent)
}

export async function content_ChannelVisibilitySetByModerator({
  store,
  event,
}: EventContext & StoreContext): Promise<void> {
  // read event data
  const [actor, channelId, isCensored, rationale] = new ChannelVisibilitySetByModeratorEvent_V1001(event).params

  // load channel
  const channel = await store.get(Channel, {
    where: { id: channelId.toString() },
  })

  // ensure channel exists
  if (!channel) {
    return inconsistentState('Non-existing channel censoring requested', channelId)
  }

  // update channel
  channel.isCensored = isCensored.isTrue

  // save channel
  await store.save<Channel>(channel)

  // emit log event
  logger.info('Channel censorship status has been updated', { id: channelId, isCensored: isCensored.isTrue })

  // common event processing - second

  const channelVisibilitySetByModeratorEvent = new ChannelVisibilitySetByModeratorEvent({
    ...genericEventFields(event),

    channelId: channelId.toNumber(),
    isHidden: isCensored.isTrue,
    rationale: bytesToString(rationale),
    actor: await convertContentActor(store, actor),
  })

  await store.save<ChannelVisibilitySetByModeratorEvent>(channelVisibilitySetByModeratorEvent)
}

export async function content_ChannelOwnerRemarked(ctx: EventContext & StoreContext): Promise<void> {
  const { event, store } = ctx
  const [channelId, message] = new ChannelOwnerRemarkedEvent_V1001(ctx.event).params

  // load channel
  const channel = await store.get(Channel, {
    where: { id: channelId.toString() },
    relations: ['ownerMember', 'ownerCuratorGroup'],
  })

  // ensure channel exists
  if (!channel) {
    return inconsistentState('Owner Remarked for Non-existing channel', channelId)
  }

  const getContentActor = (ownerMember?: Membership, ownerCuratorGroup?: CuratorGroup) => {
    if (ownerMember) {
      const actor = new ContentActorMember()
      actor.memberId = ownerMember.id
      return actor
    }

    if (ownerCuratorGroup) {
      const actor = new ContentActorCurator()
      actor.curatorId = ownerCuratorGroup.id
      return actor
    }

    return inconsistentState('Unknown content actor', { ownerMember, ownerCuratorGroup })
  }

  try {
    const decodedMessage = ChannelOwnerRemarked.decode(message.toU8a(true))
    const contentActor = getContentActor(channel.ownerMember, channel.ownerCuratorGroup)
    const metaTransactionInfo = await processOwnerRemark(store, event, channelId, contentActor, decodedMessage)

    await saveMetaprotocolTransactionSuccessful(store, event, metaTransactionInfo)
    // emit log event
    logger.info('Channel owner remarked', { decodedMessage })
  } catch (e) {
    // emit log event
    logger.info(`Bad metadata for channel owner's remark`, { e })

    // save metaprotocol info
    await saveMetaprotocolTransactionErrored(store, event, `Bad metadata for channel's owner`)
  }
}

export async function content_ChannelAgentRemarked(ctx: EventContext & StoreContext): Promise<void> {
  const { event, store } = ctx
  const [moderator, channelId, message] = new ChannelAgentRemarkedEvent_V1001(ctx.event).params

  try {
    const decodedMessage = ChannelModeratorRemarked.decode(message.toU8a(true))
    const contentActor = await convertContentActor(store, moderator)

    const metaTransactionInfo = await processModeratorRemark(store, event, channelId, contentActor, decodedMessage)

    await saveMetaprotocolTransactionSuccessful(store, event, metaTransactionInfo)
    // emit log event
    logger.info('Channel moderator remarked', { decodedMessage })
  } catch (e) {
    // emit log event
    logger.info(`Bad metadata for channel moderator's remark`, { e })

    // save metaprotocol info
    await saveMetaprotocolTransactionErrored(store, event, `Bad metadata for channel's remark`)
  }
}

async function updateChannelAgentsPermissions(
  store: DatabaseManager,
  channel: Channel,
  collaboratorsPermissions: BTreeMap<u64, BTreeSet<PalletContentIterableEnumsChannelActionPermission>>
) {
  // safest way to update permission is to delete existing and creating new ones

  // delete existing agent permissions
  const collaborators = await store.getMany(Collaborator, {
    where: { channel: { id: channel.id.toString() } },
  })
  for (const agentPermissions of collaborators) {
    await store.remove(agentPermissions)
  }

  // create new records for privledged members
  for (const [memberId, permissions] of Array.from(collaboratorsPermissions)) {
    const collaborator = new Collaborator({
      channel: new Channel({ id: channel.id.toString() }),
      member: new Membership({ id: memberId.toString() }),
      permissions: Array.from(permissions).map(mapAgentPermission),
    })

    await store.save(collaborator)
  }
}

async function processOwnerRemark(
  store: DatabaseManager,
  event: SubstrateEvent,
  channelId: ChannelId,
  contentActor: typeof ContentActor,
  decodedMessage: ChannelOwnerRemarked
): Promise<Partial<MetaprotocolTransactionSuccessful>> {
  const messageType = decodedMessage.channelOwnerRemarked

  if (messageType === 'pinOrUnpinComment') {
    await processPinOrUnpinCommentMessage(store, event, channelId, decodedMessage.pinOrUnpinComment!)

    return {}
  }

  if (messageType === 'banOrUnbanMemberFromChannel') {
    await processBanOrUnbanMemberFromChannelMessage(
      store,
      event,
      channelId,
      decodedMessage.banOrUnbanMemberFromChannel!
    )

    return {}
  }

  if (messageType === 'videoReactionsPreference') {
    await processVideoReactionsPreferenceMessage(store, event, channelId, decodedMessage.videoReactionsPreference!)

    return {}
  }

  if (messageType === 'moderateComment') {
    const comment = await processModerateCommentMessage(
      store,
      event,
      contentActor,
      channelId,
      decodedMessage.moderateComment!
    )
    return { commentModeratedId: comment.id }
  }

  return inconsistentState('Unsupported message type in channel owner remark action', messageType)
}

async function processModeratorRemark(
  store: DatabaseManager,
  event: SubstrateEvent,
  channelId: ChannelId,
  contentActor: typeof ContentActor,
  decodedMessage: ChannelModeratorRemarked
): Promise<Partial<MetaprotocolTransactionSuccessful>> {
  const messageType = decodedMessage.channelModeratorRemarked

  if (messageType === 'moderateComment') {
    const comment = await processModerateCommentMessage(
      store,
      event,
      contentActor,
      channelId,
      decodedMessage.moderateComment!
    )

    return { commentModeratedId: comment.id }
  }

  return inconsistentState('Unsupported message type in moderator remark action', messageType)
}

export async function content_ChannelPayoutsUpdated({ store, event }: EventContext & StoreContext): Promise<void> {
  // read event data
  const [updateChannelPayoutParameters, dataObjectId] = new ChannelPayoutsUpdatedEvent_V2001(event).params

  const asDataObjectId = unwrap(dataObjectId)
  const payloadDataObject = await store.get(StorageDataObject, { where: { id: asDataObjectId?.toString() } })

  if (payloadDataObject) {
    payloadDataObject.type = new DataObjectTypeChannelPayoutsPayload()
  }

  const asPayload = unwrap(updateChannelPayoutParameters.payload)?.objectCreationParams
  const payloadSize = asPayload ? new BN(asPayload.size_) : undefined
  const payloadHash = asPayload ? bytesToString(asPayload.ipfsContentId) : undefined
  const minCashoutAllowed = unwrap(updateChannelPayoutParameters.minCashoutAllowed)
  const maxCashoutAllowed = unwrap(updateChannelPayoutParameters.maxCashoutAllowed)
  const channelCashoutsEnabled = unwrap(updateChannelPayoutParameters.channelCashoutsEnabled)?.valueOf()

  const newChannelPayoutsUpdatedEvent = new ChannelPayoutsUpdatedEvent({
    ...genericEventFields(event),
    commitment: unwrap(updateChannelPayoutParameters.commitment)?.toString(),
    payloadSize,
    payloadHash,
    minCashoutAllowed,
    maxCashoutAllowed,
    channelCashoutsEnabled,
    payloadDataObject,
  })

  // save new channel payout parameters record (with new commitment)
  await store.save<ChannelPayoutsUpdatedEvent>(newChannelPayoutsUpdatedEvent)
}

export async function content_ChannelRewardUpdated({ store, event }: EventContext & StoreContext): Promise<void> {
  // load event data (was impossible to emit before v2001)
  const [cumulativeRewardEarned, claimedAmount, channelId] = new ChannelRewardUpdatedEvent_V2001(event).params

  // load channel
  const channel = await store.get(Channel, { where: { id: channelId.toString() } })

  // ensure channel exists
  if (!channel) {
    return inconsistentState('Non-existing channel reward updated', channelId)
  }

  // common event processing - second

  const rewardClaimedEvent = new ChannelRewardClaimedEvent({
    ...genericEventFields(event),

    amount: claimedAmount,
    channel,
  })

  await store.save<ChannelRewardClaimedEvent>(rewardClaimedEvent)

  channel.cumulativeRewardClaimed = cumulativeRewardEarned

  // save channel
  await store.save<Channel>(channel)
}

export async function content_ChannelRewardClaimedAndWithdrawn({
  store,
  event,
}: EventContext & StoreContext): Promise<void> {
  // load event data
  const [owner, channelId, withdrawnAmount, destination] = new ChannelRewardClaimedAndWithdrawnEvent_V1001(event).params

  // load channel
  const channel = await store.get(Channel, { where: { id: channelId.toString() } })

  // ensure channel exists
  if (!channel) {
    return inconsistentState('Non-existing channel reward updated', channelId)
  }

  // common event processing - second

  const rewardClaimedEvent = new ChannelRewardClaimedAndWithdrawnEvent({
    ...genericEventFields(event),

    amount: withdrawnAmount,
    channel,
    account: destination.isAccountId ? destination.asAccountId.toString() : undefined,
    actor: await convertContentActor(store, owner),
  })

  await store.save<ChannelRewardClaimedAndWithdrawnEvent>(rewardClaimedEvent)

  channel.cumulativeRewardClaimed = (channel.cumulativeRewardClaimed || new BN(0)).add(withdrawnAmount)

  // save channel
  await store.save<Channel>(channel)
}

export async function content_ChannelFundsWithdrawn({ store, event }: EventContext & StoreContext): Promise<void> {
  // load event data
  // load event data
  const [owner, channelId, amount, destination] = new ChannelFundsWithdrawnEvent_V1001(event).params

  // load channel
  const channel = await store.get(Channel, { where: { id: channelId.toString() } })

  // ensure channel exists
  if (!channel) {
    return inconsistentState('Non-existing channel reward updated', channelId)
  }

  // common event processing - second

  const rewardClaimedEvent = new ChannelFundsWithdrawnEvent({
    ...genericEventFields(event),

    amount,
    channel,
    account: destination.isAccountId ? destination.asAccountId.toString() : undefined,
    actor: await convertContentActor(store, owner),
  })

  await store.save<ChannelFundsWithdrawnEvent>(rewardClaimedEvent)
}

export async function processChannelPaymentFromMember(
  store: DatabaseManager,
  event: SubstrateEvent,
  memberId: MemberId,
  message: DecodedMetadataObject<IMakeChannelPayment>,
  [payeeAccount, amount]: [AccountId32, Balance]
): Promise<ChannelPaymentMadeEvent> {
  const member = await getMemberById(store, memberId)

  // Only channel reward accounts are being checked right now as payment destination.
  // Transfers to any other destination will be ignored by the query node.
  const channel = await store.get(Channel, { where: { rewardAccount: payeeAccount.toString() } })
  if (!channel) {
    unexpectedData('Payment made to unknown channel reward account')
  }

  // Get payment context from the metadata
  const getPaymentContext = async (msg: DecodedMetadataObject<IMakeChannelPayment>) => {
    if (msg.videoId) {
      const paymentContext = new PaymentContextVideo()
      const video = await store.get(Video, {
        where: { id: msg.videoId.toString(), channel: { id: channel.id } },
        relations: ['channel'],
      })
      if (!video) {
        invalidMetadata(
          `payment context video not found in channel that was queried based on reward (or payee) account.`
        )
        return
      }

      paymentContext.videoId = video.id
      return paymentContext
    }

    const paymentContext = new PaymentContextChannel()
    paymentContext.channelId = channel.id
    return paymentContext
  }

  const paymentMadeEvent = new ChannelPaymentMadeEvent({
    ...genericEventFields(event),

    payer: member,
    payeeChannel: channel,
    paymentContext: await getPaymentContext(message),
    rationale: message.rationale || undefined,
    amount: amount,
  })

  await store.save<ChannelPaymentMadeEvent>(paymentMadeEvent)

  return paymentMadeEvent
}

async function removeChannel(store: DatabaseManager, channelId: u64): Promise<void> {
  // TODO: remove manual deletion of referencing records after
  // TODO: https://github.com/Joystream/hydra/issues/490 has been implemented
  await removeChannelReferencingRelations(store, channelId.toString())
  await store.remove<Channel>(new Channel({ id: channelId.toString() }))
}

async function removeChannelReferencingRelations(store: DatabaseManager, channelId: string): Promise<void> {
  const loadReferencingEntities = async <T extends BaseModel & { channel: Partial<Channel> }>(
    store: DatabaseManager,
    entityType: { new(): T },
    channelId: string
  ) => {
    return await store.getMany(entityType, {
      where: { channel: { id: channelId } } as FindOptionsWhere<T>,
    })
  }

  const removeRelations = async <T>(store: DatabaseManager, entities: T[]) => {
    await Promise.all(entities.map(async (r) => await store.remove<T>(r)))
  }

  const referencingEntities: { new(): BaseModel & { channel: Partial<Channel> } }[] = [
    Collaborator,
    ChannelNftCollectors,
    MemberBannedFromChannelEvent,
  ]

  // Find all DB records that reference the given channel
  const referencingRecords = await Promise.all(
    referencingEntities.map(async (entity) => await loadReferencingEntities(store, entity, channelId))
  )

  // Remove all relations
  for (const records of referencingRecords) {
    await removeRelations(store, records)
  }
}
