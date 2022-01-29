import leaderSetup from '../flows/workingGroup/leaderSetup'
import activeVideoCounters from '../flows/content/activeVideoCounters'
import initStorageBucket from '../flows/clis/initStorageBucket'
import initStorage, { singleBucketConfig as storageConfig } from '../flows/storagev2/initStorage'
import { WorkingGroups } from '../WorkingGroups'
import { scenario } from '../Scenario'

scenario('Content directory', async ({ job }) => {
  const leadSetupJob = job('setup working group leads', [
    leaderSetup(WorkingGroups.Content, true),
    leaderSetup(WorkingGroups.Storage, true),
  ])

  const initStorageJob = job('initialize storage system', initStorage(storageConfig)).requires(leadSetupJob)

  job('check active video counters', activeVideoCounters).requires(initStorageJob)
})
