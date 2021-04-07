import Debug from 'debug'
import { nanoid } from 'nanoid'

import { DatabaseManager as DB } from '@dzlzv/hydra-db-utils'
import { Channel } from '../../generated/graphql-server/src/modules/channel/channel.model'
import { Language } from '../../generated/graphql-server/src/modules/language/language.model'
import { ClassEntity } from '../../generated/graphql-server/src/modules/class-entity/class-entity.model'
import { Video } from '../../generated/graphql-server/src/modules/video/video.model'
import { Category } from '../../generated/graphql-server/src/modules/category/category.model'
import { VideoMedia } from '../../generated/graphql-server/src/modules/video-media/video-media.model'
import { LicenseEntity } from '../../generated/graphql-server/src/modules/license-entity/license-entity.model'
import { VideoMediaEncoding } from '../../generated/graphql-server/src/modules/video-media-encoding/video-media-encoding.model'
import { MediaLocationEntity } from '../../generated/graphql-server/src/modules/media-location-entity/media-location-entity.model'
import { HttpMediaLocationEntity } from '../../generated/graphql-server/src/modules/http-media-location-entity/http-media-location-entity.model'
import { JoystreamMediaLocationEntity } from '../../generated/graphql-server/src/modules/joystream-media-location-entity/joystream-media-location-entity.model'
import { KnownLicenseEntity } from '../../generated/graphql-server/src/modules/known-license-entity/known-license-entity.model'
import { UserDefinedLicenseEntity } from '../../generated/graphql-server/src/modules/user-defined-license-entity/user-defined-license-entity.model'
import { FeaturedVideo } from '../../generated/graphql-server/src/modules/featured-video/featured-video.model'
import { JoystreamMediaLocation } from '../../generated/graphql-server/src/modules/variants/variants.model'

import { contentDirectoryClassNamesWithId, ContentDirectoryKnownClasses } from './content-dir-consts'

const debug = Debug('mappings:default-schema')

/**
 * Inserts a default schema for every newly created entity
 * @param db DB
 * @param ce ClassEntity
 */
export async function createDefaultSchema(db: DB, ce: ClassEntity): Promise<void> {
  const knownClass = contentDirectoryClassNamesWithId.find((k) => k.classId === ce.classId)
  // Its not a known class for query node so we simply return
  if (!knownClass) {
    debug(`Not a known class. ClassId: ${ce.classId} EntityId: ${ce.id}`)
    return
  }

  switch (knownClass.name) {
    case ContentDirectoryKnownClasses.CHANNEL:
      await channelDefaultSchema(db, ce)
      break
    case ContentDirectoryKnownClasses.CATEGORY:
      await categoryDefaultSchema(db, ce)
      break
    case ContentDirectoryKnownClasses.HTTPMEDIALOCATION:
      await httpMediaLocationDefaultSchema(db, ce)
      break
    case ContentDirectoryKnownClasses.JOYSTREAMMEDIALOCATION:
      await joystreamMediaLocationDefaultSchema(db, ce)
      break
    case ContentDirectoryKnownClasses.KNOWNLICENSE:
      await knownLicenseDefaultSchema(db, ce)
      break
    case ContentDirectoryKnownClasses.LANGUAGE:
      await languageDefaultSchema(db, ce)
      break
    case ContentDirectoryKnownClasses.LICENSE:
      await licenseDefaultSchema(db, ce)
      break
    case ContentDirectoryKnownClasses.MEDIALOCATION:
      await mediaLocationDefaultSchema(db, ce)
      break
    case ContentDirectoryKnownClasses.USERDEFINEDLICENSE:
      await userDefinedLicenseDefaultSchema(db, ce)
      break
    case ContentDirectoryKnownClasses.VIDEOMEDIAENCODING:
      await videoMediaEncodingDefaultSchema(db, ce)
      break
    case ContentDirectoryKnownClasses.FEATUREDVIDEOS:
      await featuredVideoDefaultSchema(db, ce)
      break
    case ContentDirectoryKnownClasses.VIDEO:
      await videoDefaultSchema(db, ce)
      break
    case ContentDirectoryKnownClasses.VIDEOMEDIA:
      await videoMediaDefaultSchema(db, ce)
      break

    default:
      break
  }
}

function commonProperties(ce: ClassEntity) {
  return { id: ce.id, happenedIn: ce.happenedIn, version: ce.happenedIn.block }
}

export async function categoryDefaultSchema(db: DB, ce: ClassEntity): Promise<void> {
  await db.save<Category>(
    new Category({
      ...commonProperties(ce),
      name: ce.id,
    })
  )
}

export async function channelDefaultSchema(db: DB, ce: ClassEntity): Promise<void> {
  const defaultSchemaFromDb = await db.get(Channel, { where: { id: '0' } })
  if (!defaultSchemaFromDb) throw Error(`Channel(0) not found`)

  const c = new Channel({
    ...commonProperties(ce),
    handle: `${ce.id} - ${nanoid()}`,
    description: `${ce.id}`,
    isPublic: defaultSchemaFromDb.isPublic,
    isCurated: defaultSchemaFromDb.isCurated,
  })
  await db.save<Channel>(c)
}

export async function httpMediaLocationDefaultSchema(db: DB, ce: ClassEntity): Promise<void> {
  const defaultSchemaFromDb = await db.get(HttpMediaLocationEntity, { where: { id: '0' } })
  if (!defaultSchemaFromDb) throw Error(`HttpMediaLocationEntity(0) not found`)

  await db.save<HttpMediaLocationEntity>(
    new HttpMediaLocationEntity({
      ...commonProperties(ce),
      url: defaultSchemaFromDb.url,
    })
  )
}

export async function joystreamMediaLocationDefaultSchema(db: DB, ce: ClassEntity): Promise<void> {
  const defaultSchemaFromDb = await db.get(JoystreamMediaLocationEntity, { where: { id: '0' } })
  if (!defaultSchemaFromDb) throw Error(`JoystreamMediaLocationEntity(0) not found`)

  await db.save<JoystreamMediaLocationEntity>(
    new JoystreamMediaLocationEntity({
      ...commonProperties(ce),
      dataObjectId: defaultSchemaFromDb.dataObjectId,
    })
  )
}

export async function knownLicenseDefaultSchema(db: DB, ce: ClassEntity): Promise<void> {
  const defaultSchemaFromDb = await db.get(KnownLicenseEntity, { where: { id: '0' } })
  if (!defaultSchemaFromDb) throw Error(`KnownLicenseEntity(0) not found`)

  await db.save<KnownLicenseEntity>(
    new KnownLicenseEntity({
      ...commonProperties(ce),
      code: `${ce.id}-${defaultSchemaFromDb.code}`,
      name: defaultSchemaFromDb.name,
    })
  )
}

export async function userDefinedLicenseDefaultSchema(db: DB, ce: ClassEntity): Promise<void> {
  await db.save<UserDefinedLicenseEntity>(
    new UserDefinedLicenseEntity({
      ...commonProperties(ce),
      content: `${ce.id}`,
    })
  )
}

export async function languageDefaultSchema(db: DB, ce: ClassEntity): Promise<void> {
  await db.save<Language>(
    new Language({
      ...commonProperties(ce),
      code: `${ce.id}`,
      name: `${ce.id}`,
    })
  )
}

export async function licenseDefaultSchema(db: DB, ce: ClassEntity): Promise<void> {
  const defaultSchemaFromDb = await db.get(LicenseEntity, { where: { id: '0' } })
  if (!defaultSchemaFromDb) throw Error(`LicenseEntity(0) not found`)

  await db.save<LicenseEntity>(
    new LicenseEntity({
      ...commonProperties(ce),
      type: defaultSchemaFromDb.type,
    })
  )
}

export async function mediaLocationDefaultSchema(db: DB, ce: ClassEntity): Promise<void> {
  const defaultSchemaFromDb = await db.get(MediaLocationEntity, {
    where: { id: '0' },
    relations: ['joystreamMediaLocation'],
  })
  if (!defaultSchemaFromDb) throw Error(`MediaLocationEntity(0) not found`)

  const m = new MediaLocationEntity()
  m.joystreamMediaLocation = defaultSchemaFromDb.joystreamMediaLocation
  await db.save<MediaLocationEntity>(
    new MediaLocationEntity({
      ...commonProperties(ce),
      joystreamMediaLocation: defaultSchemaFromDb.joystreamMediaLocation,
    })
  )
}

export async function videoMediaEncodingDefaultSchema(db: DB, ce: ClassEntity): Promise<void> {
  const defaultSchemaFromDb = await db.get(VideoMediaEncoding, { where: { id: '0' } })
  if (!defaultSchemaFromDb) throw Error(`VideoMediaEncoding(0) not found`)

  await db.save<VideoMediaEncoding>(
    new VideoMediaEncoding({
      ...commonProperties(ce),
      name: defaultSchemaFromDb.name,
    })
  )
}

export async function featuredVideoDefaultSchema(db: DB, ce: ClassEntity): Promise<void> {
  const video = await db.get(Video, { where: { id: '0' } })
  if (!video) throw Error(`Video(0) not found for FeaturedVideo(${ce.id}) creation`)

  await db.save<FeaturedVideo>(
    new FeaturedVideo({
      ...commonProperties(ce),
      video,
    })
  )
}

export async function videoDefaultSchema(db: DB, ce: ClassEntity): Promise<void> {
  const defaultSchemaFromDb = await db.get(Video, { where: { id: '0' } })
  if (!defaultSchemaFromDb) throw Error(`Video(0) not found`)

  const v = new Video({
    ...commonProperties(ce),
  })

  // ///// default relations ///////
  /* eslint-disable @typescript-eslint/no-non-null-assertion */
  const filmAnimation = await db.get(Category, { where: { name: 'Film & Animation' } })
  v.category = filmAnimation || (await db.get(Category, { where: { id: '0' } }))!
  v.channel = (await db.get(Channel, { where: { id: '0' } }))!
  v.license = (await db.get(LicenseEntity, { where: { id: '0' } }))!

  // const media = (await db.get(VideoMedia, { where: { id: '0' } }))!

  // const encoding = new VideoMediaEncoding({
  //   name: `${Date.now()}`,
  //   ...commonProperties(ce),
  //   id: `${Date.now()}`,
  // })
  // await db.save<VideoMediaEncoding>(encoding)
  const encoding = await db.get(VideoMediaEncoding, { where: { id: 0 } })

  const mediaLoc = await db.get(MediaLocationEntity, { where: { id: '0' }, relations: ['joystreamMediaLocation'] })
  if (!mediaLoc) throw Error(`MediaLocationEntity(0) not found while creating default schema for video`)
  const location = new JoystreamMediaLocation()
  location.dataObjectId = mediaLoc.joystreamMediaLocation!.dataObjectId

  const media = await db.get(VideoMedia, { where: { id: '0' } })
  if (!media) throw Error(`VideoMedia(0) not found while creating default schema for video`)

  const newMedia = new VideoMedia({
    ...commonProperties(ce),
    location,
    encoding,
    id: `${Date.now()}`, // override id
    pixelHeight: media.pixelHeight,
    pixelWidth: media.pixelWidth,
  })
  await db.save<VideoMedia>(newMedia)

  v.media = newMedia
  // ///// default relations ///////

  // Get default schema for video entity
  // const defaultSchemaFromDb = (await db.get(Video, { where: { id: '0' } }))!
  /* eslint-enable @typescript-eslint/no-non-null-assertion */

  v.title = ce.id
  v.description = ce.id
  v.duration = defaultSchemaFromDb.duration
  v.thumbnailUrl = defaultSchemaFromDb.thumbnailUrl
  v.isPublic = defaultSchemaFromDb.isPublic
  v.isCurated = defaultSchemaFromDb.isCurated
  v.isExplicit = defaultSchemaFromDb.isExplicit
  v.isFeatured = defaultSchemaFromDb.isFeatured

  await db.save<Video>(v)
}

export async function videoMediaDefaultSchema(db: DB, ce: ClassEntity): Promise<void> {
  const media = await db.get(VideoMedia, { where: { id: '0' } })
  if (!media) throw Error(`VideoMedia(0) not found`)

  const encoding = await db.get(VideoMediaEncoding, { where: { id: '0' } })

  const mediaLoc = await db.get(MediaLocationEntity, { where: { id: '0' }, relations: ['joystreamMediaLocation'] })
  if (!mediaLoc) throw Error(`MediaLocationEntity(0) not found while creating default schema for video`)
  const location = new JoystreamMediaLocation()
  location.dataObjectId = mediaLoc.joystreamMediaLocation!.dataObjectId

  const vm = new VideoMedia({
    ...commonProperties(ce),
    pixelHeight: media.pixelHeight,
    pixelWidth: media.pixelWidth,
    encoding,
    location,
  })

  await db.save<VideoMedia>(vm)
}
