import { ApiPromise, WsProvider } from '@polkadot/api'
import { cryptoWaitReady } from '@polkadot/util-crypto'
import { DeriveBalancesAll } from '@polkadot/api-derive/types'

async function main() {
  await cryptoWaitReady()

  // Initialise the provider to connect to the local node
  const WS_URI = process.env.WS_URI || 'ws://127.0.0.1:9944'
  const provider = new WsProvider(WS_URI)

  // Create the API and wait until ready
  const api = await ApiPromise.create({ provider })
  const addr = process.argv[2] || 'j4W7rVcUCxi2crhhjRq46fNDRbVHTjJrz6bKxZwehEMQxZeSf'
  const balances: DeriveBalancesAll = await api.derive.balances.all(addr)
  console.log(`${addr} ${balances.freeBalance.toHuman()}`)
}

main()
  .catch(console.error)
  .finally(() => process.exit())
