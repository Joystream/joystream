import leaderSetup from '../flows/working-groups/leadOpening'
import mockContentFlow from '../misc/mockContentFlow'
import updateAccountsFlow from '../misc/updateAllWorkerRoleAccountsFlow'
import initFaucet from '../flows/faucet/initFaucet'
import initStorage, { singleBucketConfig as defaultStorageConfig } from '../flows/storage/initStorage'
import initDistribution, { singleBucketConfig as defaultDistributionConfig } from '../flows/storage/initDistribution'
import { scenario } from '../Scenario'

scenario('Setup new chain', async ({ job }) => {
  const leads = job('Set WorkingGroup Leads', leaderSetup())
  const updateAccounts = job('Update Worker Accounts', updateAccountsFlow).requires(leads)

  job('Initialize Faucet', initFaucet).requires(updateAccounts)

  if (!process.env.SKIP_STORAGE_AND_DISTRIBUTION) {
    job('initialize storage system', initStorage(defaultStorageConfig)).requires(updateAccounts)
    job('initialize distribution system', initDistribution(defaultDistributionConfig)).requires(updateAccounts)
  }

  // Create some mock content in content directory - without assets or any real metadata
  job('Create Mock Content', mockContentFlow).after(updateAccounts)

  // assign members known accounts?
  // assign council known accounts?
})
