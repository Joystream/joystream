import { DB } from '../../../generated/indexer'
import { Channel } from '../../../generated/graphql-server/src/modules/channel/channel.model'
import { Category } from '../../../generated/graphql-server/src/modules/category/category.model'
import { KnownLicenseEntity } from '../../../generated/graphql-server/src/modules/known-license-entity/known-license-entity.model'
import { UserDefinedLicenseEntity } from '../../../generated/graphql-server/src/modules/user-defined-license-entity/user-defined-license-entity.model'
import { VideoMedia } from '../../../generated/graphql-server/src/modules/video-media/video-media.model'
import { Video } from '../../../generated/graphql-server/src/modules/video/video.model'
import { Language } from '../../../generated/graphql-server/src/modules/language/language.model'
import { VideoMediaEncoding } from '../../../generated/graphql-server/src/modules/video-media-encoding/video-media-encoding.model'
import { LicenseEntity } from '../../../generated/graphql-server/src/modules/license-entity/license-entity.model'
import { MediaLocationEntity } from '../../../generated/graphql-server/src/modules/media-location-entity/media-location-entity.model'
import { HttpMediaLocationEntity } from '../../../generated/graphql-server/src/modules/http-media-location-entity/http-media-location-entity.model'
import { JoystreamMediaLocationEntity } from '../../../generated/graphql-server/src/modules/joystream-media-location-entity/joystream-media-location-entity.model'
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
  IWhereCond,
} from '../../types'
import {
  HttpMediaLocation,
  JoystreamMediaLocation,
  KnownLicense,
  UserDefinedLicense,
} from '../../../generated/graphql-server/src/modules/variants/variants.model'

function getEntityIdFromReferencedField(ref: IReference, entityIdBeforeTransaction: number): string {
  const { entityId, existing } = ref
  const id = existing ? entityId : entityIdBeforeTransaction + entityId
  return id.toString()
}

async function updateMediaLocationEntityPropertyValues(
  db: DB,
  where: IWhereCond,
  props: IMediaLocation,
  entityIdBeforeTransaction: number
): Promise<void> {
  const { httpMediaLocation, joystreamMediaLocation } = props
  const record = await db.get(MediaLocationEntity, where)
  if (record === undefined) throw Error(`MediaLocation entity not found: ${where.where.id}`)

  if (httpMediaLocation) {
    const id = getEntityIdFromReferencedField(httpMediaLocation, entityIdBeforeTransaction)
    record.httpMediaLocation = await db.get(HttpMediaLocationEntity, { where: { id } })
  }
  if (joystreamMediaLocation) {
    const id = getEntityIdFromReferencedField(joystreamMediaLocation, entityIdBeforeTransaction)
    record.joystreamMediaLocation = await db.get(JoystreamMediaLocationEntity, { where: { id } })
  }
  await db.save<MediaLocationEntity>(record)
}

async function updateLicenseEntityPropertyValues(
  db: DB,
  where: IWhereCond,
  props: ILicense,
  entityIdBeforeTransaction: number
): Promise<void> {
  const record = await db.get(LicenseEntity, where)
  if (record === undefined) throw Error(`License entity not found: ${where.where.id}`)

  const { knownLicense, userDefinedLicense } = props
  if (knownLicense) {
    const id = getEntityIdFromReferencedField(knownLicense, entityIdBeforeTransaction)
    const kLicense = await db.get(KnownLicenseEntity, { where: { id } })
    if (!kLicense) throw Error(`KnownLicense not found ${id}`)

    const k = new KnownLicense()
    k.code = kLicense.code
    k.description = kLicense.description
    k.name = kLicense.name
    k.url = kLicense.url
    // Set the license type
    record.type = k
  }
  if (userDefinedLicense) {
    const id = getEntityIdFromReferencedField(userDefinedLicense, entityIdBeforeTransaction)
    const udl = await db.get(UserDefinedLicenseEntity, { where: { id } })
    if (!udl) throw Error(`UserDefinedLicense not found ${id}`)

    const u = new UserDefinedLicense()
    u.content = udl.content
    // Set the license type
    record.type = u
  }

  record.attribution = props.attribution || record.attribution
  await db.save<LicenseEntity>(record)
}

async function updateCategoryEntityPropertyValues(db: DB, where: IWhereCond, props: ICategory): Promise<void> {
  const record = await db.get(Category, where)
  if (record === undefined) throw Error(`Entity not found: ${where.where.id}`)
  Object.assign(record, props)
  await db.save<Category>(record)
}

async function updateChannelEntityPropertyValues(
  db: DB,
  where: IWhereCond,
  props: IChannel,
  entityIdBeforeTransaction: number
): Promise<void> {
  const record = await db.get(Channel, where)
  if (record === undefined) throw Error(`Entity not found: ${where.where.id}`)

  let lang: Language | undefined = record.language
  if (props.language) {
    const id = getEntityIdFromReferencedField(props.language, entityIdBeforeTransaction)
    lang = await db.get(Language, { where: { id } })
    if (lang === undefined) throw Error(`Language entity not found: ${id}`)
    props.language = undefined
  }
  Object.assign(record, props)

  record.language = lang
  await db.save<Channel>(record)
}

async function updateVideoMediaEntityPropertyValues(
  db: DB,
  where: IWhereCond,
  props: IVideoMedia,
  entityIdBeforeTransaction: number
): Promise<void> {
  const record = await db.get(VideoMedia, where)
  if (record === undefined) throw Error(`Entity not found: ${where.where.id}`)

  let enco: VideoMediaEncoding | undefined
  let mediaLoc: HttpMediaLocation | JoystreamMediaLocation = record.location
  const { encoding, location } = props
  if (encoding) {
    const id = getEntityIdFromReferencedField(encoding, entityIdBeforeTransaction)
    enco = await db.get(VideoMediaEncoding, { where: { id } })
    if (enco === undefined) throw Error(`VideoMediaEncoding entity not found: ${id}`)
    props.encoding = undefined
  }

  if (location) {
    const id = getEntityIdFromReferencedField(location, entityIdBeforeTransaction)
    const mLoc = await db.get(MediaLocationEntity, { where: { id } })
    if (!mLoc) throw Error(`MediaLocation entity not found: ${id}`)
    const { httpMediaLocation, joystreamMediaLocation } = mLoc

    if (httpMediaLocation) {
      mediaLoc = new HttpMediaLocation()
      mediaLoc.url = httpMediaLocation.url
      mediaLoc.port = httpMediaLocation.port
    }
    if (joystreamMediaLocation) {
      mediaLoc = new JoystreamMediaLocation()
      mediaLoc.dataObjectId = joystreamMediaLocation.dataObjectId
    }
    props.location = undefined
  }
  Object.assign(record, props)

  record.encoding = enco || record.encoding
  record.location = mediaLoc
  await db.save<VideoMedia>(record)
}

async function updateVideoEntityPropertyValues(
  db: DB,
  where: IWhereCond,
  props: IVideo,
  entityIdBeforeTransaction: number
): Promise<void> {
  const record = await db.get<Video>(Video, where)
  if (record === undefined) throw Error(`Entity not found: ${where.where.id}`)

  let chann: Channel | undefined
  let cat: Category | undefined
  let lang: Language | undefined
  let vMedia: VideoMedia | undefined

  const { channel, category, language, media, license } = props
  if (channel) {
    const id = getEntityIdFromReferencedField(channel, entityIdBeforeTransaction)
    chann = await db.get(Channel, { where: { id } })
    if (!chann) throw Error(`Channel entity not found: ${id}`)
    props.channel = undefined
  }
  if (category) {
    const id = getEntityIdFromReferencedField(category, entityIdBeforeTransaction)
    cat = await db.get(Category, { where: { id } })
    if (!cat) throw Error(`Category entity not found: ${id}`)
    props.category = undefined
  }
  if (media) {
    const id = getEntityIdFromReferencedField(media, entityIdBeforeTransaction)
    vMedia = await db.get(VideoMedia, { where: { id } })
    if (!vMedia) throw Error(`VideoMedia entity not found: ${id}`)
    props.media = undefined
  }
  if (license) {
    const id = getEntityIdFromReferencedField(license, entityIdBeforeTransaction)
    const licenseEntity = await db.get(LicenseEntity, { where: { id } })
    if (!licenseEntity) throw Error(`License entity not found: ${id}`)
    record.license = licenseEntity
    props.license = undefined
  }
  if (language) {
    const id = getEntityIdFromReferencedField(language, entityIdBeforeTransaction)
    lang = await db.get(Language, { where: { id } })
    if (!lang) throw Error(`Language entity not found: ${id}`)
    props.language = undefined
  }

  Object.assign(record, props)

  record.channel = chann || record.channel
  record.category = cat || record.category
  record.media = vMedia || record.media
  record.language = lang

  await db.save<Video>(record)
}

async function updateUserDefinedLicenseEntityPropertyValues(
  db: DB,
  where: IWhereCond,
  props: IUserDefinedLicense
): Promise<void> {
  const record = await db.get(UserDefinedLicenseEntity, where)
  if (record === undefined) throw Error(`Entity not found: ${where.where.id}`)
  Object.assign(record, props)
  await db.save<UserDefinedLicenseEntity>(record)
}

async function updateKnownLicenseEntityPropertyValues(db: DB, where: IWhereCond, props: IKnownLicense): Promise<void> {
  const record = await db.get(KnownLicenseEntity, where)
  if (record === undefined) throw Error(`Entity not found: ${where.where.id}`)
  Object.assign(record, props)
  await db.save<KnownLicenseEntity>(record)
}

async function updateHttpMediaLocationEntityPropertyValues(
  db: DB,
  where: IWhereCond,
  props: IHttpMediaLocation
): Promise<void> {
  const record = await db.get(HttpMediaLocationEntity, where)
  if (record === undefined) throw Error(`Entity not found: ${where.where.id}`)
  Object.assign(record, props)
  await db.save<HttpMediaLocationEntity>(record)
}

async function updateJoystreamMediaLocationEntityPropertyValues(
  db: DB,
  where: IWhereCond,
  props: IJoystreamMediaLocation
): Promise<void> {
  const record = await db.get(JoystreamMediaLocationEntity, where)
  if (record === undefined) throw Error(`Entity not found: ${where.where.id}`)
  Object.assign(record, props)
  await db.save<JoystreamMediaLocationEntity>(record)
}

async function updateLanguageEntityPropertyValues(db: DB, where: IWhereCond, props: ILanguage): Promise<void> {
  const record = await db.get(Language, where)
  if (record === undefined) throw Error(`Entity not found: ${where.where.id}`)
  Object.assign(record, props)
  await db.save<Language>(record)
}

async function updateVideoMediaEncodingEntityPropertyValues(
  db: DB,
  where: IWhereCond,
  props: IVideoMediaEncoding
): Promise<void> {
  const record = await db.get(VideoMediaEncoding, where)
  if (record === undefined) throw Error(`Entity not found: ${where.where.id}`)
  Object.assign(record, props)
  await db.save<VideoMediaEncoding>(record)
}

async function updateFeaturedVideoEntityPropertyValues(
  db: DB,
  where: IWhereCond,
  props: IFeaturedVideo,
  entityIdBeforeTransaction: number
): Promise<void> {
  const record = await db.get(FeaturedVideo, { ...where, relations: ['video'] })
  if (record === undefined) throw Error(`FeaturedVideo entity not found: ${where.where.id}`)

  if (props.video) {
    const id = getEntityIdFromReferencedField(props.video, entityIdBeforeTransaction)
    const video = await db.get(Video, { where: { id } })
    if (!video) throw Error(`Video entity not found: ${id}`)

    // Update old video isFeatured to false
    record.video.isFeatured = false
    await db.save<Video>(record.video)

    video.isFeatured = true
    record.video = video

    await db.save<Video>(video)
    await db.save<FeaturedVideo>(record)
  }
}

export {
  updateCategoryEntityPropertyValues,
  updateChannelEntityPropertyValues,
  updateVideoMediaEntityPropertyValues,
  updateVideoEntityPropertyValues,
  updateUserDefinedLicenseEntityPropertyValues,
  updateHttpMediaLocationEntityPropertyValues,
  updateJoystreamMediaLocationEntityPropertyValues,
  updateKnownLicenseEntityPropertyValues,
  updateLanguageEntityPropertyValues,
  updateVideoMediaEncodingEntityPropertyValues,
  updateLicenseEntityPropertyValues,
  updateMediaLocationEntityPropertyValues,
  updateFeaturedVideoEntityPropertyValues,
}
