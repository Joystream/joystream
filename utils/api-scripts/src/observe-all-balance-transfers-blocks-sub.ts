import { ApiPromise, WsProvider } from '@polkadot/api'
import { constructTransactionDetails } from './helpers/TransactionDetails'

async function monitorForTransaction(wsProvider: WsProvider) {
  const api = await ApiPromise.create({ provider: wsProvider })

  await api.rpc.chain.subscribeFinalizedHeads(async (header) => {
    const blockHash = header.hash
    const block = await api.rpc.chain.getBlock(blockHash)
    const extrinsics = block.block.extrinsics
    console.error(`Checking finalized block #${header.number} extrinsic count: ${extrinsics.length}`)

    for (let index = 0; index < extrinsics.length; index++) {
      const extrinsic = extrinsics[index]
      const details = await constructTransactionDetails(api, blockHash.toHex(), index, extrinsic)
      details.blockNumber = header.number.toNumber()

      // console.log(JSON.stringify(details, null, 2))

      // Not all value transfer has to be from an extrinsic calling balances.transfer*,
      // it can come from other pallets such as multisig for example, making the call to balances.transfer*
      // Look for all balance transfers related events that would indicate a transfer or deposit

      for (const event of details.events || []) {
        const { section, method } = event // as { section: string; method: string }
        if (section === 'balances' && method === 'Transfer') {
          console.log(event.data.toHuman())
        }
      }
    }
  })
}

const WS_URI = process.env.WS_URI || 'ws://127.0.0.1:9944'
const wsProvider = new WsProvider(WS_URI)

monitorForTransaction(wsProvider).catch(console.error)
