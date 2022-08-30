import leaderSetup from '../flows/working-groups/leadOpening'
import initFaucet from '../flows/faucet/initFaucet'
import initStorage, { doubleBucketConfig as doubleStorageConfig } from '../flows/storage/initStorage'
import initDistribution, { doubleBucketConfig as doubleDistributionConfig } from '../flows/storage/initDistribution'
import { scenario } from '../Scenario'

// eslint-disable-next-line @typescript-eslint/no-floating-promises
scenario('Setup new chain', async ({ job }) => {
  job('Initialize Faucet', initFaucet)

  const leads = job('Set WorkingGroup Leads', leaderSetup(true))

  if (!process.env.SKIP_STORAGE_AND_DISTRIBUTION) {
    job('initialize storage system', initStorage(doubleStorageConfig)).requires(leads)
    job('initialize distribution system', initDistribution(doubleDistributionConfig)).requires(leads)
  }
})
