/*
eslint-disable @typescript-eslint/naming-convention
*/
import { EventContext, StoreContext } from '@joystream/hydra-common'
import { In } from 'typeorm'
import { AccountId } from '@polkadot/types/interfaces'
import { Option } from '@polkadot/types/codec'
import { Content } from '../generated/types'
import { convertContentActorToChannelOwner, processChannelMetadata } from './utils'
import { AssetNone, Channel, ChannelCategory, DataObject } from 'query-node/dist/model'
import { deserializeMetadata, inconsistentState, logger } from '../common'
import { ChannelCategoryMetadata, ChannelMetadata } from '@joystream/metadata-protobuf'
import { integrateMeta } from '@joystream/metadata-protobuf/utils'

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
    // assets
    coverPhoto: new AssetNone(),
    avatarPhoto: new AssetNone(),
    // fill in auto-generated fields
    createdAt: new Date(event.blockTimestamp),
    updatedAt: new Date(event.blockTimestamp),
    // prepare channel owner (handles fields `ownerMember` and `ownerCuratorGroup`)
    ...(await convertContentActorToChannelOwner(store, contentActor)),
  })

  // deserialize & process metadata
  const metadata = deserializeMetadata(ChannelMetadata, channelCreationParameters.meta) || {}
  await processChannelMetadata(ctx, channel, metadata, channelCreationParameters.assets)

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
  const channel = await store.get(Channel, { where: { id: channelId.toString() } })

  // ensure channel exists
  if (!channel) {
    return inconsistentState('Non-existing channel update requested', channelId)
  }

  // prepare changed metadata
  const newMetadataBytes = channelUpdateParameters.new_meta.unwrapOr(null)

  //  update metadata if it was changed
  if (newMetadataBytes) {
    const newMetadata = deserializeMetadata(ChannelMetadata, newMetadataBytes) || {}
    await processChannelMetadata(ctx, channel, newMetadata, channelUpdateParameters.assets.unwrapOr([]))
  }

  // prepare changed reward account
  const newRewardAccount = channelUpdateParameters.reward_account.unwrapOr(null)

  // reward account change happened?
  if (newRewardAccount) {
    // this will change the `channel`!
    handleChannelRewardAccountChange(channel, newRewardAccount)
  }

  // set last update time
  channel.updatedAt = new Date(event.blockTimestamp)

  // save channel
  await store.save<Channel>(channel)

  // emit log event
  logger.info('Channel has been updated', { id: channel.id })
}

export async function content_ChannelAssetsRemoved({ store, event }: EventContext & StoreContext): Promise<void> {
  // read event data
  const [, , contentIds] = new Content.ChannelAssetsRemovedEvent(event).params

  // load channel
  const assets = await store.getMany(DataObject, {
    where: {
      id: In(contentIds.toArray().map((item) => item.toString())),
    },
  })

  // delete assets
  await Promise.all(assets.map((a) => store.remove<DataObject>(a)))

  // emit log event
  logger.info('Channel assets have been removed', { ids: contentIds })
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

/// //////////////// Helpers ////////////////////////////////////////////////////

function handleChannelRewardAccountChange(
  channel: Channel, // will be modified inside of the function!
  reward_account: Option<AccountId>
) {
  const rewardAccount = reward_account.unwrapOr(null)

  // new different reward account set?
  if (rewardAccount) {
    channel.rewardAccount = rewardAccount.toString()
    return
  }

  // reward account removed

  channel.rewardAccount = undefined // plan deletion (will have effect when saved to db)
}
