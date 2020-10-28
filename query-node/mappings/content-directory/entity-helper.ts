import { DB, SubstrateEvent } from '../../generated/indexer'
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
import { decode } from './decode'
import {
  CategoryPropertyNamesWithId,
  channelPropertyNamesWithId,
  httpMediaLocationPropertyNamesWithId,
  joystreamMediaLocationPropertyNamesWithId,
  knownLicensePropertyNamesWIthId,
  languagePropertyNamesWIthId,
  userDefinedLicensePropertyNamesWithId,
  videoMediaEncodingPropertyNamesWithId,
  videoPropertyNamesWithId,
  contentDirectoryClassNamesWithId,
  ContentDirectoryKnownClasses,
} from './content-dir-consts'
import {
  ICategory,
  IChannel,
  ICreateEntityOperation,
  IDBBlockId,
  IEntity,
  IHttpMediaLocation,
  IJoystreamMediaLocation,
  IKnownLicense,
  ILanguage,
  IUserDefinedLicense,
  IVideo,
  IVideoMedia,
  IVideoMediaEncoding,
  IWhereCond,
} from '../types'

async function createBlockOrGetFromDatabase(db: DB, blockNumber: number): Promise<Block> {
  let b = await db.get(Block, { where: { block: blockNumber } })
  if (b === undefined) {
    // TODO: get timestamp from the event or extrinsic
    b = new Block({ block: blockNumber, nework: Network.BABYLON, timestamp: 123 })
    await db.save<Block>(b)
  }
  return b
}

async function createChannel({ db, block, id }: IDBBlockId, p: IChannel): Promise<void> {
  // const { properties: p } = decode.channelEntity(event);
  const channel = new Channel()

  channel.version = block
  channel.id = id
  channel.title = p.title
  channel.description = p.description
  channel.isCurated = p.isCurated || false
  channel.isPublic = p.isPublic
  channel.coverPhotoUrl = p.coverPhotoURL
  channel.avatarPhotoUrl = p.avatarPhotoURL
  channel.languageId = p.language
  channel.happenedIn = await createBlockOrGetFromDatabase(db, block)
  await db.save(channel)
}

async function createCategory({ db, block, id }: IDBBlockId, p: ICategory): Promise<void> {
  // const p = decode.categoryEntity(event);
  const category = new Category()

  category.id = id
  category.name = p.name
  category.description = p.description
  category.version = block
  category.happenedIn = await createBlockOrGetFromDatabase(db, block)
  await db.save(category)
}

async function createKnownLicense({ db, block, id }: IDBBlockId, p: IKnownLicense): Promise<void> {
  const knownLicence = new KnownLicense()

  knownLicence.id = id
  knownLicence.code = p.code
  knownLicence.name = p.name
  knownLicence.description = p.description
  knownLicence.url = p.url
  knownLicence.version = block
  knownLicence.happenedIn = await createBlockOrGetFromDatabase(db, block)
  await db.save(knownLicence)
}

async function createUserDefinedLicense({ db, block, id }: IDBBlockId, p: IUserDefinedLicense): Promise<void> {
  const userDefinedLicense = new UserDefinedLicense()

  userDefinedLicense.id = id
  userDefinedLicense.content = p.content
  userDefinedLicense.version = block
  userDefinedLicense.happenedIn = await createBlockOrGetFromDatabase(db, block)
  await db.save(userDefinedLicense)
}

async function createJoystreamMediaLocation({ db, block, id }: IDBBlockId, p: IJoystreamMediaLocation): Promise<void> {
  const joyMediaLoc = new JoystreamMediaLocation()

  joyMediaLoc.id = id
  joyMediaLoc.dataObjectId = p.dataObjectId
  joyMediaLoc.version = block
  joyMediaLoc.happenedIn = await createBlockOrGetFromDatabase(db, block)
  await db.save(joyMediaLoc)
}

async function createHttpMediaLocation({ db, block, id }: IDBBlockId, p: IHttpMediaLocation): Promise<void> {
  const httpMediaLoc = new HttpMediaLocation()

  httpMediaLoc.id = id
  httpMediaLoc.url = p.url
  httpMediaLoc.port = p.port
  httpMediaLoc.version = block
  httpMediaLoc.happenedIn = await createBlockOrGetFromDatabase(db, block)
  await db.save(httpMediaLoc)
}

async function createVideoMedia({ db, block, id }: IDBBlockId, p: IVideoMedia): Promise<void> {
  const videoMedia = new VideoMedia()

  videoMedia.id = id
  videoMedia.encodingId = p.encoding
  videoMedia.locationId = p.location
  videoMedia.pixelHeight = p.pixelHeight
  videoMedia.pixelWidth = p.pixelWidth
  videoMedia.size = p.size
  videoMedia.version = block
  videoMedia.happenedIn = await createBlockOrGetFromDatabase(db, block)
  await db.save(videoMedia)
}

async function createVideo({ db, block, id }: IDBBlockId, p: IVideo): Promise<void> {
  const video = new Video()

  video.id = id
  video.title = p.title
  video.description = p.description
  video.categoryId = p.category
  video.channelId = p.channel
  video.duration = p.duration
  video.hasMarketing = p.hasMarketing
  // TODO: needs to be handled correctly, from runtime CurationStatus is coming
  video.isCurated = p.isCurated || true
  video.isExplicit = p.isExplicit
  video.isPublic = p.isPublic
  video.languageId = p.language
  video.licenseId = p.license
  video.videoMediaId = p.media
  video.publishedBeforeJoystream = p.publishedBeforeJoystream
  video.skippableIntroDuration = p.skippableIntroDuration
  video.thumbnailUrl = p.thumbnailURL
  video.version = block
  video.happenedIn = await createBlockOrGetFromDatabase(db, block)
  await db.save<Video>(video)
}

async function createLanguage({ db, block, id }: IDBBlockId, p: ILanguage): Promise<void> {
  const language = new Language()
  language.id = id
  language.name = p.name
  language.code = p.code
  language.version = block
  language.happenedIn = await createBlockOrGetFromDatabase(db, block)

  await db.save<Language>(language)
}

async function createVideoMediaEncoding({ db, block, id }: IDBBlockId, p: IVideoMediaEncoding): Promise<void> {
  const encoding = new VideoMediaEncoding()

  encoding.id = id
  encoding.name = p.name
  encoding.version = block
  // happenedIn is not defined in the graphql schema!
  // encoding.happenedIn = await createBlockOrGetFromDatabase(db, block)
  await db.save<VideoMediaEncoding>(encoding)
}

async function batchCreateClassEntities(db: DB, block: number, operations: ICreateEntityOperation[]): Promise<void> {
  // Create entities before adding schema support
  operations.map(async ({ classId }, index) => {
    const c = new ClassEntity()
    c.id = index.toString()
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
  await db.remove<Channel>(record)
}
async function removeCategory(db: DB, where: IWhereCond): Promise<void> {
  const record = await db.get(Category, where)
  if (record === undefined) throw Error(`Category not found`)
  await db.remove<Category>(record)
}
async function removeVideoMedia(db: DB, where: IWhereCond): Promise<void> {
  const record = await db.get(VideoMedia, where)
  if (record === undefined) throw Error(`VideoMedia not found`)
  await db.remove<VideoMedia>(record)
}
async function removeVideo(db: DB, where: IWhereCond): Promise<void> {
  const record = await db.get(Video, where)
  if (record === undefined) throw Error(`Video not found`)
  await db.remove<Video>(record)
}
async function removeUserDefinedLicense(db: DB, where: IWhereCond): Promise<void> {
  const record = await db.get(UserDefinedLicense, where)
  if (record === undefined) throw Error(`UserDefinedLicense not found`)
  await db.remove<UserDefinedLicense>(record)
}
async function removeKnownLicense(db: DB, where: IWhereCond): Promise<void> {
  const record = await db.get(KnownLicense, where)
  if (record === undefined) throw Error(`KnownLicense not found`)
  await db.remove<KnownLicense>(record)
}
async function removeHttpMediaLocation(db: DB, where: IWhereCond): Promise<void> {
  const record = await db.get(HttpMediaLocation, where)
  if (record === undefined) throw Error(`HttpMediaLocation not found`)
  await db.remove<HttpMediaLocation>(record)
}
async function removeJoystreamMediaLocation(db: DB, where: IWhereCond): Promise<void> {
  const record = await db.get(JoystreamMediaLocation, where)
  if (record === undefined) throw Error(`JoystreamMediaLocation not found`)
  await db.remove<JoystreamMediaLocation>(record)
}
async function removeLanguage(db: DB, where: IWhereCond): Promise<void> {
  const record = await db.get(Language, where)
  if (record === undefined) throw Error(`Language not found`)
  await db.remove<Language>(record)
}
async function removeVideoMediaEncoding(db: DB, where: IWhereCond): Promise<void> {
  const record = await db.get(VideoMediaEncoding, where)
  if (record === undefined) throw Error(`Language not found`)
  await db.remove<VideoMediaEncoding>(record)
}

// ========Entity property value updates========

async function updateCategoryEntityPropertyValues(db: DB, where: IWhereCond, props: ICategory): Promise<void> {
  const record = await db.get(Category, where)
  if (record === undefined) throw Error(`Entity not found: ${where.where.id}`)
  Object.assign(record, props)
  await db.save<Category>(record)
}
async function updateChannelEntityPropertyValues(db: DB, where: IWhereCond, props: IChannel): Promise<void> {
  const record = await db.get(Channel, where)
  if (record === undefined) throw Error(`Entity not found: ${where.where.id}`)
  Object.assign(record, props)
  await db.save<Channel>(record)
}
async function updateVideoMediaEntityPropertyValues(db: DB, where: IWhereCond, props: IVideoMedia): Promise<void> {
  const record = await db.get(VideoMedia, where)
  if (record === undefined) throw Error(`Entity not found: ${where.where.id}`)
  Object.assign(record, props)
  await db.save<VideoMedia>(record)
}
async function updateVideoEntityPropertyValues(db: DB, where: IWhereCond, props: IVideo): Promise<void> {
  const record = await db.get(Video, where)
  if (record === undefined) throw Error(`Entity not found: ${where.where.id}`)
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

async function updateEntityPropertyValues(
  db: DB,
  event: SubstrateEvent,
  where: IWhereCond,
  className: string
): Promise<void> {
  switch (className) {
    case ContentDirectoryKnownClasses.CHANNEL:
      updateChannelEntityPropertyValues(db, where, decode.setProperties<IChannel>(event, channelPropertyNamesWithId))
      break

    case ContentDirectoryKnownClasses.CATEGORY:
      await updateCategoryEntityPropertyValues(
        db,
        where,
        decode.setProperties<ICategory>(event, CategoryPropertyNamesWithId)
      )
      break

    case ContentDirectoryKnownClasses.KNOWNLICENSE:
      await updateKnownLicenseEntityPropertyValues(
        db,
        where,
        decode.setProperties<IKnownLicense>(event, knownLicensePropertyNamesWIthId)
      )
      break

    case ContentDirectoryKnownClasses.USERDEFINEDLICENSE:
      await updateUserDefinedLicenseEntityPropertyValues(
        db,
        where,
        decode.setProperties<IUserDefinedLicense>(event, userDefinedLicensePropertyNamesWithId)
      )
      break

    case ContentDirectoryKnownClasses.JOYSTREAMMEDIALOCATION:
      await updateJoystreamMediaLocationEntityPropertyValues(
        db,
        where,
        decode.setProperties<IJoystreamMediaLocation>(event, joystreamMediaLocationPropertyNamesWithId)
      )
      break

    case ContentDirectoryKnownClasses.HTTPMEDIALOCATION:
      await updateHttpMediaLocationEntityPropertyValues(
        db,
        where,
        decode.setProperties<IHttpMediaLocation>(event, httpMediaLocationPropertyNamesWithId)
      )
      break

    case ContentDirectoryKnownClasses.VIDEOMEDIA:
      await updateVideoMediaEntityPropertyValues(
        db,
        where,
        decode.setProperties<IVideoMedia>(event, videoPropertyNamesWithId)
      )
      break

    case ContentDirectoryKnownClasses.VIDEO:
      await updateVideoEntityPropertyValues(db, where, decode.setProperties<IVideo>(event, videoPropertyNamesWithId))
      break

    case ContentDirectoryKnownClasses.LANGUAGE:
      await updateLanguageEntityPropertyValues(
        db,
        where,
        decode.setProperties<ILanguage>(event, languagePropertyNamesWIthId)
      )
      break

    case ContentDirectoryKnownClasses.VIDEOMEDIAENCODING:
      await updateVideoMediaEncodingEntityPropertyValues(
        db,
        where,
        decode.setProperties<IVideoMediaEncoding>(event, videoMediaEncodingPropertyNamesWithId)
      )
      break

    default:
      throw new Error(`Unknown class name: ${className}`)
  }
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
  updateEntityPropertyValues,
}
