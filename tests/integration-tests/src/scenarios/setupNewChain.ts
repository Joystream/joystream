import electCouncil from '../flows/council/elect'
import leaderSetup from '../flows/working-groups/leadOpening'
import updateAccountsFlow from '../misc/updateAllWorkerRoleAccountsFlow'
import initStorage, { singleBucketConfig as defaultStorageConfig } from '../flows/storage/initStorage'
import initDistribution, { singleBucketConfig as defaultDistributionConfig } from '../flows/storage/initDistribution'
import { scenario } from '../Scenario'

scenario(async ({ job }) => {
  job('Elect Council', electCouncil)
  const leads = job('Set WorkingGroup Leads', leaderSetup)
  const updateWorkerAccounts = job('Update worker accounts', updateAccountsFlow).after(leads)

  if (!process.env.SKIP_STORAGE_AND_DISTRIBUTION) {
    job('initialize storage system', initStorage(defaultStorageConfig)).requires(updateWorkerAccounts)
    job('initialize distribution system', initDistribution(defaultDistributionConfig)).requires(updateWorkerAccounts)
  }

  // TODO: Mock content
  // assign members known accounts?
  // assign council known accounts?
})
