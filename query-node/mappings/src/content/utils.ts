// TODO: add logging of mapping events (entity found/not found, entity updated/deleted, etc.)
// TODO: check all `db.get()` and similar calls recieve a proper type argument (aka add `.toString()`, etc. to those calls)

import { SubstrateEvent } from '@dzlzv/hydra-common'
import { DatabaseManager } from '@dzlzv/hydra-db-utils'
import ISO6391 from 'iso-639-1';
import BN from 'bn.js'
import { u64 } from '@polkadot/types/primitive';

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

export async function readProtobuf(
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
      // prepare video file size if poosible
      const videoSize = await extractVideoSize(assets, metaAsObject.video)

      result.mediaMetadata = await prepareVideoMetadata(metaAsObject, videoSize)
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
      // this will change the `channel`!
      handlePublishedBeforeJoystream(result, metaAsObject.publishedBeforeJoystream.date)
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

function handlePublishedBeforeJoystream(video: Video, publishedAtString?: string) {
  // published elsewhere before Joystream
  if (publishedAtString) {
    video.publishedBeforeJoystream = new Date(publishedAtString)
  }

  // unset publish info
  delete video.publishedBeforeJoystream
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

async function extractVideoSize(assets: NewAsset[], assetIndex: number | undefined): Promise<BN | undefined> {
  if (assetIndex === undefined) {
    return undefined
  }

  if (assetIndex > assets.length) {
    return inconsistentState()
  }

  const rawAsset = assets[assetIndex]

  if (rawAsset.isUrls) {
    return undefined
  }

  // !rawAsset.isUrls && rawAsset.isUpload

  const contentParameters: ContentParameters = rawAsset.asUpload
  // `size` is masked by `size` special name in struct so there needs to be `.get('size') as u64`
  const videoSize = (contentParameters.get('size') as unknown as u64).toBn()

  return videoSize
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

async function prepareVideoMetadata(videoProtobuf: VideoMetadata.AsObject, videoSize: BN | undefined): Promise<VideoMediaMetadata> {
  const encoding = new VideoMediaEncoding(videoProtobuf.mediaType)

  const videoMeta = new VideoMediaMetadata({
    encoding,
    pixelWidth: videoProtobuf.mediaPixelWidth,
    pixelHeight: videoProtobuf.mediaPixelHeight,
  })

  if (videoSize !== undefined) {
    videoMeta.size = videoSize
  }

  return videoMeta
}

async function prepareVideoCategory(categoryId: number, db: DatabaseManager): Promise<VideoCategory> {
  const category = await db.get(VideoCategory, { where: { id: categoryId }})

  if (!category) {
    return inconsistentState()
  }

  return category
}
