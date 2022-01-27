import { DatabaseManager, SubstrateEvent, SubstrateExtrinsic, ExtrinsicArg } from '@joystream/hydra-common'
import { Bytes } from '@polkadot/types'
import { Network } from 'query-node/dist/model'
import { BaseModel } from '@joystream/warthog'
import { metaToObject } from '@joystream/metadata-protobuf/utils'
import { AnyMetadataClass, DecodedMetadataObject } from '@joystream/metadata-protobuf/types'

export const CURRENT_NETWORK = Network.GIZA

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

/// //////////////// Sudo extrinsic calls ///////////////////////////////////////

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
  callFactoryConstructor: new (event: SubstrateEvent) => EventObject,

  // in ideal world this parameter would not be needed, but there is no way to associate parameters
  // used in sudo to extrinsic parameters without it
  argsIndeces: Record<keyof DataParams, number>
): EventObject['args'] {
  const CallFactory = callFactoryConstructor
  // this is equal to DataParams but only this notation works properly
  // escape when extrinsic info is not available
  if (!rawEvent.extrinsic) {
    throw new Error('Invalid event - no extrinsic set') // this should never happen
  }

  // regural extrinsic call?
  if (rawEvent.extrinsic.section !== 'sudo') {
    return new CallFactory(rawEvent).args
  }

  // sudo extrinsic call

  const callArgs = extractSudoCallParameters<DataParams>(rawEvent)

  // convert naming convention (underscore_names to camelCase)
  const clearArgs = Object.keys(callArgs.args).reduce((acc, key) => {
    const formattedName = key.replace(/_([a-z])/g, (tmp) => tmp[1].toUpperCase())

    acc[formattedName] = callArgs.args[key]

    return acc
  }, {} as DataParams)

  // prepare partial event object
  const partialEvent = {
    extrinsic: ({
      args: Object.keys(argsIndeces).reduce((acc, key) => {
        acc[argsIndeces[key]] = {
          value: clearArgs[key],
        }

        return acc
      }, [] as unknown[]),
    } as unknown) as SubstrateExtrinsic,
  } as SubstrateEvent

  // create event object and extract processed args
  const finalArgs = new CallFactory(partialEvent).args

  return finalArgs
}

/*
  Extracts extrinsic call parameters used inside of sudo call.
*/
export function extractSudoCallParameters<DataParams>(rawEvent: SubstrateEvent): ISudoCallArgs<DataParams> {
  if (!rawEvent.extrinsic) {
    throw new Error('Invalid event - no extrinsic set') // this should never happen
  }

  // see Substrate's sudo frame for more info about sudo extrinsics and `call` argument index
  const argIndex =
    false ||
    (rawEvent.extrinsic.method === 'sudoAs' && 1) || // who, *call*
    (rawEvent.extrinsic.method === 'sudo' && 0) || // *call*
    (rawEvent.extrinsic.method === 'sudoUncheckedWeight' && 0) // *call*, _weight

  // ensure `call` argument was found
  if (argIndex === false) {
    // this could possibly happen in sometime in future if new sudo options are introduced in Substrate
    throw new Error('Not implemented situation with sudo')
  }

  // typecast call arguments
  const callArgs = (rawEvent.extrinsic.args[argIndex].value as unknown) as ISudoCallArgs<DataParams>

  return callArgs
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
