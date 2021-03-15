// TODO: add logging of mapping events (entity found/not found, entity updated/deleted, etc.)
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

/* TODO: can it be imported nicely like this?
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
*/

import {
  inconsistentState,
  prepareBlock,
  prepareAssetDataObject,
} from './common'

// primary entities
import { Block } from 'query-node/dist/src/modules/block/block.model'
import { Channel } from 'query-node/dist/src/modules/channel/channel.model'
import { ChannelCategory } from 'query-node/dist/src/modules/channel-category/channel-category.model'
import { Video } from 'query-node/dist/src/modules/video/video.model'
import { VideoCategory } from 'query-node/dist/src/modules/video-category/video-category.model'

// secondary entities
import { Language } from 'query-node/dist/src/modules/language/language.model'
import { License } from 'query-node/dist/src/modules/license/license.model'
import { VideoMediaEncoding } from 'query-node/dist/src/modules/video-media-encoding/video-media-encoding.model'
import { VideoMediaMetadata } from 'query-node/dist/src/modules/video-media-metadata/video-media-metadata.model'

// Asset
import {
  Asset,
  AssetUrl,
  AssetUploadStatus,
  AssetStorage,
  AssetOwner,
  AssetOwnerMember,
} from 'query-node/dist/src/modules/variants/variants.model'
import {
  AssetDataObject,
  LiaisonJudgement
} from 'query-node/dist/src/modules/asset-data-object/asset-data-object.model'


// TODO: decide which of the following imports is valid
import {
  ContentParameters
} from '@joystream/types/augment'
import {
  contentDirectory,
  storage,
} from '@joystream/types'
type RawAsset = ReturnType<typeof contentDirectory.NewAsset.create>
type RawAssetTypes = typeof contentDirectory.NewAsset.typeDefinitions

/////////////////// Utils //////////////////////////////////////////////////////

async function readProtobuf(
  type: Channel | ChannelCategory | Video | VideoCategory,
  metadata: Uint8Array,
  assets: RawAsset[],
  db: DatabaseManager,
  event: SubstrateEvent,
): Promise<Partial<typeof type>> {
  // process channel
  if (type instanceof Channel) {
    const meta = ChannelMetadata.deserializeBinary(metadata)
    const metaAsObject = meta.toObject()
    const result = metaAsObject as any as Channel

    // prepare cover photo asset if needed
    if (metaAsObject.coverPhoto !== undefined) {
      result.coverPhoto = await extractAsset(metaAsObject.coverPhoto, assets, db, event)
    }

    // prepare avatar photo asset if needed
    if (metaAsObject.avatarPhoto !== undefined) {
      result.avatarPhoto = await extractAsset(metaAsObject.avatarPhoto, assets, db, event)
    }

    // prepare language if needed
    if (metaAsObject.language) {
      result.language = await prepareLanguage(metaAsObject.language, db)
    }

    return result
  }

  // process channel category
  if (type instanceof ChannelCategory) {
    return ChannelCategoryMetadata.deserializeBinary(metadata).toObject()
  }

  // process video
  if (type instanceof Video) {
    const meta = VideoMetadata.deserializeBinary(metadata)
    const metaAsObject = meta.toObject()
    const result = metaAsObject as any as Video

    // prepare video category if needed
    if (metaAsObject.category !== undefined) {
      // TODO: find why array instead of one value is required here (mb input schema problem?)
      result.category = [await prepareVideoCategory(metaAsObject.category, db)]
    }

    // prepare media meta information if needed
    if (metaAsObject.mediaType) {
      result.mediaMetadata = await prepareVideoMetadata(metaAsObject)
      delete metaAsObject.mediaType
    }

    // prepare license if needed
    if (metaAsObject.license) {
      result.license = await prepareLicense(metaAsObject.license)
    }

    // prepare thumbnail photo asset if needed
    if (metaAsObject.thumbnailPhoto !== undefined) {
      result.thumbnail = await extractAsset(metaAsObject.thumbnailPhoto, assets, db, event)
    }

    // prepare video asset if needed
    if (metaAsObject.video !== undefined) {
      result.media = await extractAsset(metaAsObject.video, assets, db, event)
    }

    // prepare language if needed
    if (metaAsObject.language) {
      result.language = await prepareLanguage(metaAsObject.language, db)
    }

    // prepare information about media published somewhere else before Joystream if needed.
    if (metaAsObject.publishedBeforeJoystream) {
      // TODO: is ok to just ignore `isPublished?: boolean` here?
      if (metaAsObject.publishedBeforeJoystream.date) {
        result.publishedBeforeJoystream = new Date(metaAsObject.publishedBeforeJoystream.date)
      } else {
        delete result.publishedBeforeJoystream
      }
    }

    return result
  }

  // process video category
  if (type instanceof VideoCategory) {
    return VideoCategoryMetadata.deserializeBinary(metadata).toObject()
  }

  // this should never happen
  throw `Not implemented type: ${type}`
}


async function convertAsset(rawAsset: RawAsset, db: DatabaseManager, event: SubstrateEvent): Promise<typeof Asset> {
  if (rawAsset.type == 'Urls') {
    const assetUrl = new AssetUrl()
    assetUrl.url = rawAsset.asType('Urls').toArray()[0].toString() // TODO: find out why asUrl() returns array

    return assetUrl
  }

  // rawAsset == 'Upload'

  //const contentParameters: typeof contentDirectory.ContentParameters = rawAsset.asStorage()
  const contentParameters: ContentParameters = rawAsset.asType('Upload')

  const block = await prepareBlock(db, event)
  const assetStorage = await prepareAssetDataObject(contentParameters, block)

  return assetStorage
}

async function extractAsset(
  assetIndex: number | undefined,
  assets: RawAsset[],
  db: DatabaseManager,
  event: SubstrateEvent,
): Promise<typeof Asset | undefined> {
  if (assetIndex === undefined) {
    return undefined
  }

  if (assetIndex > assets.length) {
    throw 'Inconsistent state' // TODO: more sophisticated inconsistency handling; unify handling with other critical errors
  }

  return convertAsset(assets[assetIndex], db, event)
}

async function prepareLanguage(languageIso: string, db: DatabaseManager): Promise<Language> {
  // TODO: ensure language is ISO name
  const isValidIso = true;

  if (!isValidIso) {
    throw 'Inconsistent state' // TODO: create a proper way of handling inconsistent state
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

  const license = new License(licenseProtobuf)

  return license
}

async function prepareVideoMetadata(videoProtobuf: VideoMetadata.AsObject): Promise<VideoMediaMetadata> {
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
    throw 'Inconsistent state' // TODO: create a proper way of handling inconsistent state
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

  //const protobufContent = await readProtobuf(ProtobufEntity.Channel, (event.params[3].value as any).meta, event.params[2].value as any[], db) // TODO: get rid of `any` typecast
  const protobufContent = await readProtobuf(
    new Channel(),
    (event.params[3].value as any).meta,
    event.params[2].value as any[],
    db,
    event,
  ) // TODO: get rid of `any` typecast

  const channel = new Channel({
    id: event.params[0].value.toString(), // ChannelId
    isCensored: false,
    videos: [],
    happenedIn: await prepareBlock(db, event),
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
    return inconsistentState()
  }

  const protobufContent = await readProtobuf(
    new Channel(),
    (event.params[3].value as any).new_meta,
    (event.params[3].value as any).assets,
    db,
    event,
  ) // TODO: get rid of `any` typecast

  // update all fields read from protobuf
  for (let [key, value] of Object(protobufContent).entries()) {
    channel[key] = value
  }

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
  /* event arguments
  ContentActor,
  ChannelId,
  Vec<u8>
  */

  const channelId = event.params[1].value.toString()
  const channel = await db.get(Channel, { where: { id: channelId } })

  if (!channel) {
    return inconsistentState()
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
    return inconsistentState()
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

  const protobufContent = await readProtobuf(
    new ChannelCategory(),
    (event.params[2].value as any).meta,
    [],
    db,
    event,
  ) // TODO: get rid of `any` typecast

  const channelCategory = new ChannelCategory({
    id: event.params[0].value.toString(), // ChannelCategoryId
    channels: [],
    happenedIn: await prepareBlock(db, event),
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
    return inconsistentState()
  }

  const protobufContent = await readProtobuf(
    new ChannelCategory(),
    (event.params[2].value as any).meta,
    [],
    db,
    event,
  ) // TODO: get rid of `any` typecast

  // update all fields read from protobuf
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

  if (!channelCategory) {
    return inconsistentState()
  }

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

  const protobufContent = readProtobuf(
    new VideoCategory(),
    (event.params[2].value as any).meta,
    [],
    db,
    event
  ) // TODO: get rid of `any` typecast

  const videoCategory = new VideoCategory({
    id: event.params[0].value.toString(), // ChannelId
    isCensored: false,
    videos: [],
    happenedIn: await prepareBlock(db, event),
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
    return inconsistentState()
  }

  const protobufContent = await readProtobuf(
    new VideoCategory(),
    (event.params[2].value as any).meta,
    [],
    db,
    event,
  ) // TODO: get rid of `any` typecast

  // update all fields read from protobuf
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

  if (!videoCategory) {
    return inconsistentState()
  }

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

  const protobufContent = await readProtobuf(
    new Video(),
    (event.params[3].value as any).meta,
    (event.params[3].value as any).assets,
    db,
    event,
  ) // TODO: get rid of `any` typecast

  const channel = new Video({
    id: event.params[2].toString(), // ChannelId
    isCensored: false,
    channel: event.params[1],
    happenedIn: await prepareBlock(db, event),
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
    return inconsistentState()
  }

  const protobufContent = await readProtobuf(
    new Video(),
    (event.params[2].value as any).meta,
    (event.params[2].value as any).assets,
    db,
    event,
  ) // TODO: get rid of `any` typecast

  // update all fields read from protobuf
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

  if (!video) {
    return inconsistentState()
  }

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

  if (!video) {
    return inconsistentState()
  }

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

  const videoId = event.params[1].toString()
  const video = await db.get(Video, { where: { id: videoId } })

  if (!video) {
    return inconsistentState()
  }

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

  // comparsion utility
  const isSame = (videoIdA: string) => (videoIdB: string) => videoIdA == videoIdB

  // calculate diff sets
  const toRemove = existingFeaturedVideos.filter(existingFV => !videoIds.some(isSame(existingFV.id)))
  const toAdd = videoIds.filter(video => !existingFeaturedVideos.map(item => item.id).some(isSame(video)))

  // mark previously featured videos as not-featured
  for (let video of toRemove) {
    video.isFeatured = false;

    await db.save<Video>(video)
  }

  // escape if no featured video needs to be added
  if (!toAdd) {
    return
  }

  // read videos previously not-featured videos that are meant to be featured
  const videosToAdd = await db.getMany(Video, { where: { id: [toAdd] } })

  if (videosToAdd.length != toAdd.length) {
    return inconsistentState()
  }

  // mark previously not-featured videos as featured
  for (let video of videosToAdd) {
    video.isFeatured = true;

    await db.save<Video>(video)
  }
}
