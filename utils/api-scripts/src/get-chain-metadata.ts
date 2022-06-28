import { ApiPromise, WsProvider } from '@polkadot/api'

async function main() {
  // Init api
  const WS_URI = process.env.WS_URI || 'ws://127.0.0.1:9944'
  console.log(`Initializing the api (${WS_URI})...`)
  const provider = new WsProvider(WS_URI)
  const api = await ApiPromise.create({ provider })
  const meta = await api.rpc.state.getMetadata();
  console.log(JSON.stringify(meta.toJSON(), null, 2))
}

main()
  .then(() => process.exit())
  .catch((e) => console.error(e))
