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
  IUserDefinedLicense,
  IVideo,
  IVideoMedia,
  IVideoMediaEncoding,
  IWhereCond,
} from '../../types'

// ========Entity property value updates========

async function updateMediaLocationEntityPropertyValues(
  db: DB,
  where: IWhereCond,
  props: IMediaLocation
): Promise<void> {
  const { httpMediaLocation, joystreamMediaLocation } = props
  const record = await db.get(MediaLocation, where)
  if (record === undefined) throw Error(`MediaLocation entity not found: ${where.where.id}`)

  if (httpMediaLocation) {
    record.httpMediaLocation = await db.get(HttpMediaLocation, { where: { id: httpMediaLocation.toString() } })
  }
  if (joystreamMediaLocation) {
    record.joystreamMediaLocation = await db.get(JoystreamMediaLocation, {
      where: { id: joystreamMediaLocation.toString() },
    })
  }
  await db.save<MediaLocation>(record)
}

async function updateLicenseEntityPropertyValues(db: DB, where: IWhereCond, props: ILicense): Promise<void> {
  const { knownLicense, userDefinedLicense } = props
  const record = await db.get(License, where)
  if (record === undefined) throw Error(`License entity not found: ${where.where.id}`)

  if (knownLicense) {
    record.knownLicense = await db.get(KnownLicense, { where: { id: knownLicense.toString() } })
  }
  if (userDefinedLicense) {
    record.userdefinedLicense = await db.get(UserDefinedLicense, {
      where: { id: userDefinedLicense.toString() },
    })
  }
  await db.save<License>(record)
}

async function updateCategoryEntityPropertyValues(db: DB, where: IWhereCond, props: ICategory): Promise<void> {
  const record = await db.get(Category, where)
  if (record === undefined) throw Error(`Entity not found: ${where.where.id}`)
  Object.assign(record, props)
  await db.save<Category>(record)
}
async function updateChannelEntityPropertyValues(db: DB, where: IWhereCond, props: IChannel): Promise<void> {
  const record = await db.get(Channel, where)
  if (record === undefined) throw Error(`Entity not found: ${where.where.id}`)
  if (props.language) {
    const l = await db.get(Language, { where: { id: props.language.toString() } })
    if (l === undefined) throw Error(`Language entity not found: ${props.language}`)
    record.language = l
    props.language = undefined
  }
  Object.assign(record, props)
  await db.save<Channel>(record)
}
async function updateVideoMediaEntityPropertyValues(db: DB, where: IWhereCond, props: IVideoMedia): Promise<void> {
  const record = await db.get(VideoMedia, where)
  if (record === undefined) throw Error(`Entity not found: ${where.where.id}`)

  const { encoding, location } = props
  if (encoding) {
    const e = await db.get(VideoMediaEncoding, { where: { id: encoding.toString() } })
    if (e === undefined) throw Error(`VideoMediaEncoding entity not found: ${encoding}`)
    record.encoding = e
    props.encoding = undefined
  }
  if (location) {
    const mediaLoc = await db.get(MediaLocation, { where: { id: location.toString() } })
    if (!mediaLoc) throw Error(`MediaLocation entity not found: ${location}`)
    record.location = mediaLoc
    props.location = undefined
  }
  Object.assign(record, props)
  await db.save<VideoMedia>(record)
}
async function updateVideoEntityPropertyValues(db: DB, where: IWhereCond, props: IVideo): Promise<void> {
  const record = await db.get<Video>(Video, where)
  if (record === undefined) throw Error(`Entity not found: ${where.where.id}`)

  const { channel, category, language, media, license } = props
  if (channel) {
    const c = await db.get(Channel, { where: { id: channel.toString() } })
    if (c === undefined) throw Error(`Channel entity not found: ${channel}`)
    record.channel = c
    props.channel = undefined
  }
  if (category) {
    const c = await db.get(Category, { where: { id: category.toString() } })
    if (c === undefined) throw Error(`Category entity not found: ${category}`)
    record.category = c
    props.category = undefined
  }
  if (media) {
    const m = await db.get(VideoMedia, { where: { id: media.toString() } })
    if (m === undefined) throw Error(`VideoMedia entity not found: ${channel}`)
    record.media = m
    props.media = undefined
  }
  if (license) {
    const l = await db.get(License, { where: { id: license.toString() } })
    if (!l) throw Error(`License entity not found: ${license}`)
    record.license = l
    props.license = undefined
  }
  if (language) {
    const l = await db.get(Language, { where: { id: language.toString() } })
    if (l === undefined) throw Error(`Language entity not found: ${language}`)
    record.language = l
    props.language = undefined
  }

  Object.assign(record, props)
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
