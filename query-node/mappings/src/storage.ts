// TODO: validate storage types are generated as expected

import { SubstrateEvent } from '@dzlzv/hydra-common'
import { DatabaseManager } from '@dzlzv/hydra-db-utils'

import {
  inconsistentState,
  logger,
  prepareDataObject,
} from './common'

import { DataDirectory } from '../../generated/types'
import {
  ContentId,
  ContentParameters,
} from '@joystream/types/augment'
import { LiaisonJudgement } from 'query-node/src/modules/enums/enums'

import { DataObject } from 'query-node/src/modules/data-object/data-object.model'

export async function data_directory_ContentAdded(db: DatabaseManager, event: SubstrateEvent): Promise<void> {
  // read event data
  const {contentParameters} = new DataDirectory.ContentAddedEvent(event).data
  // TODO: resolve handling of Vec<ContentParameters> - currently only the first item is handleu

  const dataObject = await prepareDataObject(contentParameters[0], event.blockNumber)

  await db.save<DataObject>(dataObject)

  // emit log event
  logger.info("Storage content has beed added", {id: dataObject.joystreamContentId})
}

export async function data_directory_ContentRemoved(db: DatabaseManager, event: SubstrateEvent): Promise<void> {
  // read event data
  const {contentId: contentIds} = new DataDirectory.ContentRemovedEvent(event).data

  // load assets
  const dataObjects = await db.getMany(DataObject, { where: { joystreamContentId: contentIds }})

  // remove assets from database
  for (let item of dataObjects) {
      await db.remove<DataObject>(item)
  }

  // emit log event
  logger.info("Storage content have been removed", {id: contentIds, dataObjectIds: dataObjects.map(item => item.id)})
}

export async function data_directory_ContentAccepted(db: DatabaseManager, event: SubstrateEvent): Promise<void> {
  // read event data
  const {contentId} = new DataDirectory.ContentAcceptedEvent(event).data

  // load asset
  const dataObject = await db.get(DataObject, { where: { joystreamContentId: contentId }})

  // ensure object exists
  if (!dataObject) {
    return inconsistentState('Non-existing content acceptation requested', contentId)
  }

  // update object
  dataObject.liaisonJudgement = LiaisonJudgement.ACCEPTED

  // save object
  await db.save<DataObject>(dataObject)

  // emit log event
  logger.info("Storage content has been accepted", {id: contentId})
}

export async function data_directory_ContentRejected(db: DatabaseManager, event: SubstrateEvent): Promise<void> {
  // read event data
  const {contentId} = new DataDirectory.ContentRejectedEvent(event).data

  // load asset
  const dataObject = await db.get(DataObject, { where: { joystreamContentId: contentId }})

  // ensure object exists
  if (!dataObject) {
    return inconsistentState('Non-existing content rejection requested', contentId)
  }

  // update object
  dataObject.liaisonJudgement = LiaisonJudgement.REJECTED

  // save object
  await db.save<DataObject>(dataObject)

  // emit log event
  logger.info("Storage content has been rejected", {id: contentId})
}
