import Debug from 'debug'
import { SubstrateEvent } from '@dzlzv/hydra-common'
import { DatabaseManager as DB } from '@dzlzv/hydra-db-utils'
import { ClassEntity } from '../../../generated/graphql-server/src/modules/class-entity/class-entity.model'

import { decode } from '../decode'
import {
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
  removeLicense,
  removeMediaLocation,
  removeFeaturedVideo,
} from './remove'
import { createBlockOrGetFromDatabase } from './create'
import {
  categoryPropertyNamesWithId,
  channelPropertyNamesWithId,
  httpMediaLocationPropertyNamesWithId,
  joystreamMediaLocationPropertyNamesWithId,
  knownLicensePropertyNamesWIthId,
  languagePropertyNamesWIthId,
  userDefinedLicensePropertyNamesWithId,
  videoMediaEncodingPropertyNamesWithId,
  videoPropertyNamesWithId,
  ContentDirectoryKnownClasses,
  featuredVideoPropertyNamesWithId,
  licensePropertyNamesWithId,
  mediaLocationPropertyNamesWithId,
} from '../content-dir-consts'

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
  IWhereCond,
  ILicense,
  IMediaLocation,
  IFeaturedVideo,
} from '../../types'
import { getOrCreate, getKnownClass } from '../get-or-create'
import { createDefaultSchema } from '../default-schemas'
import {
  addSchemaToCategory,
  addSchemaToChannel,
  addSchemaToFeaturedVideo,
  addSchemaToHttpMediaLocation,
  addSchemaToJoystreamMediaLocation,
  addSchemaToKnownLicense,
  addSchemaToLanguage,
  addSchemaToLicense,
  addSchemaToMediaLocation,
  addSchemaToUserDefinedLicense,
  addSchemaToVideo,
  addSchemaToVideoMedia,
  addSchemaToVideoMediaEncoding,
} from './addSchema'
import { NextEntityId } from '../../../generated/graphql-server/src/modules/next-entity-id/next-entity-id.model'

const debug = Debug('mappings:content-directory')

async function addSchemSupportToEntity(
  event: SubstrateEvent,
  className: string,
  db: DB,
  entityId: number,
  nextEntityId = 0
) {
  switch (className) {
    case ContentDirectoryKnownClasses.CHANNEL:
      addSchemaToChannel({
        db,
        entityId,
        nextEntityId,
        props: decode.setProperties<IChannel>(event, channelPropertyNamesWithId),
      })
      break

    case ContentDirectoryKnownClasses.CATEGORY:
      await addSchemaToCategory({
        db,
        entityId,
        nextEntityId,
        props: decode.setProperties<ICategory>(event, categoryPropertyNamesWithId),
      })
      break

    case ContentDirectoryKnownClasses.KNOWNLICENSE:
      await addSchemaToKnownLicense({
        db,
        entityId,
        nextEntityId,
        props: decode.setProperties<IKnownLicense>(event, knownLicensePropertyNamesWIthId),
      })
      break

    case ContentDirectoryKnownClasses.USERDEFINEDLICENSE:
      await addSchemaToUserDefinedLicense({
        db,
        entityId,
        nextEntityId,
        props: decode.setProperties<IUserDefinedLicense>(event, userDefinedLicensePropertyNamesWithId),
      })
      break

    case ContentDirectoryKnownClasses.JOYSTREAMMEDIALOCATION:
      await addSchemaToJoystreamMediaLocation({
        db,
        entityId,
        nextEntityId,
        props: decode.setProperties<IJoystreamMediaLocation>(event, joystreamMediaLocationPropertyNamesWithId),
      })
      break

    case ContentDirectoryKnownClasses.HTTPMEDIALOCATION:
      await addSchemaToHttpMediaLocation({
        db,
        entityId,
        nextEntityId,
        props: decode.setProperties<IHttpMediaLocation>(event, httpMediaLocationPropertyNamesWithId),
      })
      break

    case ContentDirectoryKnownClasses.VIDEOMEDIA:
      await addSchemaToVideoMedia({
        db,
        entityId,
        nextEntityId,
        props: decode.setProperties<IVideoMedia>(event, videoPropertyNamesWithId),
      })
      break

    case ContentDirectoryKnownClasses.VIDEO:
      await addSchemaToVideo({
        db,
        entityId,
        nextEntityId,
        props: decode.setProperties<IVideo>(event, videoPropertyNamesWithId),
      })
      break

    case ContentDirectoryKnownClasses.LANGUAGE:
      await addSchemaToLanguage({
        db,
        entityId,
        nextEntityId,
        props: decode.setProperties<ILanguage>(event, languagePropertyNamesWIthId),
      })
      break

    case ContentDirectoryKnownClasses.VIDEOMEDIAENCODING:
      await addSchemaToVideoMediaEncoding({
        db,
        entityId,
        nextEntityId,
        props: decode.setProperties<IVideoMediaEncoding>(event, videoMediaEncodingPropertyNamesWithId),
      })
      break

    case ContentDirectoryKnownClasses.FEATUREDVIDEOS:
      await addSchemaToFeaturedVideo({
        db,
        entityId,
        nextEntityId,
        props: decode.setProperties<IFeaturedVideo>(event, featuredVideoPropertyNamesWithId),
      })
      break

    case ContentDirectoryKnownClasses.LICENSE:
      await addSchemaToLicense({
        db,
        entityId,
        nextEntityId,
        props: decode.setProperties<ILicense>(event, licensePropertyNamesWithId),
      })
      break

    case ContentDirectoryKnownClasses.MEDIALOCATION:
      await addSchemaToMediaLocation({
        db,
        entityId,
        nextEntityId,
        props: decode.setProperties<IMediaLocation>(event, mediaLocationPropertyNamesWithId),
      })
      break

    default:
      debug(`Unknown class name: ${className}`)
      break
  }
}

// eslint-disable-next-line @typescript-eslint/naming-convention
async function contentDirectory_EntitySchemaSupportAdded(db: DB, event: SubstrateEvent): Promise<void> {
  if (event.extrinsic && event.extrinsic.method === 'transaction') return
  debug(`EntitySchemaSupportAdded event: ${JSON.stringify(event)}`)

  const { params } = event
  const entityId = params[1].value as number

  const [knownClass] = await getKnownClass(db, { where: { id: entityId.toString() } })
  if (!knownClass) return

  await addSchemSupportToEntity(event, knownClass.name, db, entityId)
}

// eslint-disable-next-line @typescript-eslint/naming-convention
async function contentDirectory_EntityRemoved(db: DB, event: SubstrateEvent): Promise<void> {
  debug(`EntityRemoved event: ${JSON.stringify(event)}`)

  const entityId = decode.stringIfyEntityId(event)
  const where: IWhereCond = { where: { id: entityId } }

  const [knownClass, classEntity] = await getKnownClass(db, where)
  if (!knownClass) return

  switch (knownClass.name) {
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

    case ContentDirectoryKnownClasses.LICENSE:
      await removeLicense(db, where)
      break

    case ContentDirectoryKnownClasses.MEDIALOCATION:
      await removeMediaLocation(db, where)
      break

    case ContentDirectoryKnownClasses.FEATUREDVIDEOS:
      await removeFeaturedVideo(db, where)
      break

    default:
      throw new Error(`Unknown class name: ${knownClass.name}`)
  }
  await db.remove<ClassEntity>(classEntity)
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
  classEntity.happenedIn = await createBlockOrGetFromDatabase(db, event.blockNumber)
  await db.save<ClassEntity>(classEntity)

  const nextEntityIdFromDb = await getOrCreate.nextEntityId(db)
  nextEntityIdFromDb.nextId = c.entityId + 1
  await db.save<NextEntityId>(nextEntityIdFromDb)

  await createDefaultSchema(db, classEntity)
}

// eslint-disable-next-line @typescript-eslint/naming-convention
async function contentDirectory_EntityPropertyValuesUpdated(db: DB, event: SubstrateEvent): Promise<void> {
  const { extrinsic } = event
  if (extrinsic && extrinsic.method === 'transaction') return
  if (extrinsic === undefined) throw Error(`Extrinsic data not found for event: ${event.id}`)

  debug(`EntityPropertyValuesUpdated event: ${JSON.stringify(event)}`)

  const { 2: newPropertyValues } = extrinsic.args
  // const entityId = decode.stringIfyEntityId(event)
  // const where: IWhereCond = { where: { id: entityId } }
  const entityId = event.params[1].value as number

  const [knownClass] = await getKnownClass(db, { where: { id: entityId.toString() } })
  if (!knownClass) return

  // TODO: change setProperties method signature to accecpt SubstrateExtrinsic, then remove the following
  // line. The reason we push the same arg is beacuse of the setProperties method check the 3rd indices
  // to get properties values
  extrinsic.args.push(newPropertyValues)

  await addSchemSupportToEntity(event, knownClass.name, db, entityId)
}

export {
  contentDirectory_EntityCreated,
  contentDirectory_EntityRemoved,
  contentDirectory_EntitySchemaSupportAdded,
  contentDirectory_EntityPropertyValuesUpdated,
}
