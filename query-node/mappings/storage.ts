import { SubstrateEvent } from '@dzlzv/hydra-common'
import { DatabaseManager } from '@dzlzv/hydra-db-utils'

import {
  inconsistentState,
  prepareAssetDataObject,
  prepareBlock,
} from './common'

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
  /* event arguments
  Vec<ContentParameters>,
  StorageObjectOwner
  */

  // TODO: resolve handling of Vec<ContentParameters> - currently only the first item is handled
  const contentParameters: ContentParameters = (event.params[0].value as any)[0] // TODO: get rid of `any` typecast

  const block = await prepareBlock(db, event)
  const assetStorage = await prepareAssetDataObject(contentParameters, block)

  await db.save<AssetStorage>(assetStorage)
}

export async function ContentRemoved(db: DatabaseManager, event: SubstrateEvent): Promise<void> {
  /* event arguments
  Vec<ContentId>,
  StorageObjectOwner,
  */

  const contentIds: ContentId[] = (event.params[0].value as any)[0] // TODO: get rid of `any` typecast

  const assetDataObjects = await db.getMany(AssetDataObject, { where: { joystreamContentId: contentIds }})

  for (let item of assetDataObjects) {
      await db.remove<AssetDataObject>(item)
  }
}

export async function ContentAccepted(db: DatabaseManager, event: SubstrateEvent): Promise<void> {
  /* event arguments
  ContentId,
  StorageProviderId,
  */

  const joystreamContentId: ContentParameters = (event.params[0].value as any) // TODO: get rid of `any` typecast
  const assetDataObject = await db.get(AssetDataObject, { where: { joystreamContentId }})

  if (!assetDataObject) {
    return inconsistentState()
  }

  assetDataObject.liaisonJudgement = LiaisonJudgement.ACCEPTED

  await db.save<AssetDataObject>(assetDataObject)
}

export async function ContentRejected(db: DatabaseManager, event: SubstrateEvent): Promise<void> {
    /* event arguments
  ContentId,
  StorageProviderId,
  */

  const joystreamContentId: ContentParameters = (event.params[0].value as any) // TODO: get rid of `any` typecast
  const assetDataObject = await db.get(AssetDataObject, { where: { joystreamContentId }})

  if (!assetDataObject) {
    return inconsistentState()
  }

  assetDataObject.liaisonJudgement = LiaisonJudgement.REJECTED

  await db.save<AssetDataObject>(assetDataObject)
}
