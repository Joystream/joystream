import makeAliceMember from '../flows/membership/makeAliceMember'
import leaderSetup from '../flows/workingGroup/leaderSetup'
import { hireWorkersFlow } from '../flows/workingGroup/manageWorkerAsLead'
import updateAccountsFlow from '../misc/updateAllWorkerRoleAccountsFlow'
import initStorage, { doubleBucketConfig as storageConfig } from '../flows/storagev2/initStorage'
import { WorkingGroups } from '../WorkingGroups'
import { scenario } from '../Scenario'

scenario(async ({ job }) => {
  job('Make Alice a member', makeAliceMember)

  const leads = job('Set Storage Lead', leaderSetup(WorkingGroups.Storage))
  const workers = job('Hire Storage Worker', hireWorkersFlow(WorkingGroups.Storage, 1)).after(leads)
  const updateWorkerAccounts = job('Update worker accounts', updateAccountsFlow).after(workers)
  job('initialize storage system (2 buckets)', initStorage(storageConfig)).requires(updateWorkerAccounts)
})
