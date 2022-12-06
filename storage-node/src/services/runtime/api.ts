import { ApiPromise, WsProvider, SubmittableResult } from '@polkadot/api'
import type { Index } from '@polkadot/types/interfaces/runtime'
import { ISubmittableResult, IEvent } from '@polkadot/types/types'
import { TypeRegistry } from '@polkadot/types'
import { KeyringPair } from '@polkadot/keyring/types'
import { SubmittableExtrinsic, AugmentedEvent } from '@polkadot/api/types'
import { DispatchError } from '@polkadot/types/interfaces/system'
import logger from '../../services/logger'
import ExitCodes from '../../command-base/ExitCodes'
import { CLIError } from '@oclif/errors'
import { formatBalance } from '@polkadot/util'
import stringify from 'fast-safe-stringify'
import sleep from 'sleep-promise'
import AwaitLock from 'await-lock'

/**
 * Dedicated error for the failed extrinsics.
 */
export class ExtrinsicFailedError extends CLIError {}

/**
 * Initializes the runtime API and Joystream runtime types.
 *
 * @param apiUrl - API URL string
 * @returns runtime API promise
 */
export async function createApi(apiUrl: string): Promise<ApiPromise> {
  const provider = new WsProvider(apiUrl)
  provider.on('error', (err) => logger.error(`Api provider error: ${err.target?._url}`, { err }))

  const api = new ApiPromise({ provider })
  await api.isReadyOrError
  await untilChainIsSynced(api)

  const properties = await api.rpc.system.properties()

  const tokenSymbol = properties.tokenSymbol.unwrap()[0].toString()
  const tokenDecimals = properties.tokenDecimals.unwrap()[0].toNumber()

  // formatBlanace config
  formatBalance.setDefaults({
    decimals: tokenDecimals,
    unit: tokenSymbol,
  })

  api.on('error', (err) => logger.error(`Api promise error: ${err.target?._url}`, { err }))

  return api
}

/**
 * Awaits the chain to be fully synchronized.
 */
async function untilChainIsSynced(api: ApiPromise) {
  logger.info('Waiting for chain to be synced before proceeding.')
  while (true) {
    const isSyncing = await chainIsSyncing(api)
    if (isSyncing) {
      logger.info('Still waiting for chain to be synced.')
      await sleep(1 * 30 * 1000)
    } else {
      return
    }
  }
}

/**
 * Checks the chain sync status.
 *
 * @param api api promise
 * @returns
 */
async function chainIsSyncing(api: ApiPromise) {
  const { isSyncing } = await api.rpc.system.health()
  return isSyncing.isTrue
}

const lock = new AwaitLock()

/**
 * Sends an extrinsic to the runtime and follows the result.
 *
 * @param api - API promise
 * @param account - KeyPair instance
 * @param tx - runtime transaction object to send
 * @returns extrinsic result promise.
 */
async function sendExtrinsic(
  api: ApiPromise,
  account: KeyringPair,
  tx: SubmittableExtrinsic<'promise'>
): Promise<ISubmittableResult> {
  const nonce = await lockAndGetNonce(api, account)

  return new Promise((resolve, reject) => {
    let unsubscribe: () => void
    tx.signAndSend(account, { nonce }, (result) => {
      if (!result || !result.status) {
        return
      }

      if (result.status.isInBlock) {
        unsubscribe()
        result.events
          .filter(({ event }) => event.section === 'system')
          .forEach(({ event }) => {
            if (event.method === 'ExtrinsicFailed') {
              const dispatchError = event.data[0] as DispatchError
              let errorMsg = dispatchError.toString()
              if (dispatchError.isModule) {
                try {
                  errorMsg = formatDispatchError(api, dispatchError)
                } catch (e) {
                  // This probably means we don't have this error in the metadata
                  // In this case - continue (we'll just display dispatchError.toString())
                }
              }
              reject(
                new ExtrinsicFailedError(`Extrinsic execution error: ${errorMsg}`, {
                  exit: ExitCodes.ApiError,
                })
              )
            } else if (event.method === 'ExtrinsicSuccess') {
              resolve(result)
            }
          })
      } else if (result.isError) {
        reject(
          new ExtrinsicFailedError('Extrinsic execution error!', {
            exit: ExitCodes.ApiError,
          })
        )
      }
    })
      .then((unsubFunc) => {
        unsubscribe = unsubFunc
      })
      .catch((e) =>
        reject(
          new ExtrinsicFailedError(`Cannot send the extrinsic: ${e.message ? e.message : stringify(e)}`, {
            exit: ExitCodes.ApiError,
          })
        )
      )
      .finally(() => lock.release())
  })
}

/**
 * Set the API lock and gets the last account nonce. It removes the lock on
 * exception and rethrows the error.
 *
 * @param api runtime API promise
 * @param account account to get the last nonce from.
 * @returns
 */
async function lockAndGetNonce(api: ApiPromise, account: KeyringPair): Promise<Index> {
  await lock.acquireAsync()
  try {
    return await api.rpc.system.accountNextIndex(account.address)
  } catch (err) {
    lock.release()
    throw err
  }
}

/**
 * Helper function for formatting dispatch error.
 *
 * @param api - API promise
 * @param error - DispatchError instance
 * @returns error string.
 */
function formatDispatchError(api: ApiPromise, error: DispatchError): string {
  // Need to assert that registry is of TypeRegistry type, since Registry intefrace
  // seems outdated and doesn't include DispatchErrorModule as possible argument for "findMetaError"
  const typeRegistry = api.registry as TypeRegistry
  const { name, docs } = typeRegistry.findMetaError(error.asModule)
  const errorMsg = `${name} (${docs.join(', ')})`

  return errorMsg
}

/**
 * Helper function for sending an extrinsic to the runtime. It constructs an
 * actual transaction object.
 *
 * @param api - API promise
 * @param account - KeyPair instance
 * @param tx - prepared extrinsic with arguments
 * @param eventParser - defines event parsing function (null by default) for
 * getting any information from the successful extrinsic events.
 * @returns void or event parsing result promise.
 */
export async function sendAndFollowNamedTx<T>(
  api: ApiPromise,
  account: KeyringPair,
  tx: SubmittableExtrinsic<'promise'>,
  eventParser: ((result: ISubmittableResult) => T) | null = null
): Promise<T | void> {
  logger.debug(`Sending ${tx.method.section}.${tx.method.method} extrinsic...`)

  const result = await sendExtrinsic(api, account, tx)
  let eventResult: T | void
  if (eventParser) {
    eventResult = eventParser(result)
  }
  logger.debug(`Extrinsic successful!`)

  return eventResult
}

/**
 * Helper function for parsing the successful extrinsic result for event.
 *
 * @param result - extrinsic result
 * @param section - pallet name
 * @param eventName - event name
 * @returns void promise.
 */
export function getEvent<
  S extends keyof ApiPromise['events'] & string,
  M extends keyof ApiPromise['events'][S] & string,
  EventType = ApiPromise['events'][S][M] extends AugmentedEvent<'promise', infer T> ? IEvent<T> : never
>(result: SubmittableResult, section: S, eventName: M): EventType {
  const event = result.findRecord(section, eventName)?.event as EventType | undefined

  if (!event) {
    throw new ExtrinsicFailedError(`Cannot find expected ${section}.${eventName} event in result: ${result.toHuman()}`)
  }
  return event as EventType
}
