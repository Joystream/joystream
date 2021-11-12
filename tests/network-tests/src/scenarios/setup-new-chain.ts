import assignCouncil from '../flows/council/assign'
import leaderSetup from '../flows/workingGroup/leaderSetup'
import mockContentFlow from '../giza/mockContentFlow'
import updateAccountsFlow from '../giza/updateAllWorkerRoleAccountsFlow'

import { scenario } from '../Scenario'

scenario(async ({ job }) => {
  const COUNCIL_SIZE = 1
  job('Create Council', assignCouncil(COUNCIL_SIZE))

  const leads = job('Set WorkingGroup Leads', [
    leaderSetup.contentIfNotSet,
    leaderSetup.storageIfNotSet,
    leaderSetup.distributionIfNotSet,
    leaderSetup.operationsAlphaIfNotSet,
    leaderSetup.operationsBetaIfNotSet,
    leaderSetup.operationsGammaIfNotSet,
  ])

  const updateWorkerAccounts = job('Update worker accounts', updateAccountsFlow).after(leads)

  // Create some mock content in content directory - without assets or any real metadata
  job('Create Mock Content', mockContentFlow).after(updateWorkerAccounts)

  // assign members known accounts?
  // assign council known accounts?
})
