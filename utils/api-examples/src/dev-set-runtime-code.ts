import { ApiPromise, WsProvider } from '@polkadot/api'
import { types } from '@joystream/types'
import { Keyring } from '@polkadot/keyring'
import { ISubmittableResult } from '@polkadot/types/types/'
import { DispatchError, DispatchResult } from '@polkadot/types/interfaces/system'
import { TypeRegistry } from '@polkadot/types'
import fs from 'fs'

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

  // const wasm = '0x' + fs.readFileSync(file).toString('hex')
  const wasm = fs.readFileSync(file)
  console.log('WASM file size:', wasm.byteLength)

  const provider = new WsProvider('ws://127.0.0.1:9944')

  let api: ApiPromise
  let retry = 3
  while (true) {
    try {
      api = await ApiPromise.create({ provider, types })
      await api.isReady
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

  api.on('disconnected', onApiDisconnected)
  api.on('error', onApiError)

  const keyring = new Keyring()
  const sudo = keyring.addFromUri('//Alice', undefined, 'sr25519')

  const nonce = (await api.query.system.account(sudo.address)).nonce

  // DO SET UNCHECKED!
  // const tx = api.tx.system.setCodeWithoutChecks(wasm)

  const setCodeTx = api.tx.system.setCode(wasm)

  const sudoTx = api.tx.sudo.sudoUncheckedWeight(setCodeTx, 1)
  const signedTx = sudoTx.sign(sudo, { nonce })

  signedTx.send((result: ISubmittableResult) => {
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

      process.exit(0)
    }
  })

  await new Promise(() => {
    // wait until transaction finalizes
  })
}

main()
