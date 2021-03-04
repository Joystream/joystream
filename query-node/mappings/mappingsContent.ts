// TODO: add logging of mapping events (entity found/not found, entity updated/deleted, etc.)
// TODO: update event list - some events were added/removed recently and are missing in this file
// TODO: handling of Language, MediaType, etc.

import { SubstrateEvent } from '@dzlzv/hydra-common'
import { DatabaseManager } from '@dzlzv/hydra-db-utils'

// protobuf definitions
import {
  ChannelMetadata,
  ChannelCategoryMetadata
} from '../../content-metadata-protobuf/compiled/proto/Channel_pb'
import {
  PublishedBeforeJoystream as PublishedBeforeJoystreamMetadata,
  License as LicenseMetadata,
  MediaType as MediaTypeMetadata,
  VideoMetadata,
  VideoCategoryMetadata,
} from '../../content-metadata-protobuf/compiled/proto/Video_pb'

// enums
import { Network } from '../generated/graphql-server/src/modules/enums/enums'

// input schema models
import { Block } from '../generated/graphql-server/src/modules/block/block.model'
import { Channel } from '../generated/graphql-server/src/modules/channel/channel.model'
import { ChannelCategory } from '../generated/graphql-server/src/modules/channelCategory/channelCategory.model'
import { Video } from '../generated/graphql-server/src/modules/video/video.model'
import { VideoCategory } from '../generated/graphql-server/src/modules/videoCategory/videoCategory.model'


const currentNetwork = Network.BABYLON

enum ProtobufEntity {
  Channel,
  ChannelCategory,
  Video,
  VideoCategory,
}

function readProtobuf(type: ProtobufEntity, metadata: Uint8Array) {
  // TODO: consider getting rid of this function - it makes sense to keep it only complex logic will be executed here
  //       for example retriving language for channel, retrieving new assets (channel photo), etc.

  if (type == ProtobufEntity.Channel) {
    return ChannelMetadata.deserializeBinary(metadata)
    /*
    return {
      title: 'TODO handle', // TODO: read from protobuf
      description: 'TODO description', // TODO: read from protobuf
      coverPhoto: undefined, // TODO: read from protobuf
      avatarPhoto: undefined, // TODO: read from protobuf
      isPublic: true, // TODO: read from protobuf
      language: undefined, // TODO: read language from protobuf and connect it with existing Language (if any)
    }
    */
  }

  if (type == ProtobufEntity.ChannelCategory) {
    return ChannelCategoryMetadata.deserializeBinary(metadata)
  }

  if (type == ProtobufEntity.Video) {
    return VideoMetadata.deserializeBinary(metadata)
  }

  if (type == ProtobufEntity.VideoCategory) {
    return VideoCategoryMetadata.deserializeBinary(metadata)
  }

  throw `Not implemented type: ${type}`
}

// temporary function used before proper block is retrieved
function convertblockNumberToBlock(block: number): Block {
  return new Block({
    block: block,
    executedAt: new Date(), // TODO get real block execution time
    network: currentNetwork,
  })
}

/////////////////// Channel ////////////////////////////////////////////////////

// eslint-disable-next-line @typescript-eslint/naming-convention
export async function content_ChannelCreated(db: DatabaseManager, event: SubstrateEvent): Promise<void> {
  /* event arguments
  ChannelId,
  ChannelOwner<MemberId, CuratorGroupId, DAOId>,
  Vec<NewAsset>,
  ChannelCreationParameters<ContentParameters>,
  */

  const protobufContent = readProtobuf(ProtobufEntity.Channel, (event.params[3] as any).meta) // TODO: get rid of `any` typecast

  const channel = new Channel({
    id: event.params[0].toString(), // ChannelId
    isCensored: false,
    videos: [],
    happenedIn: convertblockNumberToBlock(event.blockNumber),
    ...protobufContent.toObject()
  })

  await db.save<Channel>(channel)
}

// eslint-disable-next-line @typescript-eslint/naming-convention
export async function content_ChannelUpdated(
  db: DatabaseManager,
  event: SubstrateEvent
) {
  /* event arguments
  ContentActor,
  ChannelId,
  Channel,
  ChannelUpdateParameters<ContentParameters, AccountId>,
  */

  const channelId = event.params[1].toString()
  const channel = await db.get(Channel, { where: { id: channelId } })

  const protobufContent = readProtobuf(ProtobufEntity.Channel, (event.params[3] as any).meta) // TODO: get rid of `any` typecast

  const updatedChannel = new Channel({
    // TODO: check that this kind of new updated channel construction is valid or it should rather be edited as `channel.myProperty = something`
    ...channel,
    ...protobufContent.toObject()
  })

  await db.save<Channel>(updatedChannel)
}

// eslint-disable-next-line @typescript-eslint/naming-convention
export async function content_ChannelDeleted(
  db: DatabaseManager,
  event: SubstrateEvent
) {
  const channelId = event.params[1].toString()
  const channel = await db.get(Channel, { where: { id: channelId } })

  await db.remove<Channel>(channel)
}

// eslint-disable-next-line @typescript-eslint/naming-convention
export async function content_ChannelCensored(
  db: DatabaseManager,
  event: SubstrateEvent
) {
  /* event arguments
  ContentActor,
  ChannelId,
  Vec<u8>
  */

  const channelId = event.params[1].toString()
  const channel = await db.get(Channel, { where: { id: channelId } })

  channel.isCensored = true;

  await db.save<Channel>(channel)
}

// eslint-disable-next-line @typescript-eslint/naming-convention
export async function content_ChannelUncensored(
  db: DatabaseManager,
  event: SubstrateEvent
) {
  /* event arguments
  ContentActor,
  ChannelId,
  Vec<u8>
  */

  const channelId = event.params[1].toString()
  const channel = await db.get(Channel, { where: { id: channelId } })

  channel.isCensored = false;

  await db.save<Channel>(channel)
}

// eslint-disable-next-line @typescript-eslint/naming-convention
export async function content_ChannelOwnershipTransferRequested(
  db: DatabaseManager,
  event: SubstrateEvent
) {
  // TODO - is mapping for this event needed?
}

// eslint-disable-next-line @typescript-eslint/naming-convention
export async function content_ChannelOwnershipTransferRequestWithdrawn(
  db: DatabaseManager,
  event: SubstrateEvent
) {
  // TODO - is mapping for this event needed?
}

// eslint-disable-next-line @typescript-eslint/naming-convention
export async function content_ChannelOwnershipTransferred(
  db: DatabaseManager,
  event: SubstrateEvent
) {
  // TODO
}

/////////////////// ChannelCategory ////////////////////////////////////////////

// eslint-disable-next-line @typescript-eslint/naming-convention
export async function content_ChannelCategoryCreated(
  db: DatabaseManager,
  event: SubstrateEvent
) {
  /* event arguments
  ChannelCategoryId,
  ChannelCategory,
  ChannelCategoryCreationParameters,
  */

  const protobufContent = readProtobuf(ProtobufEntity.ChannelCategory, (event.params[2] as any).meta) // TODO: get rid of `any` typecast

  const channelCategory = new ChannelCategory({
    id: event.params[0].toString(), // ChannelCategoryId
    channels: [],
    happenedIn: convertblockNumberToBlock(event.blockNumber),
    ...protobufContent.toObject()
  })

  await db.save<ChannelCategory>(channelCategory)
}

// eslint-disable-next-line @typescript-eslint/naming-convention
export async function content_ChannelCategoryUpdated(
  db: DatabaseManager,
  event: SubstrateEvent
) {
  /* event arguments
  ContentActor,
  ChannelCategoryId,
  ChannelCategoryUpdateParameters,
  */

  const channelCategoryId = event.params[1].toString()
  const channelCategory = await db.get(ChannelCategory, { where: { id: channelCategoryId } })

  const protobufContent = readProtobuf(ProtobufEntity.ChannelCategory, (event.params[2] as any).meta) // TODO: get rid of `any` typecast

  const updatedChannelCategory = new ChannelCategory({
    // TODO: check that this kind of new updated channel construction is valid or it should rather be edited as `channel.myProperty = something`
    ...channelCategory,
    ...protobufContent.toObject()
  })

  await db.save<ChannelCategory>(channelCategory)
}

// eslint-disable-next-line @typescript-eslint/naming-convention
export async function content_ChannelCategoryDeleted(
  db: DatabaseManager,
  event: SubstrateEvent
) {
  /* event arguments
  ContentActor,
  ChannelCategoryId
  */
  const channelCategoryId = event.params[1].toString()
  const channelCategory = await db.get(ChannelCategory, { where: { id: channelCategoryId } })

  await db.remove<ChannelCategory>(channelCategory)
}

/////////////////// VideoCategory //////////////////////////////////////////////

// eslint-disable-next-line @typescript-eslint/naming-convention
export async function content_VideoCategoryCreated(
  db: DatabaseManager,
  event: SubstrateEvent
) {
  /* event arguments
  ContentActor,
  VideoCategoryId,
  VideoCategoryCreationParameters,
  */

  const protobufContent = readProtobuf(ProtobufEntity.VideoCategory, (event.params[2] as any).meta) // TODO: get rid of `any` typecast

  const videoCategory = new VideoCategory({
    id: event.params[0].toString(), // ChannelId
    isCensored: false, // TODO: where this value comes from?
    videos: [],
    happenedIn: convertblockNumberToBlock(event.blockNumber),
    ...protobufContent.toObject()
  })

  await db.save<VideoCategory>(videoCategory)
}

// eslint-disable-next-line @typescript-eslint/naming-convention
export async function content_VideoCategoryUpdated(
  db: DatabaseManager,
  event: SubstrateEvent
) {
  /* event arguments
  ContentActor,
  VideoCategoryId,
  VideoCategoryUpdateParameters,
  */

  const videoCategoryId = event.params[1].toString()
  const videoCategory = await db.get(VideoCategory, { where: { id: videoCategoryId } })

  const protobufContent = readProtobuf(ProtobufEntity.VideoCategory, (event.params[2] as any).meta) // TODO: get rid of `any` typecast

  const updatedVideoCategory = new VideoCategory({
    // TODO: check that this kind of new updated channel construction is valid or it should rather be edited as `channel.myProperty = something`
    ...videoCategory,
    ...protobufContent.toObject()
  })

  await db.save<VideoCategory>(videoCategory)
}

// eslint-disable-next-line @typescript-eslint/naming-convention
export async function content_VideoCategoryDeleted(
  db: DatabaseManager,
  event: SubstrateEvent
) {
  /* event arguments
  ContentActor,
  VideoCategoryId,
  */

  const videoCategoryId = event.params[1].toString()
  const videoCategory = await db.get(VideoCategory, { where: { id: videoCategoryId } })

  await db.remove<VideoCategory>(videoCategory)
}

/////////////////// Video //////////////////////////////////////////////////////

// eslint-disable-next-line @typescript-eslint/naming-convention
export async function content_VideoCreated(
  db: DatabaseManager,
  event: SubstrateEvent
) {
  /* event arguments
  ContentActor,
  ChannelId,
  VideoId,
  VideoCreationParameters<ContentParameters>,
  */

  const protobufContent = readProtobuf(ProtobufEntity.Video, (event.params[3] as any).meta) // TODO: get rid of `any` typecast

  const channel = new Video({
    id: event.params[1].toString(), // ChannelId
    isCensored: false,
    channel: event.params[1],
    happenedIn: convertblockNumberToBlock(event.blockNumber),
    ...protobufContent.toObject()
  })

  await db.save<Video>(channel)
}

// eslint-disable-next-line @typescript-eslint/naming-convention
export async function content_VideoUpdated(
  db: DatabaseManager,
  event: SubstrateEvent
) {
  /* event arguments
  ContentActor,
  VideoId,
  VideoUpdateParameters<ContentParameters>,
  */
  const videoId = event.params[1].toString()
  const video = await db.get(Video, { where: { id: videoId } })

  const protobufContent = readProtobuf(ProtobufEntity.Video, (event.params[2] as any).meta) // TODO: get rid of `any` typecast

  const updatedVideo = new Video({
    // TODO: check that this kind of new updated channel construction is valid or it should rather be edited as `channel.myProperty = something`
    ...video,
    ...protobufContent.toObject()
  })

  await db.save<Video>(video)
}

// eslint-disable-next-line @typescript-eslint/naming-convention
export async function content_VideoDeleted(
  db: DatabaseManager,
  event: SubstrateEvent
) {
  /* event arguments
  ContentActor,
  VideoCategoryId,
  */

  const videoId = event.params[1].toString()
  const video = await db.get(Video, { where: { id: videoId } })

  await db.remove<Video>(video)
}

// eslint-disable-next-line @typescript-eslint/naming-convention
export async function content_VideoCensored(
  db: DatabaseManager,
  event: SubstrateEvent
) {
  /* event arguments
  ContentActor,
  VideoId,
  Vec<u8>
  */

  const videoId = event.params[1].toString()
  const video = await db.get(Video, { where: { id: videoId } })

  video.isCensored = true;

  await db.save<Video>(video)
}

// eslint-disable-next-line @typescript-eslint/naming-convention
export async function content_VideoUncensored(
  db: DatabaseManager,
  event: SubstrateEvent
) {
  /* event arguments
  ContentActor,
  VideoId,
  Vec<u8>
  */

  const channelId = event.params[1].toString()
  const video = await db.get(Video, { where: { id: videoId } })

  video.isCensored = false;

  await db.save<Video>(video)
}

// eslint-disable-next-line @typescript-eslint/naming-convention
export async function content_FeaturedVideosSet(
  db: DatabaseManager,
  event: SubstrateEvent
) {
  /* event arguments
  ContentActor,
  Vec<VideoId>,
  */

  const videoIds = event.params[1]

  for (let videoId in videoIds) {
    const video = await db.get(Video, { where: { id: videoId } })

    video.isFeatured = true;

    await db.save<Video>(video)
  }

  // TODO: remove featured flag from previously featured videos
}
