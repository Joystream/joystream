import leaderSetup from '../flows/workingGroup/leaderSetup'
import initDistribution, { defaultSingleBucketConfig } from '../flows/storagev2/initDistribution'
import { scenario } from '../Scenario'

scenario(async ({ job }) => {
  const setupLead = job('setup distributor lead', leaderSetup.distribution)
  job('initialize distribution system', initDistribution(defaultSingleBucketConfig)).requires(setupLead)
})
