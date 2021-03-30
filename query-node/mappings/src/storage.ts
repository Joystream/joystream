// TODO: validate storage types are generated as expected

import { SubstrateEvent } from '@dzlzv/hydra-common'
import { DatabaseManager } from '@dzlzv/hydra-db-utils'

import {
  inconsistentState,
  logger,
  prepareDataObject,
} from './common'

import { Storage as StorageTypes } from '../../generated/types'
import {
  ContentId,
  ContentParameters,
} from '@joystream/types/augment'
import { LiaisonJudgement } from 'query-node/src/modules/enums/enums'

import { DataObject } from 'query-node/src/modules/data-object/data-object.model'

export async function ContentAdded(db: DatabaseManager, event: SubstrateEvent): Promise<void> {
  // read event data
  const {channelId, contentParameters} = new StorageTypes.ContentAddedEvent(event).data
  // TODO: resolve handling of Vec<ContentParameters> - currently only the first item is handleu

  const dataObject = await prepareDataObject(contentParameters[0], event.blockNumber)

  await db.save<DataObject>(dataObject)

  // emit log event
  logger.info("Storage content has beed added", {id: dataObject.joystreamContentId, channelId})
}

export async function ContentRemoved(db: DatabaseManager, event: SubstrateEvent): Promise<void> {
  // read event data
  const {contentId: contentIds} = new StorageTypes.ContentRemovedEvent(event).data

  // load assets
  const dataObjects = await db.getMany(DataObject, { where: { joystreamContentId: contentIds }})

  // remove assets from database
  for (let item of dataObjects) {
      await db.remove<DataObject>(item)
  }

  // emit log event
  logger.info("Storage content have been removed", {id: contentIds, dataObjectIds: dataObjects.map(item => item.id)})
}

export async function ContentAccepted(db: DatabaseManager, event: SubstrateEvent): Promise<void> {
  // read event data
  const {contentId} = new StorageTypes.ContentAcceptedEvent(event).data

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

export async function ContentRejected(db: DatabaseManager, event: SubstrateEvent): Promise<void> {
  // read event data
  const {contentId} = new StorageTypes.ContentRejectedEvent(event).data

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
