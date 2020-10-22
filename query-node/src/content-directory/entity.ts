import Debug from 'debug'
import { DB, SubstrateEvent } from '../../generated/indexer'
import { ClassEntity } from '../../generated/graphql-server/src/modules/class-entity/class-entity.model'

import { decode } from './decode'
import {
  createCategory,
  createChannel,
  createVideoMedia,
  createVideo,
  createUserDefinedLicense,
  createKnownLicense,
  createHttpMediaLocation,
  createJoystreamMediaLocation,
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
  createLanguage,
  createVideoMediaEncoding,
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
} from './entity-helper'
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
  IChannel,
  ICategory,
  IKnownLicense,
  IUserDefinedLicense,
  IJoystreamMediaLocation,
  IHttpMediaLocation,
  IVideoMedia,
  IVideo,
  ILanguage,
  IVideoMediaEncoding,
  IDBBlockId,
  IWhereCond,
} from '../types'

const debug = Debug('mappings:content-directory')

// eslint-disable-next-line @typescript-eslint/naming-convention
async function contentDirectory_EntitySchemaSupportAdded(db: DB, event: SubstrateEvent): Promise<void> {
  if (event.extrinsic && event.extrinsic.method === 'transaction') return
  debug(`EntitySchemaSupportAdded event: ${JSON.stringify(event)}`)

  const { blockNumber: block } = event
  const entityId = decode.stringIfyEntityId(event)
  const classEntity = await db.get(ClassEntity, { where: { id: entityId } })

  if (classEntity === undefined) throw Error(`Class not found for the EntityId: ${entityId}`)

  const cls = contentDirectoryClassNamesWithId.find((c) => c.classId === classEntity.classId)
  if (cls === undefined) throw Error('Not recognized class')

  const arg: IDBBlockId = { db, block, id: entityId }

  switch (cls.name) {
    case ContentDirectoryKnownClasses.CHANNEL:
      await createChannel(arg, decode.setProperties<IChannel>(event, channelPropertyNamesWithId))
      break

    case ContentDirectoryKnownClasses.CATEGORY:
      await createCategory(arg, decode.setProperties<ICategory>(event, CategoryPropertyNamesWithId))
      break

    case ContentDirectoryKnownClasses.KNOWNLICENSE:
      await createKnownLicense(arg, decode.setProperties<IKnownLicense>(event, knownLicensePropertyNamesWIthId))
      break

    case ContentDirectoryKnownClasses.USERDEFINEDLICENSE:
      await createUserDefinedLicense(
        arg,
        decode.setProperties<IUserDefinedLicense>(event, userDefinedLicensePropertyNamesWithId)
      )
      break

    case ContentDirectoryKnownClasses.JOYSTREAMMEDIALOCATION:
      await createJoystreamMediaLocation(
        arg,
        decode.setProperties<IJoystreamMediaLocation>(event, joystreamMediaLocationPropertyNamesWithId)
      )
      break

    case ContentDirectoryKnownClasses.HTTPMEDIALOCATION:
      await createHttpMediaLocation(
        arg,
        decode.setProperties<IHttpMediaLocation>(event, httpMediaLocationPropertyNamesWithId)
      )
      break

    case ContentDirectoryKnownClasses.VIDEOMEDIA:
      await createVideoMedia(arg, decode.setProperties<IVideoMedia>(event, videoPropertyNamesWithId))
      break

    case ContentDirectoryKnownClasses.VIDEO:
      await createVideo(arg, decode.setProperties<IVideo>(event, videoPropertyNamesWithId))
      break

    case ContentDirectoryKnownClasses.LANGUAGE:
      await createLanguage(arg, decode.setProperties<ILanguage>(event, languagePropertyNamesWIthId))
      break

    case ContentDirectoryKnownClasses.VIDEOMEDIAENCODING:
      await createVideoMediaEncoding(
        arg,
        decode.setProperties<IVideoMediaEncoding>(event, videoMediaEncodingPropertyNamesWithId)
      )
      break

    default:
      throw new Error(`Unknown class name: ${cls.name}`)
  }
}

// eslint-disable-next-line @typescript-eslint/naming-convention
async function contentDirectory_EntityRemoved(db: DB, event: SubstrateEvent): Promise<void> {
  debug(`EntityRemoved event: ${JSON.stringify(event)}`)

  const entityId = decode.stringIfyEntityId(event)
  const where: IWhereCond = { where: { id: entityId } }

  const classEntity = await db.get(ClassEntity, where)
  if (classEntity === undefined) throw Error(`Class not found for the EntityId: ${entityId}`)

  const cls = contentDirectoryClassNamesWithId.find((c) => c.classId === classEntity.classId)
  if (cls === undefined) throw Error('Undefined class')

  switch (cls.name) {
    case ContentDirectoryKnownClasses.CHANNEL:
      await removeChannel(db, where)
      break

    case ContentDirectoryKnownClasses.CATEGORY:
      await removeCategory(db, where)
      break

    case ContentDirectoryKnownClasses.KNOWNLICENSE:
      await removeKnownLicense(db, where)
      break

    case ContentDirectoryKnownClasses.USERDEFINEDLICENSE:
      await removeUserDefinedLicense(db, where)
      break

    case ContentDirectoryKnownClasses.JOYSTREAMMEDIALOCATION:
      await removeJoystreamMediaLocation(db, where)
      break

    case ContentDirectoryKnownClasses.HTTPMEDIALOCATION:
      await removeHttpMediaLocation(db, where)
      break

    case ContentDirectoryKnownClasses.VIDEOMEDIA:
      await removeVideoMedia(db, where)
      break

    case ContentDirectoryKnownClasses.VIDEO:
      await removeVideo(db, where)
      break
    case ContentDirectoryKnownClasses.LANGUAGE:
      await removeLanguage(db, where)
      break

    case ContentDirectoryKnownClasses.VIDEOMEDIAENCODING:
      await removeVideoMediaEncoding(db, where)
      break

    default:
      throw new Error(`Unknown class name: ${cls.name}`)
  }
}

// eslint-disable-next-line @typescript-eslint/naming-convention
async function contentDirectory_EntityCreated(db: DB, event: SubstrateEvent): Promise<void> {
  if (event.extrinsic && event.extrinsic.method === 'transaction') return
  debug(`EntityCreated event: ${JSON.stringify(event)}`)

  const c = decode.getClassEntity(event)
  const classEntity = new ClassEntity()

  classEntity.classId = c.classId
  classEntity.id = c.entityId.toString()
  classEntity.version = event.blockNumber
  await db.save<ClassEntity>(classEntity)
}

// eslint-disable-next-line @typescript-eslint/naming-convention
async function contentDirectory_EntityPropertyValuesUpdated(db: DB, event: SubstrateEvent): Promise<void> {
  debug(`EntityPropertyValuesUpdated event: ${JSON.stringify(event)}`)

  const { extrinsic } = event

  if (extrinsic && extrinsic.method === 'transaction') return
  if (extrinsic === undefined) throw Error(`Extrinsic data not found for event: ${event.id}`)

  const { 2: newPropertyValues } = extrinsic.args
  const entityId = decode.stringIfyEntityId(event)

  const ce = await db.get(ClassEntity, { where: { id: entityId } })
  if (ce === undefined) throw Error(`Class not found for the entity id: ${entityId}`)

  const cls = contentDirectoryClassNamesWithId.find((c) => c.classId === ce.classId)
  if (cls === undefined) throw Error(`Not known class id: ${ce.classId}`)

  const where: IWhereCond = { where: { id: entityId } }

  // TODO: change setProperties method signature to accecpt SubstrateExtrinsic, then remove the following
  // line. The reason we push the same arg is beacuse of the setProperties method check the 3rd indices
  // to get properties values
  extrinsic.args.push(newPropertyValues)

  switch (cls.name) {
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
      throw new Error(`Unknown class name: ${cls.name}`)
  }
}

export {
  contentDirectory_EntityCreated,
  contentDirectory_EntityRemoved,
  contentDirectory_EntitySchemaSupportAdded,
  contentDirectory_EntityPropertyValuesUpdated,
}
