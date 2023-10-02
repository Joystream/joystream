import { scenario } from '../Scenario'
import electCouncil from '../flows/council/elect'
import { doubleDistributionBucketConfig, doubleStorageBucketConfig } from '../flows/storage/config'
import initDistribution from '../flows/storage/initDistribution'
import initStorage from '../flows/storage/initStorage'
import leaderSetup from '../flows/working-groups/leadOpening'

// eslint-disable-next-line @typescript-eslint/no-floating-promises
scenario('Init storage and distribution', async ({ job }) => {
  const councilJob = job('electing council', electCouncil)
  const setupLead = job('setup leads', leaderSetup(true, ['storageWorkingGroup', 'distributionWorkingGroup'])).after(
    councilJob
  )
  job('initialize storage system', initStorage(doubleStorageBucketConfig)).after(setupLead)
  job('initialize distribution system', initDistribution(doubleDistributionBucketConfig)).after(setupLead)
})
