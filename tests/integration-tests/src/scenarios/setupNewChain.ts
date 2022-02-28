import leaderSetup from '../flows/working-groups/leadOpening'
import initFaucet from '../flows/faucet/initFaucet'
import initStorage, { singleBucketConfig as defaultStorageConfig } from '../flows/storage/initStorage'
import initDistribution, { singleBucketConfig as defaultDistributionConfig } from '../flows/storage/initDistribution'
import { scenario } from '../Scenario'

scenario('Setup new chain', async ({ job }) => {
  const leads = job('Set WorkingGroup Leads', leaderSetup)

  job('Initialize Faucet', initFaucet).requires(leads)

  if (!process.env.SKIP_STORAGE_AND_DISTRIBUTION) {
    job('initialize storage system', initStorage(defaultStorageConfig)).requires(leads)
    job('initialize distribution system', initDistribution(defaultDistributionConfig)).requires(leads)
  }
})
