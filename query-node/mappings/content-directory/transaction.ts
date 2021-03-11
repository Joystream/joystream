import Debug from 'debug'

import { DB, SubstrateEvent } from '../../generated/indexer'
import { NextEntityId } from '../../generated/graphql-server/src/modules/next-entity-id/next-entity-id.model'
import { ClassEntity } from '../../generated/graphql-server/src/modules/class-entity/class-entity.model'

import { decode } from './decode'
import {
  ClassEntityMap,
  IBatchOperation,
  ICategory,
  IChannel,
  ICreateEntityOperation,
  IDBBlockId,
  IEntity,
  IFeaturedVideo,
  IHttpMediaLocation,
  IJoystreamMediaLocation,
  IKnownLicense,
  ILanguage,
  ILicense,
  IMediaLocation,
  IProperty,
  IUserDefinedLicense,
  IVideo,
  IVideoMedia,
  IVideoMediaEncoding,
  IWhereCond,
} from '../types'
import {
  categoryPropertyNamesWithId,
  channelPropertyNamesWithId,
  knownLicensePropertyNamesWIthId,
  userDefinedLicensePropertyNamesWithId,
  joystreamMediaLocationPropertyNamesWithId,
  httpMediaLocationPropertyNamesWithId,
  videoMediaPropertyNamesWithId,
  videoMediaEncodingPropertyNamesWithId,
  videoPropertyNamesWithId,
  languagePropertyNamesWIthId,
  ContentDirectoryKnownClasses,
  licensePropertyNamesWithId,
  mediaLocationPropertyNamesWithId,
  featuredVideoPropertyNamesWithId,
} from './content-dir-consts'

import { getClassName, createBlockOrGetFromDatabase } from './entity/create'
import { getOrCreate } from './get-or-create'
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
} from './entity/addSchema'
import { createDefaultSchema } from './default-schemas'

const debug = Debug('mappings:cd:transaction')

async function getNextEntityId(db: DB): Promise<number> {
  const e = await db.get(NextEntityId, { where: { id: '1' } })
  // Entity creation happens before addSchemaSupport so this should never happen
  if (!e) throw Error(`NextEntityId table doesn't have any record`)
  return e.nextId
}

// eslint-disable-next-line @typescript-eslint/naming-convention
export async function contentDirectory_TransactionFailed(db: DB, event: SubstrateEvent): Promise<void> {
  debug(`TransactionFailed event: ${JSON.stringify(event)}`)

  const failedOperationIndex = event.params[1].value as number
  const operations = decode.getOperations(event)

  const successfulOperations = operations.toArray().slice(0, failedOperationIndex)
  if (!successfulOperations.length) return // No succesfull operations

  await applyOperations(decode.getOperationsByTypes(successfulOperations), db, event)
}

// eslint-disable-next-line @typescript-eslint/naming-convention
export async function contentDirectory_TransactionCompleted(db: DB, event: SubstrateEvent): Promise<void> {
  debug(`TransactionCompleted event: ${JSON.stringify(event)}`)

  const operations = decode.getOperations(event)

  await applyOperations(decode.getOperationsByTypes(operations), db, event)
}

async function applyOperations(operations: IBatchOperation, db: DB, event: SubstrateEvent) {
  const { addSchemaSupportToEntityOperations, createEntityOperations, updatePropertyValuesOperations } = operations
  // Create entities before adding schema support
  // We need this to know which entity belongs to which class(we will need to know to update/create
  // Channel, Video etc.). For example if there is a property update operation there is no class id
  await batchCreateClassEntities(db, event.blockNumber, createEntityOperations)
  await batchAddSchemaSupportToEntity(db, createEntityOperations, addSchemaSupportToEntityOperations, event.blockNumber)
  await batchUpdatePropertyValue(db, createEntityOperations, updatePropertyValuesOperations)
}

async function batchCreateClassEntities(db: DB, block: number, operations: ICreateEntityOperation[]): Promise<void> {
  const nextEntityIdFromDb = await getOrCreate.nextEntityId(db)

  let entityId = nextEntityIdFromDb.nextId
  for (const { classId } of operations) {
    const c = new ClassEntity({
      id: entityId.toString(),
      classId: classId,
      version: block,
      happenedIn: await createBlockOrGetFromDatabase(db, block),
    })
    await db.save<ClassEntity>(c)

    // Create default schema for the entity
    await createDefaultSchema(db, c)
    entityId++
  }

  // Update database for next entity id
  nextEntityIdFromDb.nextId = entityId
  await db.save<NextEntityId>(nextEntityIdFromDb)
}

/**
 *
 * @param db database connection
 * @param createEntityOperations: Entity creations with in the same transaction
 * @param entities List of entities that schema support is added for
 * @param block block number
 */
async function batchAddSchemaSupportToEntity(
  db: DB,
  createEntityOperations: ICreateEntityOperation[],
  entities: IEntity[],
  block: number
) {
  const classEntityMap: ClassEntityMap = new Map<string, IEntity[]>()

  for (const entity of entities) {
    const className = await getClassName(db, entity, createEntityOperations)
    if (className !== undefined) {
      const es = classEntityMap.get(className)
      classEntityMap.set(className, es ? [...es, entity] : [entity])
    }
  }

  // This is a copy of classEntityMap, we will use it to keep track of items.
  // We will remove items from this list whenever we insert them into db
  // const doneList: ClassEntityMap = new Map(classEntityMap.entries())

  const nextEntityIdBeforeTransaction = (await getNextEntityId(db)) - createEntityOperations.length

  for (const [className, entities] of classEntityMap) {
    for (const entity of entities) {
      const { entityId, indexOf, properties } = entity
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const id = entityId !== undefined ? entityId : indexOf! + nextEntityIdBeforeTransaction
      // const arg: IDBBlockId = { db, block, id: id.toString() }

      await addSchemaSupportToEntity(db, className, id, nextEntityIdBeforeTransaction, properties)
    }
  }
}

/**
 * Batch update operations for entity properties values update
 * @param db database connection
 * @param createEntityOperations Entity creations with in the same transaction
 * @param entities list of entities those properties values updated
 */
async function batchUpdatePropertyValue(db: DB, createEntityOperations: ICreateEntityOperation[], entities: IEntity[]) {
  const entityIdBeforeTransaction = (await getNextEntityId(db)) - createEntityOperations.length

  for (const entity of entities) {
    const { entityId, indexOf, properties } = entity
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const id = entityId !== undefined ? entityId : entityIdBeforeTransaction - indexOf!

    // const where: IWhereCond = { where: { id: id.toString() } }
    const className = await getClassName(db, entity, createEntityOperations)
    if (!className) {
      debug(`Can not update entity properties values. Unknown class name`)
      return
    }

    await addSchemaSupportToEntity(db, className, id, entityIdBeforeTransaction, properties)
  }
}

async function addSchemaSupportToEntity(
  db: DB,
  className: string,
  entityId: number,
  nextEntityId: number,
  properties: IProperty[]
) {
  switch (className) {
    case ContentDirectoryKnownClasses.CATEGORY:
      await addSchemaToCategory({
        db,
        entityId,
        nextEntityId,
        props: decode.setEntityPropertyValues<ICategory>(properties, categoryPropertyNamesWithId),
      })
      break

    case ContentDirectoryKnownClasses.CHANNEL:
      await addSchemaToChannel({
        db,
        entityId,
        nextEntityId,
        props: decode.setEntityPropertyValues<IChannel>(properties, channelPropertyNamesWithId),
      })
      break

    case ContentDirectoryKnownClasses.KNOWNLICENSE:
      await addSchemaToKnownLicense({
        db,
        entityId,
        nextEntityId,
        props: decode.setEntityPropertyValues<IKnownLicense>(properties, knownLicensePropertyNamesWIthId),
      })
      break

    case ContentDirectoryKnownClasses.USERDEFINEDLICENSE:
      await addSchemaToUserDefinedLicense({
        db,
        entityId,
        nextEntityId,
        props: decode.setEntityPropertyValues<IUserDefinedLicense>(properties, userDefinedLicensePropertyNamesWithId),
      })
      break

    case ContentDirectoryKnownClasses.JOYSTREAMMEDIALOCATION:
      await addSchemaToJoystreamMediaLocation({
        db,
        entityId,
        nextEntityId,
        props: decode.setEntityPropertyValues<IJoystreamMediaLocation>(
          properties,
          joystreamMediaLocationPropertyNamesWithId
        ),
      })
      break

    case ContentDirectoryKnownClasses.HTTPMEDIALOCATION:
      await addSchemaToHttpMediaLocation({
        db,
        entityId,
        nextEntityId,
        props: decode.setEntityPropertyValues<IHttpMediaLocation>(properties, httpMediaLocationPropertyNamesWithId),
      })
      break

    case ContentDirectoryKnownClasses.VIDEOMEDIA:
      await addSchemaToVideoMedia({
        db,
        entityId,
        nextEntityId,
        props: decode.setEntityPropertyValues<IVideoMedia>(properties, videoMediaPropertyNamesWithId),
      })
      break

    case ContentDirectoryKnownClasses.VIDEO:
      await addSchemaToVideo({
        db,
        entityId,
        nextEntityId,
        props: decode.setEntityPropertyValues<IVideo>(properties, videoPropertyNamesWithId),
      })
      break

    case ContentDirectoryKnownClasses.LANGUAGE:
      await addSchemaToLanguage({
        db,
        entityId,
        nextEntityId,
        props: decode.setEntityPropertyValues<ILanguage>(properties, languagePropertyNamesWIthId),
      })
      break

    case ContentDirectoryKnownClasses.VIDEOMEDIAENCODING:
      await addSchemaToVideoMediaEncoding({
        db,
        entityId,
        nextEntityId,
        props: decode.setEntityPropertyValues<IVideoMediaEncoding>(properties, videoMediaEncodingPropertyNamesWithId),
      })
      break

    case ContentDirectoryKnownClasses.LICENSE:
      await addSchemaToLicense({
        db,
        entityId,
        nextEntityId,
        props: decode.setEntityPropertyValues<ILicense>(properties, licensePropertyNamesWithId),
      })
      break

    case ContentDirectoryKnownClasses.MEDIALOCATION:
      await addSchemaToMediaLocation({
        db,
        entityId,
        nextEntityId,
        props: decode.setEntityPropertyValues<IMediaLocation>(properties, mediaLocationPropertyNamesWithId),
      })
      break

    case ContentDirectoryKnownClasses.FEATUREDVIDEOS:
      await addSchemaToFeaturedVideo({
        db,
        entityId,
        nextEntityId,
        props: decode.setEntityPropertyValues<IFeaturedVideo>(properties, featuredVideoPropertyNamesWithId),
      })
      break

    default:
      debug(`Unknown class name: ${className}`)
      break
  }
}
