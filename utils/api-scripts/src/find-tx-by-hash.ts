import { ApiPromise, WsProvider } from '@polkadot/api'
import { constructTransactionDetails } from './helpers/TransactionDetails'

async function fetchLatestBlocksAndCheckTransaction(wsProvider: WsProvider, txHash: string, blockCount: number) {
  const api = await ApiPromise.create({ provider: wsProvider })

  // Get the latest block hash
  const lastHeader = await api.rpc.chain.getHeader()
  let currentBlockHash = lastHeader.hash

  for (let i = 0; i < blockCount; i++) {
    const block = await api.rpc.chain.getBlock(currentBlockHash)

    for (const [index, extrinsic] of block.block.extrinsics.entries()) {
      const extrinsicHash = extrinsic.hash.toHex()
      const blockNumber = block.block.header.number.toNumber()
      const blockHash = currentBlockHash.toHex()

      if (extrinsicHash === txHash) {
        // Construct the transaction details
        const details = await constructTransactionDetails(api, blockHash, index, extrinsic)
        // Update with block hash and number
        details.blockNumber = blockNumber
        details.blockHash = blockHash
        return details
      }
    }

    // Move to the parent block
    currentBlockHash = block.block.header.parentHash

    // Stop if we reach the genesis block
    if (currentBlockHash.isEmpty) {
      break
    }
  }

  // Transaction not found
  return {}
}

const txHash = process.argv[2]
if (!txHash) {
  console.error('Please provide a transaction hash as the first argument.')
  process.exit(1)
}

// An archive node stores complete history of all blocks. Non-archive nodes store only the most recent blocks.
// Joystream nodes by default keep only state of most recent 256 blocks, unless run with `--pruning archive` flag.
// const DEFAULT_BLOCK_COUNT = 256 // ~ 25 minutes back in history (assuming 6s block time)

const DEFAULT_BLOCK_COUNT = 20 // ~ 2 minutes back in history (assuming 6s block time)
const blockCount = process.argv[3] ? parseInt(process.argv[3], 10) : DEFAULT_BLOCK_COUNT

const WS_URI = process.env.WS_URI || 'ws://127.0.0.1:9944'
const wsProvider = new WsProvider(WS_URI)

// Ideas:
// - Provide a starting block number or hash, and a block count to fetch, and direction to search in (forwards or backwards)
// - Provide a date range to search in.

fetchLatestBlocksAndCheckTransaction(wsProvider, txHash, blockCount)
  .then((output) => console.log(JSON.stringify(output, null, 2)))
  .catch(console.error)
  .finally(() => process.exit(0))
