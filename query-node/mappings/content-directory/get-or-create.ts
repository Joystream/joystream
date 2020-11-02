import { Channel } from '../../generated/graphql-server/src/modules/channel/channel.model'
import { Category } from '../../generated/graphql-server/src/modules/category/category.model'
import { KnownLicense } from '../../generated/graphql-server/src/modules/known-license/known-license.model'
import { UserDefinedLicense } from '../../generated/graphql-server/src/modules/user-defined-license/user-defined-license.model'
import { JoystreamMediaLocation } from '../../generated/graphql-server/src/modules/joystream-media-location/joystream-media-location.model'
import { HttpMediaLocation } from '../../generated/graphql-server/src/modules/http-media-location/http-media-location.model'
import { VideoMedia } from '../../generated/graphql-server/src/modules/video-media/video-media.model'
import { Language } from '../../generated/graphql-server/src/modules/language/language.model'
import { VideoMediaEncoding } from '../../generated/graphql-server/src/modules/video-media-encoding/video-media-encoding.model'
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
  createUserDefinedLicense,
  createVideoMedia,
  createVideoMediaEncoding,
} from './entity-helper'

function findEntity(entityId: number, newlyCreatedEntities: IEntity[]): IEntity | undefined {
  const entity = newlyCreatedEntities.find((e) => e.indexOf === entityId)
  if (!entity) {
    console.log(`Unknown entity id: ${entityId}`)
    return
  }
  return entity
}

async function language(
  { db, block }: IDBBlockId,
  classEntityMap: ClassEntityMap,
  entityId: number
): Promise<Language> {
  let record = await db.get(Language, { where: { id: entityId.toString() } })
  if (record) return record
  const newlyCreatedEntities = classEntityMap.get('Language')

  if (newlyCreatedEntities) {
    const entity = findEntity(entityId, newlyCreatedEntities)
    if (!entity) throw Error(`Unknown Language entity id`)

    record = await createLanguage(
      { db, block, id: entityId.toString() },
      decode.setEntityPropertyValues<ILanguage>(entity.properties, languagePropertyNamesWIthId)
    )
  }
  if (!record) throw Error(`Language entity not found on the database`)
  removeInsertedEntity('Language', entityId, classEntityMap)
  return record
}

async function videoMediaEncoding(
  { db, block }: IDBBlockId,
  classEntityMap: ClassEntityMap,
  entityId: number
): Promise<VideoMediaEncoding> {
  let record = await db.get(VideoMediaEncoding, { where: { id: entityId.toString() } })
  if (record) return record
  const newlyCreatedEntities = classEntityMap.get('VideoMediaEncoding')
  if (newlyCreatedEntities) {
    const entity = findEntity(entityId, newlyCreatedEntities)
    if (!entity) throw Error(`Unknown VideoMediaEncoding entity id`)

    record = await createVideoMediaEncoding(
      { db, block, id: entityId.toString() },
      decode.setEntityPropertyValues<IVideoMediaEncoding>(entity.properties, videoMediaEncodingPropertyNamesWithId)
    )
  }

  if (!record) throw Error(`VideoMediaEncoding entity not found on the database`)
  removeInsertedEntity('VideoMediaEncoding', entityId, classEntityMap)
  return record
}

async function videoMedia(
  { db, block }: IDBBlockId,
  classEntityMap: ClassEntityMap,
  entityId: number
): Promise<VideoMedia> {
  let record = await db.get(VideoMedia, { where: { id: entityId.toString() } })
  if (record) return record

  const newlyCreatedEntities = classEntityMap.get('VideoMedia')
  if (newlyCreatedEntities) {
    const entity = findEntity(entityId, newlyCreatedEntities)
    if (!entity) throw Error(`Unknown VideoMedia entity id`)

    record = await createVideoMedia(
      { db, block, id: entityId.toString() },
      classEntityMap,
      decode.setEntityPropertyValues<IVideoMedia>(entity.properties, videoPropertyNamesWithId)
    )
  }

  if (!record) throw Error(`Video entity not found on the database`)
  removeInsertedEntity('VideoMedia', entityId, classEntityMap)
  return record
}

async function knownLicense(
  { db, block }: IDBBlockId,
  classEntityMap: ClassEntityMap,
  entityId: number
): Promise<KnownLicense | undefined> {
  let record = await db.get(KnownLicense, { where: { id: entityId.toString() } })
  if (record) return record

  const newlyCreatedEntities = classEntityMap.get('KnownLicense')
  if (newlyCreatedEntities) {
    const entity = findEntity(entityId, newlyCreatedEntities)
    if (!entity) {
      console.log(`Unknown KnownLicense entity id`)
      return
    }

    record = await createKnownLicense(
      { db, block, id: entityId.toString() },
      decode.setEntityPropertyValues<IKnownLicense>(entity.properties, knownLicensePropertyNamesWIthId)
    )
  }

  if (!record) throw Error(`KnownLicense entity not found on the database`)
  removeInsertedEntity('KnownLicense', entityId, classEntityMap)
  return record
}
async function userDefinedLicense(
  { db, block }: IDBBlockId,
  classEntityMap: ClassEntityMap,
  entityId: number
): Promise<UserDefinedLicense | undefined> {
  let record = await db.get(UserDefinedLicense, { where: { id: entityId.toString() } })
  if (record) return record

  const newlyCreatedEntities = classEntityMap.get('UserDefinedLicense')
  if (newlyCreatedEntities) {
    const entity = findEntity(entityId, newlyCreatedEntities)
    if (!entity) {
      console.log(`Unknown UserDefinedLicense entity id`)
      return
    }
    record = await createUserDefinedLicense(
      { db, block, id: entityId.toString() },
      decode.setEntityPropertyValues<IUserDefinedLicense>(entity.properties, userDefinedLicensePropertyNamesWithId)
    )
  }
  if (!record) {
    console.log(`UserDefinedLicense entity not found on the database`)
    return
  }
  removeInsertedEntity('UserDefinedLicense', entityId, classEntityMap)
  return record
}
async function channel({ db, block }: IDBBlockId, classEntityMap: ClassEntityMap, entityId: number): Promise<Channel> {
  let record = await db.get(Channel, { where: { id: entityId.toString() } })
  if (record) return record

  const newlyCreatedEntities = classEntityMap.get('Channel')
  if (newlyCreatedEntities) {
    const entity = findEntity(entityId, newlyCreatedEntities)
    if (!entity) throw Error(`Unknown Channel entity id`)

    record = await createChannel(
      { db, block, id: entityId.toString() },
      classEntityMap,
      decode.setEntityPropertyValues<IChannel>(entity.properties, channelPropertyNamesWithId)
    )
  }

  if (!record) throw Error(`Channel entity not found on the database`)
  removeInsertedEntity('Channel', entityId, classEntityMap)
  return record
}
async function category(
  { db, block }: IDBBlockId,
  classEntityMap: ClassEntityMap,
  entityId: number
): Promise<Category> {
  let record = await db.get(Category, { where: { id: entityId.toString() } })
  if (record) return record

  const newlyCreatedEntities = classEntityMap.get('Category')
  if (newlyCreatedEntities) {
    const entity = findEntity(entityId, newlyCreatedEntities)
    if (!entity) throw Error(`Unknown Category entity id`)

    record = await createCategory(
      { db, block, id: entityId.toString() },
      decode.setEntityPropertyValues<ICategory>(entity.properties, CategoryPropertyNamesWithId)
    )
  }

  if (!record) throw Error(`Category entity not found on the database`)
  removeInsertedEntity('Category', entityId, classEntityMap)
  return record
}

async function httpMediaLocation(
  { db, block }: IDBBlockId,
  classEntityMap: ClassEntityMap,
  entityId: number
): Promise<HttpMediaLocation | undefined> {
  let record = await db.get(HttpMediaLocation, { where: { id: entityId.toString() } })
  if (record) return record

  const newlyCreatedEntities = classEntityMap.get('HttpMediaLocation')
  if (newlyCreatedEntities) {
    const entity = findEntity(entityId, newlyCreatedEntities)
    if (!entity) {
      console.log(`Unknown HttpMediaLocation entity id`)
      return
    }
    record = await createHttpMediaLocation(
      { db, block, id: entityId.toString() },
      decode.setEntityPropertyValues<IHttpMediaLocation>(entity.properties, httpMediaLocationPropertyNamesWithId)
    )
  }
  if (!record) {
    console.log(`HttpMediaLocation entity not found on the database`)
    return
  }
  removeInsertedEntity('HttpMediaLocation', entityId, classEntityMap)
  return record
}

async function joystreamMediaLocation(
  { db, block }: IDBBlockId,
  classEntityMap: ClassEntityMap,
  entityId: number
): Promise<JoystreamMediaLocation | undefined> {
  let record = await db.get(JoystreamMediaLocation, { where: { id: entityId.toString() } })
  if (record) return record

  const newlyCreatedEntities = classEntityMap.get('JoystreamMediaLocation')
  if (newlyCreatedEntities) {
    const entity = findEntity(entityId, newlyCreatedEntities)
    if (!entity) throw Error(`Unknown JoystreamMediaLocation entity id`)

    record = await createJoystreamMediaLocation(
      { db, block, id: entityId.toString() },
      decode.setEntityPropertyValues<IJoystreamMediaLocation>(
        entity.properties,
        joystreamMediaLocationPropertyNamesWithId
      )
    )
  }

  if (!record) {
    console.log(`JoystreamMediaLocation entity not found on the database`)
    return
  }
  removeInsertedEntity('JoystreamMediaLocation', entityId, classEntityMap)
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
}
