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

import { IWhereCond } from '../../types'

async function removeChannel(db: DB, where: IWhereCond): Promise<void> {
  const record = await db.get(Channel, where)
  if (record === undefined) throw Error(`Channel not found`)
  if (record.videos) record.videos.map(async (v) => await removeVideo(db, { where: { id: v.id } }))
  await db.remove<Channel>(record)
}
async function removeCategory(db: DB, where: IWhereCond): Promise<void> {
  const record = await db.get(Category, where)
  if (record === undefined) throw Error(`Category not found`)
  if (record.videos) record.videos.map(async (v) => await removeVideo(db, { where: { id: v.id } }))
  await db.remove<Category>(record)
}
async function removeVideoMedia(db: DB, where: IWhereCond): Promise<void> {
  const record = await db.get(VideoMedia, where)
  if (record === undefined) throw Error(`VideoMedia not found`)
  if (record.video) await db.remove<Video>(record.video)
  await db.remove<VideoMedia>(record)
}
async function removeVideo(db: DB, where: IWhereCond): Promise<void> {
  const record = await db.get(Video, where)
  if (record === undefined) throw Error(`Video not found`)
  await db.remove<Video>(record)
}

async function removeLicense(db: DB, where: IWhereCond): Promise<void> {
  const record = await db.get(License, where)
  if (record === undefined) throw Error(`License not found`)
  // Remove all the videos under this license
  if (record.videolicense) record.videolicense.map(async (v) => await removeVideo(db, { where: { id: v.id } }))
  await db.remove<License>(record)
}
async function removeUserDefinedLicense(db: DB, where: IWhereCond): Promise<void> {
  const record = await db.get(UserDefinedLicense, where)
  if (record === undefined) throw Error(`UserDefinedLicense not found`)
  if (record.licenseuserdefinedLicense)
    record.licenseuserdefinedLicense.map(async (l) => await removeLicense(db, { where: { id: l.id } }))
  await db.remove<UserDefinedLicense>(record)
}
async function removeKnownLicense(db: DB, where: IWhereCond): Promise<void> {
  const record = await db.get(KnownLicense, where)
  if (record === undefined) throw Error(`KnownLicense not found`)
  if (record.licenseknownLicense)
    record.licenseknownLicense.map(async (k) => await removeLicense(db, { where: { id: k.id } }))
  await db.remove<KnownLicense>(record)
}
async function removeMediaLocation(db: DB, where: IWhereCond): Promise<void> {
  const record = await db.get(MediaLocation, where)
  if (record === undefined) throw Error(`MediaLocation not found`)
  if (record.videoMedia) await removeVideo(db, { where: { id: record.videoMedia.id } })
  await db.remove<MediaLocation>(record)
}
async function removeHttpMediaLocation(db: DB, where: IWhereCond): Promise<void> {
  const record = await db.get(HttpMediaLocation, where)
  if (record === undefined) throw Error(`HttpMediaLocation not found`)
  if (record.medialocationhttpMediaLocation)
    record.medialocationhttpMediaLocation.map(async (v) => await removeMediaLocation(db, { where: { id: v.id } }))
  await db.remove<HttpMediaLocation>(record)
}
async function removeJoystreamMediaLocation(db: DB, where: IWhereCond): Promise<void> {
  const record = await db.get(JoystreamMediaLocation, where)
  if (record === undefined) throw Error(`JoystreamMediaLocation not found`)
  if (record.medialocationjoystreamMediaLocation)
    record.medialocationjoystreamMediaLocation.map(async (v) => await removeVideo(db, { where: { id: v.id } }))
  await db.remove<JoystreamMediaLocation>(record)
}
async function removeLanguage(db: DB, where: IWhereCond): Promise<void> {
  const record = await db.get(Language, where)
  if (record === undefined) throw Error(`Language not found`)
  if (record.channellanguage) record.channellanguage.map(async (c) => await removeChannel(db, { where: { id: c.id } }))
  if (record.videolanguage) record.videolanguage.map(async (v) => await removeVideo(db, { where: { id: v.id } }))
  await db.remove<Language>(record)
}
async function removeVideoMediaEncoding(db: DB, where: IWhereCond): Promise<void> {
  const record = await db.get(VideoMediaEncoding, where)
  if (record === undefined) throw Error(`Language not found`)
  await db.remove<VideoMediaEncoding>(record)
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
}
