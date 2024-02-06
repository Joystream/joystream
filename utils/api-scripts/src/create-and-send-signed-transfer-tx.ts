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

  // Sign and send the transaction
  const unsubscribe = await tx.signAndSend(keyringPair, { nonce }, (result) => {
    // log result at each transaction life cycle step
    console.log(result)
  })
  unsubscribe()
  await api.disconnect()
}

main()
  .catch(console.error)
  .finally(() => process.exit())
