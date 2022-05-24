import { DatabaseManager, EventContext, StoreContext } from '@joystream/hydra-common'
import { FindConditions } from 'typeorm'
import {
  IVideoMetadata,
  IPublishedBeforeJoystream,
  ILicense,
  IMediaType,
  IChannelMetadata,
  IPlaylistMetadata,
} from '@joystream/metadata-protobuf'
import { integrateMeta, isSet, isValidLanguageCode } from '@joystream/metadata-protobuf/utils'
import { invalidMetadata, inconsistentState, logger, deterministicEntityId } from '../common'
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
  ContentActorLead,
  ContentActorCurator,
  ContentActorMember,
  ContentActor as ContentActorVariant,
  Curator,
  Playlist,
  DataObjectTypePlaylistThumbnail,
  PlaylistVideo,
} from 'query-node/dist/model'
// Joystream types
import { ContentActor, StorageAssets } from '@joystream/types/augment'
import { DecodedMetadataObject } from '@joystream/metadata-protobuf/types'
import BN from 'bn.js'
import { getMostRecentlyCreatedDataObjects } from '../storage/utils'
import { VideoId } from '@joystream/types/content'
import _ from 'lodash'

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
  playlist: [
    {
      DataObjectTypeConstructor: DataObjectTypePlaylistThumbnail,
      metaFieldName: 'thumbnailPhoto',
      schemaFieldName: 'thumbnailPhoto',
    },
  ],
} as const

// all relations that need to be loaded for full evalution of video active status to work
export const videoRelationsForCounters = ['channel', 'channel.category', 'category', 'thumbnailPhoto', 'media']

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

async function processPlaylistAssets(
  { event, store }: EventContext & StoreContext,
  assets: StorageDataObject[],
  playlist: Playlist,
  meta: DecodedMetadataObject<IPlaylistMetadata>
) {
  await Promise.all(
    ASSET_TYPES.playlist.map(async ({ metaFieldName, schemaFieldName, DataObjectTypeConstructor }) => {
      const newAssetIndex = meta[metaFieldName]
      const currentAsset = playlist[schemaFieldName]
      if (isSet(newAssetIndex)) {
        const asset = findAssetByIndex(assets, newAssetIndex)
        if (asset) {
          if (currentAsset) {
            currentAsset.unsetAt = new Date(event.blockTimestamp)
            await store.save<StorageDataObject>(currentAsset)
          }
          const dataObjectType = new DataObjectTypeConstructor()
          dataObjectType.playlistId = playlist.id
          asset.type = dataObjectType
          playlist[schemaFieldName] = asset
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
  const { store } = ctx
  const assets = assetsParams ? await processNewAssets(ctx, assetsParams) : []

  integrateMeta(video, meta, ['title', 'description', 'duration', 'hasMarketing', 'isExplicit', 'isPublic'])

  await processVideoAssets(ctx, assets, video, meta)

  if (isSet(meta.thumbnailPhoto)) {
    // If this video is first video in Playlist/s, and video thumbnail
    //  gets changed, update the thumbnail of all those Playlist/s
    const asFirstVideoInPlaylists = await store.getMany<PlaylistVideo>(PlaylistVideo, {
      where: { video: { id: video.id }, position: 0 },
      relations: ['playlist'],
    })

    asFirstVideoInPlaylists.forEach(async ({ playlist }) => {
      playlist.thumbnailPhoto = video.thumbnailPhoto
      await store.save<Playlist>(playlist)
    })
  }

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

export async function processPlaylistMetadata(
  ctx: EventContext & StoreContext,
  playlist: Playlist,
  meta: DecodedMetadataObject<IPlaylistMetadata>,
  assetsParams?: StorageAssets
): Promise<Playlist> {
  const { store } = ctx
  const assets = assetsParams ? await processNewAssets(ctx, assetsParams) : []

  integrateMeta(playlist, meta, ['title', 'description', 'isPublic'])

  await processPlaylistAssets(ctx, assets, playlist, meta)

  if (meta.videoIds) {
    playlist.videos = await processPlaylistVideos(store, playlist, meta)
    playlist.publicUncensoredVideosCount = _.sumBy(playlist.videos, ({ video }) => Number(!video.isCensored))
    playlist.publicUncensoredVideosDuration = _.sumBy(playlist.videos, ({ video }) => video.duration || 0)
  }

  return playlist
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
      createdAt: new Date(event.blockTimestamp),
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
      id: deterministicEntityId(event),
      createdInBlock: event.blockNumber,
      createdAt: new Date(event.blockTimestamp),
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

export async function convertContentActorToChannelOrNftOwner(
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

export async function convertContentActor(
  store: DatabaseManager,
  contentActor: ContentActor
): Promise<typeof ContentActorVariant> {
  if (contentActor.isMember) {
    const memberId = contentActor.asMember.toNumber()
    const member = await store.get(Membership, { where: { id: memberId.toString() } as FindConditions<Membership> })

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
      where: { id: curatorId.toString() } as FindConditions<Curator>,
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
    id: deterministicEntityId(event),
    iso: languageIso,
    createdInBlock: event.blockNumber,
    createdAt: new Date(event.blockTimestamp),
    updatedAt: new Date(event.blockTimestamp),
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
        id: deterministicEntityId(event),
        createdAt: new Date(event.blockTimestamp),
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
  const playlistAssets = ['thumbnailPhoto'] as const

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
    relations: [...videoRelationsForCounters],
  })
  const playlist = await store.get(Playlist, {
    where: playlistAssets.map((assetName) => ({
      [assetName]: {
        id: dataObject.id,
      },
    })),
    relations: [...playlistAssets],
  })

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

    // emit log event
    logger.info('Content has been disconnected from Video', {
      videoId: video.id.toString(),
      dataObjectId: dataObject.id,
    })
  }

  if (playlist) {
    playlistAssets.forEach((assetName) => {
      if (playlist[assetName] && playlist[assetName]?.id === dataObject.id) {
        playlist[assetName] = null as any
      }
    })
    await store.save<Playlist>(playlist)

    // emit log event
    logger.info('Content has been disconnected from Playlist', {
      playlistId: playlist.id.toString(),
      dataObjectId: dataObject.id,
    })
  }

  // remove data object
  await store.remove<StorageDataObject>(dataObject)
}

export async function processPlaylistVideos(
  store: DatabaseManager,
  playlist: Playlist,
  meta: DecodedMetadataObject<IPlaylistMetadata>
): Promise<PlaylistVideo[]> {
  const { videoIds, thumbnailPhoto: thumbnailPhotoIndex } = meta

  const videos = (
    await Promise.all(
      videoIds!.map((videoId) => store.get(Video, { where: { id: videoId }, relations: ['thumbnailPhoto'] }))
    )
  ).filter((video, i) => {
    if (!video) {
      invalidMetadata('Non-existing video requested to be the part of playlist', videoIds![i])
    }
    return video !== undefined
  }) as Video[]

  // set thumbnail of first video as playlist thumbnail if its not already set
  if (thumbnailPhotoIndex === null || thumbnailPhotoIndex === undefined) {
    playlist.thumbnailPhoto = videos[0].thumbnailPhoto
  }

  // save playlist; playlist record should exist in DB
  // before creating PlaylistVideo<->Playlist relation
  await store.save<Playlist>(playlist)

  const playlistVideos = await Promise.all(
    videos.map(async (video, i) => {
      const v = new PlaylistVideo({
        id: `${playlist.id}-${video.id}`,
        video,
        playlist,
        position: i,
      })

      await store.save<PlaylistVideo>(v)
      return v
    })
  )

  return playlistVideos
}
