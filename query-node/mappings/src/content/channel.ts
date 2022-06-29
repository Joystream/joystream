/*
eslint-disable @typescript-eslint/naming-convention
*/
import { EventContext, StoreContext } from '@joystream/hydra-common'
import { ChannelMetadata, ChannelModeratorRemarked, ChannelOwnerRemarked } from '@joystream/metadata-protobuf'
import { BaseModel } from '@joystream/warthog'
import {
  Channel,
  ContentActor,
  ContentActorCurator,
  ContentActorMember,
  CuratorGroup,
  Membership,
  MetaprotocolTransactionErrored,
  MetaprotocolTransactionPending,
  MetaprotocolTransactionStatusEvent,
  MetaprotocolTransactionSuccessful,
  StorageDataObject,
} from 'query-node/dist/model'
import { In } from 'typeorm'
import { Content } from '../../generated/types'
import {
  deserializeMetadata,
  genericEventFields,
  inconsistentState,
  invalidMetadata,
  logger,
  updateMetaprotocolTransactionStatus,
} from '../common'
import { getAllManagers } from '../derivedPropertiesManager/applications'
import {
  processBanOrUnbanMemberFromChannelMessage,
  processModerateCommentMessage,
  processPinOrUnpinCommentMessage,
  processVideoReactionsPreferenceMessage,
} from './commentAndReaction'
import {
  convertChannelOwnerToMemberOrCuratorGroup,
  convertContentActor,
  processChannelMetadata,
  unsetAssetRelations,
} from './utils'

export async function content_ChannelCreated(ctx: EventContext & StoreContext): Promise<void> {
  const { store, event } = ctx
  // read event data
  const [channelId, { owner }, channelCreationParameters] = new Content.ChannelCreatedEvent(event).params

  // create entity
  const channel = new Channel({
    // main data
    id: channelId.toString(),
    isCensored: false,
    videos: [],
    createdInBlock: event.blockNumber,
    activeVideosCounter: 0,

    // fill in auto-generated fields
    createdAt: new Date(event.blockTimestamp),
    updatedAt: new Date(event.blockTimestamp),

    // prepare channel owner (handles fields `ownerMember` and `ownerCuratorGroup`)
    ...(await convertChannelOwnerToMemberOrCuratorGroup(store, owner)),

    collaborators: Array.from(channelCreationParameters.collaborators).map(
      (id) => new Membership({ id: id.toString() })
    ),
  })

  // deserialize & process metadata
  if (channelCreationParameters.meta.isSome) {
    const metadata = deserializeMetadata(ChannelMetadata, channelCreationParameters.meta.unwrap()) || {}
    await processChannelMetadata(ctx, channel, metadata, channelCreationParameters.assets.unwrapOr(undefined))
  }

  // save entity
  await store.save<Channel>(channel)

  // emit log event
  logger.info('Channel has been created', { id: channel.id })
}

export async function content_ChannelUpdated(ctx: EventContext & StoreContext): Promise<void> {
  const { store, event } = ctx
  // read event data
  const [, channelId, channelUpdateParameters] = new Content.ChannelUpdatedEvent(event).params

  // load channel
  const channel = await store.get(Channel, {
    where: { id: channelId.toString() },
    relations: ['category'],
  })

  // ensure channel exists
  if (!channel) {
    return inconsistentState('Non-existing channel update requested', channelId)
  }

  // prepare changed metadata
  const newMetadataBytes = channelUpdateParameters.newMeta.unwrapOr(null)

  //  update metadata if it was changed
  if (newMetadataBytes) {
    const newMetadata = deserializeMetadata(ChannelMetadata, newMetadataBytes) || {}
    await processChannelMetadata(ctx, channel, newMetadata, channelUpdateParameters.assetsToUpload.unwrapOr(undefined))
  }

  const newCollaborators = channelUpdateParameters.collaborators.unwrapOr(undefined)
  if (newCollaborators) {
    channel.collaborators = Array.from(newCollaborators).map((id) => new Membership({ id: id.toString() }))
  }

  // set last update time
  channel.updatedAt = new Date(event.blockTimestamp)

  // transfer video active counter value to new category
  await getAllManagers(store).channels.onMainEntityUpdate(channel)

  // save channel
  await store.save<Channel>(channel)

  // emit log event
  logger.info('Channel has been updated', { id: channel.id })
}

export async function content_ChannelAssetsRemoved({ store, event }: EventContext & StoreContext): Promise<void> {
  const [, , dataObjectIds] = new Content.ChannelAssetsRemovedEvent(event).params
  const assets = await store.getMany(StorageDataObject, {
    where: {
      id: In(Array.from(dataObjectIds).map((item) => item.toString())),
    },
  })
  await Promise.all(assets.map((a) => unsetAssetRelations(store, a)))
  logger.info('Channel assets have been removed', { ids: dataObjectIds.toJSON() })
}

export async function content_ChannelDeleted({ store, event }: EventContext & StoreContext): Promise<void> {
  const [, channelId] = new Content.ChannelDeletedEvent(event).params

  await store.remove<Channel>(new Channel({ id: channelId.toString() }))
}

export async function content_ChannelOwnerRemarked(ctx: EventContext & StoreContext): Promise<void> {
  const { event, store } = ctx
  const [channelId, message] = new Content.ChannelOwnerRemarkedEvent(ctx.event).params

  // load channel
  const channel = await store.get(Channel, {
    where: { id: channelId.toString() },
    relations: ['ownerMember', 'ownerCuratorGroup'],
  })

  // ensure channel exists
  if (!channel) {
    return inconsistentState('Owner Remarked for Non-existing channel', channelId)
  }

  const getcontentActor = (ownerMember?: Membership, ownerCuratorGroup?: CuratorGroup) => {
    if (ownerMember) {
      const actor = new ContentActorMember()
      actor.memberId = ownerMember.id
      return actor
    } else if (ownerCuratorGroup) {
      const actor = new ContentActorCurator()
      actor.curatorId = ownerCuratorGroup.id
      return actor
    }
  }

  const genericFields = genericEventFields(event)
  // unique identifier for metaprotocol tx
  const { id: metaprotocolTxIdentifier } = genericFields as BaseModel

  const metaprotocolTxStatusEvent = new MetaprotocolTransactionStatusEvent({
    ...genericFields,
    status: new MetaprotocolTransactionPending(),
  })

  // save metaprotocol tx status event
  await store.save<MetaprotocolTransactionStatusEvent>(metaprotocolTxStatusEvent)

  try {
    const decodedMessage = ChannelOwnerRemarked.decode(message.toU8a(true))
    const messageType = decodedMessage.channelOwnerRemarked
    const contentActor = getcontentActor(channel.ownerMember, channel.ownerCuratorGroup)!

    // update MetaprotocolTransactionStatusEvent
    const statusSuccessful = new MetaprotocolTransactionSuccessful()

    if (!messageType) {
      invalidMetadata('Unsupported message type in channel_owner_remark action')
    } else if (messageType === 'pinOrUnpinComment') {
      await processPinOrUnpinCommentMessage(ctx, contentActor, channelId, decodedMessage.pinOrUnpinComment!)
    } else if (messageType === 'banOrUnbanMemberFromChannel') {
      await processBanOrUnbanMemberFromChannelMessage(
        ctx,
        contentActor,
        channelId,
        decodedMessage.banOrUnbanMemberFromChannel!
      )
    } else if (messageType === 'videoReactionsPreference') {
      await processVideoReactionsPreferenceMessage(
        ctx,
        contentActor,
        channelId,
        decodedMessage.videoReactionsPreference!
      )
    } else if (messageType === 'moderateComment') {
      const comment = await processModerateCommentMessage(ctx, contentActor, channelId, decodedMessage.moderateComment!)
      statusSuccessful.commentModeratedId = comment.id
    }

    await updateMetaprotocolTransactionStatus(store, metaprotocolTxIdentifier, statusSuccessful)
  } catch (e) {
    // update MetaprotocolTransactionStatusEvent
    const statusErrored = new MetaprotocolTransactionErrored()
    await updateMetaprotocolTransactionStatus(store, metaprotocolTxIdentifier, statusErrored, e)
  }
}

export async function content_ChannelModeratorRemarked(ctx: EventContext & StoreContext): Promise<void> {
  const { event, store } = ctx
  const [moderator, channelId, message] = new Content.ChannelAgentRemarkedEvent(ctx.event).params

  const genericFields = genericEventFields(event)
  // unique identifier for metaprotocol tx
  const { id: metaprotocolTxIdentifier } = genericFields as BaseModel

  const metaprotocolTxStatusEvent = new MetaprotocolTransactionStatusEvent({
    ...genericFields,
    status: new MetaprotocolTransactionPending(),
  })

  // save metaprotocol tx status event
  await store.save<MetaprotocolTransactionStatusEvent>(metaprotocolTxStatusEvent)

  try {
    const decodedMessage = ChannelModeratorRemarked.decode(message.toU8a(true))
    const messageType = decodedMessage.channelModeratorRemarked
    const contentActor = await convertContentActor(ctx.store, moderator)

    // update MetaprotocolTransactionStatusEvent
    const statusSuccessful = new MetaprotocolTransactionSuccessful()

    if (!messageType) {
      invalidMetadata('Unsupported message type in channel_moderator_remark action')
    } else if (messageType === 'moderateComment') {
      const comment = await processModerateCommentMessage(ctx, contentActor, channelId, decodedMessage.moderateComment!)
      statusSuccessful.commentModeratedId = comment.id
    }

    await updateMetaprotocolTransactionStatus(store, metaprotocolTxIdentifier, statusSuccessful)
  } catch (e) {
    // update MetaprotocolTransactionStatusEvent
    const statusErrored = new MetaprotocolTransactionErrored()
    await updateMetaprotocolTransactionStatus(store, metaprotocolTxIdentifier, statusErrored, e)
  }
}
