import { xxhashAsHex } from '@polkadot/util-crypto'
import { ApiPromise, WsProvider } from '@polkadot/api'
import fs from 'fs'
import path from 'path'

// paths & env variables
const dataPath = process.argv.slice(2).toString() || ''
const specPath = path.join(dataPath, 'chain-spec-raw.json')
const forkedSpecPath = path.join(dataPath, 'chain-spec-forked.json')
const storagePath = path.join(dataPath, 'storage.json')

// this might not be of much use
const provider = new WsProvider(process.env.WS_RPC_ENDPOINT || 'ws://localhost:9944')
/**
 * All module prefixes except those mentioned in the skippedModulesPrefix will be added to this by the script.
 * If you want to add any past module or part of a skipped module, add the prefix here manually.
 *
 * Any storage value’s hex can be logged via console.log(api.query.<module>.<call>.key([...opt params])),
 * e.g. console.log(api.query.timestamp.now.key()).
 *
 * If you want a map/doublemap key prefix, you can do it via .keyPrefix(),
 * e.g. console.log(api.query.system.account.keyPrefix()).
 *
 * For module hashing, do it via xxhashAsHex,
 * e.g. console.log(xxhashAsHex('System', 128)).
 */
const prefixes = ['0x26aa394eea5630e07c48ae0c9558cef7b99d880ec681799c0cf30e8886371da9' /* System.Account */]
const skippedModulesPrefix = [
  'System',
  'Session',
  'Babe',
  'Grandpa',
  'GrandpaFinality',
  'FinalityTracker',
  'Authorship',
  // Joystream specific
  'Council', // empty council
  'Referendum',
]

async function main() {
  const api = await ApiPromise.create({ provider })

  const metadata = await api.rpc.state.getMetadata()

  // Populate the prefixes array
  const pallets = metadata.asLatest.pallets
  pallets.forEach((pallet) => {
    if (pallet.storage) {
      if (!skippedModulesPrefix.includes(pallet.name.toString())) {
        prefixes.push(xxhashAsHex(pallet.name.toString(), 128))
      }
    }
  })

  // blank starting chainspec guaranteed to exist
  const storage: Storage = JSON.parse(fs.readFileSync(storagePath, 'utf8'))
  const chainSpec = JSON.parse(fs.readFileSync(specPath, 'utf8'))

  // Grab the items to be moved, then iterate through and insert into storage
  storage.result
    .filter((i) => prefixes.some((prefix) => i[0].startsWith(prefix)))
    .forEach(([key, value]) => (chainSpec.genesis.raw.top[key] = value))

  // Delete System.LastRuntimeUpgrade to ensure that the on_runtime_upgrade event is triggered
  delete chainSpec.genesis.raw.top['0x26aa394eea5630e07c48ae0c9558cef7f9cce9c888469bb1a0dceaa129672ef8']

  // Delete System.LastRuntimeUpgrade to ensure that the on_runtime_upgrade event is triggered
  delete chainSpec.genesis.raw.top['0x26aa394eea5630e07c48ae0c9558cef7f9cce9c888469bb1a0dceaa129672ef8']

  // To prevent the validator set from changing mid-test, set Staking.ForceEra to ForceNone ('0x02')
  chainSpec.genesis.raw.top['0x5f3e4907f716ac89b6347d15ececedcaf7dad0317324aecae8744b87fc95f2f3'] = '0x02'

  fs.writeFileSync(forkedSpecPath, JSON.stringify(chainSpec, null, 4))

  process.exit()
}

main().catch(console.error)

interface Storage {
  'jsonrpc': string
  'result': Array<[string, string]>
  'id': string
}
