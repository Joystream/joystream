import { DatabaseManager, SubstrateEvent } from '@joystream/hydra-common'
import { Bytes } from '@polkadot/types'
import { Codec } from '@polkadot/types/types'
import { WorkingGroup as WGType, WorkerId } from '@joystream/types/augment/all'
import { Worker, Event, Network, WorkingGroup as WGEntity } from 'query-node/dist/model'
import { BaseModel } from '@joystream/warthog'
import { metaToObject } from '@joystream/metadata-protobuf/utils'
import { AnyMetadataClass, DecodedMetadataObject } from '@joystream/metadata-protobuf/types'
import BN from 'bn.js'

export const CURRENT_NETWORK = Network.OLYMPIA

// Max value the database can store in Int column field
export const INT32MAX = 2147483647

// Max value we can use as argument for JavaScript `Date` constructor to create a valid Date object
// See: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date
export const TIMESTAMPMAX = 8640000000000000

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

export function deserializeMetadata<T>(
  metadataType: AnyMetadataClass<T>,
  metadataBytes: Bytes
): DecodedMetadataObject<T> | null {
  try {
    const message = metadataType.decode(metadataBytes.toU8a(true))
    Object.keys(message).forEach((key) => {
      if (key in message && typeof message[key] === 'string') {
        message[key] = perpareString(message[key])
      }
    })
    return metaToObject(metadataType, message)
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

export function asInt32(value: Codec): number {
  return Math.min(Math.max(Math.trunc(Number(value)), -2147483647), 2147483647)
}

export function asBN(value: Codec): BN {
  return new BN(value.toString())
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
  | 'contentWorkingGroup'
  | 'forumWorkingGroup'
  | 'membershipWorkingGroup'
  | 'operationsWorkingGroupAlpha'
  | 'gatewayWorkingGroup'
  | 'distributionWorkingGroup'
  | 'operationsWorkingGroupBeta'
  | 'operationsWorkingGroupGamma'

export function getWorkingGroupModuleName(group: WGType): WorkingGroupModuleName {
  if (group.isContent) {
    return 'contentWorkingGroup'
  } else if (group.isMembership) {
    return 'membershipWorkingGroup'
  } else if (group.isForum) {
    return 'forumWorkingGroup'
  } else if (group.isStorage) {
    return 'storageWorkingGroup'
  } else if (group.isOperationsAlpha) {
    return 'operationsWorkingGroupAlpha'
  } else if (group.isGateway) {
    return 'gatewayWorkingGroup'
  } else if (group.isDistribution) {
    return 'distributionWorkingGroup'
  } else if (group.isOperationsBeta) {
    return 'operationsWorkingGroupBeta'
  } else if (group.isOperationsGamma) {
    return 'operationsWorkingGroupGamma'
  }

  unexpectedData('Unsupported working group encountered:', group.type)
}

export async function getWorkingGroupByName(
  store: DatabaseManager,
  name: WorkingGroupModuleName,
  relations: string[] = []
): Promise<WGEntity> {
  const group = await store.get(WGEntity, { where: { name }, relations })
  if (!group) {
    throw new Error(`Working group ${name} not found!`)
  }
  return group
}

export async function getWorker(
  store: DatabaseManager,
  groupName: WorkingGroupModuleName,
  runtimeId: WorkerId | number,
  relations: string[] = []
): Promise<Worker> {
  const workerDbId = `${groupName}-${runtimeId}`
  const worker = await store.get(Worker, { where: { id: workerDbId }, relations })
  if (!worker) {
    inconsistentState(`Expected worker not found by id ${workerDbId}`)
  }

  return worker
}

type EntityClass<T extends BaseModel> = {
  new (): T
  name: string
}

export type RelationsArr<T extends BaseModel> = Exclude<
  keyof T & string,
  { [K in keyof T]: T[K] extends BaseModel | undefined ? '' : T[K] extends BaseModel[] | undefined ? '' : K }[keyof T]
>[]

export async function getById<T extends BaseModel>(
  store: DatabaseManager,
  entityClass: EntityClass<T>,
  id: string,
  relations?: RelationsArr<T>
): Promise<T> {
  const result = await store.get(entityClass, { where: { id }, relations })
  if (!result) {
    throw new Error(`Expected ${entityClass.name} not found by ID: ${id}`)
  }

  return result
}

export function deterministicEntityId(createdInEvent: SubstrateEvent, additionalIdentifier?: string | number): string {
  return (
    `${createdInEvent.blockNumber}-${createdInEvent.indexInBlock}` +
    (additionalIdentifier ? `-${additionalIdentifier}` : '')
  )
}

// Convert a BN to number without throwing an error if > Number.MAX_SAFE_INTEGER
// add with a custom limit to maxValue if needed
export function toNumber(value: BN, maxValue = Number.MAX_SAFE_INTEGER): number {
  try {
    if (value.toNumber() > maxValue) {
      logger.info(`toNumber() Warning: Input value ${value.toNumber()} exceeds maxValue: ${maxValue}.`)
      return maxValue
    }

    return value.toNumber()
  } catch (e) {
    logger.info(
      `toNumber() Warning: BN.toNumber() conversion error: ${
        e instanceof Error ? e.message : e
      }. Returning maxValue: ${maxValue}`
    )
    return maxValue
  }
}
