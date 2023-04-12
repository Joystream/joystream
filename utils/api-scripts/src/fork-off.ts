import { ApiPromise, WsProvider } from '@polkadot/api'
import { xxhashAsHex } from '@polkadot/util-crypto'
import fs from 'fs'
import path from 'path'

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
  'Sudo',
  // Joystream specific
  'Council', // empty council
  'Referendum',
  'Instance2WorkingGroup', // empty storage working group
  'Instance3WorkingGroup', // empty content working group
  'Instance9WorkingGroup', // empty distribution working group
]

async function main() {
  // paths & env variables
  const cmdArgs = process.argv.slice(2)
  const dataPath = cmdArgs[0].toString() || ''
  const specPath = path.join(dataPath, 'chain-spec-raw.json')
  const forkedSpecPath = path.join(dataPath, 'chain-spec-forked.json')
  const storagePath = path.join(dataPath, 'storage.json')
  const rpcRemoteEndpoint = cmdArgs[1].toString() || 'ws://localhost:9944'
  const provider = new WsProvider(rpcRemoteEndpoint)

  const api = await ApiPromise.create({ provider })

  const metadata = await api.rpc.state.getMetadata()

  // Populate the prefixes array
  const pallets = metadata.asLatest.pallets
  pallets.forEach((pallet) => {
    if (pallet.storage.isSome) {
      const storagePrefix = pallet.storage.unwrap().prefix.toString()
      if (!skippedModulesPrefix.includes(storagePrefix)) {
        prefixes.push(xxhashAsHex(storagePrefix, 128))
      }
    }
  })

  // blank starting chainspec guaranteed to exist
  const storage: Storage = JSON.parse(fs.readFileSync(storagePath, 'utf8'))
  const chainSpec = JSON.parse(fs.readFileSync(specPath, 'utf8'))

  // Grab the items to be moved, then iterate through and insert into storage
  storage.result
    .filter((i) => prefixes.some((prefix) => i[0].startsWith(prefix)))
    .forEach(([key, value]) => {
      if (
        // encoded storage key for `minAuctionDuration` key
        key !== '0xb5a494c92fa4747cc071573e93b32b87f9ad4eaa35a4c52d9289acbc42eba9d9' &&
        // encoded storage key for `nftLimitsEnabled` key
        key !== '0xb5a494c92fa4747cc071573e93b32b87d2c14024f1b303fdc87019c4c1facfde'
      ) {
        chainSpec.genesis.raw.top[key] = value
      }
    })

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
