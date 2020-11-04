import { DB } from '../../generated/indexer'
import { Channel } from '../../generated/graphql-server/src/modules/channel/channel.model'
import { Category } from '../../generated/graphql-server/src/modules/category/category.model'
import { KnownLicense } from '../../generated/graphql-server/src/modules/known-license/known-license.model'
import { UserDefinedLicense } from '../../generated/graphql-server/src/modules/user-defined-license/user-defined-license.model'
import { JoystreamMediaLocation } from '../../generated/graphql-server/src/modules/joystream-media-location/joystream-media-location.model'
import { HttpMediaLocation } from '../../generated/graphql-server/src/modules/http-media-location/http-media-location.model'
import { VideoMedia } from '../../generated/graphql-server/src/modules/video-media/video-media.model'
import { Video } from '../../generated/graphql-server/src/modules/video/video.model'
import { Block, Network } from '../../generated/graphql-server/src/modules/block/block.model'
import { Language } from '../../generated/graphql-server/src/modules/language/language.model'
import { VideoMediaEncoding } from '../../generated/graphql-server/src/modules/video-media-encoding/video-media-encoding.model'
import { ClassEntity } from '../../generated/graphql-server/src/modules/class-entity/class-entity.model'
import { License } from '../../generated/graphql-server/src/modules/license/license.model'
import { MediaLocation } from '../../generated/graphql-server/src/modules/media-location/media-location.model'

import { contentDirectoryClassNamesWithId } from './content-dir-consts'
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
  IWhereCond,
} from '../types'
import { getOrCreate } from './get-or-create'
import * as BN from 'bn.js'

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
  p: IChannel
): Promise<Channel> {
  const record = await db.get(Channel, { where: { id } })
  if (record) return record

  const channel = new Channel()

  channel.version = block
  channel.id = id
  channel.title = p.title
  channel.description = p.description
  channel.isCurated = p.isCurated || false
  channel.isPublic = p.isPublic
  channel.coverPhotoUrl = p.coverPhotoURL
  channel.avatarPhotoUrl = p.avatarPhotoURL
  if (p.language) channel.language = await getOrCreate.language({ db, block, id }, classEntityMap, p.language)
  channel.happenedIn = await createBlockOrGetFromDatabase(db, block)
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

async function createKnownLicense({ db, block, id }: IDBBlockId, p: IKnownLicense): Promise<KnownLicense> {
  const record = await db.get(KnownLicense, { where: { id } })
  if (record) return record

  const knownLicence = new KnownLicense()

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
): Promise<UserDefinedLicense> {
  const record = await db.get(UserDefinedLicense, { where: { id } })
  if (record) return record

  const userDefinedLicense = new UserDefinedLicense()

  userDefinedLicense.id = id
  userDefinedLicense.content = p.content
  userDefinedLicense.version = block
  userDefinedLicense.happenedIn = await createBlockOrGetFromDatabase(db, block)
  await db.save<UserDefinedLicense>(userDefinedLicense)
  return userDefinedLicense
}

async function createJoystreamMediaLocation(
  { db, block, id }: IDBBlockId,
  p: IJoystreamMediaLocation
): Promise<JoystreamMediaLocation> {
  const record = await db.get(JoystreamMediaLocation, { where: { id } })
  if (record) return record

  const joyMediaLoc = new JoystreamMediaLocation()

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
): Promise<HttpMediaLocation> {
  const record = await db.get(HttpMediaLocation, { where: { id } })
  if (record) return record

  const httpMediaLoc = new HttpMediaLocation()

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
  p: IVideoMedia
): Promise<VideoMedia> {
  const videoMedia = new VideoMedia()

  videoMedia.id = id
  videoMedia.pixelHeight = p.pixelHeight
  videoMedia.pixelWidth = p.pixelWidth
  videoMedia.size = p.size
  videoMedia.version = block
  const { encoding, location } = p
  if (encoding) videoMedia.encoding = await getOrCreate.videoMediaEncoding({ db, block, id }, classEntityMap, encoding)
  if (location) {
    videoMedia.location = await getOrCreate.mediaLocation({ db, block, id }, classEntityMap, location)
  }
  videoMedia.happenedIn = await createBlockOrGetFromDatabase(db, block)
  await db.save(videoMedia)
  return videoMedia
}

async function createVideo({ db, block, id }: IDBBlockId, classEntityMap: ClassEntityMap, p: IVideo): Promise<Video> {
  const record = await db.get(Video, { where: { id } })
  if (record) return record

  const video = new Video()

  video.id = id
  video.title = p.title
  video.description = p.description
  video.duration = p.duration
  video.hasMarketing = p.hasMarketing
  // TODO: needs to be handled correctly, from runtime CurationStatus is coming
  video.isCurated = p.isCurated || true
  video.isExplicit = p.isExplicit
  video.isPublic = p.isPublic
  video.publishedBeforeJoystream = p.publishedBeforeJoystream
  video.skippableIntroDuration = p.skippableIntroDuration
  video.thumbnailUrl = p.thumbnailURL
  video.version = block

  const { language, license, category, channel, media } = p
  if (language) video.language = await getOrCreate.language({ db, block, id }, classEntityMap, language)
  if (license) video.license = await getOrCreate.license({ db, block, id }, classEntityMap, license)
  if (category) video.category = await getOrCreate.category({ db, block, id }, classEntityMap, category)
  if (channel) video.channel = await getOrCreate.channel({ db, block, id }, classEntityMap, channel)
  video.happenedIn = await createBlockOrGetFromDatabase(db, block)
  if (media) video.media = await getOrCreate.videoMedia({ db, block, id }, classEntityMap, media)
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
  // happenedIn is not defined in the graphql schema!
  encoding.happenedIn = await createBlockOrGetFromDatabase(db, block)
  await db.save<VideoMediaEncoding>(encoding)
  return encoding
}

async function createLicense(
  { db, block, id }: IDBBlockId,
  classEntityMap: ClassEntityMap,
  p: ILicense
): Promise<License> {
  const record = await db.get(License, { where: { id } })
  if (record) return record

  const { knownLicense, userDefinedLicense } = p

  const license = new License()
  license.id = id
  if (knownLicense)
    license.knownLicense = await getOrCreate.knownLicense({ db, block, id }, classEntityMap, knownLicense)
  if (userDefinedLicense)
    license.userdefinedLicense = await getOrCreate.userDefinedLicense(
      { db, block, id },
      classEntityMap,
      userDefinedLicense
    )
  license.happenedIn = await createBlockOrGetFromDatabase(db, block)
  await db.save<License>(license)
  return license
}

async function createMediaLocation(
  { db, block, id }: IDBBlockId,
  classEntityMap: ClassEntityMap,
  p: IMediaLocation
): Promise<MediaLocation> {
  const { httpMediaLocation, joystreamMediaLocation } = p

  const location = new MediaLocation()
  location.id = id
  if (httpMediaLocation)
    location.httpMediaLocation = await getOrCreate.httpMediaLocation(
      { db, block, id },
      classEntityMap,
      httpMediaLocation
    )
  if (joystreamMediaLocation)
    location.joystreamMediaLocation = await getOrCreate.joystreamMediaLocation(
      { db, block, id },
      classEntityMap,
      joystreamMediaLocation
    )
  location.happenedIn = await createBlockOrGetFromDatabase(db, block)
  await db.save<License>(location)
  return location
}

async function batchCreateClassEntities(db: DB, block: number, operations: ICreateEntityOperation[]): Promise<void> {
  // Create entities before adding schema support
  operations.map(async ({ classId }, index) => {
    const c = new ClassEntity()
    c.id = index.toString() // entity id
    c.classId = classId
    c.version = block
    c.happenedIn = await createBlockOrGetFromDatabase(db, block)
    await db.save<ClassEntity>(c)
  })
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
  createBlockOrGetFromDatabase,
  batchCreateClassEntities,
  getClassName,
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
