// TODO: validate storage types are generated as expected

import { SubstrateEvent } from '@dzlzv/hydra-common'
import { DatabaseManager } from '@dzlzv/hydra-db-utils'

import {
  inconsistentState,
  prepareAssetDataObject,
  prepareBlock,
} from './common'

import { Storage as StorageTypes } from '../generated/types'
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
  const {channelId , contentParameters} = new StorageTypes.ContentAddedEvent(event).data
  // TODO: resolve handling of Vec<ContentParameters> - currently only the first item is handleu
  const block = await prepareBlock(db, event)
  const assetStorage = await prepareAssetDataObject(contentParameters[0], block)

  await db.save<AssetStorage>(assetStorage)
}

export async function ContentRemoved(db: DatabaseManager, event: SubstrateEvent): Promise<void> {
  const {contentId: contentIds} = new StorageTypes.ContentRemovedEvent(event).data
  const assetDataObjects = await db.getMany(AssetDataObject, { where: { joystreamContentId: contentIds }})

  for (let item of assetDataObjects) {
      await db.remove<AssetDataObject>(item)
  }
}

export async function ContentAccepted(db: DatabaseManager, event: SubstrateEvent): Promise<void> {
  const {contentId} = new StorageTypes.ContentAcceptedEvent(event).data
  const assetDataObject = await db.get(AssetDataObject, { where: { joystreamContentId: contentId }})

  if (!assetDataObject) {
    return inconsistentState()
  }

  assetDataObject.liaisonJudgement = LiaisonJudgement.ACCEPTED

  await db.save<AssetDataObject>(assetDataObject)
}

export async function ContentRejected(db: DatabaseManager, event: SubstrateEvent): Promise<void> {
  const {contentId} = new StorageTypes.ContentRejectedEvent(event).data
  const assetDataObject = await db.get(AssetDataObject, { where: { joystreamContentId: contentId }})

  if (!assetDataObject) {
    return inconsistentState()
  }

  assetDataObject.liaisonJudgement = LiaisonJudgement.REJECTED

  await db.save<AssetDataObject>(assetDataObject)
}
