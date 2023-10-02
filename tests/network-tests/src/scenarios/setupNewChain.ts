import { scenario } from '../Scenario'
import { populateVideoCategories } from '../flows/content/videoCategories'
import electCouncil from '../flows/council/elect'
import initFaucet from '../flows/faucet/initFaucet'
import { singleDistributionBucketConfig, singleStorageBucketConfig } from '../flows/storage/config'
import initDistribution from '../flows/storage/initDistribution'
import initStorage from '../flows/storage/initStorage'
import leaderSetup from '../flows/working-groups/leadOpening'

// eslint-disable-next-line @typescript-eslint/no-floating-promises
scenario('Setup new chain', async ({ job }) => {
  job('Initialize Faucet', initFaucet)
  const councilJob = job('electing council', electCouncil)

  const leads = job('Set WorkingGroup Leads', leaderSetup(true)).requires(councilJob)
  job('Create video categories', populateVideoCategories).after(leads)

  job('initialize storage system', initStorage(singleStorageBucketConfig)).requires(leads)
  job('initialize distribution system', initDistribution(singleDistributionBucketConfig)).requires(leads)
})
