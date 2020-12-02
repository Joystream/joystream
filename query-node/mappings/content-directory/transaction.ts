import Debug from 'debug'

import { DB, SubstrateEvent } from '../../generated/indexer'
import { NextEntityId } from '../../generated/graphql-server/src/modules/next-entity-id/next-entity-id.model'
import { ClassEntity } from '../../generated/graphql-server/src/modules/class-entity/class-entity.model'

import { decode } from './decode'
import {
  ClassEntityMap,
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
import {
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
  updateFeaturedVideoEntityPropertyValues,
} from './entity/update'

import {
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
  getClassName,
  createLicense,
  createMediaLocation,
  createBlockOrGetFromDatabase,
  createFeaturedVideo,
} from './entity/create'
import { getOrCreate } from './get-or-create'

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

  if (operations.length === 0 || operations.length === 1) return

  const successfulOperations = operations.filter((op, index) => index < failedOperationIndex)

  const {
    addSchemaSupportToEntityOperations,
    createEntityOperations,
    updatePropertyValuesOperations,
  } = decode.getOperationsByTypes(successfulOperations)

  await batchCreateClassEntities(db, event.blockNumber, createEntityOperations)
  await batchAddSchemaSupportToEntity(db, createEntityOperations, addSchemaSupportToEntityOperations, event.blockNumber)
  await batchUpdatePropertyValue(db, createEntityOperations, updatePropertyValuesOperations)
}

// eslint-disable-next-line @typescript-eslint/naming-convention
export async function contentDirectory_TransactionCompleted(db: DB, event: SubstrateEvent): Promise<void> {
  debug(`TransactionCompleted event: ${JSON.stringify(event)}`)

  const operations = decode.getOperations(event)

  const {
    addSchemaSupportToEntityOperations,
    createEntityOperations,
    updatePropertyValuesOperations,
  } = decode.getOperationsByTypes(operations)

  // Create entities before adding schema support
  // We need this to know which entity belongs to which class(we will need to know to update/create
  // Channel, Video etc.). For example if there is a property update operation there is no class id
  await batchCreateClassEntities(db, event.blockNumber, createEntityOperations)
  await batchAddSchemaSupportToEntity(db, createEntityOperations, addSchemaSupportToEntityOperations, event.blockNumber)
  await batchUpdatePropertyValue(db, createEntityOperations, updatePropertyValuesOperations)
}

async function batchCreateClassEntities(db: DB, block: number, operations: ICreateEntityOperation[]): Promise<void> {
  const nId = await db.get(NextEntityId, { where: { id: '1' } })
  let nextId = nId ? nId.nextId : 1 // start entity id from 1

  for (const { classId } of operations) {
    const c = new ClassEntity({
      id: nextId.toString(), // entity id
      classId: classId,
      version: block,
      happenedIn: await createBlockOrGetFromDatabase(db, block),
    })
    await db.save<ClassEntity>(c)
    nextId++
  }

  await getOrCreate.nextEntityId(db, nextId)
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
  const doneList: ClassEntityMap = new Map(classEntityMap.entries())

  const nextEntityIdBeforeTransaction = (await getNextEntityId(db)) - createEntityOperations.length

  for (const [className, entities] of classEntityMap) {
    for (const entity of entities) {
      const { entityId, indexOf, properties } = entity
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const id = entityId !== undefined ? entityId : indexOf! + nextEntityIdBeforeTransaction
      const arg: IDBBlockId = { db, block, id: id.toString() }

      switch (className) {
        case ContentDirectoryKnownClasses.CATEGORY:
          await createCategory(arg, decode.setEntityPropertyValues<ICategory>(properties, categoryPropertyNamesWithId))
          break

        case ContentDirectoryKnownClasses.CHANNEL:
          await createChannel(
            arg,
            doneList,
            decode.setEntityPropertyValues<IChannel>(properties, channelPropertyNamesWithId),
            nextEntityIdBeforeTransaction
          )
          break

        case ContentDirectoryKnownClasses.KNOWNLICENSE:
          await createKnownLicense(
            arg,
            decode.setEntityPropertyValues<IKnownLicense>(properties, knownLicensePropertyNamesWIthId)
          )
          break

        case ContentDirectoryKnownClasses.USERDEFINEDLICENSE:
          await createUserDefinedLicense(
            arg,
            decode.setEntityPropertyValues<IUserDefinedLicense>(properties, userDefinedLicensePropertyNamesWithId)
          )
          break

        case ContentDirectoryKnownClasses.JOYSTREAMMEDIALOCATION:
          await createJoystreamMediaLocation(
            arg,
            decode.setEntityPropertyValues<IJoystreamMediaLocation>(
              properties,
              joystreamMediaLocationPropertyNamesWithId
            )
          )
          break

        case ContentDirectoryKnownClasses.HTTPMEDIALOCATION:
          await createHttpMediaLocation(
            arg,
            decode.setEntityPropertyValues<IHttpMediaLocation>(properties, httpMediaLocationPropertyNamesWithId)
          )
          break

        case ContentDirectoryKnownClasses.VIDEOMEDIA:
          await createVideoMedia(
            arg,
            doneList,
            decode.setEntityPropertyValues<IVideoMedia>(properties, videoMediaPropertyNamesWithId),
            nextEntityIdBeforeTransaction
          )
          break

        case ContentDirectoryKnownClasses.VIDEO:
          await createVideo(
            arg,
            doneList,
            decode.setEntityPropertyValues<IVideo>(properties, videoPropertyNamesWithId),
            nextEntityIdBeforeTransaction
          )
          break

        case ContentDirectoryKnownClasses.LANGUAGE:
          await createLanguage(arg, decode.setEntityPropertyValues<ILanguage>(properties, languagePropertyNamesWIthId))
          break

        case ContentDirectoryKnownClasses.VIDEOMEDIAENCODING:
          await createVideoMediaEncoding(
            arg,
            decode.setEntityPropertyValues<IVideoMediaEncoding>(properties, videoMediaEncodingPropertyNamesWithId)
          )
          break

        case ContentDirectoryKnownClasses.LICENSE:
          await createLicense(
            arg,
            classEntityMap,
            decode.setEntityPropertyValues<ILicense>(properties, licensePropertyNamesWithId),
            nextEntityIdBeforeTransaction
          )
          break
        case ContentDirectoryKnownClasses.MEDIALOCATION:
          await createMediaLocation(
            arg,
            classEntityMap,
            decode.setEntityPropertyValues<IMediaLocation>(properties, mediaLocationPropertyNamesWithId),
            nextEntityIdBeforeTransaction
          )
          break

        case ContentDirectoryKnownClasses.FEATUREDVIDEOS:
          await createFeaturedVideo(
            arg,
            classEntityMap,
            decode.setEntityPropertyValues<IFeaturedVideo>(properties, featuredVideoPropertyNamesWithId),
            nextEntityIdBeforeTransaction
          )
          break

        default:
          console.log(`Unknown class name: ${className}`)
          break
      }
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
    const id = entityId ? entityId.toString() : entityIdBeforeTransaction - indexOf!

    const where: IWhereCond = { where: { id: id.toString() } }
    const className = await getClassName(db, entity, createEntityOperations)
    if (className === undefined) {
      console.log(`Can not update entity properties values. Unknown class name`)
      return
    }

    switch (className) {
      case ContentDirectoryKnownClasses.CHANNEL:
        await updateChannelEntityPropertyValues(
          db,
          where,
          decode.setEntityPropertyValues<IChannel>(properties, channelPropertyNamesWithId),
          entityIdBeforeTransaction
        )
        break

      case ContentDirectoryKnownClasses.CATEGORY:
        await updateCategoryEntityPropertyValues(
          db,
          where,
          decode.setEntityPropertyValues<ICategory>(properties, categoryPropertyNamesWithId)
        )
        break

      case ContentDirectoryKnownClasses.KNOWNLICENSE:
        await updateKnownLicenseEntityPropertyValues(
          db,
          where,
          decode.setEntityPropertyValues<IKnownLicense>(properties, knownLicensePropertyNamesWIthId)
        )
        break

      case ContentDirectoryKnownClasses.USERDEFINEDLICENSE:
        await updateUserDefinedLicenseEntityPropertyValues(
          db,
          where,
          decode.setEntityPropertyValues<IUserDefinedLicense>(properties, userDefinedLicensePropertyNamesWithId)
        )
        break

      case ContentDirectoryKnownClasses.JOYSTREAMMEDIALOCATION:
        await updateJoystreamMediaLocationEntityPropertyValues(
          db,
          where,
          decode.setEntityPropertyValues<IJoystreamMediaLocation>(properties, joystreamMediaLocationPropertyNamesWithId)
        )
        break

      case ContentDirectoryKnownClasses.HTTPMEDIALOCATION:
        await updateHttpMediaLocationEntityPropertyValues(
          db,
          where,
          decode.setEntityPropertyValues<IHttpMediaLocation>(properties, httpMediaLocationPropertyNamesWithId)
        )
        break

      case ContentDirectoryKnownClasses.VIDEOMEDIA:
        await updateVideoMediaEntityPropertyValues(
          db,
          where,
          decode.setEntityPropertyValues<IVideoMedia>(properties, videoPropertyNamesWithId),
          entityIdBeforeTransaction
        )
        break

      case ContentDirectoryKnownClasses.VIDEO:
        await updateVideoEntityPropertyValues(
          db,
          where,
          decode.setEntityPropertyValues<IVideo>(properties, videoPropertyNamesWithId),
          entityIdBeforeTransaction
        )
        break

      case ContentDirectoryKnownClasses.LANGUAGE:
        await updateLanguageEntityPropertyValues(
          db,
          where,
          decode.setEntityPropertyValues<ILanguage>(properties, languagePropertyNamesWIthId)
        )
        break

      case ContentDirectoryKnownClasses.VIDEOMEDIAENCODING:
        await updateVideoMediaEncodingEntityPropertyValues(
          db,
          where,
          decode.setEntityPropertyValues<IVideoMediaEncoding>(properties, videoMediaEncodingPropertyNamesWithId)
        )
        break
      case ContentDirectoryKnownClasses.LICENSE:
        await updateLicenseEntityPropertyValues(
          db,
          where,
          decode.setEntityPropertyValues<ILicense>(properties, licensePropertyNamesWithId),
          entityIdBeforeTransaction
        )
        break
      case ContentDirectoryKnownClasses.MEDIALOCATION:
        await updateMediaLocationEntityPropertyValues(
          db,
          where,
          decode.setEntityPropertyValues<IMediaLocation>(properties, mediaLocationPropertyNamesWithId),
          entityIdBeforeTransaction
        )
        break
      case ContentDirectoryKnownClasses.FEATUREDVIDEOS:
        await updateFeaturedVideoEntityPropertyValues(
          db,
          where,
          decode.setEntityPropertyValues<IFeaturedVideo>(properties, featuredVideoPropertyNamesWithId),
          entityIdBeforeTransaction
        )
        break

      default:
        console.log(`Unknown class name: ${className}`)
        break
    }
  }
}
