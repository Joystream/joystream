import { Channel } from '../../generated/graphql-server/src/modules/channel/channel.model'
import { Category } from '../../generated/graphql-server/src/modules/category/category.model'
import { KnownLicenseEntity } from '../../generated/graphql-server/src/modules/known-license-entity/known-license-entity.model'
import { UserDefinedLicenseEntity } from '../../generated/graphql-server/src/modules/user-defined-license-entity/user-defined-license-entity.model'
import { JoystreamMediaLocationEntity } from '../../generated/graphql-server/src/modules/joystream-media-location-entity/joystream-media-location-entity.model'
import { HttpMediaLocationEntity } from '../../generated/graphql-server/src/modules/http-media-location-entity/http-media-location-entity.model'
import { VideoMedia } from '../../generated/graphql-server/src/modules/video-media/video-media.model'
import { Language } from '../../generated/graphql-server/src/modules/language/language.model'
import { VideoMediaEncoding } from '../../generated/graphql-server/src/modules/video-media-encoding/video-media-encoding.model'
import { LicenseEntity } from '../../generated/graphql-server/src/modules/license-entity/license-entity.model'
import { MediaLocationEntity } from '../../generated/graphql-server/src/modules/media-location-entity/media-location-entity.model'
import { NextEntityId } from '../../generated/graphql-server/src/modules/next-entity-id/next-entity-id.model'

import { decode } from './decode'
import {
  categoryPropertyNamesWithId,
  channelPropertyNamesWithId,
  httpMediaLocationPropertyNamesWithId,
  joystreamMediaLocationPropertyNamesWithId,
  knownLicensePropertyNamesWIthId,
  languagePropertyNamesWIthId,
  licensePropertyNamesWithId,
  mediaLocationPropertyNamesWithId,
  userDefinedLicensePropertyNamesWithId,
  videoMediaEncodingPropertyNamesWithId,
  videoPropertyNamesWithId,
} from './content-dir-consts'
import {
  ClassEntityMap,
  ICategory,
  IChannel,
  IDBBlockId,
  IEntity,
  IHttpMediaLocation,
  IJoystreamMediaLocation,
  IKnownLicense,
  ILanguage,
  ILicense,
  IMediaLocation,
  IReference,
  IUserDefinedLicense,
  IVideoMedia,
  IVideoMediaEncoding,
} from '../types'

import {
  createCategory,
  createChannel,
  createVideoMedia,
  createUserDefinedLicense,
  createKnownLicense,
  createHttpMediaLocation,
  createJoystreamMediaLocation,
  createLanguage,
  createVideoMediaEncoding,
  createLicense,
  createMediaLocation,
} from './entity/create'

import { DB } from '../../generated/indexer'

// Keep track of the next entity id
async function nextEntityId(db: DB, nextEntityId: number): Promise<void> {
  let e = await db.get(NextEntityId, { where: { id: '1' } })
  if (!e) e = new NextEntityId({ id: '1' })
  e.nextId = nextEntityId
  await db.save<NextEntityId>(e)
}

function generateEntityIdFromIndex(index: number): string {
  return `${index}`
}

function findEntity(entityId: number, className: string, classEntityMap: ClassEntityMap): IEntity {
  const newlyCreatedEntities = classEntityMap.get(className)
  if (newlyCreatedEntities === undefined) throw Error(`Couldn't find '${className}' entities in the classEntityMap`)
  const entity = newlyCreatedEntities.find((e) => e.indexOf === entityId)
  if (!entity) throw Error(`Unknown ${className} entity id: ${entityId}`)

  // Remove the inserted entity from the list
  classEntityMap.set(
    className,
    newlyCreatedEntities.filter((e) => e.entityId !== entityId)
  )
  return entity
}

async function language(
  { db, block }: IDBBlockId,
  classEntityMap: ClassEntityMap,
  language: IReference,
  nextEntityIdBeforeTransaction: number
): Promise<Language> {
  let lang
  const { entityId, existing } = language
  if (existing) {
    lang = await db.get(Language, { where: { id: entityId.toString() } })
    if (!lang) throw Error(`Language entity not found`)
    return lang
  }

  const id = generateEntityIdFromIndex(nextEntityIdBeforeTransaction + entityId)
  // could be created in the transaction
  lang = await db.get(Language, { where: { id } })
  if (lang) return lang

  // get the entity from list of newly created entities and insert into db
  const { properties } = findEntity(entityId, 'Language', classEntityMap)
  return await createLanguage(
    { db, block, id },
    decode.setEntityPropertyValues<ILanguage>(properties, languagePropertyNamesWIthId)
  )
}

async function videoMediaEncoding(
  { db, block }: IDBBlockId,
  classEntityMap: ClassEntityMap,
  encoding: IReference,
  nextEntityIdBeforeTransaction: number
): Promise<VideoMediaEncoding> {
  let vmEncoding
  const { entityId, existing } = encoding
  if (existing) {
    vmEncoding = await db.get(VideoMediaEncoding, { where: { id: entityId.toString() } })
    if (!vmEncoding) throw Error(`VideoMediaEncoding entity not found`)
    return vmEncoding
  }

  const id = generateEntityIdFromIndex(nextEntityIdBeforeTransaction + entityId)

  // could be created in the transaction
  vmEncoding = await db.get(VideoMediaEncoding, { where: { id } })
  if (vmEncoding) return vmEncoding

  const { properties } = findEntity(entityId, 'VideoMediaEncoding', classEntityMap)
  return await createVideoMediaEncoding(
    { db, block, id },
    decode.setEntityPropertyValues<IVideoMediaEncoding>(properties, videoMediaEncodingPropertyNamesWithId)
  )
}

async function videoMedia(
  { db, block }: IDBBlockId,
  classEntityMap: ClassEntityMap,
  media: IReference,
  nextEntityIdBeforeTransaction: number
): Promise<VideoMedia> {
  let videoM: VideoMedia | undefined
  const { entityId, existing } = media
  if (existing) {
    videoM = await db.get(VideoMedia, { where: { id: entityId.toString() } })
    if (!videoM) throw Error(`VideoMedia entity not found`)
    return videoM
  }
  const id = generateEntityIdFromIndex(nextEntityIdBeforeTransaction + entityId)

  // could be created in the transaction
  videoM = await db.get(VideoMedia, { where: { id } })
  if (videoM) return videoM

  const { properties } = findEntity(entityId, 'VideoMedia', classEntityMap)
  return await createVideoMedia(
    { db, block, id },
    classEntityMap,
    decode.setEntityPropertyValues<IVideoMedia>(properties, videoPropertyNamesWithId),
    nextEntityIdBeforeTransaction
  )
}

async function knownLicense(
  { db, block }: IDBBlockId,
  classEntityMap: ClassEntityMap,
  knownLicense: IReference,
  nextEntityIdBeforeTransaction: number
): Promise<KnownLicenseEntity> {
  let kLicense: KnownLicenseEntity | undefined
  const { entityId, existing } = knownLicense
  if (existing) {
    kLicense = await db.get(KnownLicenseEntity, { where: { id: entityId.toString() } })
    if (!kLicense) throw Error(`KnownLicense entity not found`)
    return kLicense
  }
  const id = generateEntityIdFromIndex(nextEntityIdBeforeTransaction + entityId)
  // could be created in the transaction
  kLicense = await db.get(KnownLicenseEntity, { where: { id } })
  if (kLicense) return kLicense

  const { properties } = findEntity(entityId, 'KnownLicense', classEntityMap)
  return await createKnownLicense(
    { db, block, id },
    decode.setEntityPropertyValues<IKnownLicense>(properties, knownLicensePropertyNamesWIthId)
  )
}
async function userDefinedLicense(
  { db, block }: IDBBlockId,
  classEntityMap: ClassEntityMap,
  userDefinedLicense: IReference,
  nextEntityIdBeforeTransaction: number
): Promise<UserDefinedLicenseEntity> {
  let udLicense: UserDefinedLicenseEntity | undefined
  const { entityId, existing } = userDefinedLicense
  if (existing) {
    udLicense = await db.get(UserDefinedLicenseEntity, { where: { id: entityId.toString() } })
    if (!udLicense) throw Error(`UserDefinedLicense entity not found`)
    return udLicense
  }
  const id = generateEntityIdFromIndex(nextEntityIdBeforeTransaction + entityId)
  // could be created in the transaction
  udLicense = await db.get(UserDefinedLicenseEntity, {
    where: { id },
  })
  if (udLicense) return udLicense

  const { properties } = findEntity(entityId, 'UserDefinedLicense', classEntityMap)
  return await createUserDefinedLicense(
    { db, block, id },
    decode.setEntityPropertyValues<IUserDefinedLicense>(properties, userDefinedLicensePropertyNamesWithId)
  )
}

async function channel(
  { db, block }: IDBBlockId,
  classEntityMap: ClassEntityMap,
  channel: IReference,
  nextEntityIdBeforeTransaction: number
): Promise<Channel> {
  let chann: Channel | undefined
  const { entityId, existing } = channel

  if (existing) {
    chann = await db.get(Channel, { where: { id: entityId.toString() } })
    if (!chann) throw Error(`Channel entity not found`)
    return chann
  }

  const id = generateEntityIdFromIndex(nextEntityIdBeforeTransaction + entityId)
  // could be created in the transaction
  chann = await db.get(Channel, { where: { id } })
  if (chann) return chann

  const { properties } = findEntity(entityId, 'Channel', classEntityMap)
  return await createChannel(
    { db, block, id },
    classEntityMap,
    decode.setEntityPropertyValues<IChannel>(properties, channelPropertyNamesWithId),
    nextEntityIdBeforeTransaction
  )
}

async function category(
  { db, block }: IDBBlockId,
  classEntityMap: ClassEntityMap,
  category: IReference,
  nextEntityIdBeforeTransaction: number
): Promise<Category> {
  let cat: Category | undefined
  const { entityId, existing } = category

  if (existing) {
    cat = await db.get(Category, { where: { id: entityId.toString() } })
    if (!cat) throw Error(`Category entity not found`)
    return cat
  }
  const id = generateEntityIdFromIndex(nextEntityIdBeforeTransaction + entityId)
  // could be created in the transaction
  cat = await db.get(Category, { where: { id } })
  if (cat) return cat

  const { properties } = findEntity(entityId, 'Category', classEntityMap)
  return await createCategory(
    { db, block, id },
    decode.setEntityPropertyValues<ICategory>(properties, categoryPropertyNamesWithId)
  )
}

async function httpMediaLocation(
  { db, block }: IDBBlockId,
  classEntityMap: ClassEntityMap,
  httpMediaLoc: IReference,
  nextEntityIdBeforeTransaction: number
): Promise<HttpMediaLocationEntity | undefined> {
  let loc: HttpMediaLocationEntity | undefined
  const { entityId, existing } = httpMediaLoc

  if (existing) {
    loc = await db.get(HttpMediaLocationEntity, { where: { id: entityId.toString() } })
    if (!loc) throw Error(`HttpMediaLocation entity not found`)
    return loc
  }
  const id = generateEntityIdFromIndex(nextEntityIdBeforeTransaction + entityId)

  // could be created in the transaction
  loc = await db.get(HttpMediaLocationEntity, {
    where: { id },
  })
  if (loc) return loc

  const { properties } = findEntity(entityId, 'HttpMediaLocation', classEntityMap)
  return await createHttpMediaLocation(
    { db, block, id },
    decode.setEntityPropertyValues<IHttpMediaLocation>(properties, httpMediaLocationPropertyNamesWithId)
  )
}

async function joystreamMediaLocation(
  { db, block }: IDBBlockId,
  classEntityMap: ClassEntityMap,
  joyMediaLoc: IReference,
  nextEntityIdBeforeTransaction: number
): Promise<JoystreamMediaLocationEntity | undefined> {
  let loc: JoystreamMediaLocationEntity | undefined
  const { entityId, existing } = joyMediaLoc

  if (existing) {
    loc = await db.get(JoystreamMediaLocationEntity, { where: { id: entityId.toString() } })
    if (!loc) throw Error(`JoystreamMediaLocation entity not found`)
    return loc
  }

  const id = generateEntityIdFromIndex(nextEntityIdBeforeTransaction + entityId)

  // could be created in the transaction
  loc = await db.get(JoystreamMediaLocationEntity, {
    where: { id },
  })
  if (loc) return loc

  const { properties } = findEntity(entityId, 'JoystreamMediaLocation', classEntityMap)
  return await createJoystreamMediaLocation(
    { db, block, id },
    decode.setEntityPropertyValues<IJoystreamMediaLocation>(properties, joystreamMediaLocationPropertyNamesWithId)
  )
}

async function license(
  { db, block }: IDBBlockId,
  classEntityMap: ClassEntityMap,
  license: IReference,
  nextEntityIdBeforeTransaction: number
): Promise<LicenseEntity> {
  let lic: LicenseEntity | undefined
  const { entityId, existing } = license

  if (existing) {
    lic = await db.get(LicenseEntity, { where: { id: entityId.toString() } })
    if (!lic) throw Error(`License entity not found`)
    return lic
  }

  const id = generateEntityIdFromIndex(nextEntityIdBeforeTransaction + entityId)
  // could be created in the transaction
  lic = await db.get(LicenseEntity, { where: { id }, relations: ['knownLicense', 'userdefinedLicense'] })
  if (lic) return lic

  const { properties } = findEntity(entityId, 'License', classEntityMap)
  return await createLicense(
    { db, block, id },
    classEntityMap,
    decode.setEntityPropertyValues<ILicense>(properties, licensePropertyNamesWithId),
    nextEntityIdBeforeTransaction
  )
}

async function mediaLocation(
  { db, block }: IDBBlockId,
  classEntityMap: ClassEntityMap,
  location: IReference,
  nextEntityIdBeforeTransaction: number
): Promise<MediaLocationEntity> {
  let loc: MediaLocationEntity | undefined
  const { entityId, existing } = location
  if (existing) {
    loc = await db.get(MediaLocationEntity, { where: { id: entityId.toString() } })
    if (!loc) throw Error(`MediaLocation entity not found`)
    return loc
  }
  const id = generateEntityIdFromIndex(nextEntityIdBeforeTransaction + entityId)

  // could be created in the transaction
  loc = await db.get(MediaLocationEntity, {
    where: { id },
    relations: ['httpMediaLocation', 'joystreamMediaLocation'],
  })
  if (loc) {
    return loc
  }

  const { properties } = findEntity(entityId, 'MediaLocation', classEntityMap)
  return await createMediaLocation(
    { db, block, id },
    classEntityMap,
    decode.setEntityPropertyValues<IMediaLocation>(properties, mediaLocationPropertyNamesWithId),
    nextEntityIdBeforeTransaction
  )
}

export const getOrCreate = {
  language,
  videoMediaEncoding,
  videoMedia,
  knownLicense,
  userDefinedLicense,
  channel,
  category,
  joystreamMediaLocation,
  httpMediaLocation,
  license,
  mediaLocation,
  nextEntityId,
}
