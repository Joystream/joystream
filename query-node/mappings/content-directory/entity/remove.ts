import assert from 'assert'

import { DB } from '../../../generated/indexer'
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

import { IWhereCond } from '../../types'

function assertKeyViolation(entityName: string, entityId: string) {
  assert(false, `Can not remove ${entityName}(${entityId})! There are references to this entity`)
}

async function removeChannel(db: DB, where: IWhereCond): Promise<void> {
  const record = await db.get(Channel, where)
  if (!record) throw Error(`Channel(${where.where.id}) not found`)
  if (record.videos && record.videos.length) assertKeyViolation(`Channel`, record.id)
  await db.remove<Channel>(record)
}

async function removeCategory(db: DB, where: IWhereCond): Promise<void> {
  const record = await db.get(Category, where)
  if (!record) throw Error(`Category(${where.where.id}) not found`)
  if (record.videos && record.videos.length) assertKeyViolation(`Category`, record.id)
  await db.remove<Category>(record)
}
async function removeVideoMedia(db: DB, where: IWhereCond): Promise<void> {
  const record = await db.get(VideoMedia, where)
  if (!record) throw Error(`VideoMedia(${where.where.id}) not found`)
  if (record.video) assertKeyViolation(`VideoMedia`, record.id)
  await db.remove<VideoMedia>(record)
}
async function removeVideo(db: DB, where: IWhereCond): Promise<void> {
  const record = await db.get(Video, where)
  if (!record) throw Error(`Video(${where.where.id}) not found`)
  await db.remove<Video>(record)
}

async function removeLicense(db: DB, where: IWhereCond): Promise<void> {
  const record = await db.get(LicenseEntity, where)
  if (!record) throw Error(`License(${where.where.id}) not found`)
  if (record.videolicense && record.videolicense.length) assertKeyViolation(`License`, record.id)
  await db.remove<LicenseEntity>(record)
}

async function removeUserDefinedLicense(db: DB, where: IWhereCond): Promise<void> {
  const record = await db.get(UserDefinedLicenseEntity, where)
  if (!record) throw Error(`UserDefinedLicense(${where.where.id}) not found`)
  await db.remove<UserDefinedLicenseEntity>(record)
}

async function removeKnownLicense(db: DB, where: IWhereCond): Promise<void> {
  const record = await db.get(KnownLicenseEntity, where)
  if (!record) throw Error(`KnownLicense(${where.where.id}) not found`)
  await db.remove<KnownLicenseEntity>(record)
}
async function removeMediaLocation(db: DB, where: IWhereCond): Promise<void> {
  const record = await db.get(MediaLocationEntity, where)
  if (!record) throw Error(`MediaLocation(${where.where.id}) not found`)
  if (record.videoMedia) assertKeyViolation('MediaLocation', record.id)
  await db.remove<MediaLocationEntity>(record)
}

async function removeHttpMediaLocation(db: DB, where: IWhereCond): Promise<void> {
  const record = await db.get(HttpMediaLocationEntity, where)
  if (!record) throw Error(`HttpMediaLocation(${where.where.id}) not found`)
  if (record.medialocationentityhttpMediaLocation && record.medialocationentityhttpMediaLocation.length) {
    assertKeyViolation('HttpMediaLocation', record.id)
  }
  await db.remove<HttpMediaLocationEntity>(record)
}

async function removeJoystreamMediaLocation(db: DB, where: IWhereCond): Promise<void> {
  const record = await db.get(JoystreamMediaLocationEntity, where)
  if (!record) throw Error(`JoystreamMediaLocation(${where.where.id}) not found`)
  if (record.medialocationentityjoystreamMediaLocation && record.medialocationentityjoystreamMediaLocation.length) {
    assertKeyViolation('JoystreamMediaLocation', record.id)
  }
  await db.remove<JoystreamMediaLocationEntity>(record)
}

async function removeLanguage(db: DB, where: IWhereCond): Promise<void> {
  const record = await db.get(Language, where)
  if (!record) throw Error(`Language(${where.where.id}) not found`)
  if (record.channellanguage && record.channellanguage.length) assertKeyViolation('Language', record.id)
  if (record.videolanguage && record.videolanguage.length) assertKeyViolation('Language', record.id)
  await db.remove<Language>(record)
}

async function removeVideoMediaEncoding(db: DB, where: IWhereCond): Promise<void> {
  const record = await db.get(VideoMediaEncoding, where)
  if (!record) throw Error(`VideoMediaEncoding(${where.where.id}) not found`)
  await db.remove<VideoMediaEncoding>(record)
}

async function removeFeaturedVideo(db: DB, where: IWhereCond): Promise<void> {
  const record = await db.get(FeaturedVideo, { ...where, relations: ['video'] })
  if (!record) throw Error(`FeaturedVideo(${where.where.id}) not found`)

  record.video.isFeatured = false
  record.video.featured = undefined

  await db.save<Video>(record.video)
  await db.remove<FeaturedVideo>(record)
}

export {
  removeCategory,
  removeChannel,
  removeVideoMedia,
  removeVideo,
  removeUserDefinedLicense,
  removeKnownLicense,
  removeHttpMediaLocation,
  removeJoystreamMediaLocation,
  removeLanguage,
  removeVideoMediaEncoding,
  removeMediaLocation,
  removeLicense,
  removeFeaturedVideo,
}
