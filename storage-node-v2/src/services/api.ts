import { ApiPromise, WsProvider } from '@polkadot/api'
import {
  RegistryTypes,
  CodecArg,
  ISubmittableResult,
} from '@polkadot/types/types'
import { types } from '@joystream/types/'
import { TypeRegistry } from '@polkadot/types'
import { KeyringPair } from '@polkadot/keyring/types'
import chalk from 'chalk'
import { SubmittableExtrinsic } from '@polkadot/api/types'
import { DispatchError } from '@polkadot/types/interfaces/system'

export class ExtrinsicFailedError extends Error {}

function createExtendedTypes(): RegistryTypes {
  const extendedTypes = types
  extendedTypes.StorageBucketId = 'u64'
  extendedTypes.DynamicBagId = {}
  extendedTypes.StorageBucketsPerBagValueConstraint = {}
  extendedTypes.Voucher = {}
  extendedTypes.DynamicBagType = {}
  extendedTypes.DynamicBagCreationPolicy = {}
  extendedTypes.DataObjectId = {}
  extendedTypes.DynamicBag = {}
  extendedTypes.StaticBag = {}
  extendedTypes.StorageBucket = {}

  extendedTypes.BagId = {_enum: {Static: 'StaticBagId'}}
  extendedTypes.Static = 'StaticBagId'
  extendedTypes.StaticBagId = {_enum: ['Council']}

  extendedTypes.DataObjectCreationParameters = {}
  extendedTypes.BagIdType = {_enum: {Static: 'StaticBagId'}}
  extendedTypes.UploadParameters = {
    authenticationKey: 'Vec<u8>',
    bagId: 'BagId',
    objectCreationList: 'Vec<DataObjectCreationParameters>',
    deletionPrizeSourceAccountId : 'AccountId'
  }

  return extendedTypes
}

export async function createApi(): Promise<ApiPromise> {
  const wsProvider = new WsProvider('ws://localhost:9944')
  const extendedTypes = createExtendedTypes()

  return await ApiPromise.create({ provider: wsProvider, types: extendedTypes })
}

function sendExtrinsic(
  api: ApiPromise,
  account: KeyringPair,
  tx: SubmittableExtrinsic<'promise'>
): Promise<ISubmittableResult> {
  return new Promise((resolve, reject) => {
    let unsubscribe: () => void
    tx.signAndSend(account, {}, (result) => {
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
                  `Extrinsic execution error: ${errorMsg}`
                )
              )
            } else if (event.method === 'ExtrinsicSuccess') {
              resolve(result)
            }
          })
      } else if (result.isError) {
        reject(new ExtrinsicFailedError('Extrinsic execution error!'))
      }
    })
      .then((unsubFunc) => (unsubscribe = unsubFunc))
      .catch((e) =>
        reject(
          new Error(
            `Cannot send the extrinsic: ${
              e.message ? e.message : JSON.stringify(e)
            }`
          )
        )
      )
  })
}

async function sendAndFollowTx(
  api: ApiPromise,
  account: KeyringPair,
  tx: SubmittableExtrinsic<'promise'>,
  warnOnly = false // If specified - only warning will be displayed in case of failure (instead of error beeing thrown)
): Promise<boolean> {
  try {
    await sendExtrinsic(api, account, tx)
    console.log(chalk.green(`Extrinsic successful!`))
    return true
  } catch (e) {
    if (e instanceof ExtrinsicFailedError && warnOnly) {
      console.warn(`Extrinsic failed! ${e.message}`)
      return false
    } else if (e instanceof ExtrinsicFailedError) {
      throw new ExtrinsicFailedError(`Extrinsic failed! ${e.message}`)
    } else {
      throw e
    }
  }
}

export async function sendAndFollowNamedTx(
  api: ApiPromise,
  account: KeyringPair,
  module: string,
  method: string,
  params: CodecArg[],
  warnOnly = false
): Promise<boolean> {
  console.log(chalk.white(`\nSending ${module}.${method} extrinsic...`))
  const tx = api.tx[module][method](...params)
  return await sendAndFollowTx(api, account, tx, warnOnly)
}

//TODO: handle SUDO errors
export async function sendAndFollowSudoNamedTx(
  api: ApiPromise,
  account: KeyringPair,
  module: string,
  method: string,
  params: CodecArg[],
  warnOnly = false
): Promise<boolean> {
  console.log(chalk.white(`\nSending ${module}.${method} extrinsic...`))
  const tx = api.tx.sudo.sudo(api.tx[module][method](...params))
  return await sendAndFollowTx(api, account, tx, warnOnly)
}
