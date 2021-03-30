// TODO: validate storage types are generated as expected

import { SubstrateEvent } from '@dzlzv/hydra-common'
import { DatabaseManager } from '@dzlzv/hydra-db-utils'

import {
  inconsistentState,
  logger,
  prepareAssetDataObject,
  prepareBlock,
} from './common'

import { Storage as StorageTypes } from '../../generated/types'
import {
  ContentId,
  ContentParameters,
} from '@joystream/types/augment'
import {
  AssetStorage,
} from 'query-node/src/modules/variants/variants.model'
import { LiaisonJudgement } from 'query-node/src/modules/enums/enums'

import { AssetDataObject } from 'query-node/src/modules/asset-data-object/asset-data-object.model'

export async function ContentAdded(db: DatabaseManager, event: SubstrateEvent): Promise<void> {
  // read event data
  const {channelId, contentParameters} = new StorageTypes.ContentAddedEvent(event).data
  // TODO: resolve handling of Vec<ContentParameters> - currently only the first item is handleu

  const block = await prepareBlock(db, event)
  const assetStorage = await prepareAssetDataObject(contentParameters[0], block)

  await db.save<AssetStorage>(assetStorage)

  // emit log event
  logger.info("Storage content has beed added", {/*id: assetStorage.id, */channelId}) // TODO: update after Asset change merge
}

export async function ContentRemoved(db: DatabaseManager, event: SubstrateEvent): Promise<void> {
  // read event data
  const {contentId: contentIds} = new StorageTypes.ContentRemovedEvent(event).data

  // load assets
  const assetDataObjects = await db.getMany(AssetDataObject, { where: { joystreamContentId: contentIds }})

  // remove assets from database
  for (let item of assetDataObjects) {
      await db.remove<AssetDataObject>(item)
  }

  // emit log event
  logger.info("Storage content have been removed", {id: contentIds, dataObjectIds: assetDataObjects.map(item => item.id)})
}

export async function ContentAccepted(db: DatabaseManager, event: SubstrateEvent): Promise<void> {
  // read event data
  const {contentId} = new StorageTypes.ContentAcceptedEvent(event).data

  // load asset
  const assetDataObject = await db.get(AssetDataObject, { where: { joystreamContentId: contentId }})

  // ensure object exists
  if (!assetDataObject) {
    return inconsistentState('Non-existing content acceptation requested', contentId)
  }

  // update object
  assetDataObject.liaisonJudgement = LiaisonJudgement.ACCEPTED

  // save object
  await db.save<AssetDataObject>(assetDataObject)

  // emit log event
  logger.info("Storage content has been accepted", {id: contentId})
}

export async function ContentRejected(db: DatabaseManager, event: SubstrateEvent): Promise<void> {
  // read event data
  const {contentId} = new StorageTypes.ContentRejectedEvent(event).data

  // load asset
  const assetDataObject = await db.get(AssetDataObject, { where: { joystreamContentId: contentId }})

  // ensure object exists
  if (!assetDataObject) {
    return inconsistentState('Non-existing content rejection requested', contentId)
  }

  // update object
  assetDataObject.liaisonJudgement = LiaisonJudgement.REJECTED

  // save object
  await db.save<AssetDataObject>(assetDataObject)

  // emit log event
  logger.info("Storage content has been rejected", {id: contentId})
}
