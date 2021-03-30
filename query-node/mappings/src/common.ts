import BN from 'bn.js'
import { SubstrateEvent } from '@dzlzv/hydra-common'
import { DatabaseManager } from '@dzlzv/hydra-db-utils'
import { u64 } from '@polkadot/types/primitive';

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

export function inconsistentState(extraInfo: string, data?: unknown): never {
  const errorMessage = 'Inconsistent state: ' + extraInfo

  // log error
  logger.error(errorMessage, data)

  // throw exception
  throw errorMessage
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
    // `size` is masked by `size` special name in struct so there needs to be `.get('size') as u64`
    size: (contentParameters.get('size') as unknown as u64).toBn(),
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

/////////////////// Logger /////////////////////////////////////////////////////

/*
Logger will not be needed in the future when Hydra v3 will be released.
*/

class Logger {

  info(message: string, data?: unknown) {
    console.log(message, data)
  }

  error(message: string, data?: unknown) {
    console.error(message, data)
  }
}

export const logger = new Logger()
