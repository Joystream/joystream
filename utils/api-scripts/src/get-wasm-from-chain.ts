import { ApiPromise, WsProvider } from '@polkadot/api'
import fs from 'fs'
import { Bytes } from '@polkadot/types'

async function main() {
  const outputFilePath = process.argv[2] || 'runtime.wasm'

  const endpoint = process.env.WS_URI || 'ws://127.0.0.1:9944'
  const provider = new WsProvider(endpoint)

  const api: ApiPromise = new ApiPromise({ provider })
  await api.isReadyOrError

  const codeStorageKey = '0x3a636f6465' // hex(':code')
  const runtime = await api.rpc.state.getStorage<Bytes>(codeStorageKey)

  await api.disconnect()

  const wasm = runtime.toU8a(true)
  fs.writeFileSync(outputFilePath, wasm)
}

main()
  .catch(console.error)
  .finally(() => process.exit())
