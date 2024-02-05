import { ApiPromise, WsProvider } from '@polkadot/api'
import { cryptoWaitReady } from '@polkadot/util-crypto'
import { Keyring } from '@polkadot/keyring'
import { BN } from '@polkadot/util'

async function main() {
  await cryptoWaitReady()

  // Initialise the provider to connect to the local node
  const provider = new WsProvider('wss://rpc.joystream.org')

  // Create the API and wait until ready
  const api = await ApiPromise.create({ provider })

  const keyring = new Keyring({ type: 'sr25519', ss58Format: 126 })

  const keyringPair = keyring.addFromMnemonic('your mnemonic phrase', {}, 'sr25519')

  // Create a transfer transaction
  const OneJoy = new BN(10000000000)
  const tx = api.tx.balances.transfer('j4W34M9gBApzi8Sj9nXSSHJmv3UHnGKecyTFjLGnmxtJDi98L', OneJoy)

  // Get the next account nonce
  const nonce = await api.rpc.system.accountNextIndex(keyringPair.address)

  // We do not need the provider anymore, close it.
  await api.disconnect()

  // Sign the transaction
  const signedTx = tx.sign(keyringPair, { nonce })

  // Paste the hex here to decode it.
  // https://polkadot.js.org/apps/?rpc=wss%3A%2F%2Frpc.joystream.org#/extrinsics/decode
  // hex is the signed transaction which can be submitted to the network
  console.log(signedTx.toHex())
}

main().catch(console.error)
