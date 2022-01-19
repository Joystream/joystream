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
import { invalidMetadata, inconsistentState, logger } from '../common'
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
  Membership,
  VideoMediaEncoding,
  ChannelCategory,
  StorageDataObject,
  DataObjectTypeChannelAvatar,
  DataObjectTypeChannelCoverPhoto,
  DataObjectTypeVideoMedia,
  DataObjectTypeVideoThumbnail,
} from 'query-node/dist/model'
// Joystream types
import { ContentActor, StorageAssets } from '@joystream/types/augment'
import { DecodedMetadataObject } from '@joystream/metadata-protobuf/types'
import BN from 'bn.js'
import { getMostRecentlyCreatedDataObjects } from '../storage/utils'

const ASSET_TYPES = {
  channel: [
    {
      DataObjectTypeConstructor: DataObjectTypeChannelCoverPhoto,
      metaFieldName: 'coverPhoto',
      schemaFieldName: 'coverPhoto',
    },
    {
      DataObjectTypeConstructor: DataObjectTypeChannelAvatar,
      metaFieldName: 'avatarPhoto',
      schemaFieldName: 'avatarPhoto',
    },
  ],
  video: [
    {
      DataObjectTypeConstructor: DataObjectTypeVideoMedia,
      metaFieldName: 'video',
      schemaFieldName: 'media',
    },
    {
      DataObjectTypeConstructor: DataObjectTypeVideoThumbnail,
      metaFieldName: 'thumbnailPhoto',
      schemaFieldName: 'thumbnailPhoto',
    },
  ],
} as const

// all relations that need to be loaded for updating active video counters when deleting content
export const videoRelationsForCountersBare = ['channel', 'channel.category', 'category']
// all relations that need to be loaded for full evalution of video active status to work
export const videoRelationsForCounters = [...videoRelationsForCountersBare, 'thumbnailPhoto', 'media']

async function processChannelAssets(
  { event, store }: EventContext & StoreContext,
  assets: StorageDataObject[],
  channel: Channel,
  meta: DecodedMetadataObject<IChannelMetadata>
) {
  await Promise.all(
    ASSET_TYPES.channel.map(async ({ metaFieldName, schemaFieldName, DataObjectTypeConstructor }) => {
      const newAssetIndex = meta[metaFieldName]
      const currentAsset = channel[schemaFieldName]
      if (isSet(newAssetIndex)) {
        const asset = findAssetByIndex(assets, newAssetIndex)
        if (asset) {
          if (currentAsset) {
            currentAsset.unsetAt = new Date(event.blockTimestamp)
            await store.save<StorageDataObject>(currentAsset)
          }
          const dataObjectType = new DataObjectTypeConstructor()
          dataObjectType.channelId = channel.id
          asset.type = dataObjectType
          channel[schemaFieldName] = asset
          await store.save<StorageDataObject>(asset)
        }
      }
    })
  )
}

async function processVideoAssets(
  { event, store }: EventContext & StoreContext,
  assets: StorageDataObject[],
  video: Video,
  meta: DecodedMetadataObject<IVideoMetadata>
) {
  await Promise.all(
    ASSET_TYPES.video.map(async ({ metaFieldName, schemaFieldName, DataObjectTypeConstructor }) => {
      const newAssetIndex = meta[metaFieldName]
      const currentAsset = video[schemaFieldName]
      if (isSet(newAssetIndex)) {
        const asset = findAssetByIndex(assets, newAssetIndex)
        if (asset) {
          if (currentAsset) {
            currentAsset.unsetAt = new Date(event.blockTimestamp)
            await store.save<StorageDataObject>(currentAsset)
          }
          const dataObjectType = new DataObjectTypeConstructor()
          dataObjectType.videoId = video.id
          asset.type = dataObjectType
          video[schemaFieldName] = asset
          await store.save<StorageDataObject>(asset)
        }
      }
    })
  )
}

export async function processChannelMetadata(
  ctx: EventContext & StoreContext,
  channel: Channel,
  meta: DecodedMetadataObject<IChannelMetadata>,
  assetsParams?: StorageAssets
): Promise<Channel> {
  const assets = assetsParams ? await processNewAssets(ctx, assetsParams) : []

  integrateMeta(channel, meta, ['title', 'description', 'isPublic'])

  await processChannelAssets(ctx, assets, channel, meta)

  // prepare channel category if needed
  if (isSet(meta.category)) {
    channel.category = await processChannelCategory(ctx, channel.category, parseInt(meta.category))
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
  assetsParams?: StorageAssets
): Promise<Video> {
  const assets = assetsParams ? await processNewAssets(ctx, assetsParams) : []

  integrateMeta(video, meta, ['title', 'description', 'duration', 'hasMarketing', 'isExplicit', 'isPublic'])

  await processVideoAssets(ctx, assets, video, meta)

  // prepare video category if needed
  if (meta.category) {
    video.category = await processVideoCategory(ctx, video.category, parseInt(meta.category))
  }

  // prepare media meta information if needed
  if (isSet(meta.video) || isSet(meta.mediaType) || isSet(meta.mediaPixelWidth) || isSet(meta.mediaPixelHeight)) {
    // prepare video file size if poosible
    const videoSize = extractVideoSize(assets)
    video.mediaMetadata = await processVideoMediaMetadata(ctx, video.mediaMetadata, meta, videoSize)
  }

  // prepare license if needed
  if (isSet(meta.license)) {
    await updateVideoLicense(ctx, video, meta.license)
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

function findAssetByIndex(assets: StorageDataObject[], index: number, name?: string): StorageDataObject | null {
  if (assets[index]) {
    return assets[index]
  }

  invalidMetadata(`Invalid${name ? ' ' + name : ''} asset index`, {
    numberOfAssets: assets.length,
    requestedAssetIndex: index,
  })

  return null
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
  videoSize: BN | undefined
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

async function processNewAssets(ctx: EventContext & StoreContext, assets: StorageAssets): Promise<StorageDataObject[]> {
  const assetsUploaded = assets.object_creation_list.length
  // FIXME: Ideally the runtime would provide object ids in ChannelCreated/VideoCreated/ChannelUpdated(...) events
  const objects = await getMostRecentlyCreatedDataObjects(ctx.store, assetsUploaded)
  return objects
}

function extractVideoSize(assets: StorageDataObject[]): BN | undefined {
  const mediaAsset = assets.find((a) => a.type?.isTypeOf === DataObjectTypeVideoMedia.name)
  return mediaAsset ? mediaAsset.size : undefined
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
      [assetName]: {
        id: dataObject.id,
      },
    })),
    relations: [...channelAssets],
  })
  const video = await store.get(Video, {
    where: videoAssets.map((assetName) => ({
      [assetName]: {
        id: dataObject.id,
      },
    })),
    relations: [...videoAssets, ...videoRelationsForCountersBare],
  })

  // remember if video is fully active before update
  const wasFullyActive = video && getVideoActiveStatus(video)

  if (channel) {
    channelAssets.forEach((assetName) => {
      if (channel[assetName] && channel[assetName]?.id === dataObject.id) {
        channel[assetName] = null as any
      }
    })
    await store.save<Channel>(channel)

    // emit log event
    logger.info('Content has been disconnected from Channel', {
      channelId: channel.id.toString(),
      dataObjectId: dataObject.id,
    })
  }

  if (video) {
    videoAssets.forEach((assetName) => {
      if (video[assetName] && video[assetName]?.id === dataObject.id) {
        video[assetName] = null as any
      }
    })
    await store.save<Video>(video)

    // update video active counters
    await updateVideoActiveCounters(store, wasFullyActive as IVideoActiveStatus, undefined)

    // emit log event
    logger.info('Content has been disconnected from Video', {
      videoId: video.id.toString(),
      dataObjectId: dataObject.id,
    })
  }

  // remove data object
  await store.remove<StorageDataObject>(dataObject)
}

export interface IVideoActiveStatus {
  isFullyActive: boolean
  video: Video
  videoCategory: VideoCategory | undefined
  channel: Channel
  channelCategory: ChannelCategory | undefined
}

export function getVideoActiveStatus(video: Video): IVideoActiveStatus {
  const isFullyActive =
    !!video.isPublic && !video.isCensored && !!video.thumbnailPhoto?.isAccepted && !!video.media?.isAccepted

  const videoCategory = video.category
  const channel = video.channel
  const channelCategory = channel.category

  return {
    isFullyActive,
    video,
    videoCategory,
    channel,
    channelCategory,
  }
}

export async function updateVideoActiveCounters(
  store: DatabaseManager,
  initialActiveStatus: IVideoActiveStatus | null | undefined,
  activeStatus: IVideoActiveStatus | null | undefined
): Promise<void> {
  async function updateSingleEntity<Entity extends VideoCategory | Channel>(
    entity: Entity,
    counterChange: number
  ): Promise<void> {
    entity.activeVideosCounter += counterChange

    await store.save(entity)
  }

  async function reflectUpdate<Entity extends VideoCategory | Channel>(
    oldEntity: Entity | undefined,
    newEntity: Entity | undefined,
    initFullyActive: boolean,
    nowFullyActive: boolean
  ): Promise<void> {
    if (!oldEntity && !newEntity) {
      return
    }

    const didEntityChange = oldEntity?.id.toString() !== newEntity?.id.toString()
    const didFullyActiveChange = initFullyActive !== nowFullyActive

    // escape if nothing changed
    if (!didEntityChange && !didFullyActiveChange) {
      return
    }

    if (!didEntityChange) {
      // && didFullyActiveChange
      const counterChange = nowFullyActive ? 1 : -1

      await updateSingleEntity(newEntity as Entity, counterChange)

      return
    }

    // didEntityChange === true

    if (oldEntity && initFullyActive) {
      // if video was fully active before, prepare to decrease counter
      const counterChange = -1

      await updateSingleEntity(oldEntity, counterChange)
    }

    if (newEntity && nowFullyActive) {
      // if video is fully active now, prepare to increase counter
      const counterChange = 1

      await updateSingleEntity(newEntity, counterChange)
    }
  }

  const items = ['videoCategory', 'channel', 'channelCategory']
  const promises = items.map(
    async (item) =>
      await reflectUpdate(
        initialActiveStatus?.[item],
        activeStatus?.[item],
        initialActiveStatus?.isFullyActive || false,
        activeStatus?.isFullyActive || false
      )
  )
  await Promise.all(promises)
}

export async function updateChannelCategoryVideoActiveCounter(
  store: DatabaseManager,
  originalCategory: ChannelCategory | undefined,
  newCategory: ChannelCategory | undefined,
  videosCount: number
) {
  // escape if no counter change needed
  if (!videosCount || originalCategory === newCategory) {
    return
  }

  if (originalCategory) {
    originalCategory.activeVideosCounter -= videosCount
    await store.save<ChannelCategory>(originalCategory)
  }

  if (newCategory) {
    newCategory.activeVideosCounter += videosCount
    await store.save<ChannelCategory>(newCategory)
  }
}
