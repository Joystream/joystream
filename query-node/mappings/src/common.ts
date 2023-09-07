import {
  DatabaseManager,
  FindOneOptions,
  FindOptionsOrderValue,
  FindOptionsWhere,
  SubstrateEvent,
} from '@joystream/hydra-common'
import { AnyMetadataClass, DecodedMetadataObject } from '@joystream/metadata-protobuf/types'
import { metaToObject } from '@joystream/metadata-protobuf/utils'
import { MemberId, WorkerId } from '@joystream/types/primitives'
import { BaseModel } from '@joystream/warthog'
import { Bytes, Option } from '@polkadot/types'
import { PalletCommonWorkingGroupIterableEnumsWorkingGroup as WGType } from '@polkadot/types/lookup'
import { Codec } from '@polkadot/types/types'
import BN from 'bn.js'
import {
  Event,
  Membership,
  MetaprotocolTransactionErrored,
  MetaprotocolTransactionStatusEvent,
  MetaprotocolTransactionSuccessful,
  Network,
  WorkingGroup as WGEntity,
  Worker,
} from 'query-node/dist/model'
import { In } from 'typeorm'

export const CURRENT_NETWORK = Network.OLYMPIA

// used to create Ids for metaprotocol entities (entities that don't
// have any runtime existence; and solely exist on the Query node).
export const METAPROTOCOL = 'METAPROTOCOL'

// Max value the database can store in Int column field
export const INT32MAX = 2147483647

// Max value we can use as argument for JavaScript `Date` constructor to create a valid Date object
// See: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date
export const TIMESTAMPMAX = 8640000000000000

// definition of generic type for Hydra DatabaseManager's methods
export type EntityType<T> = {
  new (...args: any[]): T
}

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
  Get Id of new metaprotocol entity in Query node DB
 */
export function newMetaprotocolEntityId(substrateEvent: SubstrateEvent): string {
  const { blockNumber, indexInBlock } = substrateEvent
  return `${METAPROTOCOL}-${CURRENT_NETWORK}-${blockNumber}-${indexInBlock}`
}

export function genericEventFields(substrateEvent: SubstrateEvent): Partial<BaseModel & Event> {
  const { blockNumber, indexInBlock, extrinsic } = substrateEvent
  return {
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

  // eslint-disable-next-line local-rules/no-throw
  throw errorMessage
}

/**
 * Reports an unimplemented mapping/variant error for which a runtime implementation logic exists and is not filtered.
 */
export function unimplementedError(extraInfo: string, data?: unknown): never {
  const errorMessage = 'unimplemented error: ' + extraInfo

  // log error
  logger.error(errorMessage, data)

  // eslint-disable-next-line local-rules/no-throw
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
  metadataBytes: Bytes,
  opts = {
    skipWarning: false,
  }
): DecodedMetadataObject<T> | null {
  try {
    const message = metadataType.decode(metadataBytes.toU8a(true))
    Object.keys(message).forEach((key) => {
      if (key in message && typeof message[key] === 'string') {
        message[key] = prepareString(message[key])
      }
    })
    return metaToObject(metadataType, message)
  } catch (e) {
    if (!opts.skipWarning) {
      invalidMetadata(`Cannot deserialize ${metadataType.name}! Provided bytes: (${metadataBytes.toHex()})`)
    }
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

export function prepareString(s: string): string {
  // eslint-disable-next-line no-control-regex
  return s.replace(/\u0000/g, '')
}

export function asInt32(value: Codec): number {
  return Math.min(Math.max(Math.trunc(Number(value)), -2147483647), 2147483647)
}

export function asBN(value: Codec): BN {
  return new BN(value.toString())
}

export function unwrap<T extends Codec, R>(value: Option<T>): T | undefined {
  return value.isSome ? value.unwrap() : undefined
}

export function whenDef<T, R>(value: T | null | undefined, fn: (value: T) => R): R | undefined {
  if (value !== null && typeof value !== 'undefined') return fn(value)
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
  | 'appWorkingGroup'
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
  } else if (group.isApp) {
    return 'appWorkingGroup'
  } else if (group.isDistribution) {
    return 'distributionWorkingGroup'
  } else if (group.isOperationsBeta) {
    return 'operationsWorkingGroupBeta'
  } else if (group.isOperationsGamma) {
    return 'operationsWorkingGroupGamma'
  }

  unimplementedError('Unsupported working group encountered:', group.type)
}

export async function getWorkingGroupByNameOrFail(
  store: DatabaseManager,
  name: WorkingGroupModuleName,
  relations: RelationsArr<WGEntity> = []
): Promise<WGEntity> {
  return getOneByOrFail(store, WGEntity, { name }, relations)
}

export async function getMembershipById(
  store: DatabaseManager,
  id: MemberId,
  relations: RelationsArr<Membership> = []
): Promise<Membership> {
  return getByIdOrFail(store, Membership, id.toString(), relations)
}

export async function getWorkerOrFail(
  store: DatabaseManager,
  groupName: WorkingGroupModuleName,
  runtimeId: WorkerId | number,
  relations: RelationsArr<Worker> = []
): Promise<Worker> {
  const workerDbId = `${groupName}-${runtimeId}`
  return getByIdOrFail(store, Worker, workerDbId, relations)
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
): Promise<T | undefined> {
  return store.get(entityClass, { where: { id }, relations } as FindOneOptions<T>)
}

export async function getByIdOrFail<T extends BaseModel>(
  store: DatabaseManager,
  entityClass: EntityClass<T>,
  id: string,
  relations?: RelationsArr<T>,
  errMessage?: string
): Promise<T> {
  const result = await getById<T>(store, entityClass, id, relations)
  if (!result) {
    // eslint-disable-next-line local-rules/no-throw
    throw new Error(`Expected "${entityClass.name}" not found by ID: ${id} ${errMessage ? `- ${errMessage}` : ''}`)
  }

  return result
}

export async function getOneBy<T extends BaseModel>(
  store: DatabaseManager,
  entityClass: EntityClass<T>,
  where?: FindOptionsWhere<T>,
  relations?: RelationsArr<T>,
  order?: Partial<{ [K in keyof T]: FindOptionsOrderValue }>
): Promise<T | undefined> {
  return store.get(entityClass, { where, relations, order } as FindOneOptions<T>)
}

/**
 * Retrieves a entity by any field(s) or throws an error if not found
 */
export async function getOneByOrFail<T extends BaseModel>(
  store: DatabaseManager,
  entityClass: EntityClass<T>,
  where?: FindOptionsWhere<T>,
  relations?: RelationsArr<T>,
  order?: Partial<{ [K in keyof T]: FindOptionsOrderValue }>,
  errMessage?: string
): Promise<T> {
  const result = await getOneBy(store, entityClass, where, relations, order)
  if (!result) {
    // eslint-disable-next-line local-rules/no-throw
    throw new Error(
      `Expected "${entityClass.name}" not found by filter: ${JSON.stringify({
        where,
        relations,
        order,
      })} ${errMessage ? `- ${errMessage}` : ''}`
    )
  }

  return result
}

export async function getManyBy<T extends BaseModel>(
  store: DatabaseManager,
  entityClass: EntityClass<T>,
  entityIds: string[],
  where?: FindOptionsWhere<T>,
  relations?: RelationsArr<T>
): Promise<T[]> {
  return store.getMany(entityClass, { where: { id: In(entityIds), ...where }, relations } as FindOneOptions<T>)
}

export async function getManyByOrFail<T extends BaseModel>(
  store: DatabaseManager,
  entityClass: EntityClass<T>,
  entityIds: string[],
  where?: FindOptionsWhere<T>,
  relations?: RelationsArr<T>,
  errMessage?: string
): Promise<T[]> {
  const entities = await getManyBy(store, entityClass, entityIds, where, relations)
  const loadedEntityIds = entities.map((item) => item.id)
  if (loadedEntityIds.length !== entityIds.length) {
    const missingIds = entityIds.filter((item) => !loadedEntityIds.includes(item))

    // eslint-disable-next-line local-rules/no-throw
    throw new Error(
      `"${entityClass.name}" missing records for following IDs: ${missingIds} ${errMessage ? `- ${errMessage}` : ''}`
    )
  }
  return entities
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

export async function saveMetaprotocolTransactionSuccessful(
  store: DatabaseManager,
  event: SubstrateEvent,
  info: Partial<MetaprotocolTransactionSuccessful>
): Promise<void> {
  const status = new MetaprotocolTransactionSuccessful()
  Object.assign(status, info)

  const metaprotocolTransaction = new MetaprotocolTransactionStatusEvent({
    ...genericEventFields(event),
    status,
  })

  await store.save(metaprotocolTransaction)
}

export async function saveMetaprotocolTransactionErrored(
  store: DatabaseManager,
  event: SubstrateEvent,
  error: MetaprotocolTxError
): Promise<void> {
  const status = new MetaprotocolTransactionErrored()
  status.message = error

  const metaprotocolTransaction = new MetaprotocolTransactionStatusEvent({
    ...genericEventFields(event),
    status,
  })

  await store.save(metaprotocolTransaction)
}

export enum MetaprotocolTxError {
  InvalidMetadata = 'InvalidMetadata',

  // App errors
  AppAlreadyExists = 'AppAlreadyExists',
  AppNotFound = 'AppNotFound',
  InvalidAppOwnerMember = 'InvalidAppOwnerMember',

  // Video errors
  VideoNotFound = 'VideoNotFound',
  VideoNotFoundInChannel = 'VideoNotFoundInChannel',
  VideoReactionsDisabled = 'VideoReactionsDisabled',

  // Comment errors
  CommentSectionDisabled = 'CommentSectionDisabled',
  CommentNotFound = 'CommentNotFound',
  ParentCommentNotFound = 'ParentCommentNotFound',
  InvalidCommentAuthor = 'InvalidCommentAuthor',

  // Membership error
  MemberNotFound = 'MemberNotFound',
  MemberBannedFromChannel = 'MemberBannedFromChannel',

  // Channel errors
  InvalidChannelRewardAccount = 'InvalidChannelRewardAccount',
}
