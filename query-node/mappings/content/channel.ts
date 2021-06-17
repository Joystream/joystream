/*
eslint-disable @typescript-eslint/naming-convention
*/
import { EventContext, StoreContext } from '@dzlzv/hydra-common'
import { FindConditions, In } from 'typeorm'
import { AccountId } from '@polkadot/types/interfaces'
import { Option } from '@polkadot/types/codec'
import { Content } from '../generated/types'
import {
  readProtobuf,
  readProtobufWithAssets,
  convertContentActorToChannelOwner,
  convertContentActorToDataObjectOwner,
} from './utils'
import { Channel, ChannelCategory, DataObject, AssetAvailability } from 'query-node/dist/model'
import { inconsistentState, logger } from '../common'

export async function content_ChannelCreated({ store, event }: EventContext & StoreContext): Promise<void> {
  // read event data
  const { channelId, channelCreationParameters, contentActor } = new Content.ChannelCreatedEvent(event).data

  // read metadata
  const protobufContent = await readProtobufWithAssets(new Channel(), {
    metadata: channelCreationParameters.meta,
    store,
    blockNumber: event.blockNumber,
    assets: channelCreationParameters.assets,
    contentOwner: convertContentActorToDataObjectOwner(contentActor, channelId.toNumber()),
  })

  // create entity
  const channel = new Channel({
    // main data
    id: channelId.toString(),
    isCensored: false,
    videos: [],
    createdInBlock: event.blockNumber,

    // default values for properties that might or might not be filled by metadata
    coverPhotoUrls: [],
    coverPhotoAvailability: AssetAvailability.INVALID,
    avatarPhotoUrls: [],
    avatarPhotoAvailability: AssetAvailability.INVALID,

    // fill in auto-generated fields
    createdAt: new Date(event.blockTimestamp),
    updatedAt: new Date(event.blockTimestamp),

    // prepare channel owner (handles fields `ownerMember` and `ownerCuratorGroup`)
    ...(await convertContentActorToChannelOwner(store, contentActor)),

    // integrate metadata
    ...protobufContent,
  })

  // save entity
  await store.save<Channel>(channel)

  // emit log event
  logger.info('Channel has been created', { id: channel.id })
}

export async function content_ChannelUpdated({ store, event }: EventContext & StoreContext): Promise<void> {
  // read event data
  const { channelId, channelUpdateParameters, contentActor } = new Content.ChannelUpdatedEvent(event).data

  // load channel
  const channel = await store.get(Channel, { where: { id: channelId.toString() } as FindConditions<Channel> })

  // ensure channel exists
  if (!channel) {
    return inconsistentState('Non-existing channel update requested', channelId)
  }

  // prepare changed metadata
  const newMetadata = channelUpdateParameters.new_meta.unwrapOr(null)

  //  update metadata if it was changed
  if (newMetadata) {
    const protobufContent = await readProtobufWithAssets(new Channel(), {
      metadata: newMetadata,
      store,
      blockNumber: event.blockNumber,
      assets: channelUpdateParameters.assets.unwrapOr([]),
      contentOwner: convertContentActorToDataObjectOwner(contentActor, channelId.toNumber()),
    })

    // update all fields read from protobuf
    for (const [key, value] of Object.entries(protobufContent)) {
      channel[key] = value
    }
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
  const { contentId: contentIds } = new Content.ChannelAssetsRemovedEvent(event).data

  // load channel
  const assets = await store.getMany(DataObject, {
    where: {
      id: In(contentIds.toArray().map((item) => item.toString())),
    } as FindConditions<DataObject>,
  })

  // delete assets
  for (const asset of assets) {
    await store.remove<DataObject>(asset)
  }

  // emit log event
  logger.info('Channel assets have been removed', { ids: contentIds })
}

export async function content_ChannelCensorshipStatusUpdated({
  store,
  event,
}: EventContext & StoreContext): Promise<void> {
  // read event data
  const { channelId, isCensored } = new Content.ChannelCensorshipStatusUpdatedEvent(event).data

  // load event
  const channel = await store.get(Channel, { where: { id: channelId.toString() } as FindConditions<Channel> })

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
  const { channelCategoryCreationParameters, channelCategoryId } = new Content.ChannelCategoryCreatedEvent(event).data

  // read metadata
  const protobufContent = await readProtobuf(new ChannelCategory(), {
    metadata: channelCategoryCreationParameters.meta,
    store,
    blockNumber: event.blockNumber,
  })

  // create new channel category
  const channelCategory = new ChannelCategory({
    // main data
    id: channelCategoryId.toString(),
    channels: [],
    createdInBlock: event.blockNumber,

    // fill in auto-generated fields
    createdAt: new Date(event.blockTimestamp),
    updatedAt: new Date(event.blockTimestamp),

    // integrate metadata
    ...protobufContent,
  })

  // save channel
  await store.save<ChannelCategory>(channelCategory)

  // emit log event
  logger.info('Channel category has been created', { id: channelCategory.id })
}

export async function content_ChannelCategoryUpdated({ store, event }: EventContext & StoreContext): Promise<void> {
  // read event data
  const { channelCategoryId, channelCategoryUpdateParameters } = new Content.ChannelCategoryUpdatedEvent(event).data

  // load channel category
  const channelCategory = await store.get(ChannelCategory, {
    where: {
      id: channelCategoryId.toString(),
    } as FindConditions<ChannelCategory>,
  })

  // ensure channel exists
  if (!channelCategory) {
    return inconsistentState('Non-existing channel category update requested', channelCategoryId)
  }

  // read metadata
  const protobufContent = await readProtobuf(new ChannelCategory(), {
    metadata: channelCategoryUpdateParameters.new_meta,
    store,
    blockNumber: event.blockNumber,
  })

  // update all fields read from protobuf
  for (const [key, value] of Object.entries(protobufContent)) {
    channelCategory[key] = value
  }

  // set last update time
  channelCategory.updatedAt = new Date(event.blockTimestamp)

  // save channel category
  await store.save<ChannelCategory>(channelCategory)

  // emit log event
  logger.info('Channel category has been updated', { id: channelCategory.id })
}

export async function content_ChannelCategoryDeleted({ store, event }: EventContext & StoreContext): Promise<void> {
  // read event data
  const { channelCategoryId } = new Content.ChannelCategoryDeletedEvent(event).data

  // load channel category
  const channelCategory = await store.get(ChannelCategory, {
    where: {
      id: channelCategoryId.toString(),
    } as FindConditions<ChannelCategory>,
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
