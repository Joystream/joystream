// @ts-check

import { ApiPromise, WsProvider } from '@polkadot/api'
import * as types from '@polkadot/types'
import * as util from '@polkadot/util'
import { types as joyTypes } from '@joystream/types'
import * as joy from '@joystream/types'
import * as hashing from '@polkadot/util-crypto'
import { Keyring } from '@polkadot/keyring'

const scripts = require('../scripts')

async function main () {
  

  const scriptArg = process.argv[2]
  const script = scripts[scriptArg]

  if (!scriptArg || !script) {
    console.error('Please specify valid script name.')
    console.error('Available scripts:', Object.keys(scripts))
    return
  }

  const provider = new WsProvider('ws://127.0.0.1:9944')

  const api = await ApiPromise.create({ provider, types: joyTypes })

  // We don't pass a custom signer to the api so we must use a keyPair
  // when calling signAndSend on transactions
  const keyring = new Keyring()

  // Optional last argument is a SURI for account to use for signing transactions
  const suri = process.argv[3]
  if (suri) {
    keyring.addFromUri(suri, undefined, 'sr25519')
  }

  // Add development well known keys to keyring
  if ((await api.rpc.system.chain()).toString() === 'Development') {
    keyring.addFromUri('//Alice', undefined, 'sr25519')
    keyring.addFromUri('//Bob', undefined, 'sr25519')
  }

  try {
    await script({ api, types, util, hashing, keyring, joy })
  } catch (err) {
    console.error(err)
  }

  api.disconnect();
}

main()
