import { SubstrateEvent } from '@dzlzv/hydra-common'
import { DatabaseManager } from '@dzlzv/hydra-db-utils'
import { u64 } from '@polkadot/types/primitive';
import * as crypto from 'crypto'
import { SubstrateExtrinsic, ExtrinsicArg } from '@dzlzv/hydra-common'

// Asset
import {
  DataObjectOwner,
  DataObject,
  LiaisonJudgement,
  Network,
} from 'query-node'
import {
  ContentParameters,
} from '@joystream/types/augment'

import { ContentParameters as Custom_ContentParameters } from '@joystream/types/storage'
import { registry } from '@joystream/types'

const currentNetwork = Network.BABYLON

/*
  Reports that insurmountable inconsistent state has been encountered and throws an exception.
*/
export function inconsistentState(extraInfo: string, data?: unknown): never {
  const errorMessage = 'Inconsistent state: ' + extraInfo

  // log error
  logger.error(errorMessage, data)

  throw errorMessage
}

/*
  Reports that metadata inserted by the user are not entirely valid, but the problem can be overcome.
*/
export function invalidMetadata(extraInfo: string, data?: unknown): void {
  const errorMessage = 'Invalid metadata: ' + extraInfo

  // log error
  logger.info(errorMessage, data)
}

/*
  Creates a predictable and unique ID for the given content.
*/
export function createPredictableId(event: SubstrateEvent, content: string | Object): string {
  const contentType = typeof content == 'string'
    ? content
    : JSON.stringify(content)

  const id = `${event.blockNumber}_${event.index}_${contentType}`

  return crypto
    .createHash('sha256')
    .update(id, 'utf-8')
    .digest('base64')
}

/*
  Prepares data object from content parameters.
*/
export async function prepareDataObject(
  contentParameters: ContentParameters,
  event: SubstrateEvent,
  owner: typeof DataObjectOwner,
): Promise<DataObject> {
  // convert generic content parameters coming from processor to custom Joystream data type
  const customContentParameters = new Custom_ContentParameters(registry, contentParameters.toJSON() as any)

  const dataObject = new DataObject({
    owner,
    createdInBlock: event.blockNumber,
    typeId: contentParameters.type_id.toNumber(),
    size: customContentParameters.size_in_bytes.toNumber(),
    liaisonJudgement: LiaisonJudgement.PENDING, // judgement is pending at start; liaison id is set when content is accepted/rejected
    ipfsContentId: contentParameters.ipfs_content_id.toUtf8(),
    joystreamContentId: customContentParameters.content_id.encode(),

    createdById: '1',
    updatedById: '1',
  })

  dataObject.id = createPredictableId(event, dataObject)

  return dataObject
}

/////////////////// Sudo extrinsic calls ///////////////////////////////////////

// soft-peg interface for typegen-generated `*Call` types
export interface IGenericExtrinsicObject<T> {
  readonly extrinsic: SubstrateExtrinsic
  readonly expectedArgTypes: string[]
  args: T
}

// arguments for calling extrinsic as sudo
export interface ISudoCallArgs<T> extends ExtrinsicArg {
  args: T
  callIndex: string
}

/*
  Extracts extrinsic arguments from the Substrate event. Supports both direct extrinsic calls and sudo calls.
*/
export function extractExtrinsicArgs<DataParams, EventObject extends IGenericExtrinsicObject<DataParams>>(
  rawEvent: SubstrateEvent,
  callFactory: new (event: SubstrateEvent) => EventObject
): DataParams {
  // escape when extrinsic info is not available
  if (!rawEvent.extrinsic) {
    throw 'Invalid event - no extrinsic set' // this should never happen
  }

  // regural extrinsic call?
  if (rawEvent.extrinsic.section != 'sudo') {
    return (new callFactory(rawEvent)).args
  }

  // sudo extrinsic call

  // see Substrate's sudo frame for more info about sudo extrinsics and `call` argument index
  const argIndex = false
    || (rawEvent.extrinsic.method == 'sudoAs' && 1) // who, *call*
    || (rawEvent.extrinsic.method == 'sudo' && 0) // *call*
    || (rawEvent.extrinsic.method == 'sudoUncheckedWeight' && 0) // *call*, _weight

  // ensure `call` argument was found
  if (argIndex === false) {
    // this could possibly happen in sometime in future if new sudo options are introduced in Substrate
    throw 'Not implemented situation with sudo'
  }

  // typecast call arguments
  const callArgs = rawEvent.extrinsic.args[argIndex].value as unknown as ISudoCallArgs<DataParams>

  return callArgs.args
}

/////////////////// Logger /////////////////////////////////////////////////////

/*
  Simple logger enabling error and informational reporting.

  `Logger` class will not be needed in the future when Hydra v3 will be released.
  Hydra will provide logger instance and relevant code using `Logger` should be refactored.
*/
class Logger {

  /*
    Log significant event.
  */
  info(message: string, data?: unknown) {
    console.log(message, data)
  }

  /*
    Log significant error.
  */
  error(message: string, data?: unknown) {
    console.error(message, data)
  }
}

export const logger = new Logger()
