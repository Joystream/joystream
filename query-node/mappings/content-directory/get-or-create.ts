import { Channel } from '../../generated/graphql-server/src/modules/channel/channel.model'
import { Category } from '../../generated/graphql-server/src/modules/category/category.model'
import { KnownLicense } from '../../generated/graphql-server/src/modules/known-license/known-license.model'
import { UserDefinedLicense } from '../../generated/graphql-server/src/modules/user-defined-license/user-defined-license.model'
import { JoystreamMediaLocation } from '../../generated/graphql-server/src/modules/joystream-media-location/joystream-media-location.model'
import { HttpMediaLocation } from '../../generated/graphql-server/src/modules/http-media-location/http-media-location.model'
import { VideoMedia } from '../../generated/graphql-server/src/modules/video-media/video-media.model'
import { Language } from '../../generated/graphql-server/src/modules/language/language.model'
import { VideoMediaEncoding } from '../../generated/graphql-server/src/modules/video-media-encoding/video-media-encoding.model'
import { License } from '../../generated/graphql-server/src/modules/license/license.model'
import { MediaLocation } from '../../generated/graphql-server/src/modules/media-location/media-location.model'

import { decode } from './decode'
import {
  CategoryPropertyNamesWithId,
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
  createHttpMediaLocation,
  createJoystreamMediaLocation,
  createKnownLicense,
  createLanguage,
  createLicense,
  createMediaLocation,
  createUserDefinedLicense,
  createVideoMedia,
  createVideoMediaEncoding,
} from './entity-helper'

function generateEntityIdFromIndex(index: number): string {
  return `${index + 1}`
}

function findEntity(entityId: number, className: string, classEntityMap: ClassEntityMap): IEntity {
  const newlyCreatedEntities = classEntityMap.get(className)
  if (newlyCreatedEntities === undefined) throw Error(`Couldn't find '${className}' entities in the classEntityMap`)
  const entity = newlyCreatedEntities.find((e) => e.indexOf === entityId)
  if (!entity) throw Error(`Unknown ${className} entity id: ${entityId}`)
  removeInsertedEntity(className, entityId, classEntityMap)
  return entity
}

async function language(
  { db, block }: IDBBlockId,
  classEntityMap: ClassEntityMap,
  language: IReference
): Promise<Language> {
  let lang
  const { entityId, existing } = language
  if (existing) {
    lang = await db.get(Language, { where: { id: entityId.toString() } })
    if (!lang) throw Error(`Language entity not found`)
    return lang
  }

  // could be created in the transaction
  lang = await db.get(Language, { where: { id: generateEntityIdFromIndex(entityId) } })
  if (lang) return lang

  // get the entity from list of newly created entities and insert into db
  const { properties } = findEntity(entityId, 'Language', classEntityMap)
  return await createLanguage(
    { db, block, id: generateEntityIdFromIndex(entityId) },
    decode.setEntityPropertyValues<ILanguage>(properties, languagePropertyNamesWIthId)
  )
}

async function videoMediaEncoding(
  { db, block }: IDBBlockId,
  classEntityMap: ClassEntityMap,
  encoding: IReference
): Promise<VideoMediaEncoding> {
  let vmEncoding
  const { entityId, existing } = encoding
  if (existing) {
    vmEncoding = await db.get(VideoMediaEncoding, { where: { id: entityId.toString() } })
    if (!vmEncoding) throw Error(`VideoMediaEncoding entity not found`)
    return vmEncoding
  }

  // could be created in the transaction
  vmEncoding = await db.get(VideoMediaEncoding, { where: { id: generateEntityIdFromIndex(entityId) } })
  if (vmEncoding) return vmEncoding

  const { properties } = findEntity(entityId, 'VideoMediaEncoding', classEntityMap)
  return await createVideoMediaEncoding(
    { db, block, id: generateEntityIdFromIndex(entityId) },
    decode.setEntityPropertyValues<IVideoMediaEncoding>(properties, videoMediaEncodingPropertyNamesWithId)
  )
}

async function videoMedia(
  { db, block }: IDBBlockId,
  classEntityMap: ClassEntityMap,
  media: IReference
): Promise<VideoMedia> {
  let videoM: VideoMedia | undefined
  const { entityId, existing } = media
  if (existing) {
    videoM = await db.get(VideoMedia, { where: { id: entityId.toString() } })
    if (!videoM) throw Error(`VideoMedia entity not found`)
    return videoM
  }

  // could be created in the transaction
  videoM = await db.get(VideoMedia, { where: { id: generateEntityIdFromIndex(entityId) } })
  if (videoM) return videoM

  const { properties } = findEntity(entityId, 'VideoMedia', classEntityMap)
  return await createVideoMedia(
    { db, block, id: generateEntityIdFromIndex(entityId) },
    classEntityMap,
    decode.setEntityPropertyValues<IVideoMedia>(properties, videoPropertyNamesWithId)
  )
}

async function knownLicense(
  { db, block }: IDBBlockId,
  classEntityMap: ClassEntityMap,
  knownLicense: IReference
): Promise<KnownLicense> {
  let kLicense: KnownLicense | undefined
  const { entityId, existing } = knownLicense
  if (existing) {
    kLicense = await db.get(KnownLicense, { where: { id: entityId.toString() } })
    if (!kLicense) throw Error(`KnownLicense entity not found`)
    return kLicense
  }

  // could be created in the transaction
  kLicense = await db.get(KnownLicense, { where: { id: generateEntityIdFromIndex(entityId) } })
  if (kLicense) return kLicense

  const { properties } = findEntity(entityId, 'KnownLicense', classEntityMap)
  return await createKnownLicense(
    { db, block, id: generateEntityIdFromIndex(entityId) },
    decode.setEntityPropertyValues<IKnownLicense>(properties, knownLicensePropertyNamesWIthId)
  )
}
async function userDefinedLicense(
  { db, block }: IDBBlockId,
  classEntityMap: ClassEntityMap,
  userDefinedLicense: IReference
): Promise<UserDefinedLicense> {
  let udLicense: UserDefinedLicense | undefined
  const { entityId, existing } = userDefinedLicense
  if (existing) {
    udLicense = await db.get(UserDefinedLicense, { where: { id: entityId.toString() } })
    if (!udLicense) throw Error(`UserDefinedLicense entity not found`)
    return udLicense
  }

  // could be created in the transaction
  udLicense = await db.get(UserDefinedLicense, { where: { id: generateEntityIdFromIndex(entityId) } })
  if (udLicense) return udLicense

  const { properties } = findEntity(entityId, 'UserDefinedLicense', classEntityMap)
  return await createUserDefinedLicense(
    { db, block, id: generateEntityIdFromIndex(entityId) },
    decode.setEntityPropertyValues<IUserDefinedLicense>(properties, userDefinedLicensePropertyNamesWithId)
  )
}

async function channel(
  { db, block }: IDBBlockId,
  classEntityMap: ClassEntityMap,
  channel: IReference
): Promise<Channel> {
  let chann: Channel | undefined
  const { entityId, existing } = channel

  if (existing) {
    chann = await db.get(Channel, { where: { id: entityId.toString() } })
    if (!chann) throw Error(`Channel entity not found`)
    return chann
  }

  // could be created in the transaction
  chann = await db.get(Channel, { where: { id: generateEntityIdFromIndex(entityId) } })
  if (chann) return chann

  const { properties } = findEntity(entityId, 'Channel', classEntityMap)
  return await createChannel(
    { db, block, id: generateEntityIdFromIndex(entityId) },
    classEntityMap,
    decode.setEntityPropertyValues<IChannel>(properties, channelPropertyNamesWithId)
  )
}

async function category(
  { db, block }: IDBBlockId,
  classEntityMap: ClassEntityMap,
  category: IReference
): Promise<Category> {
  let cat: Category | undefined
  const { entityId, existing } = category

  if (existing) {
    cat = await db.get(Category, { where: { id: entityId.toString() } })
    if (!cat) throw Error(`Category entity not found`)
    return cat
  }

  // could be created in the transaction
  cat = await db.get(Category, { where: { id: generateEntityIdFromIndex(entityId) } })
  if (cat) return cat

  const { properties } = findEntity(entityId, 'Category', classEntityMap)
  return await createCategory(
    { db, block, id: generateEntityIdFromIndex(entityId) },
    decode.setEntityPropertyValues<ICategory>(properties, CategoryPropertyNamesWithId)
  )
}

async function httpMediaLocation(
  { db, block }: IDBBlockId,
  classEntityMap: ClassEntityMap,
  httpMediaLoc: IReference
): Promise<HttpMediaLocation | undefined> {
  let loc: HttpMediaLocation | undefined
  const { entityId, existing } = httpMediaLoc

  if (existing) {
    loc = await db.get(HttpMediaLocation, { where: { id: entityId.toString() } })
    if (!loc) throw Error(`HttpMediaLocation entity not found`)
    return loc
  }

  // could be created in the transaction
  loc = await db.get(HttpMediaLocation, { where: { id: generateEntityIdFromIndex(entityId) } })
  if (loc) return loc

  const { properties } = findEntity(entityId, 'HttpMediaLocation', classEntityMap)
  return await createHttpMediaLocation(
    { db, block, id: generateEntityIdFromIndex(entityId) },
    decode.setEntityPropertyValues<IHttpMediaLocation>(properties, httpMediaLocationPropertyNamesWithId)
  )
}

async function joystreamMediaLocation(
  { db, block }: IDBBlockId,
  classEntityMap: ClassEntityMap,
  joyMediaLoc: IReference
): Promise<JoystreamMediaLocation | undefined> {
  let loc: JoystreamMediaLocation | undefined
  const { entityId, existing } = joyMediaLoc

  if (existing) {
    loc = await db.get(JoystreamMediaLocation, { where: { id: entityId.toString() } })
    if (!loc) throw Error(`JoystreamMediaLocation entity not found`)
    return loc
  }

  // could be created in the transaction
  loc = await db.get(JoystreamMediaLocation, { where: { id: generateEntityIdFromIndex(entityId) } })
  if (loc) return loc

  const { properties } = findEntity(entityId, 'JoystreamMediaLocation', classEntityMap)
  return await createJoystreamMediaLocation(
    { db, block, id: generateEntityIdFromIndex(entityId) },
    decode.setEntityPropertyValues<IJoystreamMediaLocation>(properties, joystreamMediaLocationPropertyNamesWithId)
  )
}

async function license(
  { db, block }: IDBBlockId,
  classEntityMap: ClassEntityMap,
  license: IReference
): Promise<License> {
  let lic: License | undefined
  const { entityId, existing } = license

  if (existing) {
    lic = await db.get(License, { where: { id: entityId.toString() } })
    if (!lic) throw Error(`License entity not found`)
    return lic
  }

  // could be created in the transaction
  lic = await db.get(License, { where: { id: generateEntityIdFromIndex(entityId) } })
  if (lic) return lic

  const { properties } = findEntity(entityId, 'License', classEntityMap)
  return await createLicense(
    { db, block, id: generateEntityIdFromIndex(entityId) },
    classEntityMap,
    decode.setEntityPropertyValues<ILicense>(properties, licensePropertyNamesWithId)
  )
}

async function mediaLocation(
  { db, block }: IDBBlockId,
  classEntityMap: ClassEntityMap,
  location: IReference
): Promise<MediaLocation> {
  let loc: MediaLocation | undefined
  const { entityId, existing } = location
  if (existing) {
    loc = await db.get(MediaLocation, { where: { id: entityId.toString() } })
    if (!loc) throw Error(`MediaLocation entity not found`)
    return loc
  }

  // could be created in the transaction
  loc = await db.get(MediaLocation, { where: { id: generateEntityIdFromIndex(entityId) } })
  if (loc) return loc

  const { properties } = findEntity(entityId, 'MediaLocation', classEntityMap)
  return await createMediaLocation(
    { db, block, id: generateEntityIdFromIndex(entityId) },
    classEntityMap,
    decode.setEntityPropertyValues<IMediaLocation>(properties, mediaLocationPropertyNamesWithId)
  )
}

function removeInsertedEntity(key: string, insertedEntityId: number, classEntityMap: ClassEntityMap) {
  const newlyCreatedEntities = classEntityMap.get(key)
  // Remove the inserted entity from the list
  classEntityMap.set(
    key,
    newlyCreatedEntities!.filter((e) => e.entityId !== insertedEntityId)
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
}
