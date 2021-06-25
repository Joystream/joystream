import { ApiPromise, WsProvider } from '@polkadot/api'
import type { Index } from '@polkadot/types/interfaces/runtime'
import { CodecArg, ISubmittableResult } from '@polkadot/types/types'
import { types } from '@joystream/types/'
import { TypeRegistry } from '@polkadot/types'
import { KeyringPair } from '@polkadot/keyring/types'
import { SubmittableExtrinsic } from '@polkadot/api/types'
import {
  DispatchError,
  DispatchResult,
} from '@polkadot/types/interfaces/system'
import { Keyring } from '@polkadot/keyring'
import { getNonce } from './nonceKeeper'
import logger from '../../services/logger'
import ExitCodes from '../../command-base/ExitCodes'
import { CLIError } from '@oclif/errors'

// TODO: ApiHelper class container for functions ???

export class ExtrinsicFailedError extends CLIError {}

// TODO: set URL variable
export async function createApi(): Promise<ApiPromise> {
  const provider = new WsProvider('ws://localhost:9944')

  return await ApiPromise.create({ provider, types })
}

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
                  // Need to assert that registry is of TypeRegistry type, since Registry intefrace
                  // seems outdated and doesn't include DispatchErrorModule as possible argument for "findMetaError"
                  const typeRegistry = api.registry as TypeRegistry
                  const { name, documentation } = typeRegistry.findMetaError(
                    dispatchError.asModule
                  )
                  errorMsg = `${name} (${documentation})`
                } catch (e) {
                  // This probably means we don't have this error in the metadata
                  // In this case - continue (we'll just display dispatchError.toString())
                }
              }
              reject(
                new ExtrinsicFailedError(
                  `Extrinsic execution error: ${errorMsg}`,
                  {
                    exit: ExitCodes.ApiError,
                  }
                )
              )
            } else if (event.method === 'ExtrinsicSuccess') {
              const sudid = result.findRecord('sudo', 'Sudid')

              if (sudid) {
                const dispatchSuccess = sudid.event.data[0] as DispatchResult
                if (dispatchSuccess.isOk) {
                  resolve(result)
                } else {
                  reject(
                    // TODO: print error
                    new ExtrinsicFailedError(
                      'Sudo extrinsic execution error!',
                      {
                        exit: ExitCodes.ApiError,
                      }
                    )
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
          new ExtrinsicFailedError(
            `Cannot send the extrinsic: ${
              e.message ? e.message : JSON.stringify(e)
            }`,
            {
              exit: ExitCodes.ApiError,
            }
          )
        )
      )
  })
}

// TODO: Refactor sendTx* methods.
export async function sendAndFollowTx(
  api: ApiPromise,
  account: KeyringPair,
  tx: SubmittableExtrinsic<'promise'>
): Promise<boolean> {
  const nonce = await getNonce(api, account)

  await sendExtrinsic(api, account, tx, nonce)
  logger.debug(`Extrinsic successful!`)
  return true
}

// TODO: Refactor sendTx* methods.
export async function sendAndFollowNamedTx(
  api: ApiPromise,
  account: KeyringPair,
  module: string,
  method: string,
  params: CodecArg[]
): Promise<boolean> {
  logger.debug(`Sending ${module}.${method} extrinsic...`)
  const tx = api.tx[module][method](...params)
  return await sendAndFollowTx(api, account, tx)
}

// TODO: Refactor sendTx* methods.
export async function sendAndFollowSudoNamedTx(
  api: ApiPromise,
  account: KeyringPair,
  module: string,
  method: string,
  params: CodecArg[]
): Promise<boolean> {
  logger.debug(`Sending ${module}.${method} extrinsic...`)
  const tx = api.tx.sudo.sudo(api.tx[module][method](...params))
  return await sendAndFollowTx(api, account, tx)
}

// TODO: Move to accounts.ts
export function getAlicePair(): KeyringPair {
  const keyring = new Keyring({ type: 'sr25519' })
  return keyring.addFromUri('//Alice')
}
