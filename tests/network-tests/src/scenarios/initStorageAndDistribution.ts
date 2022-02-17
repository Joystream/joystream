import leaderSetup from '../flows/working-groups/leadOpening'
import initStorage, { singleBucketConfig as defaultStorageConfig } from '../flows/storage/initStorage'
import initDistribution, { singleBucketConfig as defaultDistributionConfig } from '../flows/storage/initDistribution'
import { scenario } from '../Scenario'
import updateAccountsFlow from '../misc/updateAllWorkerRoleAccountsFlow'

scenario(async ({ job }) => {
  const setupLead = job('setup leads', leaderSetup(true, ['storageWorkingGroup', 'distributionWorkingGroup']))
  const updateWorkerAccounts = job('Update worker accounts', updateAccountsFlow).after(setupLead)
  job('initialize storage system', initStorage(defaultStorageConfig)).after(updateWorkerAccounts)
  job('initialize distribution system', initDistribution(defaultDistributionConfig)).after(updateWorkerAccounts)
})
