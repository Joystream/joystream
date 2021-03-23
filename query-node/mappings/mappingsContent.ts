// TODO: add logging of mapping events (entity found/not found, entity updated/deleted, etc.)
// TODO: split file into multiple files
// TODO: make sure assets are updated when VideoUpdateParameters have only `assets` parameter set (no `new_meta` set) - if this situation can even happend

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

import {
  Content,
} from '../generated/types'

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
import { Block } from 'query-node/src/modules/block/block.model'
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

/////////////////// Utils //////////////////////////////////////////////////////

async function readProtobuf(
  type: Channel | ChannelCategory | Video | VideoCategory,
  metadata: Uint8Array,
  assets: NewAsset[],
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
      result.category = await prepareVideoCategory(metaAsObject.category, db)
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
      result.thumbnailPhoto = await extractAsset(metaAsObject.thumbnailPhoto, assets, db, event)
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

async function convertAsset(rawAsset: NewAsset, db: DatabaseManager, event: SubstrateEvent): Promise<typeof Asset> {
  if (rawAsset.isUrls) {
    const assetUrl = new AssetUrl()
    assetUrl.url = rawAsset.asUrls.toArray()[0].toString() // TODO: find out why asUrl() returns array

    return assetUrl
  }

  // !rawAsset.isUrls && rawAsset.isUpload

  const contentParameters: ContentParameters = rawAsset.asUpload

  const block = await prepareBlock(db, event)
  const assetStorage = await prepareAssetDataObject(contentParameters, block)

  return assetStorage
}

async function extractAsset(
  assetIndex: number | undefined,
  assets: NewAsset[],
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
  const {channelId, channelCreationParameters} = new Content.ChannelCreatedEvent(event).data

  const protobufContent = await readProtobuf(
    new Channel(),
    channelCreationParameters.meta,
    channelCreationParameters.assets,
    db,
    event,
  )

  const channel = new Channel({
    id: channelId,
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
  const {channelId , channelUpdateParameters} = new Content.ChannelUpdatedEvent(event).data

  const channel = await db.get(Channel, { where: { id: channelId } })

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
  const channelId = event.params[1].value.toString()
  const channel = await db.get(Channel, { where: { id: channelId } })

  if (!channel) {
    return inconsistentState()
  }

  channel.isCensored = false;

  await db.save<Channel>(channel)
}

/////////////////// ChannelCategory ////////////////////////////////////////////

// eslint-disable-next-line @typescript-eslint/naming-convention
export async function content_ChannelCategoryCreated(
  db: DatabaseManager,
  event: SubstrateEvent
) {
  const {channelCategoryCreationParameters} = new Content.ChannelCategoryCreatedEvent(event).data

  const protobufContent = await readProtobuf(
    new ChannelCategory(),
    channelCategoryCreationParameters.meta,
    [],
    db,
    event,
  )

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
  const {channelCategoryId, channelCategoryUpdateParameters} = new Content.ChannelCategoryUpdatedEvent(event).data
  const channelCategory = await db.get(ChannelCategory, { where: { id: channelCategoryId } })

  if (!channelCategory) {
    return inconsistentState()
  }

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

  await db.save<ChannelCategory>(channelCategory)
}

// eslint-disable-next-line @typescript-eslint/naming-convention
export async function content_ChannelCategoryDeleted(
  db: DatabaseManager,
  event: SubstrateEvent
) {
  const {channelCategoryId} = new Content.ChannelCategoryDeletedEvent(event).data
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
  const {videoCategoryId, videoCategoryCreationParameters} = new Content.VideoCategoryCreatedEvent(event).data
  const protobufContent = readProtobuf(
    new VideoCategory(),
    videoCategoryCreationParameters.meta,
    [],
    db,
    event
  )

  const videoCategory = new VideoCategory({
    id: videoCategoryId.toString(), // ChannelId
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
  const {videoCategoryId, videoCategoryUpdateParameters} = new Content.VideoCategoryUpdatedEvent(event).data
  const videoCategory = await db.get(VideoCategory, { where: { id: videoCategoryId } })

  if (!videoCategory) {
    return inconsistentState()
  }

  const protobufContent = await readProtobuf(
    new VideoCategory(),
    videoCategoryUpdateParameters.new_meta,
    [],
    db,
    event,
  )

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
  const {videoCategoryId} = new Content.VideoCategoryDeletedEvent(event).data
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
  const {channelId, videoId, videoCreationParameters} = new Content.VideoCreatedEvent(event).data
  const protobufContent = await readProtobuf(
    new Video(),
    videoCreationParameters.meta,
    videoCreationParameters.assets,
    db,
    event,
  )

  const channel = new Video({
    id: videoId,
    isCensored: false,
    channel: channelId,
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
  const {videoId, videoUpdateParameters} = new Content.VideoUpdatedEvent(event).data
  const video = await db.get(Video, { where: { id: videoId } })

  if (!video) {
    return inconsistentState()
  }

  if (videoUpdateParameters.new_meta.isSome) {
    const protobufContent = await readProtobuf(
      new Video(),
      videoUpdateParameters.new_meta.unwrap(), // TODO: is there any better way to get value without unwrap?
      videoUpdateParameters.assets.unwrapOr([]),
      db,
      event,
    )

    // update all fields read from protobuf
    for (let [key, value] of Object(protobufContent).entries()) {
      video[key] = value
    }
  }

  await db.save<Video>(video)
}

// eslint-disable-next-line @typescript-eslint/naming-convention
export async function content_VideoDeleted(
  db: DatabaseManager,
  event: SubstrateEvent
) {
  const {videoId} = new Content.VideoDeletedEvent(event).data
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
  const {videoId} = new Content.VideoCensoredEvent(event).data
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
  const {videoId} = new Content.VideoUncensoredEvent(event).data
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
  const {videoId: videoIds} = new Content.FeaturedVideosSetEvent(event).data
  const existingFeaturedVideos = await db.getMany(Video, { where: { isFeatured: true } })

  // comparsion utility
  const isSame = (videoIdA: string) => (videoIdB: string) => videoIdA == videoIdB

  // calculate diff sets
  const toRemove = existingFeaturedVideos.filter(existingFV =>
    !videoIds
      .map(item => item.toHex())
      .some(isSame(existingFV.id))
  )
  const toAdd = videoIds.filter(video =>
    !existingFeaturedVideos
      .map(item => item.id)
      .some(isSame(video.toHex()))
  )

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
