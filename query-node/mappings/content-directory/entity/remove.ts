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
  const record = await db.get(LicenseEntity, where)
  if (record === undefined) throw Error(`License not found`)

  const { knownLicense, userdefinedLicense } = record
  let videos: Video[] = []

  if (knownLicense) {
    videos = await db.getMany(Video, {
      where: {
        license: {
          isTypeOf: 'KnownLicense',
          code: knownLicense.code,
          description: knownLicense.description,
          name: knownLicense.name,
          url: knownLicense.url,
        },
      },
    })
  }
  if (userdefinedLicense) {
    videos = await db.getMany(Video, {
      where: { license: { isTypeOf: 'UserDefinedLicense', content: userdefinedLicense.content } },
    })
  }
  // Remove all the videos under this license
  videos.map(async (v) => await removeVideo(db, { where: { id: v.id } }))
  await db.remove<LicenseEntity>(record)
}
async function removeUserDefinedLicense(db: DB, where: IWhereCond): Promise<void> {
  const record = await db.get(UserDefinedLicenseEntity, where)
  if (record === undefined) throw Error(`UserDefinedLicense not found`)
  if (record.licenseentityuserdefinedLicense)
    record.licenseentityuserdefinedLicense.map(async (l) => await removeLicense(db, { where: { id: l.id } }))
  await db.remove<UserDefinedLicenseEntity>(record)
}
async function removeKnownLicense(db: DB, where: IWhereCond): Promise<void> {
  const record = await db.get(KnownLicenseEntity, where)
  if (record === undefined) throw Error(`KnownLicense not found`)
  if (record.licenseentityknownLicense)
    record.licenseentityknownLicense.map(async (k) => await removeLicense(db, { where: { id: k.id } }))
  await db.remove<KnownLicenseEntity>(record)
}
async function removeMediaLocation(db: DB, where: IWhereCond): Promise<void> {
  const record = await db.get(MediaLocationEntity, where)
  if (record === undefined) throw Error(`MediaLocation not found`)
  if (record.videoMedia) await removeVideo(db, { where: { id: record.videoMedia.id } })

  const { httpMediaLocation, joystreamMediaLocation } = record

  let videoMedia: VideoMedia | undefined
  if (httpMediaLocation) {
    videoMedia = await db.get(VideoMedia, {
      where: { location: { isTypeOf: 'HttpMediaLocation', url: httpMediaLocation.url, port: httpMediaLocation.port } },
    })
  }
  if (joystreamMediaLocation) {
    videoMedia = await db.get(VideoMedia, {
      where: { location: { isTypeOf: 'JoystreamMediaLocation', dataObjectId: joystreamMediaLocation.dataObjectId } },
    })
  }
  if (videoMedia) await db.remove<VideoMedia>(videoMedia)
  await db.remove<MediaLocationEntity>(record)
}
async function removeHttpMediaLocation(db: DB, where: IWhereCond): Promise<void> {
  const record = await db.get(HttpMediaLocationEntity, where)
  if (record === undefined) throw Error(`HttpMediaLocation not found`)
  if (record.medialocationentityhttpMediaLocation)
    record.medialocationentityhttpMediaLocation.map(async (v) => await removeMediaLocation(db, { where: { id: v.id } }))
  await db.remove<HttpMediaLocationEntity>(record)
}
async function removeJoystreamMediaLocation(db: DB, where: IWhereCond): Promise<void> {
  const record = await db.get(JoystreamMediaLocationEntity, where)
  if (record === undefined) throw Error(`JoystreamMediaLocation not found`)
  if (record.medialocationentityjoystreamMediaLocation)
    record.medialocationentityjoystreamMediaLocation.map(async (v) => await removeVideo(db, { where: { id: v.id } }))
  await db.remove<JoystreamMediaLocationEntity>(record)
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
