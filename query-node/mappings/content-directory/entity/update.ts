import { DB } from '../../../generated/indexer'
import { Channel } from '../../../generated/graphql-server/src/modules/channel/channel.model'
import { Category } from '../../../generated/graphql-server/src/modules/category/category.model'
import { KnownLicense } from '../../../generated/graphql-server/src/modules/known-license/known-license.model'
import { UserDefinedLicense } from '../../../generated/graphql-server/src/modules/user-defined-license/user-defined-license.model'
import { JoystreamMediaLocation } from '../../../generated/graphql-server/src/modules/joystream-media-location/joystream-media-location.model'
import { HttpMediaLocation } from '../../../generated/graphql-server/src/modules/http-media-location/http-media-location.model'
import { VideoMedia } from '../../../generated/graphql-server/src/modules/video-media/video-media.model'
import { Video } from '../../../generated/graphql-server/src/modules/video/video.model'
import { Language } from '../../../generated/graphql-server/src/modules/language/language.model'
import { VideoMediaEncoding } from '../../../generated/graphql-server/src/modules/video-media-encoding/video-media-encoding.model'
import { License } from '../../../generated/graphql-server/src/modules/license/license.model'
import { MediaLocation } from '../../../generated/graphql-server/src/modules/media-location/media-location.model'

import {
  ICategory,
  IChannel,
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
  const record = await db.get(MediaLocation, where)
  if (record === undefined) throw Error(`MediaLocation entity not found: ${where.where.id}`)

  if (httpMediaLocation) {
    const id = getEntityIdFromReferencedField(httpMediaLocation, entityIdBeforeTransaction)
    record.httpMediaLocation = await db.get(HttpMediaLocation, { where: { id } })
  }
  if (joystreamMediaLocation) {
    const id = getEntityIdFromReferencedField(joystreamMediaLocation, entityIdBeforeTransaction)
    record.joystreamMediaLocation = await db.get(JoystreamMediaLocation, { where: { id } })
  }
  await db.save<MediaLocation>(record)
}

async function updateLicenseEntityPropertyValues(
  db: DB,
  where: IWhereCond,
  props: ILicense,
  entityIdBeforeTransaction: number
): Promise<void> {
  const record = await db.get(License, where)
  if (record === undefined) throw Error(`License entity not found: ${where.where.id}`)

  const { knownLicense, userDefinedLicense } = props
  if (knownLicense) {
    const id = getEntityIdFromReferencedField(knownLicense, entityIdBeforeTransaction)
    record.knownLicense = await db.get(KnownLicense, { where: { id } })
  }
  if (userDefinedLicense) {
    const id = getEntityIdFromReferencedField(userDefinedLicense, entityIdBeforeTransaction)
    record.userdefinedLicense = await db.get(UserDefinedLicense, { where: { id } })
  }
  await db.save<License>(record)
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

  let lang: Language | undefined
  if (props.language !== undefined) {
    const id = getEntityIdFromReferencedField(props.language, entityIdBeforeTransaction)
    lang = await db.get(Language, { where: { id } })
    if (lang === undefined) throw Error(`Language entity not found: ${id}`)
    props.language = undefined
  }
  Object.assign(record, props)

  record.language = lang || record.language
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
  let mediaLoc: MediaLocation | undefined
  const { encoding, location } = props
  if (encoding) {
    const id = getEntityIdFromReferencedField(encoding, entityIdBeforeTransaction)
    enco = await db.get(VideoMediaEncoding, { where: { id } })
    if (enco === undefined) throw Error(`VideoMediaEncoding entity not found: ${id}`)
    props.encoding = undefined
  }
  if (location) {
    const id = getEntityIdFromReferencedField(location, entityIdBeforeTransaction)
    mediaLoc = await db.get(MediaLocation, { where: { id } })
    if (!mediaLoc) throw Error(`MediaLocation entity not found: ${id}`)
    props.location = undefined
  }
  Object.assign(record, props)

  record.encoding = enco || record.encoding
  record.location = mediaLoc || record.location
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
  let lic: License | undefined
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
    lic = await db.get(License, { where: { id } })
    if (!lic) throw Error(`License entity not found: ${id}`)
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
  record.license = lic || record.license
  record.language = lang

  await db.save<Video>(record)
}
async function updateUserDefinedLicenseEntityPropertyValues(
  db: DB,
  where: IWhereCond,
  props: IUserDefinedLicense
): Promise<void> {
  const record = await db.get(UserDefinedLicense, where)
  if (record === undefined) throw Error(`Entity not found: ${where.where.id}`)
  Object.assign(record, props)
  await db.save<UserDefinedLicense>(record)
}
async function updateKnownLicenseEntityPropertyValues(db: DB, where: IWhereCond, props: IKnownLicense): Promise<void> {
  const record = await db.get(KnownLicense, where)
  if (record === undefined) throw Error(`Entity not found: ${where.where.id}`)
  Object.assign(record, props)
  await db.save<KnownLicense>(record)
}
async function updateHttpMediaLocationEntityPropertyValues(
  db: DB,
  where: IWhereCond,
  props: IHttpMediaLocation
): Promise<void> {
  const record = await db.get(HttpMediaLocation, where)
  if (record === undefined) throw Error(`Entity not found: ${where.where.id}`)
  Object.assign(record, props)
  await db.save<HttpMediaLocation>(record)
}

async function updateJoystreamMediaLocationEntityPropertyValues(
  db: DB,
  where: IWhereCond,
  props: IJoystreamMediaLocation
): Promise<void> {
  const record = await db.get(JoystreamMediaLocation, where)
  if (record === undefined) throw Error(`Entity not found: ${where.where.id}`)
  Object.assign(record, props)
  await db.save<JoystreamMediaLocation>(record)
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
}
