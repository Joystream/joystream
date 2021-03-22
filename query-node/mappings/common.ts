import BN from 'bn.js'
import { SubstrateEvent } from '@dzlzv/hydra-common'
import { DatabaseManager } from '@dzlzv/hydra-db-utils'

import { Block } from 'query-node/src/modules/block/block.model'
import { Network } from 'query-node/src/modules/enums/enums'

// Asset
import {
  Asset,
  AssetUploadStatus,
  AssetStorage,
  AssetOwnerMember,
} from 'query-node/src/modules/variants/variants.model'
import {
  AssetDataObject,
  LiaisonJudgement,
} from 'query-node/src/modules/asset-data-object/asset-data-object.model'
import {
  ContentParameters
} from '@joystream/types/augment'

const currentNetwork = Network.BABYLON

export function inconsistentState(): void {
  throw 'Inconsistent state' // TODO: create a proper way of handling inconsistent state
}

// prepare block record
export async function prepareBlock(db: DatabaseManager, event: SubstrateEvent): Promise<Block> {
  let block = await db.get(Block, { where: { block: event.blockNumber } })

  if (block) {
      return block
  }

  return new Block({
    block: event.blockNumber,
    executedAt: new Date(event.blockTimestamp.toNumber()),
    network: currentNetwork,
  })
}

export async function prepareAssetDataObject(contentParameters: ContentParameters, block: Block): Promise<AssetStorage> {
  const assetOwner = new AssetOwnerMember() // TODO: proper owner
  assetOwner.memberId = new BN(0)

  const assetDataObject = new AssetDataObject({
    owner: assetOwner,
    addedAt: block,
    typeId: contentParameters.type_id.toNumber(),
    size: new BN(contentParameters.size),
    liaisonId: new BN(0), // TODO: proper id
    liaisonJudgement: LiaisonJudgement.PENDING, // TODO: proper judgement
    ipfsContentId: contentParameters.ipfs_content_id.toHex(),
    joystreamContentId: contentParameters.content_id.toHex(),
  })
  // TODO: handle `AssetNeverProvided` and `AssetDeleted` states
  const uploadingStatus = new AssetUploadStatus()
  /* TODO: set the values (`dataObject` and `oldDataObject` absent in AssetUploadStatus)
  uploadingStatus.dataObject = new AssetDataObject
  uploadingStatus.oldDataObject: undefined // TODO: handle oldDataObject
  */

  const assetStorage = new AssetStorage()
  assetStorage.uploadStatus = uploadingStatus

  return assetStorage
}
