import { DatabaseManager, EventContext, StoreContext } from '@joystream/hydra-common'
import { FindConditions, Raw } from 'typeorm'
import {
  IVideoMetadata,
  IPublishedBeforeJoystream,
  ILicense,
  IMediaType,
  IChannelMetadata,
} from '@joystream/metadata-protobuf'
import { integrateMeta, isSet, isValidLanguageCode } from '@joystream/metadata-protobuf/utils'
import { invalidMetadata, inconsistentState, unexpectedData, logger } from '../common'
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
  Membership,
  VideoMediaEncoding,
  ChannelCategory,
  AssetNone,
  AssetExternal,
  AssetJoystreamStorage,
  StorageDataObject,
} from 'query-node/dist/model'
// Joystream types
import { NewAssets, ContentActor } from '@joystream/types/augment'
import { DecodedMetadataObject } from '@joystream/metadata-protobuf/types'
import BN from 'bn.js'
import { getMostRecentlyCreatedDataObjects } from '../storage/utils'
import { DataObjectCreationParameters as ObjectCreationParams } from '@joystream/types/storage'
import { registry } from '@joystream/types'

export async function processChannelMetadata(
  ctx: EventContext & StoreContext,
  channel: Channel,
  meta: DecodedMetadataObject<IChannelMetadata>,
  assets?: NewAssets
): Promise<Channel> {
  const processedAssets = assets ? await processNewAssets(ctx, assets) : []

  integrateMeta(channel, meta, ['title', 'description', 'isPublic'])

  // prepare channel category if needed
  if (isSet(meta.category)) {
    channel.category = await processChannelCategory(ctx, channel.category, parseInt(meta.category))
  }

  channel.coverPhoto = new AssetNone()
  channel.avatarPhoto = new AssetNone()
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
  video: Video,
  meta: DecodedMetadataObject<IVideoMetadata>,
  assets?: NewAssets
): Promise<Video> {
  const processedAssets = assets ? await processNewAssets(ctx, assets) : []

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

  video.thumbnailPhoto = new AssetNone()
  video.media = new AssetNone()
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

async function processNewAssets(ctx: EventContext & StoreContext, assets: NewAssets): Promise<Array<typeof Asset>> {
  if (assets.isUrls) {
    return assets.asUrls.map((assetUrls) => {
      const resultAsset = new AssetExternal()
      resultAsset.urls = JSON.stringify(assetUrls.map((u) => u.toString()))
      return resultAsset
    })
  } else if (assets.isUpload) {
    const assetsUploaded = assets.asUpload.object_creation_list.length
    // FIXME: Ideally the runtime would provide object ids in ChannelCreated/VideoCreated/ChannelUpdated(...) events
    const objects = await getMostRecentlyCreatedDataObjects(ctx.store, assetsUploaded)
    return objects.map((o) => {
      const resultAsset = new AssetJoystreamStorage()
      resultAsset.dataObjectId = o.id
      return resultAsset
    })
  } else {
    unexpectedData('Unrecognized assets type', assets.type)
  }
}

function extractVideoSize(assets: NewAssets | undefined, assetIndex: number | null | undefined): number | undefined {
  // escape if no assetIndex is set
  if (!isSet(assetIndex)) {
    return undefined
  }

  // index provided, but there are no assets
  if (!assets) {
    invalidMetadata(`Non-existing asset video size extraction requested - no assets were uploaded!`, {
      assetIndex,
    })
    return undefined
  }

  // cannot extract size from other asset types than "Upload"
  if (!assets.isUpload) {
    return undefined
  }

  const dataObjectsParams = assets.asUpload.object_creation_list

  // ensure asset index is valid
  if (assetIndex >= dataObjectsParams.length) {
    invalidMetadata(`Non-existing asset video size extraction requested`, {
      assetsProvided: dataObjectsParams.length,
      assetIndex,
    })
    return undefined
  }

  // extract video size from objectParams
  const objectParams = assets.asUpload.object_creation_list[assetIndex]
  const params = new ObjectCreationParams(registry, objectParams.toJSON() as any)
  const videoSize = params.getField('size').toNumber()

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

  // ensure language string is valid
  if (!isValidLanguageCode(languageIso)) {
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
  // See: https://github.com/Joystream/hydra/issues/435
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

// Needs to be done every time before data object is removed!
export async function unsetAssetRelations(store: DatabaseManager, dataObject: StorageDataObject): Promise<void> {
  const channelAssets = ['avatarPhoto', 'coverPhoto'] as const
  const videoAssets = ['thumbnailPhoto', 'media'] as const

  // NOTE: we don't need to retrieve multiple channels/videos via `store.getMany()` because dataObject
  // is allowed to be associated only with one channel/video in runtime
  const channel = await store.get(Channel, {
    where: channelAssets.map((assetName) => ({
      [assetName]: Raw((alias) => `${alias}::json->'dataObjectId' = :id`, {
        id: dataObject.id,
      }),
    })),
  })
  const video = await store.get(Video, {
    where: videoAssets.map((assetName) => ({
      [assetName]: Raw((alias) => `${alias}::json->'dataObjectId' = :id`, {
        id: dataObject.id,
      }),
    })),
  })

  if (channel) {
    channelAssets.forEach((assetName) => {
      if (channel[assetName] && (channel[assetName] as AssetJoystreamStorage).dataObjectId === dataObject.id) {
        channel[assetName] = new AssetNone()
      }
    })
    await store.save<Channel>(channel)

    // emit log event
    logger.info('Content has been disconnected from Channel', {
      channelId: channel.id.toString(),
      dataObjectId: dataObject.id,
    })
  } else if (video) {
    videoAssets.forEach((assetName) => {
      if (video[assetName] && (video[assetName] as AssetJoystreamStorage).dataObjectId === dataObject.id) {
        video[assetName] = new AssetNone()
      }
    })
    await store.save<Video>(video)

    // emit log event
    logger.info('Content has been disconnected from Video', {
      videoId: video.id.toString(),
      dataObjectId: dataObject.id,
    })
  }
}
