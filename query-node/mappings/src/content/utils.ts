// TODO: finish db cascade on save/remove; right now there is manually added `cascade: ["insert", "update"]` directive
//       to all relations in `query-node/generated/graphql-server/src/modules/**/*.model.ts`. That should ensure all records
//       are saved on one `db.save(...)` call. Missing features
//       - find a proper way to cascade on remove or implement custom removals for every entity
//       - convert manual changes done to `*model.ts` file into some patch or bash commands that can be executed
//         every time query node codegen is run (that will overwrite said manual changes)
//       - verify in integration tests that the records are trully created/updated/removed as expected

import { SubstrateEvent } from '@dzlzv/hydra-common'
import { DatabaseManager } from '@dzlzv/hydra-db-utils'
import { Bytes } from '@polkadot/types'
import ISO6391 from 'iso-639-1';
import { u64 } from '@polkadot/types/primitive';
import { FindConditions } from 'typeorm'
import * as jspb from "google-protobuf";

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
  logger,
  prepareDataObject,
} from '../common'


import {
  // primary entities
  CuratorGroup,
  Channel,
  ChannelCategory,
  Video,
  VideoCategory,

  // secondary entities
  Language,
  License,
  VideoMediaEncoding,
  VideoMediaMetadata,

  // asset
  DataObjectOwner,
  DataObjectOwnerMember,
  DataObjectOwnerChannel,
  DataObject,
  LiaisonJudgement,
  AssetAvailability,

  Membership,
} from 'query-node'

// Joystream types
import {
  ChannelId,
  ContentParameters,
  NewAsset,
  ContentActor,
} from '@joystream/types/augment'

/*
  Asset either stored in storage or describing list of URLs.
*/
type AssetStorageOrUrls = DataObject | string[]

/*
  Type guard differentiating asset stored in storage from asset describing a list of URLs.
*/
function isAssetInStorage(dataObject: AssetStorageOrUrls): dataObject is DataObject {
  if (Array.isArray(dataObject)) {
    return false
  }

  return true
}

export interface IReadProtobufArguments {
  metadata: Bytes
  db: DatabaseManager
  blockNumber: number
}

export interface IReadProtobufArgumentsWithAssets extends IReadProtobufArguments {
  assets: NewAsset[] // assets provided in event
  contentOwner: typeof DataObjectOwner
}

/*
  Reads information from the event and protobuf metadata and constructs changeset that's fit to be used when saving to db.
*/
export async function readProtobuf<T extends ChannelCategory | VideoCategory>(
  type: T,
  parameters: IReadProtobufArguments,
): Promise<Partial<T>> {
  // true option here is crucial, it indicates that we want just the underlying bytes (by default it will also include bytes encoding the length)
  const metaU8a = parameters.metadata.toU8a(true);

  // process channel category
  if (type instanceof ChannelCategory) {
    const meta = ChannelCategoryMetadata.deserializeBinary(metaU8a)
    const result = convertMetadataToObject<ChannelCategoryMetadata.AsObject>(meta) as Partial<T>

    return result
  }

  // process video category
  if (type instanceof VideoCategory) {
    const meta = VideoCategoryMetadata.deserializeBinary(metaU8a)
    const result = convertMetadataToObject<VideoCategoryMetadata.AsObject>(meta) as Partial<T>

    return result
  }

  // this should never happen
  logger.error('Not implemented metadata type', {type})
  throw `Not implemented metadata type`
}

/*
  Reads information from the event and protobuf metadata and constructs changeset that's fit to be used when saving to db.
  In addition it handles any assets associated with the metadata.
*/

export async function readProtobufWithAssets<T extends Channel | Video>(
  type: T,
  parameters: IReadProtobufArgumentsWithAssets,
): Promise<Partial<T>> {
  // true option here is crucial, it indicates that we want just the underlying bytes (by default it will also include bytes encoding the length)
  const metaU8a = parameters.metadata.toU8a(true);

  // process channel
  if (type instanceof Channel) {
    const meta = ChannelMetadata.deserializeBinary(metaU8a)
    const metaAsObject = convertMetadataToObject<ChannelMetadata.AsObject>(meta)
    const result = metaAsObject as any as Partial<Channel>

    // prepare cover photo asset if needed
    if ('coverPhoto' in metaAsObject) {
      const asset = await extractAsset({
        //assetIndex: metaAsObject.coverPhoto,
        assetIndex: metaAsObject.coverPhoto,
        assets: parameters.assets,
        db: parameters.db,
        blockNumber: parameters.blockNumber,
        contentOwner: parameters.contentOwner,
      })
      integrateAsset('coverPhoto', result, asset) // changes `result` inline!
      delete metaAsObject.coverPhoto
    }

    // prepare avatar photo asset if needed
    if ('avatarPhoto' in metaAsObject) {
      const asset = await extractAsset({
        assetIndex: metaAsObject.avatarPhoto,
        assets: parameters.assets,
        db: parameters.db,
        blockNumber: parameters.blockNumber,
        contentOwner: parameters.contentOwner,
      })
      integrateAsset('avatarPhoto', result, asset) // changes `result` inline!
      delete metaAsObject.avatarPhoto
    }

    // prepare language if needed
    if ('language' in metaAsObject) {
      result.language = await prepareLanguage(metaAsObject.language, parameters.db, parameters.blockNumber)
    }

    return result as Partial<T>
  }

  // process video
  if (type instanceof Video) {
    const meta = VideoMetadata.deserializeBinary(metaU8a)
    const metaAsObject = convertMetadataToObject<VideoMetadata.AsObject>(meta)
    const result = metaAsObject as any as Partial<Video>

    // prepare video category if needed
    if ('category' in metaAsObject) {
      result.category = await prepareVideoCategory(metaAsObject.category, parameters.db)
    }

    // prepare media meta information if needed
    if ('mediaType' in metaAsObject) {
      // prepare video file size if poosible
      const videoSize = await extractVideoSize(parameters.assets, metaAsObject.video)

      result.mediaMetadata = await prepareVideoMetadata(metaAsObject, videoSize, parameters.blockNumber)
      delete metaAsObject.mediaType
    }

    // prepare license if needed
    if ('license' in metaAsObject) {
      result.license = await prepareLicense(metaAsObject.license)
    }

    // prepare thumbnail photo asset if needed
    if ('thumbnailPhoto' in metaAsObject) {
      const asset = await extractAsset({
        assetIndex: metaAsObject.thumbnailPhoto,
        assets: parameters.assets,
        db: parameters.db,
        blockNumber: parameters.blockNumber,
        contentOwner: parameters.contentOwner,
      })
      integrateAsset('thumbnail', result, asset) // changes `result` inline!
      delete metaAsObject.thumbnailPhoto
    }

    // prepare video asset if needed
    if ('video' in metaAsObject) {
      const asset = await extractAsset({
        assetIndex: metaAsObject.video,
        assets: parameters.assets,
        db: parameters.db,
        blockNumber: parameters.blockNumber,
        contentOwner: parameters.contentOwner,
      })
      integrateAsset('media', result, asset) // changes `result` inline!
      delete metaAsObject.video
    }

    // prepare language if needed
    if ('language' in metaAsObject) {
      result.language = await prepareLanguage(metaAsObject.language, parameters.db, parameters.blockNumber)
    }

    // prepare information about media published somewhere else before Joystream if needed.
    if (metaAsObject.publishedBeforeJoystream && metaAsObject.publishedBeforeJoystream.isPublished) {
      // this will change the `channel`!
      handlePublishedBeforeJoystream(result, metaAsObject.publishedBeforeJoystream.date)
    } else {
      delete metaAsObject.publishedBeforeJoystream // make sure the object is unset
    }

    return result as Partial<T>
  }

  // this should never happen
  logger.error('Not implemented metadata type', {type})
  throw `Not implemented metadata type`
}

export async function convertContentActorToChannelOwner(db: DatabaseManager, contentActor: ContentActor): Promise<{
  ownerMember?: Membership,
  ownerCuratorGroup?: CuratorGroup,
}> {
  if (contentActor.isMember) {
    const memberId = contentActor.asMember.toNumber()
    const member = await db.get(Membership, { where: { id: memberId.toString() } as FindConditions<Membership> })

    // ensure member exists
    if (!member) {
      inconsistentState(`Actor is non-existing member`, memberId)
      return {
        // this will clear fields
        ownerMember: undefined,
        ownerCuratorGroup: undefined,
      }
    }

    return {
      ownerMember: member,
      ownerCuratorGroup: undefined, // this will clear the field
    }
  }

  if (contentActor.isCurator) {
    const curatorGroupId = contentActor.asCurator[0].toNumber()
    const curatorGroup = await db.get(CuratorGroup, { where: { id: curatorGroupId.toString() } as FindConditions<CuratorGroup> })

    // ensure curator group exists
    if (!curatorGroup) {
      inconsistentState('Actor is non-existing curator group', curatorGroupId)
      return {
        // this will clear fields
        ownerMember: undefined,
        ownerCuratorGroup: undefined,
      }
    }

    return {
      ownerMember: undefined, // this will clear the field
      ownerCuratorGroup: curatorGroup,
    }
  }

  // TODO: contentActor.isLead

  logger.error('Not implemented ContentActor type', {contentActor: contentActor.toString()})
  throw 'Not-implemented ContentActor type used'
}

export function convertContentActorToDataObjectOwner(contentActor: ContentActor, channelId: number): typeof DataObjectOwner {
  const owner = new DataObjectOwnerChannel()
  owner.channel = channelId

  return owner

  /* contentActor is irrelevant now -> all video/channel content belongs to the channel
  if (contentActor.isMember) {
    const owner = new DataObjectOwnerMember()
    owner.member = contentActor.asMember.toBn()

    return owner
  }

  if (contentActor.isLead || contentActor.isCurator) {
    const owner = new DataObjectOwnerChannel()
    owner.channel = channelId

    return owner
  }

  logger.error('Not implemented ContentActor type', {contentActor: contentActor.toString()})
  throw 'Not-implemented ContentActor type used'
  */
}

function handlePublishedBeforeJoystream(video: Partial<Video>, publishedAtString?: string) {
  // published elsewhere before Joystream
  if (publishedAtString) {
    video.publishedBeforeJoystream = new Date(publishedAtString)

    return
  }

  // unset publish info
  video.publishedBeforeJoystream = undefined // plan deletion (will have effect when saved to db)
}

interface IConvertAssetParameters {
  rawAsset: NewAsset
  db: DatabaseManager
  blockNumber: number
  contentOwner: typeof DataObjectOwner
}

/*
  Converts event asset into data object or list of URLs fit to be saved to db.
*/
async function convertAsset(parameters: IConvertAssetParameters): Promise<AssetStorageOrUrls> {
  // is asset describing list of URLs?
  if (parameters.rawAsset.isUrls) {
    const urls = parameters.rawAsset.asUrls.toArray().map(item => item.toString())

    return urls
  }

  // !parameters.rawAsset.isUrls && parameters.rawAsset.isUpload // asset is in storage

  // prepare data object
  const contentParameters: ContentParameters = parameters.rawAsset.asUpload
  const dataObject = await prepareDataObject(contentParameters, parameters.blockNumber, parameters.contentOwner)

  return dataObject
}

interface IExtractAssetParameters {
  assetIndex: number | undefined
  assets: NewAsset[]
  db: DatabaseManager
  blockNumber: number
  contentOwner: typeof DataObjectOwner
}

/*
  Selects asset from provided set of assets and prepares asset data fit to be saved to db.
*/
async function extractAsset(parameters: IExtractAssetParameters): Promise<AssetStorageOrUrls | undefined> {
  // is asset being unset?
  if (parameters.assetIndex === undefined) {
    return undefined
  }

  // ensure asset index is valid
  if (parameters.assetIndex >= parameters.assets.length) {
    inconsistentState(`Non-existing asset extraction requested`, {
      assetsProvided: parameters.assets.length,
      assetIndex: parameters.assetIndex,
    })
    return undefined
  }

  // convert asset to data object record
  return convertAsset({
    rawAsset: parameters.assets[parameters.assetIndex],
    db: parameters.db,
    blockNumber: parameters.blockNumber,
    contentOwner: parameters.contentOwner,
  })
}

/*
  As a temporary messure to overcome yet-to-be-implemented features in Hydra, we are using redudant information
  to describe asset state. This function introduces all redudant data needed to be saved to db.

  Changes `result` argument!
*/
function integrateAsset<T>(propertyName: string, result: Object, asset: AssetStorageOrUrls | undefined) {
  // helpers - property names
  const nameUrl = propertyName + 'Urls'
  const nameDataObject = propertyName + 'DataObject'
  const nameAvailability = propertyName + 'Availability'

  if (asset === undefined) {
    result[nameUrl] = []
    result[nameAvailability] = AssetAvailability.INVALID
    result[nameDataObject] = undefined // plan deletion (will have effect when saved to db)

    return result
  }

  // is asset saved in storage?
  if (!isAssetInStorage(asset)) {
    // (un)set asset's properties
    result[nameUrl] = asset
    result[nameAvailability] = AssetAvailability.ACCEPTED
    result[nameDataObject] = undefined // plan deletion (will have effect when saved to db)

    return result
  }

  // prepare conversion table between liaison judgment and asset availability
  const conversionTable = {
    [LiaisonJudgement.ACCEPTED]: AssetAvailability.ACCEPTED,
    [LiaisonJudgement.PENDING]: AssetAvailability.PENDING,
  }

  // (un)set asset's properties
  result[nameUrl] = [] // plan deletion (will have effect when saved to db)
  result[nameAvailability] = conversionTable[asset.liaisonJudgement]
  result[nameDataObject] = asset
}

async function extractVideoSize(assets: NewAsset[], assetIndex: number | undefined): Promise<number | undefined> {
  // escape if no asset is required
  if (assetIndex === undefined) {
    return undefined
  }

  // ensure asset index is valid
  if (assetIndex > assets.length) {
    inconsistentState(`Non-existing asset video size extraction requested`, {assetsProvided: assets.length, assetIndex})
    return undefined
  }

  const rawAsset = assets[assetIndex]

  // escape if asset is describing URLs (can't get size)
  if (rawAsset.isUrls) {
    return undefined
  }

  // !rawAsset.isUrls && rawAsset.isUpload // asset is in storage

  // extract video size
  const contentParameters: ContentParameters = rawAsset.asUpload
  // `size` is masked by `size` special name in struct that's why there needs to be `.get('size') as u64`
  const videoSize = (contentParameters.get('size') as unknown as u64).toNumber()


  return videoSize
}

async function prepareLanguage(languageIso: string | undefined, db: DatabaseManager, blockNumber: number): Promise<Language | undefined> {
  // is language being unset?
  if (languageIso === undefined) {
    return undefined
  }

  // validate language string
  const isValidIso = ISO6391.validate(languageIso);

  // ensure language string is valid
  if (!isValidIso) {
    inconsistentState(`Invalid language ISO-639-1 provided`, languageIso)
    return undefined
  }

  // load language
  const language = await db.get(Language, { where: { iso: languageIso } as FindConditions<Language> })

  // return existing language if any
  if (language) {
    return language;
  }


  // create new language
  const newLanguage = new Language({
    iso: languageIso,
    createdInBlock: blockNumber,

    // TODO: remove these lines after Hydra auto-fills the values when cascading save (remove them on all places)
    createdById: '1',
    updatedById: '1',
  })

  await db.save<Language>(newLanguage)

  return newLanguage
}

async function prepareLicense(licenseProtobuf: LicenseMetadata.AsObject | undefined): Promise<License | undefined> {
  // NOTE: Deletion of any previous license should take place in appropriate event handling function
  //       and not here even it might appear so.

  // is license being unset?
  if (licenseProtobuf === undefined) {
    return undefined
  }

  // crete new license
  const license = new License({
    ...licenseProtobuf,

    createdById: '1',
    updatedById: '1',
  })

  return license
}

async function prepareVideoMetadata(videoProtobuf: VideoMetadata.AsObject, videoSize: number | undefined, blockNumber: number): Promise<VideoMediaMetadata> {
  // create new encoding info
  const encoding = new VideoMediaEncoding({
    ...videoProtobuf.mediaType,

    createdById: '1',
    updatedById: '1',
  })

  // create new video metadata
  const videoMeta = new VideoMediaMetadata({
    encoding,
    pixelWidth: videoProtobuf.mediaPixelWidth,
    pixelHeight: videoProtobuf.mediaPixelHeight,
    createdInBlock: blockNumber,

    createdById: '1',
    updatedById: '1',
  })

  // fill in video size if provided
  if (videoSize !== undefined) {
    videoMeta.size = videoSize
  }

  return videoMeta
}

async function prepareVideoCategory(categoryId: number | undefined, db: DatabaseManager): Promise<VideoCategory | undefined> {
  // is category being unset?
  if (categoryId === undefined) {
    return undefined
  }

  // load video category
  const category = await db.get(VideoCategory, { where: { id: categoryId.toString() } as FindConditions<VideoCategory> })

  // ensure video category exists
  if (!category) {
    inconsistentState('Non-existing video category association with video requested', categoryId)
    return undefined
  }

  return category
}

function convertMetadataToObject<T extends Object>(metadata: jspb.Message): T {
  const metaAsObject = metadata.toObject()
  const result = {} as T

  for (const key in metaAsObject) {
    const funcNameBase = key.charAt(0).toUpperCase() + key.slice(1)
    const hasFuncName = 'has' + funcNameBase
    const isSet = funcNameBase == 'PersonsList' // there is no `VideoMetadata.hasPersonsList` method from unkown reason -> create exception
      ? true
      : metadata[hasFuncName]()

    if (!isSet) {
      continue
    }


    const getFuncName = 'get' + funcNameBase
    const value = metadata[getFuncName]()

    // TODO: check that recursion trully works
    if (value instanceof jspb.Message) {
      result[key] = convertMetadataToObject(value)
      continue
    }

    result[key] = metaAsObject[key]
  }

  return result
}
