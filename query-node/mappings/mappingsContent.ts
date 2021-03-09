// TODO: add logging of mapping events (entity found/not found, entity updated/deleted, etc.)
// TODO: update event list - some events were added/removed recently and are missing in this file
// TODO: handling of Language, MediaType, etc.
// TODO: fix TS imports from joystream packages
// TODO: split file into multiple files

import { SubstrateEvent } from '@dzlzv/hydra-common'
import { DatabaseManager } from '@dzlzv/hydra-db-utils'

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
/*
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
*/

import {
  // primary entites
  Network,
  Block,
  Channel,
  ChannelCategory,
  Video,
  VideoCategory,

  // secondary entities
  Language,
  License,
  MediaType,
  VideoMediaEncoding,
  VideoMediaMetadata,

  // Asset
  Asset,
  AssetUrl,
  AssetUploadStatus,
  AssetDataObject,
  LiaisonJudgement,
  AssetStorage,
  AssetOwner,
  AssetOwnerMember,
} from 'query-node'

import {
  contentDirectory
} from '@joystream/types'
/*
// enums
import { Network } from '../generated/graphql-server/src/modules/enums/enums'

// input schema models
import { Block } from '../generated/graphql-server/src/modules/block/block.model'
import { Channel } from '../generated/graphql-server/src/modules/channel/channel.model'
import { ChannelCategory } from '../generated/graphql-server/src/modules/channelCategory/channelCategory.model'
import { Video } from '../generated/graphql-server/src/modules/video/video.model'
import { VideoCategory } from '../generated/graphql-server/src/modules/videoCategory/videoCategory.model'
*/

const currentNetwork = Network.BABYLON

/////////////////// Utils //////////////////////////////////////////////////////

enum ProtobufEntity {
  Channel,
  ChannelCategory,
  Video,
  VideoCategory,
}

// TODO: tweak generic types to make them actually work
//function readProtobuf(type: ProtobufEntity, metadata: Uint8Array) {
async function readProtobuf<T extends ProtobufEntity>(
  type: ProtobufEntity,
  metadata: Uint8Array,
  assets: contentDirectory.RawAsset[],
  db: DatabaseManager,
): Promise<Partial<T>> {
  // TODO: consider getting rid of this function - it makes sense to keep it only complex logic will be executed here
  //       for example retriving language for channel, retrieving new assets (channel photo), etc.

  // process channel
  if (type == ProtobufEntity.Channel) {
    const meta = ChannelMetadata.deserializeBinary(metadata)
    const result = meta.toObject()

    // prepare cover photo asset if needed
    if (result.coverPhoto !== undefined) {
      result.coverPhoto = extractAsset(result.coverPhoto, assets)
    }

    // prepare avatar photo asset if needed
    if (result.avatarPhoto !== undefined) {
      result.avatarPhoto = extractAsset(result.avatarPhoto, assets)
    }

    // prepare language if needed
    if (result.language) {
      result.language = await prepareLanguage(result.language, db)
    }

    return result
  }

  // process channel category
  if (type == ProtobufEntity.ChannelCategory) {
    return ChannelCategoryMetadata.deserializeBinary(metadata).toObject()
  }

  // process video
  if (type == ProtobufEntity.Video) {
    const meta = VideoMetadata.deserializeBinary(metadata)
    const result = meta.toObject()

    // prepare video category if needed
    if (result.category !== undefined) {
      result.category = prepareVideoCategory(result.category, db)
    }

    // prepare media meta information if needed
    if (result.mediaType) {
      result.mediaType = prepareVideoMetadata(result)
    }

    // prepare license if needed
    if (result.license) {
      result.license = prepareLicense(result.license)
    }

    // prepare thumbnail photo asset if needed
    if (result.thumbnail !== undefined) {
      result.thumbnail = extractAsset(result.thumbnail, assets)
    }

    // prepare video asset if needed
    if (result.media !== undefined) {
      result.media = extractAsset(result.media, assets)
    }

    // prepare language if needed
    if (result.language) {
      result.language = await prepareLanguage(result.language, db)
    }

    // prepare information about media published somewhere else before Joystream if needed.
    if (result.publishedBeforeJoystream) {
      // TODO: is ok to just ignore `isPublished?: boolean` here?
      if (result.publishedBeforeJoystream.hasDate()) {
        result.publishedBeforeJoystream = new Date(result.publishedBeforeJoystream.getDate())
      } else {
        delete result.publishedBeforeJoystream
      }
    }

    return result
  }

  // process video category
  if (type == ProtobufEntity.VideoCategory) {
    return VideoCategoryMetadata.deserializeBinary(metadata).toObject()
  }

  // this should never happen
  throw `Not implemented type: ${type}`
}

// temporary function used before proper block is retrieved
function convertBlockNumberToBlock(block: number): Block {
  return new Block({
    block: block,
    executedAt: new Date(), // TODO get real block execution time
    network: currentNetwork,
  })
}

function convertAsset(rawAsset: contentDirectory.RawAsset): Asset {
  if (rawAsset.isUrl) {
    const assetUrl = new AssetUrl({
      url: rawAsset.asUrl()[0] // TODO: find out why asUrl() returns array
    })

    const asset = new Asset(assetUrl) // TODO: make sure this is a proper way to initialize Asset (on all places)

    return asset
  }

  // !rawAsset.isUrl && rawAsset.isUpload

  const contentParameters: contentDirectory.ContentParameters = rawAsset.asStorage()

  const assetOwner = new AssetOwner(new AssetOwnerMember(0)) // TODO: proper owner
  const assetDataObject = new AssetDataObject({
    owner: new AssetOwner(),
    addedAt: convertBlockNumberToBlock(0), // TODO: proper addedAt
    typeId: contentParameters.type_id,
    size: 0, // TODO: retrieve proper file size
    liaisonId: 0, // TODO: proper id
    liaisonJudgement: LiaisonJudgement.PENDING, // TODO: proper judgement
    ipfsContentId: contentParameters.ipfs_content_id,
    joystreamContentId: contentParameters.content_id,
  })
  // TODO: handle `AssetNeverProvided` and `AssetDeleted` states
  const uploadingStatus = new AssetUploadStatus({
    dataObject: new AssetDataObject,
    oldDataObject: undefined // TODO: handle oldDataObject
  })

  const assetStorage = new AssetStorage({
    uploadStatus: uploadingStatus
  })
  const asset = new Asset(assetStorage)

  return asset
}

function extractAsset(assetIndex: number | undefined, assets: contentDirectory.RawAsset[]): Asset | undefined {
  if (assetIndex === undefined) {
    return undefined
  }

  if (assetIndex > assets.length) {
    throw 'Inconsistent state' // TODO: more sophisticated inconsistency handling; unify handling with other critical errors
  }

  return convertAsset(assets[assetIndex])
}

async function prepareLanguage(languageIso: string, db: DatabaseManager): Promise<Language> {
  // TODO: ensure language is ISO name
  const isValidIso = true;

  if (!isValidIso) {
    throw // TODO: create a proper way of handling inconsistent state
  }

  const language = await db.get(Language, { where: { iso: languageIso }})

  if (language) {
    return language;
  }

  const newLanguage = new Language({
    iso: languageIso
  })

  return newLanguage
}

async function prepareLicense(licenseProtobuf: LicenseMetadata.AsObject): Promise<License> {
  // TODO: add old license removal (when existing) or rework the whole function

  const license = new License(licenseProtobuf.toObject())

  return license
}

async function prepareVideoMetadata(videoProtobuf: VideoMetadata.AsObject): Promise<MediaType> {
  const encoding = new VideoMediaEncoding(videoProtobuf.mediaType)

  const videoMeta = new VideoMediaMetadata({
    encoding,
    pixelWidth: videoProtobuf.mediaPixelWidth,
    pixelHeight: videoProtobuf.mediaPixelHeight,
    size: 0, // TODO: retrieve proper file size
  })

  return videoMeta
}

async function prepareVideoCategory(categoryId: number, db: DatabaseManager): Promise<VideoCategory> {
  const category = await db.get(VideoCategory, { where: { id: categoryId }})

  if (!category) {
    throw // TODO: create a proper way of handling inconsistent state
  }

  return category
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

  const protobufContent = await readProtobuf(ProtobufEntity.Channel, (event.params[3].value as any).meta, event.params[2].value as any[], db) // TODO: get rid of `any` typecast

  const channel = new Channel({
    id: event.params[0].value.toString(), // ChannelId
    isCensored: false,
    videos: [],
    happenedIn: convertBlockNumberToBlock(event.blockNumber),
    ...Object(protobufContent)
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

  const channelId = event.params[1].value.toString()
  const channel = await db.get(Channel, { where: { id: channelId } })

  if (!channel) {
    throw // TODO: create a proper way of handling inconsistent state
  }

  const protobufContent = await readProtobuf(ProtobufEntity.Channel, (event.params[3].value as any).new_meta, (event.params[3].value as any).assets, db) // TODO: get rid of `any` typecast

  for (let [key, value] of Object(protobufContent).entries()) {
    channel[key] = value
  }

  await db.save<Channel>(channel)
}

// eslint-disable-next-line @typescript-eslint/naming-convention
export async function content_ChannelDeleted(
  db: DatabaseManager,
  event: SubstrateEvent
) {
  const channelId = event.params[1].value.toString()
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

  const channelId = event.params[1].value.toString()
  const channel = await db.get(Channel, { where: { id: channelId } })

  if (!channel) {
    throw // TODO: create a proper way of handling inconsistent state
  }

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

  const channelId = event.params[1].value.toString()
  const channel = await db.get(Channel, { where: { id: channelId } })

  if (!channel) {
    throw // TODO: create a proper way of handling inconsistent state
  }

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

  const protobufContent = await readProtobuf(ProtobufEntity.ChannelCategory, (event.params[2].value as any).meta, [], db) // TODO: get rid of `any` typecast

  const channelCategory = new ChannelCategory({
    id: event.params[0].value.toString(), // ChannelCategoryId
    channels: [],
    happenedIn: convertBlockNumberToBlock(event.blockNumber),
    ...Object(protobufContent)
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

  const channelCategoryId = event.params[1].value.toString()
  const channelCategory = await db.get(ChannelCategory, { where: { id: channelCategoryId } })

  if (!channelCategory) {
    throw // TODO: create a proper way of handling inconsistent state
  }

  const protobufContent = await readProtobuf(ProtobufEntity.ChannelCategory, (event.params[2].value as any).meta, [], db) // TODO: get rid of `any` typecast

  for (let [key, value] of Object(protobufContent).entries()) {
    channelCategory[key] = value
  }

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
  const channelCategoryId = event.params[1].value.toString()
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

  const protobufContent = readProtobuf(ProtobufEntity.VideoCategory, (event.params[2].value as any).meta, [], db) // TODO: get rid of `any` typecast

  const videoCategory = new VideoCategory({
    id: event.params[0].value.toString(), // ChannelId
    isCensored: false,
    videos: [],
    happenedIn: convertBlockNumberToBlock(event.blockNumber),
    ...Object(protobufContent)
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

  if (!videoCategory) {
    throw // TODO: create a proper way of handling inconsistent state
  }

  const protobufContent = await readProtobuf(ProtobufEntity.VideoCategory, (event.params[2].value as any).meta, [], db) // TODO: get rid of `any` typecast

  for (let [key, value] of Object(protobufContent).entries()) {
    videoCategory[key] = value
  }

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

  const protobufContent = await readProtobuf(ProtobufEntity.Video, (event.params[3].value as any).meta, (event.params[3].value as any).assets, db) // TODO: get rid of `any` typecast

  const channel = new Video({
    id: event.params[2].toString(), // ChannelId
    isCensored: false,
    channel: event.params[1],
    happenedIn: convertBlockNumberToBlock(event.blockNumber),
    ...Object(protobufContent)
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

  if (!video) {
    throw // TODO: create a proper way of handling inconsistent state
  }

  const protobufContent = await readProtobuf(ProtobufEntity.Video, (event.params[2].value as any).meta, (event.params[2].value as any).assets, db) // TODO: get rid of `any` typecast

  for (let [key, value] of Object(protobufContent).entries()) {
    video[key] = value
  }

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

  const videoIds = event.params[1].value as string[]
  const existingFeaturedVideos = await db.getMany(Video, { where: { isFeatured: true } })

  const isSame = (videoA: Video) => (videoB: Video) => videoA.id == videoB

  const toRemove = existingFeaturedVideos.filter(existingFV => !videoIds.some(isSame(existingFV)))
  const toAdd = videoIds.filter(video => !existingFeaturedVideos.some(isSame(video)))

  for (let video in toRemove) {
    video.isFeatured = false;

    await db.save<Video>(video)
  }

  for (let video in toAdd) {
    video.isFeatured = true;

    await db.save<Video>(video)
  }
}
