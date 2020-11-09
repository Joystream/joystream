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
  return entity
}

async function language(
  { db, block }: IDBBlockId,
  classEntityMap: ClassEntityMap,
  entityId: number
): Promise<Language> {
  const entity = findEntity(entityId, 'Language', classEntityMap)
  const record = await createLanguage(
    { db, block, id: generateEntityIdFromIndex(entityId) },
    decode.setEntityPropertyValues<ILanguage>(entity.properties, languagePropertyNamesWIthId)
  )
  removeInsertedEntity('Language', entityId, classEntityMap)
  return record
}

async function videoMediaEncoding(
  { db, block }: IDBBlockId,
  classEntityMap: ClassEntityMap,
  entityId: number
): Promise<VideoMediaEncoding> {
  const entity = findEntity(entityId, 'VideoMediaEncoding', classEntityMap)
  const record = await createVideoMediaEncoding(
    { db, block, id: generateEntityIdFromIndex(entityId) },
    decode.setEntityPropertyValues<IVideoMediaEncoding>(entity.properties, videoMediaEncodingPropertyNamesWithId)
  )
  removeInsertedEntity('VideoMediaEncoding', entityId, classEntityMap)
  return record
}

async function videoMedia(
  { db, block }: IDBBlockId,
  classEntityMap: ClassEntityMap,
  entityId: number
): Promise<VideoMedia> {
  const entity = findEntity(entityId, 'VideoMedia', classEntityMap)
  const record = await createVideoMedia(
    { db, block, id: generateEntityIdFromIndex(entityId) },
    classEntityMap,
    decode.setEntityPropertyValues<IVideoMedia>(entity.properties, videoPropertyNamesWithId)
  )
  removeInsertedEntity('VideoMedia', entityId, classEntityMap)
  return record
}

async function knownLicense(
  { db, block }: IDBBlockId,
  classEntityMap: ClassEntityMap,
  entityId: number
): Promise<KnownLicense> {
  const entity = findEntity(entityId, 'KnownLicense', classEntityMap)
  const record = await createKnownLicense(
    { db, block, id: generateEntityIdFromIndex(entityId) },
    decode.setEntityPropertyValues<IKnownLicense>(entity.properties, knownLicensePropertyNamesWIthId)
  )
  removeInsertedEntity('KnownLicense', entityId, classEntityMap)
  return record
}
async function userDefinedLicense(
  { db, block }: IDBBlockId,
  classEntityMap: ClassEntityMap,
  entityId: number
): Promise<UserDefinedLicense> {
  const entity = findEntity(entityId, 'UserDefinedLicense', classEntityMap)
  const record = await createUserDefinedLicense(
    { db, block, id: generateEntityIdFromIndex(entityId) },
    decode.setEntityPropertyValues<IUserDefinedLicense>(entity.properties, userDefinedLicensePropertyNamesWithId)
  )
  removeInsertedEntity('UserDefinedLicense', entityId, classEntityMap)
  return record
}
async function channel({ db, block }: IDBBlockId, classEntityMap: ClassEntityMap, entityId: number): Promise<Channel> {
  const entity = findEntity(entityId, 'Channel', classEntityMap)
  const record = await createChannel(
    { db, block, id: generateEntityIdFromIndex(entityId) },
    classEntityMap,
    decode.setEntityPropertyValues<IChannel>(entity.properties, channelPropertyNamesWithId)
  )
  removeInsertedEntity('Channel', entityId, classEntityMap)
  return record
}
async function category(
  { db, block }: IDBBlockId,
  classEntityMap: ClassEntityMap,
  entityId: number
): Promise<Category> {
  const entity = findEntity(entityId, 'Category', classEntityMap)
  const record = await createCategory(
    { db, block, id: generateEntityIdFromIndex(entityId) },
    decode.setEntityPropertyValues<ICategory>(entity.properties, CategoryPropertyNamesWithId)
  )
  removeInsertedEntity('Category', entityId, classEntityMap)
  return record
}

async function httpMediaLocation(
  { db, block }: IDBBlockId,
  classEntityMap: ClassEntityMap,
  entityId: number
): Promise<HttpMediaLocation | undefined> {
  const entity = findEntity(entityId, 'HttpMediaLocation', classEntityMap)
  const record = await createHttpMediaLocation(
    { db, block, id: generateEntityIdFromIndex(entityId) },
    decode.setEntityPropertyValues<IHttpMediaLocation>(entity.properties, httpMediaLocationPropertyNamesWithId)
  )
  removeInsertedEntity('HttpMediaLocation', entityId, classEntityMap)
  return record
}

async function joystreamMediaLocation(
  { db, block }: IDBBlockId,
  classEntityMap: ClassEntityMap,
  entityId: number
): Promise<JoystreamMediaLocation | undefined> {
  const entity = findEntity(entityId, 'JoystreamMediaLocation', classEntityMap)
  const record = await createJoystreamMediaLocation(
    { db, block, id: generateEntityIdFromIndex(entityId) },
    decode.setEntityPropertyValues<IJoystreamMediaLocation>(
      entity.properties,
      joystreamMediaLocationPropertyNamesWithId
    )
  )
  removeInsertedEntity('JoystreamMediaLocation', entityId, classEntityMap)
  return record
}

async function license({ db, block }: IDBBlockId, classEntityMap: ClassEntityMap, entityId: number): Promise<License> {
  const entity = findEntity(entityId, 'License', classEntityMap)
  const record = await createLicense(
    { db, block, id: generateEntityIdFromIndex(entityId) },
    classEntityMap,
    decode.setEntityPropertyValues<ILicense>(entity.properties, licensePropertyNamesWithId)
  )
  removeInsertedEntity('License', entityId, classEntityMap)
  return record
}

async function mediaLocation(
  { db, block }: IDBBlockId,
  classEntityMap: ClassEntityMap,
  entityId: number
): Promise<MediaLocation> {
  const entity = findEntity(entityId, 'MediaLocation', classEntityMap)
  const record = await createMediaLocation(
    { db, block, id: generateEntityIdFromIndex(entityId) },
    classEntityMap,
    decode.setEntityPropertyValues<IMediaLocation>(entity.properties, mediaLocationPropertyNamesWithId)
  )
  removeInsertedEntity('MediaLocation', entityId, classEntityMap)
  return record
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
