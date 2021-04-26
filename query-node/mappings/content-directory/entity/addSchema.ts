import { DatabaseManager as DB } from '@dzlzv/hydra-db-utils'
import { Channel } from '../../../generated/graphql-server/src/modules/channel/channel.model'
import { Category } from '../../../generated/graphql-server/src/modules/category/category.model'
import { KnownLicenseEntity } from '../../../generated/graphql-server/src/modules/known-license-entity/known-license-entity.model'
import { UserDefinedLicenseEntity } from '../../../generated/graphql-server/src/modules/user-defined-license-entity/user-defined-license-entity.model'
import { JoystreamMediaLocationEntity } from '../../../generated/graphql-server/src/modules/joystream-media-location-entity/joystream-media-location-entity.model'
import { HttpMediaLocationEntity } from '../../../generated/graphql-server/src/modules/http-media-location-entity/http-media-location-entity.model'
import { VideoMedia } from '../../../generated/graphql-server/src/modules/video-media/video-media.model'
import { Video } from '../../../generated/graphql-server/src/modules/video/video.model'
import { Language } from '../../../generated/graphql-server/src/modules/language/language.model'
import { VideoMediaEncoding } from '../../../generated/graphql-server/src/modules/video-media-encoding/video-media-encoding.model'
import { LicenseEntity } from '../../../generated/graphql-server/src/modules/license-entity/license-entity.model'
import { MediaLocationEntity } from '../../../generated/graphql-server/src/modules/media-location-entity/media-location-entity.model'
import { FeaturedVideo } from '../../../generated/graphql-server/src/modules/featured-video/featured-video.model'

import {
  ICategory,
  IChannel,
  IFeaturedVideo,
  IHttpMediaLocation,
  IJoystreamMediaLocation,
  IKnownLicense,
  ILanguage,
  ILicense,
  IMediaLocation,
  IReference,
  IUserDefinedLicense,
  IVideo,
  IVideoMedia,
  IVideoMediaEncoding,
} from '../../types'
import {
  HttpMediaLocation,
  JoystreamMediaLocation,
  KnownLicense,
  UserDefinedLicense,
} from '../../../generated/graphql-server/src/modules/variants/variants.model'

type SchemaSupport<T> = { db: DB; entityId: number; props: T; nextEntityId: number }

function getEntityIdFromRef(ref: IReference, nextEntityId: number) {
  const { entityId, existing } = ref
  return (existing ? entityId : entityId + nextEntityId).toString()
}

export async function addSchemaToChannel(param: SchemaSupport<IChannel>): Promise<void> {
  const { entityId, nextEntityId, props, db } = param
  const c = await db.get(Channel, { where: { id: entityId.toString() } })
  if (!c) throw Error(`Channel(${entityId}) has never been created!`)

  c.handle = props.handle || c.handle
  c.description = props.description || c.description
  c.isCurated = !!props.isCurated
  c.isPublic = props.isPublic || c.isPublic
  c.coverPhotoUrl = props.coverPhotoUrl || c.coverPhotoUrl
  c.avatarPhotoUrl = props.avatarPhotoUrl || c.avatarPhotoUrl

  const { language } = props
  if (language) {
    c.language = await db.get(Language, { where: { id: getEntityIdFromRef(language, nextEntityId) } })
  }
  await db.save<Channel>(c)
}

export async function addSchemaToCategory(param: SchemaSupport<ICategory>): Promise<void> {
  const { entityId, props, db } = param
  const c = await db.get(Category, { where: { id: entityId.toString() } })
  if (!c) throw Error(`Category(${entityId}) has never been created!`)

  c.name = props.name || c.name
  c.description = props.description || c.description
  await db.save<Category>(c)
}

export async function addSchemaToHttpMediaLocation(param: SchemaSupport<IHttpMediaLocation>): Promise<void> {
  const { entityId, props, db } = param
  const c = await db.get(HttpMediaLocationEntity, { where: { id: entityId.toString() } })
  if (!c) throw Error(`HttpMediaLocationEntity(${entityId}) has never been created!`)

  c.url = props.url || c.url
  c.port = props.port || c.port

  await db.save<HttpMediaLocationEntity>(c)
}

export async function addSchemaToJoystreamMediaLocation(param: SchemaSupport<IJoystreamMediaLocation>): Promise<void> {
  const { entityId, props, db } = param
  const j = await db.get(JoystreamMediaLocationEntity, { where: { id: entityId.toString() } })
  if (!j) throw Error(`JoystreamMediaLocationEntity(${entityId}) has never been created!`)

  j.dataObjectId = props.dataObjectId || j.dataObjectId
  await db.save<JoystreamMediaLocationEntity>(j)
}

export async function addSchemaToKnownLicense(param: SchemaSupport<IKnownLicense>): Promise<void> {
  const { entityId, props, db } = param
  const k = await db.get(KnownLicenseEntity, { where: { id: entityId.toString() } })
  if (!k) throw Error(`KnownLicenseEntity(${entityId}) has never been created!`)

  k.code = props.code || k.code
  k.description = props.description || k.description
  k.name = props.name || k.name
  k.url = props.url || k.url

  await db.save<KnownLicenseEntity>(k)
}

export async function addSchemaToLanguage(param: SchemaSupport<ILanguage>): Promise<void> {
  const { entityId, props, db } = param
  const l = await db.get(Language, { where: { id: entityId.toString() } })
  if (!l) throw Error(`Language(${entityId}) has never been created!`)

  l.code = props.code || l.code
  l.name = props.name || l.name

  await db.save<Language>(l)
}

export async function addSchemaToLicense(param: SchemaSupport<ILicense>): Promise<void> {
  const { entityId, props, db, nextEntityId } = param
  const l = await db.get(LicenseEntity, { where: { id: entityId.toString() } })
  if (!l) throw Error(`LicenseEntity(${entityId}) has never been created!`)

  const { knownLicense, userDefinedLicense } = props

  let licenseEntityId

  if (knownLicense) {
    licenseEntityId = getEntityIdFromRef(knownLicense, nextEntityId)
    const k = await db.get(KnownLicenseEntity, { where: { id: licenseEntityId } })
    if (!k) throw Error(`KnownLicenseEntity(${licenseEntityId}) not found`)

    const licenseType = new KnownLicense()
    licenseType.code = k.code
    licenseType.description = k.description
    licenseType.name = k.name
    licenseType.url = k.url
    l.type = licenseType
  }

  if (userDefinedLicense) {
    licenseEntityId = getEntityIdFromRef(userDefinedLicense, nextEntityId)
    const u = await db.get(UserDefinedLicenseEntity, {
      where: { id: licenseEntityId },
    })
    if (!u) throw Error(`UserDefinedLicenseEntity(${licenseEntityId}) not found`)
    const licenseType = new UserDefinedLicense()
    licenseType.content = u.content
    l.type = licenseType
  }

  l.attribution = props.attribution || l.attribution
  await db.save<LicenseEntity>(l)
}

export async function addSchemaToMediaLocation(param: SchemaSupport<IMediaLocation>): Promise<void> {
  const { entityId, props, db, nextEntityId } = param
  const m = await db.get(MediaLocationEntity, { where: { id: entityId.toString() } })
  if (!m) throw Error(`MediaLocationEntity(${entityId}) has never been created!`)

  const { httpMediaLocation, joystreamMediaLocation } = props

  if (httpMediaLocation) {
    m.httpMediaLocation =
      (await db.get(HttpMediaLocationEntity, {
        where: { id: getEntityIdFromRef(httpMediaLocation, nextEntityId) },
      })) || m.httpMediaLocation
  }
  if (joystreamMediaLocation) {
    m.joystreamMediaLocation =
      (await db.get(JoystreamMediaLocationEntity, {
        where: { id: getEntityIdFromRef(joystreamMediaLocation, nextEntityId) },
      })) || m.joystreamMediaLocation
  }
  await db.save<MediaLocationEntity>(m)
}

export async function addSchemaToUserDefinedLicense(param: SchemaSupport<IUserDefinedLicense>): Promise<void> {
  const { entityId, props, db } = param
  const u = await db.get(UserDefinedLicenseEntity, { where: { id: entityId.toString() } })
  if (!u) throw Error(`UserDefinedLicenseEntity(${entityId}) has never been created!`)

  u.content = props.content || u.content
  await db.save<UserDefinedLicenseEntity>(u)
}

export async function addSchemaToVideoMedia(param: SchemaSupport<IVideoMedia>): Promise<void> {
  const { entityId, props, db, nextEntityId } = param
  const v = await db.get(VideoMedia, { where: { id: entityId.toString() } })
  if (!v) throw Error(`VideoMedia(${entityId}) has never been created!`)

  v.pixelHeight = props.pixelHeight || v.pixelHeight
  v.pixelWidth = props.pixelWidth || v.pixelWidth
  v.size = props.size || v.size

  const { location, encoding } = props

  if (encoding) {
    const encodingId = getEntityIdFromRef(encoding, nextEntityId)
    const encod = await db.get(VideoMediaEncoding, { where: { id: encodingId } })
    if (!encod) throw Error(`VideoMediaEncoding(${encodingId}) has never been created!`)
    v.encoding = encod
  }

  if (location) {
    const mediaLocation = await db.get(MediaLocationEntity, {
      where: { id: getEntityIdFromRef(location, nextEntityId) },
      relations: ['httpMediaLocation', 'joystreamMediaLocation'],
    })
    v.locationEntity = mediaLocation

    if (mediaLocation) {
      const { httpMediaLocation, joystreamMediaLocation } = mediaLocation
      if (httpMediaLocation) {
        const mediaLoc = new HttpMediaLocation()
        mediaLoc.port = httpMediaLocation.port
        mediaLoc.url = httpMediaLocation.url
        v.location = mediaLoc
      }
      if (joystreamMediaLocation) {
        const mediaLoc = new JoystreamMediaLocation()
        mediaLoc.dataObjectId = joystreamMediaLocation.dataObjectId
        v.location = mediaLoc
      }
    }
  }
  await db.save<VideoMedia>(v)
}

export async function addSchemaToVideoMediaEncoding(param: SchemaSupport<IVideoMediaEncoding>): Promise<void> {
  const { entityId, props, db } = param
  const e = await db.get(VideoMediaEncoding, { where: { id: entityId.toString() } })
  if (!e) throw Error(`VideoMediaEncoding(${entityId}) has never been created!`)

  e.name = props.name || e.name
  await db.save<VideoMediaEncoding>(e)
}

export async function addSchemaToFeaturedVideo(param: SchemaSupport<IFeaturedVideo>): Promise<void> {
  const { entityId, props, db, nextEntityId } = param
  const f = await db.get(FeaturedVideo, { where: { id: entityId.toString() } })
  if (!f) throw Error(`FeaturedVideo(${entityId}) has never been created!`)

  if (props.video) {
    const videoId = getEntityIdFromRef(props.video, nextEntityId)
    const v = await db.get(Video, { where: { id: videoId } })
    if (!v) throw Error(`Video(${videoId}) has never been created!`)
    f.video = v
  }
  await db.save<FeaturedVideo>(f)
}

export async function addSchemaToVideo(param: SchemaSupport<IVideo>): Promise<void> {
  const { entityId, nextEntityId, props, db } = param

  const v = await db.get(Video, { where: { id: entityId.toString() } })
  if (!v) throw Error(`Video(${entityId}) has never been created!`)

  v.title = props.title || v.title
  v.description = props.description || v.description
  v.duration = props.duration || v.duration
  v.hasMarketing = props.hasMarketing || v.hasMarketing
  v.isCurated = !!props.isCurated
  v.isExplicit = props.isExplicit || v.isExplicit
  v.isPublic = props.isPublic || v.isPublic
  v.publishedBeforeJoystream = props.publishedBeforeJoystream || v.publishedBeforeJoystream
  v.skippableIntroDuration = props.skippableIntroDuration || v.skippableIntroDuration
  v.thumbnailUrl = props.thumbnailUrl || v.thumbnailUrl
  v.isFeatured = !!v.isFeatured

  const { language, license, category, channel, media } = props

  if (language) {
    v.language = await db.get(Language, { where: { id: getEntityIdFromRef(language, nextEntityId) } })
  }
  if (license) {
    const licenseId = getEntityIdFromRef(license, nextEntityId)
    const l = await db.get(LicenseEntity, { where: { id: licenseId } })
    if (!l) throw Error(`LicenseEntity(${licenseId}) has never been created!`)
    v.license = l
  }
  if (category) {
    const categoryId = getEntityIdFromRef(category, nextEntityId)
    const c = await db.get(Category, { where: { id: categoryId } })
    if (!c) throw Error(`Category(${categoryId}) has never been created!`)
    v.category = c
  }
  if (channel) {
    const channelId = getEntityIdFromRef(channel, nextEntityId)
    const c = await db.get(Channel, { where: { id: channelId } })
    if (!c) throw Error(`Channel(${channelId}) has never been created!`)
    v.channel = c
  }
  if (media) {
    v.media = await db.get(VideoMedia, { where: { id: getEntityIdFromRef(media, nextEntityId) } })
  }
  /* eslint-enable @typescript-eslint/no-non-null-assertion */
  await db.save<Video>(v)
}
