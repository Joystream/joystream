// TODO: finish db cascade on save/remove; right now there is manually added `cascade: ["insert", "update"]` directive
//       to all relations in `query-node/generated/graphql-server/src/modules/**/*.model.ts`. That should ensure all records
//       are saved on one `store.save(...)` call. Missing features
//       - find a proper way to cascade on remove or implement custom removals for every entity
//       - convert manual changes done to `*model.ts` file into some patch or bash commands that can be executed
//         every time query node codegen is run (that will overwrite said manual changes)
//       - verify in integration tests that the records are trully created/updated/removed as expected

import { DatabaseManager, EventContext, StoreContext } from '@dzlzv/hydra-common'
import ISO6391 from 'iso-639-1'
import { FindConditions } from 'typeorm'
import {
  IVideoMetadata,
  IPublishedBeforeJoystream,
  ILicense,
  IMediaType,
  IChannelMetadata,
} from '@joystream/metadata-protobuf'
import { integrateMeta, isSet } from '@joystream/metadata-protobuf/utils'
import { invalidMetadata, inconsistentState, logger, unexpectedData, createDataObject } from '../common'
import {
  // primary entities
  CuratorGroup,
  Channel,
  Video,
  VideoCategory,
  // secondary entities
  Language,
  License,
  VideoMediaMetadata,
  // asset
  Asset,
  DataObjectOwner,
  DataObjectOwnerChannel,
  Membership,
  VideoMediaEncoding,
  AssetExternal,
  AssetJoystreamStorage,
  ChannelCategory,
} from 'query-node/dist/model'
// Joystream types
import { ContentParameters, NewAsset, ContentActor } from '@joystream/types/augment'
import { ContentParameters as Custom_ContentParameters } from '@joystream/types/storage'
import { registry } from '@joystream/types'
import { DecodedMetadataObject } from '@joystream/metadata-protobuf/types'
import BN from 'bn.js'

export async function processChannelMetadata(
  ctx: EventContext & StoreContext,
  channel: Channel,
  meta: DecodedMetadataObject<IChannelMetadata>,
  assets: NewAsset[]
): Promise<Channel> {
  const assetsOwner = new DataObjectOwnerChannel()
  assetsOwner.channelId = channel.id

  const processedAssets = await Promise.all(assets.map((asset) => processNewAsset(ctx, asset, assetsOwner)))

  integrateMeta(channel, meta, ['title', 'description', 'isPublic'])

  // prepare channel category if needed
  if (isSet(meta.category)) {
    channel.category = await processChannelCategory(ctx, channel.category, parseInt(meta.category))
  }

  // prepare cover photo asset if needed
  if (isSet(meta.coverPhoto)) {
    const asset = findAssetByIndex(processedAssets, meta.coverPhoto, 'channel cover photo')
    if (asset) {
      channel.coverPhoto = asset
    }
  }

  // prepare avatar photo asset if needed
  if (isSet(meta.avatarPhoto)) {
    const asset = findAssetByIndex(processedAssets, meta.avatarPhoto, 'channel avatar photo')
    if (asset) {
      channel.avatarPhoto = asset
    }
  }

  // prepare language if needed
  if (isSet(meta.language)) {
    channel.language = await processLanguage(ctx, channel.language, meta.language)
  }

  return channel
}

export async function processVideoMetadata(
  ctx: EventContext & StoreContext,
  channel: Channel,
  video: Video,
  meta: DecodedMetadataObject<IVideoMetadata>,
  assets: NewAsset[]
): Promise<Video> {
  const assetsOwner = new DataObjectOwnerChannel()
  assetsOwner.channelId = channel.id

  const processedAssets = await Promise.all(assets.map((asset) => processNewAsset(ctx, asset, assetsOwner)))

  integrateMeta(video, meta, ['title', 'description', 'duration', 'hasMarketing', 'isExplicit', 'isPublic'])

  // prepare video category if needed
  if (meta.category) {
    video.category = await processVideoCategory(ctx, video.category, parseInt(meta.category))
  }

  // prepare media meta information if needed
  if (isSet(meta.mediaType) || isSet(meta.mediaPixelWidth) || isSet(meta.mediaPixelHeight)) {
    // prepare video file size if poosible
    const videoSize = extractVideoSize(assets, meta.video)
    video.mediaMetadata = await processVideoMediaMetadata(ctx, video.mediaMetadata, meta, videoSize)
  }

  // prepare license if needed
  if (isSet(meta.license)) {
    await updateVideoLicense(ctx, video, meta.license)
  }

  // prepare thumbnail photo asset if needed
  if (isSet(meta.thumbnailPhoto)) {
    const asset = findAssetByIndex(processedAssets, meta.thumbnailPhoto, 'thumbnail photo')
    if (asset) {
      video.thumbnailPhoto = asset
    }
  }

  // prepare video asset if needed
  if (isSet(meta.video)) {
    const asset = findAssetByIndex(processedAssets, meta.video, 'video')
    if (asset) {
      video.media = asset
    }
  }

  // prepare language if needed
  if (isSet(meta.language)) {
    video.language = await processLanguage(ctx, video.language, meta.language)
  }

  if (isSet(meta.publishedBeforeJoystream)) {
    video.publishedBeforeJoystream = processPublishedBeforeJoystream(
      ctx,
      video.publishedBeforeJoystream,
      meta.publishedBeforeJoystream
    )
  }

  return video
}

function findAssetByIndex(assets: typeof Asset[], index: number, name?: string): typeof Asset | null {
  if (assets[index]) {
    return assets[index]
  } else {
    invalidMetadata(`Invalid${name ? ' ' + name : ''} asset index`, {
      numberOfAssets: assets.length,
      requestedAssetIndex: index,
    })

    return null
  }
}

async function processVideoMediaEncoding(
  { store, event }: StoreContext & EventContext,
  existingVideoMediaEncoding: VideoMediaEncoding | undefined,
  metadata: DecodedMetadataObject<IMediaType>
): Promise<VideoMediaEncoding> {
  const encoding =
    existingVideoMediaEncoding ||
    new VideoMediaEncoding({
      createdAt: new Date(event.blockTimestamp),
      createdById: '1',
      updatedById: '1',
    })
  // integrate media encoding-related data
  integrateMeta(encoding, metadata, ['codecName', 'container', 'mimeMediaType'])
  encoding.updatedAt = new Date(event.blockTimestamp)
  await store.save<VideoMediaEncoding>(encoding)

  return encoding
}

async function processVideoMediaMetadata(
  ctx: StoreContext & EventContext,
  existingVideoMedia: VideoMediaMetadata | undefined,
  metadata: DecodedMetadataObject<IVideoMetadata>,
  videoSize: number | undefined
): Promise<VideoMediaMetadata> {
  const { store, event } = ctx
  const videoMedia =
    existingVideoMedia ||
    new VideoMediaMetadata({
      createdInBlock: event.blockNumber,
      createdAt: new Date(event.blockTimestamp),
      createdById: '1',
      updatedById: '1',
    })

  // integrate media-related data
  const mediaMetadata = {
    size: isSet(videoSize) ? new BN(videoSize.toString()) : undefined,
    pixelWidth: metadata.mediaPixelWidth,
    pixelHeight: metadata.mediaPixelHeight,
  }
  integrateMeta(videoMedia, mediaMetadata, ['pixelWidth', 'pixelHeight', 'size'])
  videoMedia.updatedAt = new Date(event.blockTimestamp)
  videoMedia.encoding = await processVideoMediaEncoding(ctx, videoMedia.encoding, metadata.mediaType || {})
  await store.save<VideoMediaMetadata>(videoMedia)

  return videoMedia
}

export async function convertContentActorToChannelOwner(
  store: DatabaseManager,
  contentActor: ContentActor
): Promise<{
  ownerMember?: Membership
  ownerCuratorGroup?: CuratorGroup
}> {
  if (contentActor.isMember) {
    const memberId = contentActor.asMember.toNumber()
    const member = await store.get(Membership, { where: { id: memberId.toString() } as FindConditions<Membership> })

    // ensure member exists
    if (!member) {
      return inconsistentState(`Actor is non-existing member`, memberId)
    }

    return {
      ownerMember: member,
      ownerCuratorGroup: undefined, // this will clear the field
    }
  }

  if (contentActor.isCurator) {
    const curatorGroupId = contentActor.asCurator[0].toNumber()
    const curatorGroup = await store.get(CuratorGroup, {
      where: { id: curatorGroupId.toString() } as FindConditions<CuratorGroup>,
    })

    // ensure curator group exists
    if (!curatorGroup) {
      return inconsistentState('Actor is non-existing curator group', curatorGroupId)
    }

    return {
      ownerMember: undefined, // this will clear the field
      ownerCuratorGroup: curatorGroup,
    }
  }

  // TODO: contentActor.isLead

  logger.error('Not implemented ContentActor type', { contentActor: contentActor.toString() })
  throw new Error('Not-implemented ContentActor type used')
}

function processPublishedBeforeJoystream(
  ctx: EventContext & StoreContext,
  currentValue: Date | undefined,
  metadata: DecodedMetadataObject<IPublishedBeforeJoystream>
): Date | undefined {
  if (!isSet(metadata)) {
    return currentValue
  }

  // Property is beeing unset
  if (!metadata.isPublished) {
    return undefined
  }

  // try to parse timestamp from publish date
  const timestamp = isSet(metadata.date) ? Date.parse(metadata.date) : NaN

  // ensure date is valid
  if (isNaN(timestamp)) {
    invalidMetadata(`Invalid date used for publishedBeforeJoystream`, {
      timestamp,
    })
    return currentValue
  }

  // set new date
  return new Date(timestamp)
}

async function processNewAsset(
  ctx: EventContext & StoreContext,
  asset: NewAsset,
  owner: typeof DataObjectOwner
): Promise<typeof Asset> {
  if (asset.isUrls) {
    const urls = asset.asUrls.toArray().map((url) => url.toString())
    const resultAsset = new AssetExternal()
    resultAsset.urls = JSON.stringify(urls)
    return resultAsset
  } else if (asset.isUpload) {
    const contentParameters: ContentParameters = asset.asUpload
    const dataObject = await createDataObject(ctx, contentParameters, owner)

    const resultAsset = new AssetJoystreamStorage()
    resultAsset.dataObjectId = dataObject.id
    return resultAsset
  } else {
    unexpectedData('Unrecognized asset type', asset.type)
  }
}

function extractVideoSize(assets: NewAsset[], assetIndex: number | null | undefined): number | undefined {
  // escape if no asset is required
  if (!isSet(assetIndex)) {
    return undefined
  }

  // ensure asset index is valid
  if (assetIndex > assets.length) {
    invalidMetadata(`Non-existing asset video size extraction requested`, { assetsProvided: assets.length, assetIndex })
    return undefined
  }

  const rawAsset = assets[assetIndex]

  // escape if asset is describing URLs (can't get size)
  if (rawAsset.isUrls) {
    return undefined
  }

  // !rawAsset.isUrls && rawAsset.isUpload // asset is in storage

  // convert generic content parameters coming from processor to custom Joystream data type
  const customContentParameters = new Custom_ContentParameters(registry, rawAsset.asUpload.toJSON() as any)
  // extract video size
  const videoSize = customContentParameters.size_in_bytes.toNumber()

  return videoSize
}

async function processLanguage(
  ctx: EventContext & StoreContext,
  currentLanguage: Language | undefined,
  languageIso: string | undefined
): Promise<Language | undefined> {
  const { event, store } = ctx

  if (!isSet(languageIso)) {
    return currentLanguage
  }

  // validate language string
  const isValidIso = ISO6391.validate(languageIso)

  // ensure language string is valid
  if (!isValidIso) {
    invalidMetadata(`Invalid language ISO-639-1 provided`, languageIso)
    return currentLanguage
  }

  // load language
  const existingLanguage = await store.get(Language, { where: { iso: languageIso } })

  // return existing language if any
  if (existingLanguage) {
    return existingLanguage
  }

  // create new language
  const newLanguage = new Language({
    iso: languageIso,
    createdInBlock: event.blockNumber,
    createdAt: new Date(event.blockTimestamp),
    updatedAt: new Date(event.blockTimestamp),
    // TODO: remove these lines after Hydra auto-fills the values when cascading save (remove them on all places)
    createdById: '1',
    updatedById: '1',
  })

  await store.save<Language>(newLanguage)

  return newLanguage
}

async function updateVideoLicense(
  ctx: StoreContext & EventContext,
  video: Video,
  licenseMetadata: ILicense | null | undefined
): Promise<void> {
  const { store, event } = ctx

  if (!isSet(licenseMetadata)) {
    return
  }

  const previousLicense = video.license
  let license: License | null = null

  if (!isLicenseEmpty(licenseMetadata)) {
    // license is meant to be created/updated
    license =
      previousLicense ||
      new License({
        createdAt: new Date(event.blockTimestamp),
        createdById: '1',
        updatedById: '1',
      })
    license.updatedAt = new Date(event.blockTimestamp)
    integrateMeta(license, licenseMetadata, ['attribution', 'code', 'customText'])
    await store.save<License>(license)
  }

  // Update license (and potentially remove foreign key reference)
  // FIXME: Note that we MUST to provide "null" here in order to unset a relation,
  // even though the model typings itself are not aware that "null" is a valid value.
  // See: https://github.com/typeorm/typeorm/issues/2934
  video.license = license as License | undefined
  video.updatedAt = new Date(ctx.event.blockTimestamp)
  await store.save<Video>(video)

  // Safely remove previous license if needed
  if (previousLicense && !license) {
    await store.remove<License>(previousLicense)
  }
}

/*
  Checks if protobof contains license with some fields filled or is empty object (`{}` or `{someKey: undefined, ...}`).
  Empty object means deletion is requested.
*/
function isLicenseEmpty(licenseObject: ILicense): boolean {
  const somePropertySet = Object.values(licenseObject).some((v) => isSet(v))

  return !somePropertySet
}

async function processVideoCategory(
  ctx: EventContext & StoreContext,
  currentCategory: VideoCategory | undefined,
  categoryId: number
): Promise<VideoCategory | undefined> {
  const { store } = ctx

  // load video category
  const category = await store.get(VideoCategory, {
    where: { id: categoryId.toString() },
  })

  // ensure video category exists
  if (!category) {
    invalidMetadata('Non-existing video category association with video requested', categoryId)
    return currentCategory
  }

  return category
}

async function processChannelCategory(
  ctx: EventContext & StoreContext,
  currentCategory: ChannelCategory | undefined,
  categoryId: number
): Promise<ChannelCategory | undefined> {
  const { store } = ctx

  // load video category
  const category = await store.get(ChannelCategory, {
    where: { id: categoryId.toString() },
  })

  // ensure video category exists
  if (!category) {
    invalidMetadata('Non-existing channel category association with channel requested', categoryId)
    return currentCategory
  }

  return category
}
