/*
  Example in three steps of how to create a signed transfer transaction, using txwrapper sdk.
  This allows the construction of the unsigned transaction on one machine which doesn't hold the
  private key and needs to be online, and the signing on another machine which does hold the private key.
*/

import { ApiPromise, HttpProvider } from '@polkadot/api'
import { methods } from './helpers/txwrapper'
import { construct } from '@substrate/txwrapper-core'
import { Keyring } from '@polkadot/keyring'
import { cryptoWaitReady } from '@polkadot/util-crypto'
import { signWith } from './helpers/signWith'
import { JOYSTREAM_CHAIN_CONFIG } from './helpers/ChainConfig'

async function signOfflineTransaction() {
  await cryptoWaitReady()

  const senderAddress = 'j4W7rVcUCxi2crhhjRq46fNDRbVHTjJrz6bKxZwehEMQxZeSf' // Signer (Alice)
  const recipientAddress = 'j4UYhDYJ4pz2ihhDDzu69v2JTVeGaGmTebmBdWaX2ANVinXyE' // Destination (Bob)
  const transferAmount = `${1e10}` // 10_000_000_000 = 1 Joy
  const tip = 0

  const { registry, metadataRpc, specVersion, transactionVersion } = JOYSTREAM_CHAIN_CONFIG

  const HTTP_RPC_URI = process.env.HTTP_RPC_URI || 'http://127.0.0.1:9933'
  const provider = new HttpProvider(HTTP_RPC_URI)
  const api = await ApiPromise.create({ provider })

  const genesisHash = (await api.rpc.chain.getBlockHash(0)).toHex()
  const nonce = (await api.rpc.system.accountNextIndex(senderAddress)).toNumber()
  const lastHeader = await api.rpc.chain.getHeader()

  // Step 1: Construct the unsigned transaction
  const unsignedTransaction = methods.balances.transfer(
    {
      value: transferAmount,
      dest: recipientAddress,
    },
    {
      address: senderAddress,
      blockHash: lastHeader.hash.toHex(),
      blockNumber: lastHeader.number.toNumber(),
      eraPeriod: 128,
      genesisHash,
      metadataRpc,
      nonce,
      specVersion,
      transactionVersion,
      tip,
    },
    {
      registry,
      metadataRpc,
    }
  )

  console.log('Unsigned Transaction:', unsignedTransaction)

  const exportedTx = JSON.stringify(unsignedTransaction)
  // Transport the transaction to the offline signer...
  const importedTx = JSON.parse(exportedTx)

  // Step 2: Sign the transaction offline
  const keyring = new Keyring({ type: 'sr25519' })
  const senderKeyPair = keyring.addFromUri('//Alice') // Replace with the private key or mnemonic of the sender

  const signature = signWith(senderKeyPair, importedTx, {
    metadataRpc,
    registry,
  })

  console.log(`\nSignature: ${signature}`)

  // Encode a signed transaction.
  const tx = construct.signedTx(importedTx, signature, {
    metadataRpc,
    registry,
  })
  console.log(`\nTransaction to Submit: ${tx}`)

  // Calculate the tx hash of the signed transaction offline.
  const expectedTxHash = construct.txHash(tx)
  console.log(`\nExpected Tx Hash: ${expectedTxHash}`)

  // Step 3: Move the signed transaction to an online node and submit it to the network.
  const actualTxHash = await api.rpc.author.submitExtrinsic(tx)
  console.log(`\nActual Tx Hash: ${actualTxHash}`)
}

signOfflineTransaction().catch((error) => {
  console.error(error)
  process.exit(1)
})
