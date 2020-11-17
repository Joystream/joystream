import { ApiPromise, WsProvider } from '@polkadot/api'
import { types as joyTypes } from '@joystream/types'
import * as BN from 'bn.js'

async function main() {
  // Initialize the api
  const provider = new WsProvider('ws://127.0.0.1:9944')
  const api = await ApiPromise.create({ provider, types: joyTypes })

  const n = await api.query.contentDirectory.nextClassId()
  const nextClassId = new BN(n.toJSON() as string).toNumber()
  for (let id = 0; id < nextClassId; id++) {
    const cls = await api.query.contentDirectory.classById(new BN(id))
    const { name } = cls.toJSON() as never
    console.log(id, name)
  }
}

main()
  .then(() => process.exit())
  .catch(console.error)
