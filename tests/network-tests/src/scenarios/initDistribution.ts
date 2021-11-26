import leaderSetup from '../flows/workingGroup/leaderSetup'
import initDistribution, { defaultSingleBucketConfig } from '../flows/storagev2/initDistribution'
import { scenario } from '../Scenario'
import { WorkingGroups } from '../WorkingGroups'

scenario(async ({ job }) => {
  const setupLead = job('setup distributor lead', leaderSetup(WorkingGroups.Distribution))
  job('initialize distribution system', initDistribution(defaultSingleBucketConfig)).requires(setupLead)
})
