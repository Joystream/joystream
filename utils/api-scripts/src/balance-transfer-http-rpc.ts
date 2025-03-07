/* eslint-disable @typescript-eslint/no-unused-vars */

/*
  Example of how to create a signed transfer transaction using HTTP RPC interface. 
  The output of the program is the hex encoded transaction hash and the signed transaction.
  The transaction hash must be used to find the transaction success or failure result on the blockchain.
*/

import { ApiPromise, HttpProvider } from '@polkadot/api'
import { cryptoWaitReady } from '@polkadot/util-crypto'
import { Keyring } from '@polkadot/keyring'
import { BN } from '@polkadot/util'
import { JOYSTREAM_ADDRESS_PREFIX } from '@joystream/types'

async function main() {
  await cryptoWaitReady()

  // Create the API and wait until ready
  const HTTP_RPC_URI = process.env.HTTP_RPC_URI || 'http://127.0.0.1:9933'
  const provider = new HttpProvider(HTTP_RPC_URI)
  const api = await ApiPromise.create({ provider })

  const keyring = new Keyring({ type: 'sr25519', ss58Format: JOYSTREAM_ADDRESS_PREFIX })
  const keyringPair = keyring.addFromUri('//Alice', undefined, 'sr25519')

  // Create a transfer transaction
  const OneJoy = new BN(`${1e10}`, 10) // 10_000_000_000 = 1 Joy
  const destination = 'j4UYhDYJ4pz2ihhDDzu69v2JTVeGaGmTebmBdWaX2ANVinXyE'
  const tx = api.tx.balances.transfer(destination, OneJoy)

  const { partialFee } = await tx.paymentInfo(keyringPair.address)
  console.error('Estimated Fee:', partialFee.toHuman())

  // Get the next account nonce
  const senderAddress = keyringPair.address

  // const accountNonce = await fetchAccountNextIndex(senderAddress, HTTP_RPC_URI)
  const accountNonce = await api.rpc.system.accountNextIndex(senderAddress)

  // Sign the transaction
  const signedTx = await tx.signAsync(keyringPair, { nonce: accountNonce })
  console.error('Transaction:', signedTx.toHuman())

  // Transaction Hash can be used to find the transaction on the blockchain
  console.log('TxHash:', signedTx.hash.toHex())

  // Paste the hex here to decode it.
  // https://polkadot.js.org/apps/?rpc=wss%3A%2F%2Frpc.joystream.org#/extrinsics/decode
  console.log('Tx:', signedTx.toHex())

  // Submit the transaction
  // await submitExtrinsic(signedTx.toHex(), HTTP_RPC_URI)
  await api.rpc.author.submitExtrinsic(signedTx)
}

main()
  .catch(console.error)
  .finally(() => process.exit())
