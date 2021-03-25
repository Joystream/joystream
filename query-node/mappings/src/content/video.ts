// TODO: add logging of mapping events (entity found/not found, entity updated/deleted, etc.)
// TODO: split file into multiple files
// TODO: make sure assets are updated when VideoUpdateParameters have only `assets` parameter set (no `new_meta` set) - if this situation can even happend
// TODO: check all `db.get()` and similar calls recieve a proper type argument (aka add `.toString()`, etc. to those calls)

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
} from '../generated/types'

import {
  inconsistentState,
  prepareBlock,
  prepareAssetDataObject,
} from './common'

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
    assetUrl.urls = rawAsset.asUrls.toArray().map(item => item.toString())

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
    return inconsistentState()
  }

  return convertAsset(assets[assetIndex], db, event)
}

async function prepareLanguage(languageIso: string, db: DatabaseManager): Promise<Language> {
  const isValidIso = ISO6391.validate(languageIso);

  if (!isValidIso) {
    return inconsistentState()
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
    return inconsistentState()
  }

  return category
}

/////////////////// Channel ////////////////////////////////////////////////////

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

/////////////////// VideoCategory //////////////////////////////////////////////

// eslint-disable-next-line @typescript-eslint/naming-convention
export async function content_VideoCategoryCreated(
  db: DatabaseManager,
  event: SubstrateEvent
) {
  // read event data
  const {videoCategoryId, videoCategoryCreationParameters} = new Content.VideoCategoryCreatedEvent(event).data

  // read metadata
  const protobufContent = readProtobuf(
    new VideoCategory(),
    videoCategoryCreationParameters.meta,
    [],
    db,
    event
  )

  // create new video category
  const videoCategory = new VideoCategory({
    id: videoCategoryId.toString(), // ChannelId
    isCensored: false,
    videos: [],
    happenedIn: await prepareBlock(db, event),
    ...Object(protobufContent)
  })

  // save video category
  await db.save<VideoCategory>(videoCategory)
}

// eslint-disable-next-line @typescript-eslint/naming-convention
export async function content_VideoCategoryUpdated(
  db: DatabaseManager,
  event: SubstrateEvent
) {
  // read event data
  const {videoCategoryId, videoCategoryUpdateParameters} = new Content.VideoCategoryUpdatedEvent(event).data

  // load video category
  const videoCategory = await db.get(VideoCategory, { where: { id: videoCategoryId } })

  // ensure video category exists
  if (!videoCategory) {
    return inconsistentState()
  }

  // read metadata
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

  // save video category
  await db.save<VideoCategory>(videoCategory)
}

// eslint-disable-next-line @typescript-eslint/naming-convention
export async function content_VideoCategoryDeleted(
  db: DatabaseManager,
  event: SubstrateEvent
) {
  // read event data
  const {videoCategoryId} = new Content.VideoCategoryDeletedEvent(event).data

  // load video category
  const videoCategory = await db.get(VideoCategory, { where: { id: videoCategoryId } })

  // ensure video category exists
  if (!videoCategory) {
    return inconsistentState()
  }

  // remove video category
  await db.remove<VideoCategory>(videoCategory)
}

/////////////////// Video //////////////////////////////////////////////////////

// eslint-disable-next-line @typescript-eslint/naming-convention
export async function content_VideoCreated(
  db: DatabaseManager,
  event: SubstrateEvent
) {
  // read event data
  const {channelId, videoId, videoCreationParameters} = new Content.VideoCreatedEvent(event).data

  // read metadata
  const protobufContent = await readProtobuf(
    new Video(),
    videoCreationParameters.meta,
    videoCreationParameters.assets,
    db,
    event,
  )

  // create new video
  const video = new Video({
    id: videoId,
    isCensored: false,
    channel: channelId,
    happenedIn: await prepareBlock(db, event),
    ...Object(protobufContent)
  })

  // save video
  await db.save<Video>(video)
}

// eslint-disable-next-line @typescript-eslint/naming-convention
export async function content_VideoUpdated(
  db: DatabaseManager,
  event: SubstrateEvent
) {
  // read event data
  const {videoId, videoUpdateParameters} = new Content.VideoUpdatedEvent(event).data

  // load video
  const video = await db.get(Video, { where: { id: videoId } })

  // ensure video exists
  if (!video) {
    return inconsistentState()
  }

  // update metadata if it changed
  if (videoUpdateParameters.new_meta.isSome) {
    const protobufContent = await readProtobuf(
      new Video(),
      videoUpdateParameters.new_meta.unwrap(), // TODO: is there any better way to get value without unwrap?
      videoUpdateParameters.assets.unwrapOr([]),
      db,
      event,
    )

    // remember original license
    const originalLicense = video.license

    // update all fields read from protobuf
    for (let [key, value] of Object(protobufContent).entries()) {
      video[key] = value
    }

    // license has changed - delete old license
    if (originalLicense && video.license != originalLicense) {
      await db.remove<License>(originalLicense)
    }
  }

  // TODO: handle situation when only assets changed

  // save video
  await db.save<Video>(video)
}

// eslint-disable-next-line @typescript-eslint/naming-convention
export async function content_VideoDeleted(
  db: DatabaseManager,
  event: SubstrateEvent
) {
  // read event data
  const {videoId} = new Content.VideoDeletedEvent(event).data

  // load video
  const video = await db.get(Video, { where: { id: videoId } })

  // ensure video exists
  if (!video) {
    return inconsistentState()
  }

  // remove video
  await db.remove<Video>(video)
}

// eslint-disable-next-line @typescript-eslint/naming-convention
export async function content_VideoCensored(
  db: DatabaseManager,
  event: SubstrateEvent
) {
  // read event data
  const {videoId} = new Content.VideoCensoredEvent(event).data

  // load video
  const video = await db.get(Video, { where: { id: videoId } })

  // ensure video exists
  if (!video) {
    return inconsistentState()
  }

  // update video
  video.isCensored = true;

  // save video
  await db.save<Video>(video)
}

// eslint-disable-next-line @typescript-eslint/naming-convention
export async function content_VideoUncensored(
  db: DatabaseManager,
  event: SubstrateEvent
) {
  // read event data
  const {videoId} = new Content.VideoUncensoredEvent(event).data

  // load video
  const video = await db.get(Video, { where: { id: videoId } })

  // ensure video exists
  if (!video) {
    return inconsistentState()
  }

  // update video
  video.isCensored = false;

  // save video
  await db.save<Video>(video)
}

// eslint-disable-next-line @typescript-eslint/naming-convention
export async function content_FeaturedVideosSet(
  db: DatabaseManager,
  event: SubstrateEvent
) {
  // read event data
  const {videoId: videoIds} = new Content.FeaturedVideosSetEvent(event).data

  // load old featured videos
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

/////////////////// Curator Group //////////////////////////////////////////////

export async function content_CuratorGroupCreated(
  db: DatabaseManager,
  event: SubstrateEvent
) {
  // read event data
  const {curatorGroupId} = new Content.CuratorGroupCreatedEvent(event).data

  // create new curator group
  const curatorGroup = new CuratorGroup({
    id: curatorGroupId.toString(),
    curatorIds: [],
    isActive: false, // runtime creates inactive curator groups by default
  })

  // save curator group
  await db.save<CuratorGroup>(curatorGroup)
}

export async function content_CuratorGroupStatusSet(
  db: DatabaseManager,
  event: SubstrateEvent
) {
  // read event data
  const {curatorGroupId, bool: isActive} = new Content.CuratorGroupStatusSetEvent(event).data

  // load curator group
  const curatorGroup = await db.get(CuratorGroup, { where: { id: curatorGroupId }})

  // ensure curator group exists
  if (!curatorGroup) {
    return inconsistentState()
  }

  // update curator group
  curatorGroup.isActive = isActive.isTrue

  // save curator group
  await db.save<CuratorGroup>(curatorGroup)
}

export async function content_CuratorAdded(
  db: DatabaseManager,
  event: SubstrateEvent
) {
  // read event data
  const {curatorGroupId, curatorId} = new Content.CuratorAddedEvent(event).data

  // load curator group
  const curatorGroup = await db.get(CuratorGroup, { where: { id: curatorGroupId }})

  // ensure curator group exists
  if (!curatorGroup) {
    return inconsistentState()
  }

  // update curator group
  curatorGroup.curatorIds.push(curatorId)

  // save curator group
  await db.save<CuratorGroup>(curatorGroup)
}

export async function content_CuratorRemoved(
  db: DatabaseManager,
  event: SubstrateEvent
) {
  // read event data
  const {curatorGroupId, curatorId} = new Content.CuratorAddedEvent(event).data

  // load curator group
  const curatorGroup = await db.get(CuratorGroup, { where: { id: curatorGroupId }})

  // ensure curator group exists
  if (!curatorGroup) {
    return inconsistentState()
  }

  const curatorIndex = curatorGroup.curatorIds.indexOf(curatorId)

  // ensure curator group exists
  if (curatorIndex < 0) {
    return inconsistentState()
  }

  // update curator group
  curatorGroup.curatorIds.splice(curatorIndex, 1)

  // save curator group
  await db.save<CuratorGroup>(curatorGroup)
}
