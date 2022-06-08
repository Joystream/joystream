/*
eslint-disable @typescript-eslint/naming-convention
*/
import { EventContext, StoreContext, SubstrateEvent } from '@joystream/hydra-common'
import { ChannelCategoryMetadata, ChannelMetadata } from '@joystream/metadata-protobuf'
import { integrateMeta } from '@joystream/metadata-protobuf/utils'
import BN from 'bn.js'
import {
  Channel,
  ChannelCategory,
  ChannelPayoutParameters,
  ChannelPayoutsCommitmentUpdatedEvent,
  ChannelRewardClaimedAndWithdrawnEvent,
  ChannelRewardClaimedEvent,
  Membership,
  StorageDataObject,
} from 'query-node/dist/model'
import { getCurrentElectedCouncil } from 'src/council'
import { In } from 'typeorm'
import { Content } from '../../generated/types'
import {
  deserializeMetadata,
  deterministicEntityId,
  genericEventFields,
  inconsistentState,
  logger,
  unwrap,
} from '../common'
import { getAllManagers } from '../derivedPropertiesManager/applications'
import {
  convertContentActor,
  convertContentActorToChannelOrNftOwner,
  processChannelMetadata,
  unsetAssetRelations,
} from './utils'

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

export async function content_ChannelPayoutsUpdated({ store, event }: EventContext & StoreContext): Promise<void> {
  // read event data
  const [updateChannelPayoutParameters, dataObjectId] = new Content.ChannelPayoutsUpdatedEvent(event).params

  const asDataObjectId = unwrap(dataObjectId)

  const payloadDataObject = await store.get(StorageDataObject, { where: { id: asDataObjectId } })

  if (payloadDataObject) {
    const electedCouncil = await getCurrentElectedCouncil(store)
    payloadDataObject.channelPayoutsPayloadByCouncil = electedCouncil

    // common event processing - second

    const commitmentUpdatedEvent = new ChannelPayoutsCommitmentUpdatedEvent({
      ...genericEventFields(event),
      commitment: Buffer.from(updateChannelPayoutParameters.commitment.unwrap()),
      payload: payloadDataObject,
    })

    await store.save<ChannelPayoutsCommitmentUpdatedEvent>(commitmentUpdatedEvent)
  }

  // load existing channel payout parameters record (if any)
  const channelPayoutParameters = await store.get(ChannelPayoutParameters, {
    where: { isCommitmentValid: true },
  })

  const asPayload = unwrap(updateChannelPayoutParameters.payload)?.object_creation_params
  const payloadSize = asPayload ? new BN(asPayload.size) : undefined
  const payloadHash = asPayload ? Buffer.from(asPayload.ipfsContentId) : undefined
  const minCashoutAllowed = unwrap(updateChannelPayoutParameters.min_cashout_allowed)
  const maxCashoutAllowed = unwrap(updateChannelPayoutParameters.max_cashout_allowed)
  const channelCashoutsEnabled = unwrap(updateChannelPayoutParameters.channel_cashouts_enabled)?.valueOf()

  if (updateChannelPayoutParameters.commitment.isSome) {
    if (channelPayoutParameters) {
      channelPayoutParameters.isCommitmentValid = false

      // invalidate existing channel payout parameters record
      await store.save<ChannelPayoutParameters>(channelPayoutParameters)
    }

    const newChannelPayoutParameters = new ChannelPayoutParameters({
      id: deterministicEntityId(event),
      commitment: Buffer.from(updateChannelPayoutParameters.commitment.unwrap()),
      payloadSize,
      payloadHash,
      minCashoutAllowed,
      maxCashoutAllowed,
      channelCashoutsEnabled,
      createdAt: new Date(event.blockTimestamp),
      updatedAt: new Date(event.blockTimestamp),
      isCommitmentValid: true,
    })

    // save new channel payout parameters record (with new commitment)
    await store.save<ChannelPayoutParameters>(newChannelPayoutParameters)

    // common event processing - second

    const commitmentUpdatedEvent = new ChannelPayoutsCommitmentUpdatedEvent({
      ...genericEventFields(event),
      commitment: Buffer.from(updateChannelPayoutParameters.commitment.unwrap()),
      payload: payloadDataObject,
    })

    await store.save<ChannelPayoutsCommitmentUpdatedEvent>(commitmentUpdatedEvent)

    return
  }

  if (!channelPayoutParameters) {
    inconsistentState('Channel payout params update request for non-existing commitment')
  }

  channelPayoutParameters.payloadHash = payloadHash
  channelPayoutParameters.payloadSize = payloadSize
  channelPayoutParameters.minCashoutAllowed = minCashoutAllowed || channelPayoutParameters.minCashoutAllowed
  channelPayoutParameters.maxCashoutAllowed = maxCashoutAllowed || channelPayoutParameters.maxCashoutAllowed
  channelPayoutParameters.channelCashoutsEnabled =
    channelCashoutsEnabled || channelPayoutParameters.channelCashoutsEnabled
  channelPayoutParameters.updatedAt = new Date(event.blockTimestamp)

  // update existing channel payout parameters record
  await store.save<ChannelPayoutParameters>(channelPayoutParameters)
}

function setChannelRewardFields(event: SubstrateEvent, channel: Channel, amount: BN) {
  // update channel reward fields
  channel.lastRewardClaimed = amount
  channel.cumulativeRewardClaimed = channel.cumulativeRewardClaimed?.add(amount)
  channel.lastRewardClaimedAt = new Date(event.blockTimestamp)
  channel.updatedAt = new Date(event.blockTimestamp)
}

export async function content_ChannelRewardUpdated({ store, event }: EventContext & StoreContext): Promise<void> {
  // load event data
  const [amount, channelId] = new Content.ChannelRewardUpdatedEvent(event).params

  // load channel
  const channel = await store.get(Channel, { where: { id: channelId.toString() } })

  // ensure channel exists
  if (!channel) {
    return inconsistentState('Non-existing channel reward updated', channelId)
  }

  // common event processing - second

  const rewardClaimedEvent = new ChannelRewardClaimedEvent({
    ...genericEventFields(event),

    amount,
    channel,
  })

  await store.save<ChannelRewardClaimedEvent>(rewardClaimedEvent)

  setChannelRewardFields(event, channel, amount)

  // save channel
  await store.save<Channel>(channel)
}

export async function content_ChannelRewardClaimedAndWithdrawn({
  store,
  event,
}: EventContext & StoreContext): Promise<void> {
  // load event data
  const [owner, channelId, amount, accountId] = new Content.ChannelRewardClaimedAndWithdrawnEvent(event).params

  // load channel
  const channel = await store.get(Channel, { where: { id: channelId.toString() } })

  // ensure channel exists
  if (!channel) {
    return inconsistentState('Non-existing channel reward updated', channelId)
  }

  // common event processing - second

  const rewardClaimedEvent = new ChannelRewardClaimedAndWithdrawnEvent({
    ...genericEventFields(event),

    amount,
    channel,
    account: accountId.toString(),
    actor: await convertContentActor(store, owner),
  })

  await store.save<ChannelRewardClaimedEvent>(rewardClaimedEvent)

  setChannelRewardFields(event, channel, amount)

  // save channel
  await store.save<Channel>(channel)
}
