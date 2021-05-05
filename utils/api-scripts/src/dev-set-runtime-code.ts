import { ApiPromise, WsProvider } from '@polkadot/api'
import { types } from '@joystream/types'
import { Keyring } from '@polkadot/keyring'
import { ISubmittableResult } from '@polkadot/types/types/'
import { DispatchError, DispatchResult } from '@polkadot/types/interfaces/system'
import { TypeRegistry } from '@polkadot/types'
import fs from 'fs'
import { compactAddLength } from '@polkadot/util'

function onApiDisconnected() {
  process.exit(2)
}

function onApiError() {
  process.exit(3)
}

async function main() {
  const file = process.argv[2]

  if (!file) {
    console.log('No wasm file argument provided.')
    process.exit(1)
  }

  const wasm = Uint8Array.from(fs.readFileSync(file))
  console.log('WASM bytes:', wasm.byteLength)

  const provider = new WsProvider('ws://127.0.0.1:9944')

  let api: ApiPromise
  let retry = 6
  while (true) {
    try {
      api = new ApiPromise({ provider, types })
      await api.isReadyOrError
      break
    } catch (err) {
      // failed to connect to node
    }

    if (retry-- === 0) {
      process.exit(-1)
    }

    await new Promise((resolve) => {
      setTimeout(resolve, 5000)
    })
  }

  const keyring = new Keyring()
  const sudo = keyring.addFromUri('//Alice', undefined, 'sr25519')

  // DO NOT SET UNCHECKED!
  // const tx = api.tx.system.setCodeWithoutChecks(wasm)

  const setCodeTx = api.tx.system.setCode(compactAddLength(wasm))
  const sudoTx = api.tx.sudo.sudoUncheckedWeight(setCodeTx, 1)
  const nonce = (await api.query.system.account(sudo.address)).nonce
  const signedTx = sudoTx.sign(sudo, { nonce })

  // console.log('Tx size:', signedTx.length)
  // const wasmCodeInTxArg = (signedTx.method.args[0] as Call).args[0]
  // console.log('WASM code arg byte length:', (wasmCodeInTxArg as Bytes).byteLength)

  await signedTx.send((result: ISubmittableResult) => {
    if (result.status.isInBlock && result.events !== undefined) {
      result.events.forEach((event) => {
        if (event.event.method === 'ExtrinsicFailed') {
          console.log('ExtrinsicFailed', (event.event.data[0] as DispatchError).toHuman())
          process.exit(4)
        }

        if (event.event.method === 'Sudid') {
          const result = event.event.data[0] as DispatchResult
          if (result.isOk) {
            process.exit(0)
          } else if (result.isError) {
            const err = result.asError
            console.log('Error:', err.toHuman())
            if (err.isModule) {
              const { name, documentation } = (api.registry as TypeRegistry).findMetaError(err.asModule)
              console.log(`${name}\n${documentation}`)
            }
            process.exit(5)
          } else {
            console.log('Sudid result:', result.toHuman())
            process.exit(-1)
          }
        }
      })

      // Wait a few seconds to display new runtime changes
      setTimeout(() => {
        process.exit(0)
      }, 12000)
    }
  })

  api.on('disconnected', onApiDisconnected)
  api.on('error', onApiError)

  await new Promise(() => {
    // wait until transaction finalizes
  })
}

main()
