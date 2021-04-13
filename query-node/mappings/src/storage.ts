import { SubstrateEvent } from '@dzlzv/hydra-common'
import { DatabaseManager } from '@dzlzv/hydra-db-utils'
import { FindConditions, In } from 'typeorm'

import {
  inconsistentState,
  logger,
  prepareDataObject,
} from './common'

import {
  DataDirectory,
} from '../../generated/types'
import {
  ContentId,
  ContentParameters,
  StorageObjectOwner,
} from '@joystream/types/augment'
import {
  DataObject,
  DataObjectOwner,
  DataObjectOwnerMember,
  DataObjectOwnerChannel,
  DataObjectOwnerDao,
  DataObjectOwnerCouncil,
  DataObjectOwnerWorkingGroup,
  LiaisonJudgement,
} from 'query-node'

export async function data_directory_ContentAdded(db: DatabaseManager, event: SubstrateEvent): Promise<void> {
  // read event data
  const {contentParameters, storageObjectOwner} = new DataDirectory.ContentAddedEvent(event).data

  // save all content objects
  for (let parameters of contentParameters) {
    const owner = convertStorageObjectOwner(storageObjectOwner)
    const dataObject = await prepareDataObject(parameters, event.blockNumber, owner)

    // fill in auto-generated fields
    dataObject.createdAt = new Date(event.blockTimestamp.toNumber())
    dataObject.updatedAt = new Date(event.blockTimestamp.toNumber())

    await db.save<DataObject>(dataObject)
  }

  // emit log event
  logger.info("Storage content has beed added", {ids: contentParameters.map(item => item.content_id.toString())})
}

export async function data_directory_ContentRemoved(db: DatabaseManager, event: SubstrateEvent): Promise<void> {
  // read event data
  const {contentId: contentIds} = new DataDirectory.ContentRemovedEvent(event).data

  // load assets
  const dataObjects = await db.getMany(DataObject, { where: {
    joystreamContentId: In(contentIds.map(item => item.toString()))
  } as FindConditions<DataObject> })

  // remove assets from database
  for (let item of dataObjects) {
      await db.remove<DataObject>(item)
  }

  // emit log event
  logger.info("Storage content have been removed", {id: contentIds, dataObjectIds: dataObjects.map(item => item.id)})
}

export async function data_directory_ContentAccepted(db: DatabaseManager, event: SubstrateEvent): Promise<void> {
  // read event data
  const {contentId, storageProviderId} = new DataDirectory.ContentAcceptedEvent(event).data

  // load asset
  const dataObject = await db.get(DataObject, { where: { joystreamContentId: contentId.toString() } as FindConditions<DataObject>})

  // ensure object exists
  if (!dataObject) {
    return inconsistentState('Non-existing content acceptation requested', contentId)
  }

  // update object
  dataObject.liaisonId = storageProviderId
  dataObject.liaisonJudgement = LiaisonJudgement.ACCEPTED

  // set last update time
  dataObject.updatedAt = new Date(event.blockTimestamp.toNumber())

  // save object
  await db.save<DataObject>(dataObject)

  // emit log event
  logger.info("Storage content has been accepted", {id: contentId})
}

/////////////////// Helpers ////////////////////////////////////////////////////

function convertStorageObjectOwner(objectOwner: StorageObjectOwner): typeof DataObjectOwner {
  if (objectOwner.isMember) {
    const owner = new DataObjectOwnerMember()
    owner.member = objectOwner.asMember.toBn()

    return owner
  }

  if (objectOwner.isChannel) {
    const owner = new DataObjectOwnerChannel()
    owner.channel = objectOwner.asChannel.toBn()

    return owner
  }

  if (objectOwner.isDao) {
    const owner = new DataObjectOwnerDao()
    owner.dao = objectOwner.asDao.toBn()

    return owner
  }

  if (objectOwner.isCouncil) {
    return new DataObjectOwnerCouncil()
  }

  if (objectOwner.isWorkingGroup) {
    const owner = new DataObjectOwnerWorkingGroup()
    owner.workingGroup = objectOwner.asWorkingGroup.toNumber()

    return owner
  }

  logger.error('Not implemented StorageObjectOwner type', {objectOwner: objectOwner.toString()})
  throw 'Not implemented StorageObjectOwner type'
}