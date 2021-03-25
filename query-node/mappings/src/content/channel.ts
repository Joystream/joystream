import { SubstrateEvent } from '@dzlzv/hydra-common'
import { DatabaseManager } from '@dzlzv/hydra-db-utils'
import ISO6391 from 'iso-639-1';

// protobuf definitions
import {
  ChannelMetadata,
  ChannelCategoryMetadata,
  PublishedBeforeJoystream as PublishedBeforeJoystreamMetadata,
  License as LicenseMetadata,
  MediaType as MediaTypeMetadata,
  VideoMetadata,
  VideoCategoryMetadata,
} from '@joystream/content-metadata-protobuf'

import {
  Content,
} from '../../../generated/types'

import { readProtobuf } from './utils'

import {
  inconsistentState,
  prepareBlock,
  prepareAssetDataObject,
} from '../common'

// primary entities
import { Block } from 'query-node/src/modules/block/block.model'
import { CuratorGroup } from 'query-node/src/modules/curator-group/curator-group.model'
import { Channel } from 'query-node/src/modules/channel/channel.model'
import { ChannelCategory } from 'query-node/src/modules/channel-category/channel-category.model'
import { Video } from 'query-node/src/modules/video/video.model'
import { VideoCategory } from 'query-node/src/modules/video-category/video-category.model'

// secondary entities
import { Language } from 'query-node/src/modules/language/language.model'
import { License } from 'query-node/src/modules/license/license.model'
import { VideoMediaEncoding } from 'query-node/src/modules/video-media-encoding/video-media-encoding.model'
import { VideoMediaMetadata } from 'query-node/src/modules/video-media-metadata/video-media-metadata.model'

// Asset
import {
  Asset,
  AssetUrl,
  AssetUploadStatus,
  AssetStorage,
  AssetOwner,
  AssetOwnerMember,
} from 'query-node/src/modules/variants/variants.model'
import {
  AssetDataObject,
  LiaisonJudgement
} from 'query-node/src/modules/asset-data-object/asset-data-object.model'

// Joystream types
import {
  ContentParameters,
  NewAsset,
} from '@joystream/types/augment'

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

  // metadata change happened?
  if (channelUpdateParameters.new_meta.isSome) {
    const protobufContent = await readProtobuf(
      new Channel(),
      channelUpdateParameters.new_meta.unwrap(), // TODO: is there any better way to get value without unwrap?
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
    // TODO: separate to function
    // new different reward account set
    if (channelUpdateParameters.reward_account.unwrap().isSome) {
      channel.rewardAccount = channelUpdateParameters.reward_account.unwrap().unwrap().toString()
    } else { // reward account removed
      delete channel.rewardAccount
    }
  }

  // save channel
  await db.save<Channel>(channel)
}

export async function content_ChannelAssetsRemoved(
  db: DatabaseManager,
  event: SubstrateEvent
) {
  // TODO - what should happen here?
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
}
