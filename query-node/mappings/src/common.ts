import BN from 'bn.js'
import { SubstrateEvent } from '@dzlzv/hydra-common'
import { DatabaseManager } from '@dzlzv/hydra-db-utils'
import { u64 } from '@polkadot/types/primitive';

import { Network } from 'query-node/src/modules/enums/enums'

// Asset
import {
  DataObjectOwner,
  DataObjectOwnerMember,
  DataObjectOwnerChannel,
  DataObjectOwnerDao,
  DataObjectOwnerCouncil,
  DataObjectOwnerWorkingGroup,
} from 'query-node/src/modules/variants/variants.model'
import {
  DataObject,
  LiaisonJudgement,
} from 'query-node/src/modules/data-object/data-object.model'
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

export async function prepareDataObject(contentParameters: ContentParameters, blockNumber: number): Promise<DataObject> {
  const dataObjectOwner = new DataObjectOwnerMember() // TODO: proper owner
  dataObjectOwner.memberId = new BN(0)

  const dataObject = new DataObject({
    owner: dataObjectOwner,
    addedAt: blockNumber,
    typeId: contentParameters.type_id.toNumber(),
    // `size` is masked by `size` special name in struct so there needs to be `.get('size') as u64`
    size: (contentParameters.get('size') as unknown as u64).toBn(),
    liaisonId: new BN(0), // TODO: proper id
    liaisonJudgement: LiaisonJudgement.PENDING, // TODO: proper judgement
    ipfsContentId: contentParameters.ipfs_content_id.toHex(),
    joystreamContentId: contentParameters.content_id.toHex(),
  })

  return dataObject
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
