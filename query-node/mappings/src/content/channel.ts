import { SubstrateEvent } from '@dzlzv/hydra-common'
import { DatabaseManager } from '@dzlzv/hydra-db-utils'
import ISO6391 from 'iso-639-1';

import { AccountId } from "@polkadot/types/interfaces";
import { Option } from '@polkadot/types/codec';
import { Content } from '../../../generated/types'
import { readProtobuf } from './utils'


// Asset
import { AssetStorage } from 'query-node/src/modules/variants/variants.model'
import {
  inconsistentState,
  logger,
  prepareBlock,
} from '../common'

// primary entities
import { Channel } from 'query-node/src/modules/channel/channel.model'
import { ChannelCategory } from 'query-node/src/modules/channel-category/channel-category.model'

// eslint-disable-next-line @typescript-eslint/naming-convention
export async function content_ChannelCreated(db: DatabaseManager, event: SubstrateEvent): Promise<void> {
  // read event data
  const {channelId, channelCreationParameters} = new Content.ChannelCreatedEvent(event).data

  // read metadata
  const protobufContent = await readProtobuf(
    new Channel(),
    channelCreationParameters.meta,
    channelCreationParameters.assets,
    db,
    event,
  )

  // create entity
  const channel = new Channel({
    id: channelId,
    isCensored: false,
    videos: [],
    happenedIn: await prepareBlock(db, event),
    ...Object(protobufContent)
  })

  // save entity
  await db.save<Channel>(channel)

  // emit log event
  logger.info('Channel has been created', {id: channel.id})
}

// eslint-disable-next-line @typescript-eslint/naming-convention
export async function content_ChannelUpdated(
  db: DatabaseManager,
  event: SubstrateEvent
) {
  // read event data
  const {channelId , channelUpdateParameters} = new Content.ChannelUpdatedEvent(event).data

  // load channel
  const channel = await db.get(Channel, { where: { id: channelId } })

  // ensure channel exists
  if (!channel) {
    return inconsistentState()
  }


  // prepare changed metadata
  const newMetadata = channelUpdateParameters.new_meta.isSome && channelUpdateParameters.new_meta.unwrapOr(null)

  //  update metadata if it was changed
  if (newMetadata) {
    const protobufContent = await readProtobuf(
      new Channel(),
      newMetadata,
      channelUpdateParameters.assets.unwrapOr([]),
      db,
      event,
    )

    // update all fields read from protobuf
    for (let [key, value] of Object(protobufContent).entries()) {
      channel[key] = value
    }
  }

  // reward account change happened?
  if (channelUpdateParameters.reward_account.isSome) {
    // this will change the `channel`!
    handleChannelRewardAccountChange(channel, channelUpdateParameters.reward_account.unwrap())
  }

  // save channel
  await db.save<Channel>(channel)

  // emit log event
  logger.info('Channel has been updated', {id: channel.id})
}

export async function content_ChannelAssetsRemoved(
  db: DatabaseManager,
  event: SubstrateEvent
) {
  // read event data
  const {contentId: contentIds} = new Content.ChannelAssetsRemovedEvent(event).data

  // load channel
  const assets = await db.getMany(AssetStorage, { where: { id: contentIds } })

  // delete assets
  for (const asset in assets) {
    await db.remove<AssetStorage>(asset)
  }

  // emit log event
  logger.info('Channel assets have been removed', {ids: contentIds})
}

// eslint-disable-next-line @typescript-eslint/naming-convention
export async function content_ChannelCensored(
  db: DatabaseManager,
  event: SubstrateEvent
) {
  // read event data
  const {channelId} = new Content.ChannelCensoredEvent(event).data

  // load event
  const channel = await db.get(Channel, { where: { id: channelId } })

  // ensure channel exists
  if (!channel) {
    return inconsistentState()
  }

  // update channel
  channel.isCensored = true;

  // save channel
  await db.save<Channel>(channel)

  // emit log event
  logger.info('Channel has been censored', {id: channelId})
}

// eslint-disable-next-line @typescript-eslint/naming-convention
export async function content_ChannelUncensored(
  db: DatabaseManager,
  event: SubstrateEvent
) {
  // read event data
  const {channelId} = new Content.ChannelUncensoredEvent(event).data

  // load event
  const channel = await db.get(Channel, { where: { id: channelId } })

  // ensure channel exists
  if (!channel) {
    return inconsistentState()
  }

  // update channel
  channel.isCensored = false;

  // save channel
  await db.save<Channel>(channel)

  // emit log event
  logger.info('Channel has been uncensored', {id: channel.id})
}

/////////////////// ChannelCategory ////////////////////////////////////////////

// eslint-disable-next-line @typescript-eslint/naming-convention
export async function content_ChannelCategoryCreated(
  db: DatabaseManager,
  event: SubstrateEvent
) {
  // read event data
  const {channelCategoryCreationParameters} = new Content.ChannelCategoryCreatedEvent(event).data

  // read metadata
  const protobufContent = await readProtobuf(
    new ChannelCategory(),
    channelCategoryCreationParameters.meta,
    [],
    db,
    event,
  )

  // create new channel category
  const channelCategory = new ChannelCategory({
    id: event.params[0].value.toString(), // ChannelCategoryId
    channels: [],
    happenedIn: await prepareBlock(db, event),
    ...Object(protobufContent)
  })

  // save channel
  await db.save<ChannelCategory>(channelCategory)

  // emit log event
  logger.info('Channel category has been created', {id: channelCategory.id})
}

// eslint-disable-next-line @typescript-eslint/naming-convention
export async function content_ChannelCategoryUpdated(
  db: DatabaseManager,
  event: SubstrateEvent
) {
  // read event data
  const {channelCategoryId, channelCategoryUpdateParameters} = new Content.ChannelCategoryUpdatedEvent(event).data

  // load channel category
  const channelCategory = await db.get(ChannelCategory, { where: { id: channelCategoryId } })

  // ensure channel exists
  if (!channelCategory) {
    return inconsistentState()
  }

  // read metadata
  const protobufContent = await readProtobuf(
    new ChannelCategory(),
    channelCategoryUpdateParameters.new_meta,
    [],
    db,
    event,
  )

  // update all fields read from protobuf
  for (let [key, value] of Object(protobufContent).entries()) {
    channelCategory[key] = value
  }

  // save channel category
  await db.save<ChannelCategory>(channelCategory)

  // emit log event
  logger.info('Channel category has been updated', {id: channelCategory.id})
}

// eslint-disable-next-line @typescript-eslint/naming-convention
export async function content_ChannelCategoryDeleted(
  db: DatabaseManager,
  event: SubstrateEvent
) {
  // read event data
  const {channelCategoryId} = new Content.ChannelCategoryDeletedEvent(event).data

  // load channel category
  const channelCategory = await db.get(ChannelCategory, { where: { id: channelCategoryId } })

  // ensure channel category exists
  if (!channelCategory) {
    return inconsistentState()
  }

  // delete channel category
  await db.remove<ChannelCategory>(channelCategory)

  // emit log event
  logger.info('Channel category has been deleted', {id: channelCategory.id})
}

/////////////////// Helpers ////////////////////////////////////////////////////

function handleChannelRewardAccountChange(
  channel: Channel, // will be modified inside of the function!
  reward_account: Option<AccountId>
) {
  // new different reward account set?
  if (reward_account.isSome) {
    channel.rewardAccount = reward_account.unwrap().toString()
    return
  }

  // reward account removed

  delete channel.rewardAccount
}
