import assignCouncil from '../flows/council/assign'
import leaderSetup from '../flows/workingGroup/leaderSetup'
import mockContentFlow from '../misc/mockContentFlow'
import updateAccountsFlow from '../misc/updateAllWorkerRoleAccountsFlow'
import initStorage, { defaultSingleBucketConfig as defaultStorageConfig } from '../flows/storagev2/initStorage'
import initDistribution, {
  defaultSingleBucketConfig as defaultDistributionConfig,
} from '../flows/storagev2/initDistribution'
import { AllWorkingGroups } from '../WorkingGroups'
import { scenario } from '../Scenario'

scenario(async ({ job }) => {
  const COUNCIL_SIZE = 1
  job('Create Council', assignCouncil(COUNCIL_SIZE))

  const leads = job(
    'Set WorkingGroup Leads',
    AllWorkingGroups.map((group) => leaderSetup(group, true))
  )

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
