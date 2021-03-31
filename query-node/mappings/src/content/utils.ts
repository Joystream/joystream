// TODO: check all `db.get()` and similar calls recieve a proper type argument (aka add `.toString()`, etc. to those calls)
// TODO: can we rely on db having "foreign keys"? When item is deleted will automaticly be all relations to it unset?
//       Similarly, will saving item also save all its related items no-yet-saved in db, or do they need to saved individually?

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
  prepareDataObject,
} from '../common'


// primary entities
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
import { AssetAvailability } from 'query-node/src/modules/enums/enums';
import {
  DataObject,
  LiaisonJudgement
} from 'query-node/src/modules/data-object/data-object.model'

// Joystream types
import {
  ContentParameters,
  NewAsset,
} from '@joystream/types/augment'

type AssetStorageOrUrls = DataObject | string[]

function isAssetInStorage(dataObject: AssetStorageOrUrls): dataObject is DataObject {
  if (Array.isArray(dataObject)) {
    return false
  }

  return true
}

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
      const asset = await extractAsset(metaAsObject.coverPhoto, assets, db, event)
      integrateAsset('coverPhoto', result, asset) // changes `result` inline!
      delete metaAsObject.coverPhoto
    }

    // prepare avatar photo asset if needed
    if (metaAsObject.avatarPhoto !== undefined) {
      const asset = await extractAsset(metaAsObject.avatarPhoto, assets, db, event)
      integrateAsset('avatarPhoto', result, asset) // changes `result` inline!
      delete metaAsObject.avatarPhoto
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
      const asset = await extractAsset(metaAsObject.thumbnailPhoto, assets, db, event)
      integrateAsset('thumbnail', result, asset) // changes `result` inline!
      delete metaAsObject.thumbnailPhoto
    }

    // prepare video asset if needed
    if (metaAsObject.video !== undefined) {
      const asset = await extractAsset(metaAsObject.video, assets, db, event)
      integrateAsset('media', result, asset) // changes `result` inline!
      delete metaAsObject.video
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

async function convertAsset(rawAsset: NewAsset, db: DatabaseManager, event: SubstrateEvent): Promise<AssetStorageOrUrls> {
  if (rawAsset.isUrls) {
    const urls = rawAsset.asUrls.toArray().map(item => item.toString())

    return urls
  }

  // !rawAsset.isUrls && rawAsset.isUpload

  const contentParameters: ContentParameters = rawAsset.asUpload
  const dataObject = await prepareDataObject(contentParameters, event.blockNumber)

  return dataObject
}

async function extractAsset(
  assetIndex: number,
  assets: NewAsset[],
  db: DatabaseManager,
  event: SubstrateEvent,
): Promise<AssetStorageOrUrls> {
  if (assetIndex > assets.length) {
    return inconsistentState(`Non-existing asset extraction requested`, {assetsProvided: assets.length, assetIndex})
  }

  return convertAsset(assets[assetIndex], db, event)
}

// changes `result` inline!
function integrateAsset<T>(propertyName: string, result: T, asset: AssetStorageOrUrls): T {
  const nameUrl = propertyName + 'Urls'
  const nameDataObject = propertyName + 'DataObject'
  const nameAvailability = propertyName + 'Availability'

  // is asset saved in storage?
  if (!isAssetInStorage(asset)) {
    // (un)set asset's properties
    result[nameUrl] = asset
    result[nameAvailability] = AssetAvailability.ACCEPTED
    delete result[nameDataObject]

    return result
  }

  // prepare conversion table between liaison judgment and asset availability
  const conversionTable = {
    [LiaisonJudgement.ACCEPTED]: AssetAvailability.ACCEPTED,
    [LiaisonJudgement.PENDING]: AssetAvailability.PENDING,
    [LiaisonJudgement.REJECTED]: AssetAvailability.INVALID,
  }

  // (un)set asset's properties
  delete result[nameUrl]
  result[nameAvailability] = conversionTable[asset.liaisonJudgement]
  result[nameDataObject] = asset

  return result
}

async function extractVideoSize(assets: NewAsset[], assetIndex: number | undefined): Promise<BN | undefined> {
  if (assetIndex === undefined) {
    return undefined
  }

  if (assetIndex > assets.length) {
    return inconsistentState(`Non-existing asset video size extraction requested`, {assetsProvided: assets.length, assetIndex})
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
    return inconsistentState(`Invalid language ISO-639-1 provided`, languageIso)
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
    return inconsistentState('Non-existing video category association with video requested', categoryId)
  }

  return category
}
