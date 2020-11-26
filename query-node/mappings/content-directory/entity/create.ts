import { DB } from '../../../generated/indexer'
import { Channel } from '../../../generated/graphql-server/src/modules/channel/channel.model'
import { Category } from '../../../generated/graphql-server/src/modules/category/category.model'
import { KnownLicenseEntity } from '../../../generated/graphql-server/src/modules/known-license-entity/known-license-entity.model'
import { UserDefinedLicenseEntity } from '../../../generated/graphql-server/src/modules/user-defined-license-entity/user-defined-license-entity.model'
import { JoystreamMediaLocationEntity } from '../../../generated/graphql-server/src/modules/joystream-media-location-entity/joystream-media-location-entity.model'
import { HttpMediaLocationEntity } from '../../../generated/graphql-server/src/modules/http-media-location-entity/http-media-location-entity.model'
import { VideoMedia } from '../../../generated/graphql-server/src/modules/video-media/video-media.model'
import { Video } from '../../../generated/graphql-server/src/modules/video/video.model'
import { Block, Network } from '../../../generated/graphql-server/src/modules/block/block.model'
import { Language } from '../../../generated/graphql-server/src/modules/language/language.model'
import { VideoMediaEncoding } from '../../../generated/graphql-server/src/modules/video-media-encoding/video-media-encoding.model'
import { ClassEntity } from '../../../generated/graphql-server/src/modules/class-entity/class-entity.model'
import { LicenseEntity } from '../../../generated/graphql-server/src/modules/license-entity/license-entity.model'
import { MediaLocationEntity } from '../../../generated/graphql-server/src/modules/media-location-entity/media-location-entity.model'

import { contentDirectoryClassNamesWithId } from '../content-dir-consts'
import {
  ClassEntityMap,
  ICategory,
  IChannel,
  ICreateEntityOperation,
  IDBBlockId,
  IEntity,
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
} from '../../types'
import { getOrCreate } from '../get-or-create'
import BN from 'bn.js'
import {
  HttpMediaLocation,
  JoystreamMediaLocation,
  KnownLicense,
  UserDefinedLicense,
} from '../../../generated/graphql-server/src/modules/variants/variants.model'

async function createBlockOrGetFromDatabase(db: DB, blockNumber: number): Promise<Block> {
  let b = await db.get(Block, { where: { block: blockNumber } })
  if (b === undefined) {
    // TODO: get timestamp from the event or extrinsic
    b = new Block({ block: blockNumber, network: Network.BABYLON, timestamp: new BN(Date.now()) })
    await db.save<Block>(b)
  }
  return b
}

async function createChannel(
  { db, block, id }: IDBBlockId,
  classEntityMap: ClassEntityMap,
  p: IChannel,
  nextEntityIdBeforeTransaction: number
): Promise<Channel> {
  const record = await db.get(Channel, { where: { id } })
  if (record) return record

  const channel = new Channel()

  channel.version = block
  channel.id = id
  channel.handle = p.handle
  channel.description = p.description
  channel.isCurated = !!p.isCurated
  channel.isPublic = p.isPublic
  channel.coverPhotoUrl = p.coverPhotoUrl
  channel.avatarPhotoUrl = p.avatarPhotoUrl

  channel.happenedIn = await createBlockOrGetFromDatabase(db, block)
  const { language } = p
  if (language) {
    channel.language = await getOrCreate.language(
      { db, block, id },
      classEntityMap,
      language,
      nextEntityIdBeforeTransaction
    )
  }
  await db.save(channel)
  return channel
}

async function createCategory({ db, block, id }: IDBBlockId, p: ICategory): Promise<Category> {
  const record = await db.get(Category, { where: { id } })
  if (record) return record

  const category = new Category()

  category.id = id
  category.name = p.name
  category.description = p.description
  category.version = block
  category.happenedIn = await createBlockOrGetFromDatabase(db, block)
  await db.save(category)
  return category
}

async function createKnownLicense({ db, block, id }: IDBBlockId, p: IKnownLicense): Promise<KnownLicenseEntity> {
  const record = await db.get(KnownLicenseEntity, { where: { id } })
  if (record) return record

  const knownLicence = new KnownLicenseEntity()

  knownLicence.id = id
  knownLicence.code = p.code
  knownLicence.name = p.name
  knownLicence.description = p.description
  knownLicence.url = p.url
  knownLicence.version = block
  knownLicence.happenedIn = await createBlockOrGetFromDatabase(db, block)
  await db.save(knownLicence)
  return knownLicence
}

async function createUserDefinedLicense(
  { db, block, id }: IDBBlockId,
  p: IUserDefinedLicense
): Promise<UserDefinedLicenseEntity> {
  const record = await db.get(UserDefinedLicenseEntity, { where: { id } })
  if (record) return record

  const userDefinedLicense = new UserDefinedLicenseEntity()

  userDefinedLicense.id = id
  userDefinedLicense.content = p.content
  userDefinedLicense.version = block
  userDefinedLicense.happenedIn = await createBlockOrGetFromDatabase(db, block)
  await db.save<UserDefinedLicenseEntity>(userDefinedLicense)
  return userDefinedLicense
}

async function createJoystreamMediaLocation(
  { db, block, id }: IDBBlockId,
  p: IJoystreamMediaLocation
): Promise<JoystreamMediaLocationEntity> {
  const record = await db.get(JoystreamMediaLocationEntity, { where: { id } })
  if (record) return record

  const joyMediaLoc = new JoystreamMediaLocationEntity()

  joyMediaLoc.id = id
  joyMediaLoc.dataObjectId = p.dataObjectId
  joyMediaLoc.version = block
  joyMediaLoc.happenedIn = await createBlockOrGetFromDatabase(db, block)
  await db.save(joyMediaLoc)
  return joyMediaLoc
}

async function createHttpMediaLocation(
  { db, block, id }: IDBBlockId,
  p: IHttpMediaLocation
): Promise<HttpMediaLocationEntity> {
  const record = await db.get(HttpMediaLocationEntity, { where: { id } })
  if (record) return record

  const httpMediaLoc = new HttpMediaLocationEntity()

  httpMediaLoc.id = id
  httpMediaLoc.url = p.url
  httpMediaLoc.port = p.port
  httpMediaLoc.version = block
  httpMediaLoc.happenedIn = await createBlockOrGetFromDatabase(db, block)
  await db.save(httpMediaLoc)
  return httpMediaLoc
}

async function createVideoMedia(
  { db, block, id }: IDBBlockId,
  classEntityMap: ClassEntityMap,
  p: IVideoMedia,
  nextEntityIdBeforeTransaction: number
): Promise<VideoMedia> {
  const videoMedia = new VideoMedia()

  videoMedia.id = id
  videoMedia.pixelHeight = p.pixelHeight
  videoMedia.pixelWidth = p.pixelWidth
  videoMedia.size = p.size
  videoMedia.version = block
  const { encoding, location } = p
  if (encoding !== undefined) {
    videoMedia.encoding = await getOrCreate.videoMediaEncoding(
      { db, block, id },
      classEntityMap,
      encoding,
      nextEntityIdBeforeTransaction
    )
  }
  if (location !== undefined) {
    const m = await getOrCreate.mediaLocation(
      { db, block, id },
      classEntityMap,
      location,
      nextEntityIdBeforeTransaction
    )
    videoMedia.locationEntity = m
    const { httpMediaLocation, joystreamMediaLocation } = m
    if (httpMediaLocation) {
      const mediaLoc = new HttpMediaLocation()
      mediaLoc.isTypeOf = 'HttpMediaLocation'
      mediaLoc.port = httpMediaLocation.port
      mediaLoc.url = httpMediaLocation.url
      videoMedia.location = mediaLoc
    }
    if (joystreamMediaLocation) {
      const mediaLoc = new JoystreamMediaLocation()
      mediaLoc.isTypeOf = 'JoystreamMediaLocation'
      mediaLoc.dataObjectId = joystreamMediaLocation.dataObjectId
      videoMedia.location = mediaLoc
    }
  }

  videoMedia.happenedIn = await createBlockOrGetFromDatabase(db, block)
  await db.save<VideoMedia>(videoMedia)
  return videoMedia
}

async function createVideo(
  { db, block, id }: IDBBlockId,
  classEntityMap: ClassEntityMap,
  p: IVideo,
  nextEntityIdBeforeTransaction: number
): Promise<Video> {
  const record = await db.get(Video, { where: { id } })
  if (record) return record

  const video = new Video()

  video.id = id
  video.title = p.title
  video.description = p.description
  video.duration = p.duration
  video.hasMarketing = p.hasMarketing
  video.isCurated = !!p.isCurated
  video.isExplicit = p.isExplicit
  video.isPublic = p.isPublic
  video.publishedBeforeJoystream = p.publishedBeforeJoystream
  video.skippableIntroDuration = p.skippableIntroDuration
  video.thumbnailUrl = p.thumbnailUrl
  video.version = block

  const { language, license, category, channel, media } = p
  if (language !== undefined) {
    video.language = await getOrCreate.language(
      { db, block, id },
      classEntityMap,
      language,
      nextEntityIdBeforeTransaction
    )
  }
  if (license !== undefined) {
    const { knownLicense, userdefinedLicense } = await getOrCreate.license(
      { db, block, id },
      classEntityMap,
      license,
      nextEntityIdBeforeTransaction
    )
    if (knownLicense) {
      const lic = new KnownLicense()
      lic.code = knownLicense.code
      lic.description = knownLicense.description
      lic.isTypeOf = 'KnownLicense'
      lic.name = knownLicense.name
      lic.url = knownLicense.url
      video.license = lic
    }
    if (userdefinedLicense) {
      const lic = new UserDefinedLicense()
      lic.content = userdefinedLicense.content
      lic.isTypeOf = 'UserDefinedLicense'
      video.license = lic
    }
  }
  if (category !== undefined) {
    video.category = await getOrCreate.category(
      { db, block, id },
      classEntityMap,
      category,
      nextEntityIdBeforeTransaction
    )
  }
  if (channel !== undefined) {
    video.channel = await getOrCreate.channel({ db, block, id }, classEntityMap, channel, nextEntityIdBeforeTransaction)
  }
  if (media !== undefined) {
    video.media = await getOrCreate.videoMedia({ db, block, id }, classEntityMap, media, nextEntityIdBeforeTransaction)
  }

  video.happenedIn = await createBlockOrGetFromDatabase(db, block)
  await db.save<Video>(video)
  return video
}

async function createLanguage({ db, block, id }: IDBBlockId, p: ILanguage): Promise<Language> {
  const record = await db.get(Language, { where: { id } })
  if (record) return record

  const language = new Language()
  language.id = id
  language.name = p.name
  language.code = p.code
  language.version = block
  language.happenedIn = await createBlockOrGetFromDatabase(db, block)

  await db.save<Language>(language)
  return language
}

async function createVideoMediaEncoding(
  { db, block, id }: IDBBlockId,
  p: IVideoMediaEncoding
): Promise<VideoMediaEncoding> {
  const record = await db.get(VideoMediaEncoding, { where: { id } })
  if (record) return record

  const encoding = new VideoMediaEncoding()
  encoding.id = id
  encoding.name = p.name
  encoding.version = block
  encoding.happenedIn = await createBlockOrGetFromDatabase(db, block)
  await db.save<VideoMediaEncoding>(encoding)
  return encoding
}

async function createLicense(
  { db, block, id }: IDBBlockId,
  classEntityMap: ClassEntityMap,
  p: ILicense,
  nextEntityIdBeforeTransaction: number
): Promise<LicenseEntity> {
  const record = await db.get(LicenseEntity, { where: { id } })
  if (record) return record

  const { knownLicense, userDefinedLicense } = p

  const license = new LicenseEntity()
  license.id = id
  if (knownLicense !== undefined) {
    license.knownLicense = await getOrCreate.knownLicense(
      { db, block, id },
      classEntityMap,
      knownLicense,
      nextEntityIdBeforeTransaction
    )
  }
  if (userDefinedLicense !== undefined) {
    license.userdefinedLicense = await getOrCreate.userDefinedLicense(
      { db, block, id },
      classEntityMap,
      userDefinedLicense,
      nextEntityIdBeforeTransaction
    )
  }
  license.happenedIn = await createBlockOrGetFromDatabase(db, block)
  await db.save<LicenseEntity>(license)
  return license
}

async function createMediaLocation(
  { db, block, id }: IDBBlockId,
  classEntityMap: ClassEntityMap,
  p: IMediaLocation,
  nextEntityIdBeforeTransaction: number
): Promise<MediaLocationEntity> {
  const { httpMediaLocation, joystreamMediaLocation } = p

  const location = new MediaLocationEntity()
  location.id = id
  if (httpMediaLocation !== undefined) {
    location.httpMediaLocation = await getOrCreate.httpMediaLocation(
      { db, block, id },
      classEntityMap,
      httpMediaLocation,
      nextEntityIdBeforeTransaction
    )
  }
  if (joystreamMediaLocation !== undefined) {
    location.joystreamMediaLocation = await getOrCreate.joystreamMediaLocation(
      { db, block, id },
      classEntityMap,
      joystreamMediaLocation,
      nextEntityIdBeforeTransaction
    )
  }
  location.happenedIn = await createBlockOrGetFromDatabase(db, block)
  await db.save<MediaLocationEntity>(location)
  return location
}

async function getClassName(
  db: DB,
  entity: IEntity,
  createEntityOperations: ICreateEntityOperation[]
): Promise<string | undefined> {
  const { entityId, indexOf } = entity
  if (entityId === undefined && indexOf === undefined) {
    throw Error(`Can not determine class of the entity`)
  }

  let classId: number | undefined
  // Is newly created entity in the same transaction
  if (indexOf !== undefined) {
    classId = createEntityOperations[indexOf].classId
  } else {
    const ce = await db.get(ClassEntity, { where: { id: entityId } })
    if (ce === undefined) console.log(`Class not found for the entity: ${entityId}`)
    classId = ce ? ce.classId : undefined
  }

  const c = contentDirectoryClassNamesWithId.find((c) => c.classId === classId)
  // TODO: stop execution, class should be created before entity creation
  if (c === undefined) console.log(`Not recognized class id: ${classId}`)
  return c ? c.name : undefined
}

export {
  createCategory,
  createChannel,
  createVideoMedia,
  createVideo,
  createUserDefinedLicense,
  createKnownLicense,
  createHttpMediaLocation,
  createJoystreamMediaLocation,
  createLanguage,
  createVideoMediaEncoding,
  createLicense,
  createMediaLocation,
  createBlockOrGetFromDatabase,
  getClassName,
}
