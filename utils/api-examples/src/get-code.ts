import { ApiPromise, WsProvider } from '@polkadot/api'
import { types } from '@joystream/types'

async function main() {
  const provider = new WsProvider('ws://127.0.0.1:9944')

  const api = await ApiPromise.create({ provider, types })

  await api.isReady

  const currentBlockHash = await api.rpc.chain.getBlockHash(1)

  console.log('getting code as of block hash', currentBlockHash.toString())

  const substrateWasm = await api.query.substrate.code.at(currentBlockHash)

  console.log(substrateWasm.toHex())

  api.disconnect()
}

main()
