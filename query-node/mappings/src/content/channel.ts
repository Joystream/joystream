/*
eslint-disable @typescript-eslint/naming-convention
*/
import { EventContext, StoreContext } from '@joystream/hydra-common'
import { Content } from '../../generated/types'
import {
  convertContentActor,
  convertContentActorToChannelOrNftOwner,
  processChannelMetadata,
  unsetAssetRelations,
} from './utils'
import {
  Channel,
  ChannelCategory,
  StorageDataObject,
  Membership,
  MetaprotocolTransactionStatusEvent,
  MetaprotocolTransactionPending,
  MetaprotocolTransactionErrored,
  MetaprotocolTransactionSuccessful,
} from 'query-node/dist/model'
import {
  deserializeMetadata,
  genericEventFields,
  inconsistentState,
  invalidMetadata,
  logger,
  updateMetaprotocolTransactionStatus,
} from '../common'
import {
  ChannelCategoryMetadata,
  ChannelMetadata,
  ChannelModeratorRemarked,
  ChannelOwnerRemarked,
} from '@joystream/metadata-protobuf'
import { integrateMeta } from '@joystream/metadata-protobuf/utils'
import { In } from 'typeorm'
import {
  processModerateCommentMessage,
  processPinOrUnpinCommentMessage,
  processBanOrUnbanMemberFromChannelMessage,
  processVideoReactionsPreferenceMessage,
} from './commentAndReaction'
import { getAllManagers } from '../derivedPropertiesManager/applications'
import { BaseModel } from '@joystream/warthog'

export async function content_ChannelCreated(ctx: EventContext & StoreContext): Promise<void> {
  const { store, event } = ctx
  // read event data
  const [contentActor, channelId, , channelCreationParameters] = new Content.ChannelCreatedEvent(event).params

  // create entity
  const channel = new Channel({
    // main data
    id: channelId.toString(),
    isCensored: false,
    videos: [],
    createdInBlock: event.blockNumber,
    rewardAccount: channelCreationParameters.reward_account.unwrapOr(undefined)?.toString(),
    activeVideosCounter: 0,

    // fill in auto-generated fields
    createdAt: new Date(event.blockTimestamp),
    updatedAt: new Date(event.blockTimestamp),

    // prepare channel owner (handles fields `ownerMember` and `ownerCuratorGroup`)
    ...(await convertContentActorToChannelOrNftOwner(store, contentActor)),

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
  const [, channelId, , channelUpdateParameters] = new Content.ChannelUpdatedEvent(event).params

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
  const newMetadataBytes = channelUpdateParameters.new_meta.unwrapOr(null)

  //  update metadata if it was changed
  if (newMetadataBytes) {
    const newMetadata = deserializeMetadata(ChannelMetadata, newMetadataBytes) || {}
    await processChannelMetadata(
      ctx,
      channel,
      newMetadata,
      channelUpdateParameters.assets_to_upload.unwrapOr(undefined)
    )
  }

  // prepare changed reward account
  const newRewardAccount = channelUpdateParameters.reward_account.unwrapOr(null)
  // reward account change happened?
  if (newRewardAccount) {
    // this will change the `channel`!
    channel.rewardAccount = newRewardAccount.unwrapOr(undefined)?.toString()
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

export async function content_ChannelCensorshipStatusUpdated({
  store,
  event,
}: EventContext & StoreContext): Promise<void> {
  // read event data
  const [, channelId, isCensored] = new Content.ChannelCensorshipStatusUpdatedEvent(event).params

  // load event
  const channel = await store.get(Channel, { where: { id: channelId.toString() } })

  // ensure channel exists
  if (!channel) {
    return inconsistentState('Non-existing channel censoring requested', channelId)
  }

  // update channel
  channel.isCensored = isCensored.isTrue

  // set last update time
  channel.updatedAt = new Date(event.blockTimestamp)

  await getAllManagers(store).channels.onMainEntityUpdate(channel)

  // save channel
  await store.save<Channel>(channel)

  // emit log event
  logger.info('Channel censorship status has been updated', { id: channelId, isCensored: isCensored.isTrue })
}

/// //////////////// ChannelCategory ////////////////////////////////////////////

export async function content_ChannelCategoryCreated({ store, event }: EventContext & StoreContext): Promise<void> {
  // read event data
  const [channelCategoryId, , channelCategoryCreationParameters] = new Content.ChannelCategoryCreatedEvent(event).params

  // read metadata
  const metadata = deserializeMetadata(ChannelCategoryMetadata, channelCategoryCreationParameters.meta) || {}

  // create new channel category
  const channelCategory = new ChannelCategory({
    // main data
    id: channelCategoryId.toString(),
    channels: [],
    createdInBlock: event.blockNumber,
    activeVideosCounter: 0,

    // fill in auto-generated fields
    createdAt: new Date(event.blockTimestamp),
    updatedAt: new Date(event.blockTimestamp),
  })
  integrateMeta(channelCategory, metadata, ['name'])

  // save channel
  await store.save<ChannelCategory>(channelCategory)

  // emit log event
  logger.info('Channel category has been created', { id: channelCategory.id })
}

export async function content_ChannelCategoryUpdated({ store, event }: EventContext & StoreContext): Promise<void> {
  // read event data
  const [, channelCategoryId, channelCategoryUpdateParameters] = new Content.ChannelCategoryUpdatedEvent(event).params

  // load channel category
  const channelCategory = await store.get(ChannelCategory, {
    where: {
      id: channelCategoryId.toString(),
    },
  })

  // ensure channel exists
  if (!channelCategory) {
    return inconsistentState('Non-existing channel category update requested', channelCategoryId)
  }

  // read metadata
  const newMeta = deserializeMetadata(ChannelCategoryMetadata, channelCategoryUpdateParameters.new_meta) || {}
  integrateMeta(channelCategory, newMeta, ['name'])

  // set last update time
  channelCategory.updatedAt = new Date(event.blockTimestamp)

  // save channel category
  await store.save<ChannelCategory>(channelCategory)

  // emit log event
  logger.info('Channel category has been updated', { id: channelCategory.id })
}

export async function content_ChannelCategoryDeleted({ store, event }: EventContext & StoreContext): Promise<void> {
  // read event data
  const [, channelCategoryId] = new Content.ChannelCategoryDeletedEvent(event).params

  // load channel category
  const channelCategory = await store.get(ChannelCategory, {
    where: {
      id: channelCategoryId.toString(),
    },
  })

  // ensure channel category exists
  if (!channelCategory) {
    return inconsistentState('Non-existing channel category deletion requested', channelCategoryId)
  }

  // delete channel category
  await store.remove<ChannelCategory>(channelCategory)

  // emit log event
  logger.info('Channel category has been deleted', { id: channelCategory.id })
}

export async function content_ChannelDeleted({ store, event }: EventContext & StoreContext): Promise<void> {
  const [, channelId] = new Content.ChannelDeletedEvent(event).params

  await store.remove<Channel>(new Channel({ id: channelId.toString() }))
}

export async function content_ChannelOwnerRemarked(ctx: EventContext & StoreContext): Promise<void> {
  const { event, store } = ctx
  const [owner, channelId, message] = new Content.ChannelOwnerRemarkedEvent(ctx.event).params

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
    const contentActor = await convertContentActor(ctx.store, owner)

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
  const [moderator, channelId, message] = new Content.ChannelModeratorRemarkedEvent(ctx.event).params

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
