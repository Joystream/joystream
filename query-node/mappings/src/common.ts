import {
  DatabaseManager,
  SubstrateEvent,
  SubstrateExtrinsic,
  ExtrinsicArg,
  EventContext,
  StoreContext,
} from '@joystream/hydra-common'
import { Bytes } from '@polkadot/types'
import { WorkingGroup, WorkerId, ThreadId, ContentParameters } from '@joystream/types/augment/all'
import { Worker, Event, Network, DataObject, LiaisonJudgement, DataObjectOwner } from 'query-node/dist/model'
import { BaseModel } from '@joystream/warthog'
import { ContentParameters as Custom_ContentParameters } from '@joystream/types/storage'
import { registry } from '@joystream/types'
import { metaToObject } from '@joystream/metadata-protobuf/utils'
import { AnyMetadataClass, DecodedMetadataObject } from '@joystream/metadata-protobuf/types'
import BN from 'bn.js'

export const CURRENT_NETWORK = Network.OLYMPIA
/*
  Simple logger enabling error and informational reporting.

  FIXME: `Logger` class will not be needed in the future when Hydra v3 will be released.
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
  Reports that insurmountable unexpected data has been encountered and throws an exception.
*/
export function unexpectedData(extraInfo: string, data?: unknown): never {
  const errorMessage = 'Unexpected data: ' + extraInfo

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

export async function createDataObject(
  { event, store }: EventContext & StoreContext,
  contentParameters: ContentParameters,
  owner: typeof DataObjectOwner
): Promise<DataObject> {
  const {
    size_in_bytes: sizeInBytes,
    type_id: typeId,
    content_id: contentId,
    ipfs_content_id: ipfsContentId,
  } = new Custom_ContentParameters(registry, contentParameters.toJSON() as any)
  const dataObjectId = contentId.encode()
  const dataObject = new DataObject({
    id: dataObjectId,
    owner,
    createdAt: new Date(event.blockTimestamp),
    updatedAt: new Date(event.blockTimestamp),
    createdInBlock: event.blockNumber,
    typeId: typeId.toNumber(),
    size: new BN(sizeInBytes.toString()),
    liaisonJudgement: LiaisonJudgement.PENDING, // judgement is pending at start; liaison id is set when content is accepted/rejected
    ipfsContentId: ipfsContentId.toUtf8(),
    joystreamContentId: dataObjectId,
    createdById: '1',
    updatedById: '1',
  })
  await store.save<DataObject>(dataObject)

  return dataObject
}

export function genericEventFields(substrateEvent: SubstrateEvent): Partial<BaseModel & Event> {
  const { blockNumber, indexInBlock, extrinsic, blockTimestamp } = substrateEvent
  const eventTime = new Date(blockTimestamp)
  return {
    createdAt: eventTime,
    updatedAt: eventTime,
    id: `${CURRENT_NETWORK}-${blockNumber}-${indexInBlock}`,
    inBlock: blockNumber,
    network: CURRENT_NETWORK,
    inExtrinsic: extrinsic?.hash,
    indexInBlock,
  }
}
export function deserializeMetadata<T>(
  metadataType: AnyMetadataClass<T>,
  metadataBytes: Bytes
): DecodedMetadataObject<T> | null {
  try {
    return metaToObject(metadataType, metadataType.decode(metadataBytes.toU8a(true)))
  } catch (e) {
    invalidMetadata(`Cannot deserialize ${metadataType.name}! Provided bytes: (${metadataBytes.toHex()})`)
    return null
  }
}

export function bytesToString(b: Bytes): string {
  return (
    Buffer.from(b.toU8a(true))
      .toString()
      // eslint-disable-next-line no-control-regex
      .replace(/\u0000/g, '')
  )
}

export function perpareString(s: string): string {
  // eslint-disable-next-line no-control-regex
  return s.replace(/\u0000/g, '')
}

export function hasValuesForProperties<
  T extends Record<string, unknown>,
  P extends keyof T & string,
  PA extends readonly P[]
>(obj: T, props: PA): obj is T & { [K in PA[number]]: NonNullable<K> } {
  props.forEach((p) => {
    if (obj[p] === null || obj[p] === undefined) {
      return false
    }
  })
  return true
}

export type WorkingGroupModuleName =
  | 'storageWorkingGroup'
  | 'contentDirectoryWorkingGroup'
  | 'forumWorkingGroup'
  | 'membershipWorkingGroup'
  | 'operationsWorkingGroup'
  | 'gatewayWorkingGroup'

export function getWorkingGroupModuleName(group: WorkingGroup): WorkingGroupModuleName {
  if (group.isContent) {
    return 'contentDirectoryWorkingGroup'
  } else if (group.isMembership) {
    return 'membershipWorkingGroup'
  } else if (group.isForum) {
    return 'forumWorkingGroup'
  } else if (group.isStorage) {
    return 'storageWorkingGroup'
  } else if (group.isOperations) {
    return 'operationsWorkingGroup'
  } else if (group.isGateway) {
    return 'gatewayWorkingGroup'
  }

  unexpectedData('Unsupported working group encountered:', group.type)
}

export async function getWorker(
  store: DatabaseManager,
  groupName: WorkingGroupModuleName,
  runtimeId: WorkerId | number
): Promise<Worker> {
  const workerDbId = `${groupName}-${runtimeId}`
  const worker = await store.get(Worker, { where: { id: workerDbId } })
  if (!worker) {
    inconsistentState(`Expected worker not found by id ${workerDbId}`)
  }

  return worker
}
