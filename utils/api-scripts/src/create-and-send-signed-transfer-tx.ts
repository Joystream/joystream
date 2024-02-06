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

  const signedTx = tx.sign(keyringPair, { nonce })

  await signedTx.send((result) => {
    if (result.status.isInBlock) {
      console.error('Included in block', result.status.asInBlock.toHex())
    }

    if (result.status.isReady) {
      console.error('Ready')
    }

    if (result.status.isFinalized) {
      const blockHash = result.status.asFinalized
      console.log(
        JSON.stringify(
          {
            'blockHash': blockHash.toHex(),
            'txIndex': result.txIndex,
            'txHash': result.txHash.toHex(),
            'txSignature': signedTx.signature.toHex(),
          },
          null,
          2
        )
      )
      process.exit(0)
    }

    if (result.isError) {
      console.error('Error', result.toHuman())
      process.exit(-2)
    }
  })
}

main().catch((err) => {
  console.error(err)
  process.exit(-1)
})
