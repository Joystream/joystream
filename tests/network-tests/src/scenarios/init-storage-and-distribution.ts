import leaderSetup from '../flows/workingGroup/leaderSetup'
import initStorage, { singleBucketConfig as defaultStorageConfig } from '../flows/storagev2/initStorage'
import initDistribution, { singleBucketConfig as defaultDistributionConfig } from '../flows/storagev2/initDistribution'
import { scenario } from '../Scenario'
import { WorkingGroups } from '../WorkingGroups'
import updateAccountsFlow from '../misc/updateAllWorkerRoleAccountsFlow'

scenario(async ({ job }) => {
  const setupLead = job('setup leads', [
    leaderSetup(WorkingGroups.Distribution, true),
    leaderSetup(WorkingGroups.Storage, true),
  ])
  const updateWorkerAccounts = job('Update worker accounts', updateAccountsFlow).after(setupLead)
  job('initialize storage system', initStorage(defaultStorageConfig)).after(updateWorkerAccounts)
  job('initialize distribution system', initDistribution(defaultDistributionConfig)).after(updateWorkerAccounts)
})
