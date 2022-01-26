import { ApiPromise, WsProvider } from '@polkadot/api'
import types from '@joystream/types/augment/all/defs.json'

export default async function createApi(): Promise<ApiPromise> {
  // Get URL to websocket endpoint from environment or connect to local node by default
  const WS_URL = process.env.WS_PROVIDER_ENDPOINT_URI || 'ws://127.0.0.1:9944'

  // explicitely state what RPC we are connecting to
  console.error('Connecting to RPC at: ' + WS_URL)

  // Initialise the provider
  const provider = new WsProvider(WS_URL)

  // Create the API and wait until ready
  const api = await ApiPromise.create({ provider, types })
  await api.isReadyOrError

  return api
}
