import assert from 'assert'
import Debug from 'debug'

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

const debug = Debug(`mappings:remove-entity`)

function assertKeyViolation(entityName: string, entityId: string) {
  assert(false, `Can not remove ${entityName}(${entityId})! There are references to this entity`)
}

function logEntityNotFound(className: string, where: IWhereCond) {
  debug(`${className}(${where.where.id}) not found. This happen when schema support is not added for the entity.`)
}

async function removeChannel(db: DB, where: IWhereCond): Promise<void> {
  const record = await db.get(Channel, where)
  if (!record) return logEntityNotFound(`Channel`, where)
  if (record.videos && record.videos.length) assertKeyViolation(`Channel`, record.id)
  await db.remove<Channel>(record)
}

async function removeCategory(db: DB, where: IWhereCond): Promise<void> {
  const record = await db.get(Category, where)
  if (!record) return logEntityNotFound(`Category`, where)
  if (record.videos && record.videos.length) assertKeyViolation(`Category`, record.id)
  await db.remove<Category>(record)
}
async function removeVideoMedia(db: DB, where: IWhereCond): Promise<void> {
  const record = await db.get(VideoMedia, where)
  if (!record) return logEntityNotFound(`VideoMedia`, where)
  if (record.video) assertKeyViolation(`VideoMedia`, record.id)
  await db.remove<VideoMedia>(record)
}

async function removeVideo(db: DB, where: IWhereCond): Promise<void> {
  const record = await db.get(Video, where)
  if (!record) return logEntityNotFound(`Video`, where)
  await db.remove<Video>(record)
}

async function removeLicense(db: DB, where: IWhereCond): Promise<void> {
  const record = await db.get(LicenseEntity, where)
  if (!record) return logEntityNotFound(`License`, where)
  if (record.videolicense && record.videolicense.length) assertKeyViolation(`License`, record.id)
  await db.remove<LicenseEntity>(record)
}

async function removeUserDefinedLicense(db: DB, where: IWhereCond): Promise<void> {
  const record = await db.get(UserDefinedLicenseEntity, where)
  if (!record) return logEntityNotFound(`UserDefinedLicense`, where)
  await db.remove<UserDefinedLicenseEntity>(record)
}

async function removeKnownLicense(db: DB, where: IWhereCond): Promise<void> {
  const record = await db.get(KnownLicenseEntity, where)
  if (!record) return logEntityNotFound(`KnownLicense`, where)
  await db.remove<KnownLicenseEntity>(record)
}
async function removeMediaLocation(db: DB, where: IWhereCond): Promise<void> {
  const record = await db.get(MediaLocationEntity, where)
  if (!record) return logEntityNotFound(`MediaLocation`, where)
  if (record.videoMedia) assertKeyViolation('MediaLocation', record.id)
  await db.remove<MediaLocationEntity>(record)
}

async function removeHttpMediaLocation(db: DB, where: IWhereCond): Promise<void> {
  const record = await db.get(HttpMediaLocationEntity, where)
  if (!record) return logEntityNotFound(`HttpMediaLocation`, where)
  if (record.medialocationentityhttpMediaLocation && record.medialocationentityhttpMediaLocation.length) {
    assertKeyViolation('HttpMediaLocation', record.id)
  }
  await db.remove<HttpMediaLocationEntity>(record)
}

async function removeJoystreamMediaLocation(db: DB, where: IWhereCond): Promise<void> {
  const record = await db.get(JoystreamMediaLocationEntity, where)
  if (!record) return logEntityNotFound(`JoystreamMediaLocation`, where)
  if (record.medialocationentityjoystreamMediaLocation && record.medialocationentityjoystreamMediaLocation.length) {
    assertKeyViolation('JoystreamMediaLocation', record.id)
  }
  await db.remove<JoystreamMediaLocationEntity>(record)
}

async function removeLanguage(db: DB, where: IWhereCond): Promise<void> {
  const record = await db.get(Language, where)
  if (!record) return logEntityNotFound(`Language`, where)
  if (record.channellanguage && record.channellanguage.length) assertKeyViolation('Language', record.id)
  if (record.videolanguage && record.videolanguage.length) assertKeyViolation('Language', record.id)
  await db.remove<Language>(record)
}

async function removeVideoMediaEncoding(db: DB, where: IWhereCond): Promise<void> {
  const record = await db.get(VideoMediaEncoding, where)
  if (!record) return logEntityNotFound(`VideoMediaEncoding`, where)
  await db.remove<VideoMediaEncoding>(record)
}

async function removeFeaturedVideo(db: DB, where: IWhereCond): Promise<void> {
  const record = await db.get(FeaturedVideo, { ...where, relations: ['video'] })
  if (!record) return logEntityNotFound(`FeaturedVideo`, where)

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
