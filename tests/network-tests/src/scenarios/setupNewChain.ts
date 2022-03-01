import electCouncil from '../flows/council/elect'
import leaderSetup from '../flows/working-groups/leadOpening'
import mockContentFlow from '../misc/mockContentFlow'
import updateAccountsFlow from '../misc/updateAllWorkerRoleAccountsFlow'
import initStorage, { singleBucketConfig as defaultStorageConfig } from '../flows/storage/initStorage'
import initDistribution, { singleBucketConfig as defaultDistributionConfig } from '../flows/storage/initDistribution'
import { scenario } from '../Scenario'

scenario('Setup new chain', async ({ job }) => {
  job('Elect Council', electCouncil)
  const leads = job('Set WorkingGroup Leads', leaderSetup())
  const updateWorkerAccounts = job('Update worker accounts', updateAccountsFlow).after(leads)

  if (!process.env.SKIP_STORAGE_AND_DISTRIBUTION) {
    job('initialize storage system', initStorage(defaultStorageConfig)).requires(updateWorkerAccounts)
    job('initialize distribution system', initDistribution(defaultDistributionConfig)).requires(updateWorkerAccounts)
  }

  // Create some mock content in content directory - without assets or any real metadata
  job('Create Mock Content', mockContentFlow).after(updateWorkerAccounts)

  // assign members known accounts?
  // assign council known accounts?
})
