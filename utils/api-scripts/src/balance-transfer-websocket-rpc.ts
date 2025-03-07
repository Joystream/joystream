/*
  Example of how to create a signed transfer transaction using Websocket RPC interface.
  The program will wait for the transaction is finalized.
  The finalized blockhash, transaction index will be printed.
*/

import { ApiPromise, WsProvider } from '@polkadot/api'
import { cryptoWaitReady } from '@polkadot/util-crypto'
import { Keyring } from '@polkadot/keyring'
import { BN } from '@polkadot/util'
import { decodeError } from './helpers/decodeError'

async function main() {
  await cryptoWaitReady()

  // Initialise the provider to connect to the local node
  const WS_URI = process.env.WS_URI || 'ws://127.0.0.1:9944'
  const provider = new WsProvider(WS_URI)

  // Create the API and wait until ready
  const api = await ApiPromise.create({ provider })

  const keyring = new Keyring({ type: 'sr25519', ss58Format: 126 })

  // const keyringPair = keyring.addFromMnemonic('your mnemonic phrase', {}, 'sr25519')
  const keyringPair = keyring.addFromUri('//Alice', undefined, 'sr25519')

  // Create a transfer transaction
  const OneJoy = new BN(`${1e10}`, 10) // 10_000_000_000 = 1 Joy
  const tx = api.tx.balances.transfer('j4UYhDYJ4pz2ihhDDzu69v2JTVeGaGmTebmBdWaX2ANVinXyE', OneJoy)

  const { partialFee } = await tx.paymentInfo(keyringPair.address)
  console.error('Estimated Fee:', partialFee.toHuman())

  // Get the next account nonce
  const nonce = await api.rpc.system.accountNextIndex(keyringPair.address)

  const signedTx = await tx.signAsync(keyringPair, { nonce })
  console.error('Transaction:', signedTx.toHuman())

  console.error('TxHash:', signedTx.hash.toHex())

  await signedTx.send((result) => {
    if (result.status.isReady) {
      // The transaction has been successfully validated by the transaction pool
      // and is ready to be included in a block by the block producer.
      console.error('Tx Submitted, waiting for inclusion...')
    }

    if (result.status.isInBlock) {
      // console.error('Tx in block', result.status.asInBlock.toHex())
      console.error('Tx in Block, waiting for finalization...')
    }

    if (result.status.isFinalized) {
      console.error('Tx Finalized.')
      const blockHash = result.status.asFinalized
      console.log(
        JSON.stringify(
          {
            'blockHash': blockHash.toHex(),
            'txIndex': result.txIndex,
            // 'txHash': result.txHash.toHex(),
            // 'txSignature': signedTx.signature.toHex(),
          },
          null,
          2
        )
      )
      const success = result.findRecord('system', 'ExtrinsicSuccess')
      if (success) {
        console.error('Transfer successful.')
        process.exit(0)
      } else {
        const failed = result.findRecord('system', 'ExtrinsicFailed')
        if (failed) {
          console.error('Transfer Failed.', failed.event.data.toString())
          console.error('Error:', decodeError(api, failed.event))
        }
        process.exit(3)
      }
    }

    if (result.isError) {
      console.error('Error', result.toHuman())
      process.exit(2)
    }
  })
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
