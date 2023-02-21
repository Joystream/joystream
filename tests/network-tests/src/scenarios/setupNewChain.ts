import leaderSetup from '../flows/working-groups/leadOpening'
import initFaucet from '../flows/faucet/initFaucet'
import { populateVideoCategories } from '../flows/content/videoCategories'
import initStorage, { singleBucketConfig as defaultStorageConfig } from '../flows/storage/initStorage'
import initDistribution, { singleBucketConfig as defaultDistributionConfig } from '../flows/storage/initDistribution'
import { scenario } from '../Scenario'
import electCouncil from '../flows/council/elect'

// eslint-disable-next-line @typescript-eslint/no-floating-promises
scenario('Setup new chain', async ({ job }) => {
  job('Initialize Faucet', initFaucet)
  const councilJob = job('electing council', electCouncil)

  const leads = job('Set WorkingGroup Leads', leaderSetup(true)).requires(councilJob)
  job('Create video categories', populateVideoCategories).after(leads)

  if (!process.env.SKIP_STORAGE_AND_DISTRIBUTION) {
    job('initialize storage system', initStorage(defaultStorageConfig)).requires(leads)
    job('initialize distribution system', initDistribution(defaultDistributionConfig)).requires(leads)
  }
})
