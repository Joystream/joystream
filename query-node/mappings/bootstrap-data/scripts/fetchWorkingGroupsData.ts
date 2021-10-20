import createApi from './api'
import { BlockHash } from '@polkadot/types/interfaces'
import { ApiPromise } from '@polkadot/api'
import { WorkerJson, WorkingGroupJson, WorkingGroupsJson } from '../types'
import fs from 'fs'
import path from 'path'

export enum WorkingGroups {
  Storage = 'storageWorkingGroup',
  Gateway = 'gatewayWorkingGroup',
}

// export flow
async function main() {
  // prepare api connection
  const api = await createApi()

  const blockNumner = parseInt(process.env.AT_BLOCK_NUMBER || '')
  const hash = process.env.AT_BLOCK_NUMBER ? await api.rpc.chain.getBlockHash(blockNumner) : undefined
  const now = new Date()

  // get results for all relevant groups
  const workingGroups: WorkingGroupsJson = {
    STORAGE: await getWorkingGroupData(api, WorkingGroups.Storage, hash, now),
    GATEWAY: await getWorkingGroupData(api, WorkingGroups.Gateway, hash, now),
  }

  // output results
  fs.writeFileSync(path.resolve(__dirname, '../data/workingGroups.json'), JSON.stringify(workingGroups, undefined, 4))
  console.log(`${workingGroups.GATEWAY?.workers.length || 0} GATEWAY workers exported & saved!`)
  console.log(`${workingGroups.STORAGE?.workers.length || 0} STORAGE workers exported & saved!`)

  // disconnect api
  api.disconnect()
}

// retrieves all active workers in working group
async function getWorkingGroupData(
  api: ApiPromise,
  group: WorkingGroups,
  hash: BlockHash | undefined,
  now: Date
): Promise<WorkingGroupJson> {
  // get working group entries
  const entries = await (hash ? api.query[group].workerById.entriesAt(hash) : api.query[group].workerById.entries())

  const workers: WorkerJson[] = []
  entries.forEach(([storageKey]) => {
    // prepare workerId
    const workerId = storageKey.args[0]
    // add record
    workers.push({
      workerId: workerId.toString(),
      // set time of running this script as createdAt
      createdAt: now.getTime(),
    })
  })

  return { workers }
}

main()
  .then(() => process.exit())
  .catch(console.error)
