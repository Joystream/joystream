import leaderSetup from '../flows/workingGroup/leaderSetup'
import initStorage, { defaultSingleBucketConfig as defaultStorageConfig } from '../flows/storagev2/initStorage'
import initDistribution, {
  defaultSingleBucketConfig as defaultDistributionConfig,
} from '../flows/storagev2/initDistribution'
import { scenario } from '../Scenario'
import { WorkingGroups } from '../WorkingGroups'

scenario(async ({ job }) => {
  const setupLead = job('setup leads', [
    leaderSetup(WorkingGroups.Distribution, true),
    leaderSetup(WorkingGroups.Storage, true),
  ])
  job('initialize storage system', initStorage(defaultStorageConfig)).requires(setupLead)
  job('initialize distribution system', initDistribution(defaultDistributionConfig)).requires(setupLead)
})
