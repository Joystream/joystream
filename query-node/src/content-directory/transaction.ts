import Debug from 'debug'

import { DB, SubstrateEvent } from '../../generated/indexer'
import { decode } from './decode'
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
import {
  CategoryPropertyNamesWithId,
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
} from './content-dir-consts'
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
  batchCreateClassEntities,
} from './entity-helper'

const debug = Debug('mappings:content-directory:TransactionCompleted')

// eslint-disable-next-line @typescript-eslint/naming-convention
export async function contentDirectory_TransactionCompleted(db: DB, event: SubstrateEvent): Promise<void> {
  debug(`Substrate event: ${JSON.stringify(event)}`)

  const { extrinsic, blockNumber: block } = event
  if (!extrinsic) {
    throw Error(`No extrinsic found for the event: ${event.id}`)
  }

  const { 1: operations } = extrinsic.args
  if (operations.name.toString() !== 'operations') {
    throw Error(`Could not found 'operations' in the extrinsic.args[1]`)
  }

  const {
    addSchemaSupportToEntityOperations,
    createEntityOperations,
    updatePropertyValuesOperations,
  } = decode.getOperations(event)

  // Create entities before adding schema support
  // We need this to know which entity belongs to which class(we will need to know to update/create
  // Channel, Video etc.). For example if there is
  // a property update operation there is no class id
  await batchCreateClassEntities(db, block, createEntityOperations)
  await batchUpdatePropertyValue(db, createEntityOperations, updatePropertyValuesOperations)
  await batchAddSchemaSupportToEntity(db, createEntityOperations, addSchemaSupportToEntityOperations, block)
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
  // find the related entity ie. Channel, Video etc
  for (const entity of entities) {
    debug(`Entity: ${JSON.stringify(entity)}`)

    const { entityId, indexOf, properties } = entity

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const id = entityId ? entityId.toString() : indexOf!.toString()

    const className = await getClassName(db, entity, createEntityOperations)
    if (className === undefined) continue

    const arg: IDBBlockId = { db, block, id }

    switch (className) {
      case ContentDirectoryKnownClasses.CATEGORY:
        await createCategory(arg, decode.setEntityPropertyValues<ICategory>(properties, CategoryPropertyNamesWithId))
        break

      case ContentDirectoryKnownClasses.CHANNEL:
        await createChannel(arg, decode.setEntityPropertyValues<IChannel>(properties, channelPropertyNamesWithId))
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
          decode.setEntityPropertyValues<IJoystreamMediaLocation>(properties, joystreamMediaLocationPropertyNamesWithId)
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
          decode.setEntityPropertyValues<IVideoMedia>(properties, videoMediaPropertyNamesWithId)
        )
        break

      case ContentDirectoryKnownClasses.VIDEO:
        await createVideo(arg, decode.setEntityPropertyValues<IVideo>(properties, videoPropertyNamesWithId))
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

      default:
        throw new Error(`Unknown class name: ${className}`)
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
  for (const entity of entities) {
    debug(`Update entity properties values: ${JSON.stringify(entity)}`)

    const { entityId, indexOf, properties } = entity
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const id = entityId ? entityId.toString() : indexOf!.toString()

    const where: IWhereCond = { where: { id } }
    const className = await getClassName(db, entity, createEntityOperations)
    if (className === undefined) throw Error(`Can not update entity properties values. Unknown class name`)

    switch (className) {
      case ContentDirectoryKnownClasses.CHANNEL:
        updateChannelEntityPropertyValues(
          db,
          where,
          decode.setEntityPropertyValues<IChannel>(properties, CategoryPropertyNamesWithId)
        )
        break

      case ContentDirectoryKnownClasses.CATEGORY:
        await updateCategoryEntityPropertyValues(
          db,
          where,
          decode.setEntityPropertyValues<ICategory>(properties, CategoryPropertyNamesWithId)
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
          decode.setEntityPropertyValues<IVideoMedia>(properties, videoPropertyNamesWithId)
        )
        break

      case ContentDirectoryKnownClasses.VIDEO:
        await updateVideoEntityPropertyValues(
          db,
          where,
          decode.setEntityPropertyValues<IVideo>(properties, videoPropertyNamesWithId)
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

      default:
        throw new Error(`Unknown class name: ${className}`)
    }
  }
}
