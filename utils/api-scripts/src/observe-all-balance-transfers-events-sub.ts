import { ApiPromise, WsProvider } from '@polkadot/api'
import { EventRecord } from '@polkadot/types/interfaces'

async function monitorForEvents(wsProvider: WsProvider) {
  const api = await ApiPromise.create({ provider: wsProvider })

  await api.query.system.events((events: EventRecord[]) => {
    events.forEach((record) => {
      const { event, phase } = record
      if (phase.isApplyExtrinsic && event.section === 'balances' && event.method === 'Transfer') {
        console.log(event.data.toHuman())
      }
    })
  })
}

const WS_URI = process.env.WS_URI || 'ws://127.0.0.1:9944'
const wsProvider = new WsProvider(WS_URI)

monitorForEvents(wsProvider).catch(console.error)
