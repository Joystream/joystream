import { ApiPromise, WsProvider } from '@polkadot/api'
import { constructTransactionDetails } from './helpers/TransactionDetails'
import { Vec } from '@polkadot/types'
import { EventRecord } from '@polkadot/types/interfaces'

async function monitorForTransaction(wsProvider: WsProvider, txHash: string | undefined) {
  const api = await ApiPromise.create({ provider: wsProvider })

  // Wait for transaction inclusion
  const unsub = await api.rpc.chain.subscribeFinalizedHeads(async (header) => {
    const blockHash = header.hash
    const block = await api.rpc.chain.getBlock(blockHash)
    const extrinsics = block.block.extrinsics
    console.error(`Checking finalized block #${header.number} extrinsic count: ${extrinsics.length}`)

    for (let index = 0; index < extrinsics.length; index++) {
      const extrinsic = extrinsics[index]
      const { method, section } = extrinsic.method
      if (section !== 'balances') continue
      if (!method.startsWith('transfer')) continue
      if (extrinsic.hash.toHex() === txHash || !txHash) {
        const blockEvents = await (await api.at(blockHash)).query.system.events()
        const details = constructTransactionDetails(blockEvents as Vec<EventRecord>, index, extrinsic)
        if (details.result !== 'Success') continue
        delete details.events
        delete details.nonce
        details.blockHash = blockHash.toHex()
        details.blockNumber = header.number.toNumber()
        console.log(JSON.stringify(details, null, 2))
        if (txHash) {
          unsub() // Unsubscribe when transaction is found
          await api.disconnect()
          return
        }
      }
    }
  })
}

const txHash = process.argv[2]
const WS_URI = process.env.WS_URI || 'ws://127.0.0.1:9944'
const wsProvider = new WsProvider(WS_URI)

monitorForTransaction(wsProvider, txHash).then(console.log).catch(console.error)
