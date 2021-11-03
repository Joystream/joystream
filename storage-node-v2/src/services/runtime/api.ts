import { ApiPromise, WsProvider, SubmittableResult } from '@polkadot/api'
import type { Index } from '@polkadot/types/interfaces/runtime'
import { ISubmittableResult, IEvent } from '@polkadot/types/types'
import { types } from '@joystream/types/'
import { TypeRegistry } from '@polkadot/types'
import { KeyringPair } from '@polkadot/keyring/types'
import { SubmittableExtrinsic, AugmentedEvent } from '@polkadot/api/types'
import { DispatchError, DispatchResult } from '@polkadot/types/interfaces/system'
import { getTransactionNonce, resetTransactionNonceCache } from '../caching/transactionNonceKeeper'
import logger from '../../services/logger'
import ExitCodes from '../../command-base/ExitCodes'
import { CLIError } from '@oclif/errors'
import stringify from 'fast-safe-stringify'

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

  const api = new ApiPromise({ provider, types })
  await api.isReadyOrError

  api.on('error', (err) => logger.error(`Api promise error: ${err.target?._url}`, { err }))

  return api
}

/**
 * Sends an extrinsic to the runtime and follows the result.
 *
 * @param api - API promise
 * @param account - KeyPair instance
 * @param tx - runtime transaction object to send
 * @param nonce - transaction nonce for a given account.
 * @returns extrinsic result promise.
 */
function sendExtrinsic(
  api: ApiPromise,
  account: KeyringPair,
  tx: SubmittableExtrinsic<'promise'>,
  nonce: Index
): Promise<ISubmittableResult> {
  return new Promise((resolve, reject) => {
    let unsubscribe: () => void
    tx.signAndSend(account, { nonce }, (result) => {
      // Implementation loosely based on /pioneer/packages/react-signer/src/Modal.tsx
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
              const sudid = result.findRecord('sudo', 'Sudid')

              if (sudid) {
                const dispatchResult = sudid.event.data[0] as DispatchResult
                if (dispatchResult.isOk) {
                  resolve(result)
                } else {
                  const errorMsg = formatDispatchError(api, dispatchResult.asErr)
                  reject(
                    new ExtrinsicFailedError(`Sudo extrinsic execution error! ${errorMsg}`, {
                      exit: ExitCodes.ApiError,
                    })
                  )
                }
              } else {
                resolve(result)
              }
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
      .then((unsubFunc) => (unsubscribe = unsubFunc))
      .catch((e) =>
        reject(
          new ExtrinsicFailedError(`Cannot send the extrinsic: ${e.message ? e.message : stringify(e)}`, {
            exit: ExitCodes.ApiError,
          })
        )
      )
  })
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
  const { name, documentation } = typeRegistry.findMetaError(error.asModule)
  const errorMsg = `${name} (${documentation})`

  return errorMsg
}

/**
 * Helper function for sending an extrinsic to the runtime. It constructs an
 * actual transaction object.
 *
 * @param api - API promise
 * @param account - KeyPair instance
 * @param tx - prepared extrinsic with arguments
 * @param sudoCall - defines whether the transaction call should be wrapped in
 * the sudo call (false by default).
 * @param eventParser - defines event parsing function (null by default) for
 * getting any information from the successful extrinsic events.
 * @returns void or event parsing result promise.
 */
export async function sendAndFollowNamedTx<T>(
  api: ApiPromise,
  account: KeyringPair,
  tx: SubmittableExtrinsic<'promise'>,
  sudoCall = false,
  eventParser: ((result: ISubmittableResult) => T) | null = null
): Promise<T | void> {
  try {
    logger.debug(`Sending ${tx.method.section}.${tx.method.method} extrinsic...`)
    if (sudoCall) {
      tx = api.tx.sudo.sudo(tx)
    }
    const nonce = await getTransactionNonce(api, account)

    const result = await sendExtrinsic(api, account, tx, nonce)
    let eventResult: T | void
    if (eventParser) {
      eventResult = eventParser(result)
    }
    logger.debug(`Extrinsic successful!`)

    return eventResult
  } catch (err) {
    await resetTransactionNonceCache()
    throw err
  }
}

/**
 * Helper function for sending an extrinsic to the runtime. It constructs an
 * actual transaction object and sends a transactions wrapped in sudo call.
 *
 * @param api - API promise
 * @param account - KeyPair instance
 * @param tx - prepared extrinsic with arguments
 * @param eventParser - defines event parsing function (null by default) for
 * getting any information from the successful extrinsic events.
 * @returns void promise.
 */
export async function sendAndFollowSudoNamedTx<T>(
  api: ApiPromise,
  account: KeyringPair,
  tx: SubmittableExtrinsic<'promise'>,
  eventParser: ((result: ISubmittableResult) => T) | null = null
): Promise<T | void> {
  return sendAndFollowNamedTx(api, account, tx, true, eventParser)
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
