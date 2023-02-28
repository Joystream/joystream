import { DatabaseManager, EventContext, StoreContext } from '@joystream/hydra-common'
import {
  IVideoMetadata,
  IPublishedBeforeJoystream,
  ILicense,
  IMediaType,
  IChannelMetadata,
  ISubtitleMetadata,
  IAppAction,
  AppAction,
} from '@joystream/metadata-protobuf'
import { integrateMeta, isSet, isValidLanguageCode } from '@joystream/metadata-protobuf/utils'
import { ed25519Verify } from '@polkadot/util-crypto'
import { invalidMetadata, inconsistentState, logger, deterministicEntityId, EntityType } from '../common'
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
  App,
  // asset
  Membership,
  VideoMediaEncoding,
  StorageDataObject,
  DataObjectTypeChannelAvatar,
  DataObjectTypeChannelCoverPhoto,
  DataObjectTypeVideoMedia,
  DataObjectTypeVideoThumbnail,
  ContentActorLead,
  ContentActorCurator,
  ContentActorMember,
  ContentActor as ContentActorVariant,
  Curator,
  DataObjectTypeVideoSubtitle,
  VideoSubtitle,
} from 'query-node/dist/model'
// Joystream types
import {
  PalletContentChannelOwner as ChannelOwner,
  PalletContentPermissionsContentActor as ContentActor,
  PalletContentIterableEnumsChannelActionPermission,
} from '@polkadot/types/lookup'
import { DecodedMetadataObject } from '@joystream/metadata-protobuf/types'
import BN from 'bn.js'
import _ from 'lodash'
import { getSortedDataObjectsByIds } from '../storage/utils'
import { BTreeSet } from '@polkadot/types'
import { DataObjectId } from '@joystream/types/primitives'
import { Bytes } from '@polkadot/types/primitive'
import { u8aToHex, stringToHex } from '@polkadot/util'
import { createType } from '@joystream/types'
import { getAppById } from './app'

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
  subtitle: {
    DataObjectTypeConstructor: DataObjectTypeVideoSubtitle,
    metaFieldName: 'newAsset',
    schemaFieldName: 'asset',
  },
} as const

// all relations that need to be loaded for full evalution of video active status to work
export const videoRelationsForCounters = ['channel', 'category', 'thumbnailPhoto', 'media'] as const

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

async function processVideoSubtitleAssets(
  { event, store }: EventContext & StoreContext,
  assets: StorageDataObject[],
  subtitle: VideoSubtitle,
  meta: DecodedMetadataObject<ISubtitleMetadata>
) {
  const { metaFieldName, schemaFieldName, DataObjectTypeConstructor } = ASSET_TYPES.subtitle
  const newAssetIndex = meta[metaFieldName]
  const currentAsset = subtitle[schemaFieldName]

  if (isSet(newAssetIndex)) {
    const asset = findAssetByIndex(assets, newAssetIndex)
    if (asset) {
      if (currentAsset) {
        currentAsset.unsetAt = new Date(event.blockTimestamp)
        await store.save<StorageDataObject>(currentAsset)
      }
      const dataObjectType = new DataObjectTypeConstructor()
      dataObjectType.subtitleId = subtitle.id
      dataObjectType.videoId = subtitle.video.id
      asset.type = dataObjectType
      subtitle[schemaFieldName] = asset
      await store.save<StorageDataObject>(asset)
    }
  }
}

async function validateAndGetApp(
  ctx: EventContext & StoreContext,
  validationContext: {
    ownerNonce: number | undefined
    appCommitment: string | undefined
  },
  appAction: DecodedMetadataObject<IAppAction>
): Promise<App | undefined> {
  // If one is missing we cannot verify the signature
  if (
    !appAction.appId ||
    !appAction.signature ||
    typeof appAction.nonce !== 'number' ||
    !validationContext.appCommitment
  ) {
    invalidMetadata('Missing action fields to verify app')
    return undefined
  }

  const app = await getAppById(ctx.store, appAction.appId)

  if (!app || !app.authKey) {
    invalidMetadata('No app of given id found')
    return undefined
  }

  if (typeof validationContext.ownerNonce === 'undefined' || validationContext.ownerNonce !== appAction.nonce) {
    invalidMetadata('Invalid app action nonce')

    return undefined
  }

  try {
    const isSignatureValid = ed25519Verify(
      validationContext.appCommitment,
      appAction.signature as Uint8Array,
      app.authKey
    )

    if (!isSignatureValid) {
      invalidMetadata('Invalid app action signature')
    }

    return isSignatureValid ? app : undefined
  } catch (e) {
    invalidMetadata((e as Error)?.message)
    return undefined
  }
}

export async function processAppActionMetadata<T extends { entryApp?: App }>(
  ctx: EventContext & StoreContext,
  entity: T,
  meta: DecodedMetadataObject<IAppAction>,
  validationContext: {
    ownerNonce: number | undefined
    appCommitment: string | undefined
  },
  entityMetadataProcessor: (entity: T) => Promise<T>
): Promise<T> {
  const app = await validateAndGetApp(ctx, validationContext, meta)
  if (!app) {
    return entityMetadataProcessor(entity)
  }

  integrateMeta(entity, { entryApp: app }, ['entryApp'])

  return entityMetadataProcessor(entity)
}

export async function processChannelMetadata(
  ctx: EventContext & StoreContext,
  channel: Channel,
  meta: DecodedMetadataObject<IChannelMetadata>,
  newAssets: BTreeSet<DataObjectId>
): Promise<Channel> {
  const assets = await getSortedDataObjectsByIds(ctx.store, newAssets)

  integrateMeta(channel, meta, ['title', 'description', 'isPublic'])

  await processChannelAssets(ctx, assets, channel, meta)

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
  newAssets: BTreeSet<DataObjectId>
): Promise<Video> {
  const assets = await getSortedDataObjectsByIds(ctx.store, newAssets)

  integrateMeta(video, meta, ['title', 'description', 'duration', 'hasMarketing', 'isExplicit', 'isPublic'])

  await processVideoAssets(ctx, assets, video, meta)

  // prepare video category if needed
  if (meta.category) {
    video.category = await processVideoCategory(ctx, video.category, meta.category)
    // if video has NFT assign the category to NFT too.
    if (video.nft) {
      video.nft.videoCategory = video.category
    }
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

  // prepare subtitles if needed
  const subtitles = meta.clearSubtitles ? [] : meta.subtitles
  if (isSet(subtitles)) {
    await processVideoSubtitles(ctx, video, assets, subtitles)
  }

  if (isSet(meta.publishedBeforeJoystream)) {
    video.publishedBeforeJoystream = processPublishedBeforeJoystream(
      ctx,
      video.publishedBeforeJoystream,
      meta.publishedBeforeJoystream
    )
  }

  if (isSet(meta.enableComments)) {
    video.isCommentSectionEnabled = meta.enableComments
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
      id: deterministicEntityId(event),
    })
  // integrate media encoding-related data
  integrateMeta(encoding, metadata, ['codecName', 'container', 'mimeMediaType'])
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
      id: deterministicEntityId(event),
      createdInBlock: event.blockNumber,
    })

  // integrate media-related data
  const mediaMetadata = {
    size: isSet(videoSize) ? new BN(videoSize.toString()) : undefined,
    pixelWidth: metadata.mediaPixelWidth,
    pixelHeight: metadata.mediaPixelHeight,
  }
  integrateMeta(videoMedia, mediaMetadata, ['pixelWidth', 'pixelHeight', 'size'])
  videoMedia.encoding = await processVideoMediaEncoding(ctx, videoMedia.encoding, metadata.mediaType || {})
  await store.save<VideoMediaMetadata>(videoMedia)

  return videoMedia
}

export async function convertChannelOwnerToMemberOrCuratorGroup(
  store: DatabaseManager,
  channelOwner: ChannelOwner
): Promise<{
  ownerMember?: Membership
  ownerCuratorGroup?: CuratorGroup
}> {
  if (channelOwner.isMember) {
    const member = await store.get(Membership, {
      where: { id: channelOwner.asMember.toString() },
    })

    // ensure member exists
    if (!member) {
      return inconsistentState(`Channel owner is non-existing member`, channelOwner.asMember)
    }

    return {
      ownerMember: member,
      ownerCuratorGroup: undefined,
    }
  }

  const curatorGroup = await store.get(CuratorGroup, {
    where: { id: channelOwner.asCuratorGroup.toString() },
  })

  // ensure curator group exists
  if (!curatorGroup) {
    return inconsistentState('Channel owner is non-existing curator group', channelOwner.asCuratorGroup)
  }

  return {
    ownerMember: undefined,
    ownerCuratorGroup: curatorGroup,
  }
}

export async function convertContentActorToChannelOrNftOwner(
  store: DatabaseManager,
  contentActor: ContentActor
): Promise<{
  ownerMember?: Membership
  ownerCuratorGroup?: CuratorGroup
}> {
  if (contentActor.isMember) {
    const memberId = contentActor.asMember.toNumber()
    const member = await store.get(Membership, { where: { id: memberId.toString() } })

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
      where: { id: curatorGroupId.toString() },
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

export async function convertContentActor(
  store: DatabaseManager,
  contentActor: ContentActor
): Promise<typeof ContentActorVariant> {
  if (contentActor.isMember) {
    const memberId = contentActor.asMember.toNumber()
    const member = await store.get(Membership, { where: { id: memberId.toString() } })

    // ensure member exists
    if (!member) {
      return inconsistentState(`Actor is non-existing member`, memberId)
    }

    const result = new ContentActorMember()
    result.member = member

    return result
  }

  if (contentActor.isCurator) {
    const curatorId = contentActor.asCurator[1].toNumber()
    const curator = await store.get(Curator, {
      where: { id: curatorId.toString() },
    })

    // ensure curator group exists
    if (!curator) {
      return inconsistentState('Actor is non-existing curator group', curatorId)
    }

    const result = new ContentActorCurator()
    result.curator = curator

    return result
  }

  if (contentActor.isLead) {
    return new ContentActorLead()
  }

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
    id: deterministicEntityId(event),
    iso: languageIso,
    createdInBlock: event.blockNumber,
  })

  await store.save<Language>(newLanguage)

  return newLanguage
}

async function processVideoSubtitles(
  ctx: EventContext & StoreContext,
  video: Video,
  assets: StorageDataObject[],
  subtitlesMeta: ISubtitleMetadata[]
) {
  const { store } = ctx

  const subtitlesToRemove = await store.getMany(VideoSubtitle, { where: { video: { id: video.id } } })

  for (const subtitleMeta of subtitlesMeta) {
    const subtitleId = `${video.id}-${subtitleMeta.type}-${subtitleMeta.language}`

    _.remove(subtitlesToRemove, (sub) => sub.id === subtitleId)

    const subtitle = new VideoSubtitle({
      id: subtitleId,
      type: subtitleMeta.type,
      video,
      language: await processLanguage(ctx, undefined, subtitleMeta.language),
      mimeType: subtitleMeta.mimeType,
    })

    // process subtitle assets
    await processVideoSubtitleAssets(ctx, assets, subtitle, subtitleMeta)

    await store.save<VideoSubtitle>(subtitle)
  }

  // Remove all subtitles which are not part of update
  // metadata, since we are overriding subtitles list
  for (const subToRemove of subtitlesToRemove) {
    await store.remove<VideoSubtitle>(subToRemove)
  }
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
        id: deterministicEntityId(event),
      })
    integrateMeta(license, licenseMetadata, ['attribution', 'code', 'customText'])
    await store.save<License>(license)
  }

  // Update license (and potentially remove foreign key reference)
  // FIXME: Note that we MUST to provide "null" here in order to unset a relation,
  // See: https://github.com/Joystream/hydra/issues/435
  video.license = license as License | undefined
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
  categoryId: string
): Promise<VideoCategory | undefined> {
  const { store, event } = ctx

  // load video category
  const category = await store.get(VideoCategory, {
    where: { id: categoryId.toString() },
  })

  // if category is not found, create new one
  if (!category) {
    logger.info('Creating unknown video category', { categoryId })
    const newCategory = new VideoCategory({
      id: categoryId,
      videos: [],
      nfts: [],
      createdInBlock: event.blockNumber,
      activeVideosCounter: 0,
    })
    await store.save<VideoCategory>(newCategory)
    return newCategory
  }

  return category
}

// Needs to be done every time before data object is removed!
export async function unsetAssetRelations(store: DatabaseManager, dataObject: StorageDataObject): Promise<void> {
  const channelAssets = ['avatarPhoto', 'coverPhoto'] as const
  const videoAssets = ['thumbnailPhoto', 'media'] as const
  const subtitleAssets = ['asset'] as const

  async function unconnectAsset<T extends EntityType<Channel | Video | VideoSubtitle>>(
    entity: T,
    targetAsset: string,
    relations: typeof channelAssets | typeof videoAssets | typeof subtitleAssets
  ) {
    // load video/channel
    const result = await store.get(entity, {
      where: {
        [targetAsset]: {
          id: dataObject.id,
        },
      },
      relations: [...relations],
    })

    if (!result) {
      return
    }

    // unset relation
    relations.forEach((assetName) => {
      if (result[assetName] && result[assetName]?.id === dataObject.id) {
        result[assetName] = null as any
      }
    })

    await store.save(result)

    // log event
    if (result instanceof Video) {
      logger.info('Asset has been disconnected from Video', {
        videoId: result.id.toString(),
        dataObjectId: dataObject.id,
      })
    } else if (result instanceof Channel) {
      logger.info('Asset has been disconnected from Channel', {
        channelId: result.id.toString(),
        dataObjectId: dataObject.id,
      })
    } else {
      // asset belongs to Video Subtitle
      logger.info('Asset has been disconnected from Video Subtitle', {
        subtitleId: result.id.toString(),
        dataObjectId: dataObject.id,
      })
    }
  }

  // NOTE: we don't need to retrieve multiple channels/videos via `store.getMany()` because dataObject
  // is allowed to be associated only with one channel/video in runtime

  for (const channelAsset of channelAssets) {
    await unconnectAsset(Channel, channelAsset, channelAssets)
  }

  for (const videoAsset of videoAssets) {
    await unconnectAsset(Video, videoAsset, videoAssets)
  }

  for (const subtitleAsset of subtitleAssets) {
    await unconnectAsset(VideoSubtitle, subtitleAsset, subtitleAssets)
  }

  // remove data object
  await store.remove<StorageDataObject>(dataObject)
}

export function mapAgentPermission(permission: PalletContentIterableEnumsChannelActionPermission): string {
  return permission.toString()
}

export function generateAppActionCommitment(
  nonce: number,
  creatorId: string,
  type: AppAction.ActionType,
  assets: Uint8Array,
  rawAction?: Bytes,
  rawAppActionMetadata?: Bytes
): string {
  const rawCommitment = [
    nonce,
    creatorId,
    type,
    u8aToHex(assets),
    ...(rawAction ? [u8aToHex(rawAction)] : []),
    ...(rawAppActionMetadata ? [u8aToHex(rawAppActionMetadata)] : []),
  ]
  return stringToHex(JSON.stringify(rawCommitment))
}

export function u8aToBytes(array?: DecodedMetadataObject<Uint8Array> | null): Bytes {
  return createType('Bytes', array ? u8aToHex(array as Uint8Array) : '')
}
