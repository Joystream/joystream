// @ts-check

import { ApiPromise, WsProvider } from '@polkadot/api'
import * as types from '@polkadot/types'
import * as util from '@polkadot/util'
import joy, { types as joyTypes } from '@joystream/types'
import * as hashing from '@polkadot/util-crypto'
import { Keyring } from '@polkadot/keyring'
import fs from 'fs'
import path from 'path'

async function main() {
  const scriptArg = process.argv[2]

  if (!scriptArg) {
    console.error('Please specify script name.')
    console.error('Available scripts:', fs.readdirSync(path.join(__dirname, '../scripts')))
    return
  }

  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const script = require(`../scripts/${scriptArg}`)

  const provider = new WsProvider('ws://127.0.0.1:9944')

  const api = new ApiPromise({ provider, types: joyTypes })

  await api.isReady

  // We don't pass a custom signer to the api so we must use a keyPair
  // when calling signAndSend on transactions
  const keyring = new Keyring()

  // Optional last argument is a SURI for account to use for signing transactions
  const suri = process.argv[3]
  let userAddress
  if (suri) {
    userAddress = keyring.addFromUri(suri, undefined, 'sr25519').address
    console.error('userAddress:', userAddress)
  }

  // Add development well known keys to keyring
  if ((await api.rpc.system.chain()).toString() === 'Development') {
    keyring.addFromUri('//Alice', undefined, 'sr25519')
    keyring.addFromUri('//Bob', undefined, 'sr25519')
  }

  try {
    await script({ api, types, util, hashing, keyring, joy, userAddress })
  } catch (err) {
    console.error(err)
  }

  api.disconnect()
}

main()
