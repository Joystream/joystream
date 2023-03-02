import { xxhashAsHex } from '@polkadot/util-crypto'
import { ApiPromise, WsProvider } from '@polkadot/api'
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
const prefixes = [
  '0x26aa394eea5630e07c48ae0c9558cef7b99d880ec681799c0cf30e8886371da9' /* System.Account */,
  // '0x2ce461329fdf4be12bce01afc0af09bc' /* Members */,
  // '0x30f7f927af3a1cd6f254a51fb5ddb9e7' /* Membership WG */,
  // '0xf2bc8460d32f9e3947b72e0e2ac73992' /* OperationsWgGamma */,
  // '0x9a73b960a5d89e29b0a5636837f8df16' /* OperationsWgBeta */,
  // '0xbf38d6d001fcafa118fc9526bee4cb50' /* OperationsWgAlpha */,
  // '0xaa4612cd135c6055b7910d493c5fd4ae' /* Forum */,
  // '0xcf9da36cc34d922a84a3ec231495ea2b' /* Forum WG */,
  // '0x95875cb80ebaf9f918457db6a86ac6ad' /* Storage */,
  // '0xaff74aad5f7ed527360635c9b99b50d2' /* Storage WG */,
  // '0xb5a494c92fa4747cc071573e93b32b87' /* Content */,
  // '0xde7bf41b08da4e09ac0e7c35311f0086' /* ProposalDiscussion */,
  // '0xf546b188d57525d1826b066ad7959643' /* Proposal Engine */,
  // '0x9a4d7ec4b42d2468c1e2ef6de6dfe59f' /* Proposal Codex */,
  // '0x4d91f840794dbb0abe4c14e33733ae2a' /* App WG */,
  // '0xdf66cf37cde77d2a63889732a23c685e' /* BagList */,
  // '0x43a64b3f1b3826a8520d6a2635c4cdbe' /* Bounty */,
  // '0x122856f80f579448b2710bec9ee1f890' /* DistributionWG */,
  // '0xcb732bb8b688ea549fec1838a1350aed' /* Project Token */,
]
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
    .forEach(([key, value]) => (chainSpec.genesis.raw.top[key] = value))

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
