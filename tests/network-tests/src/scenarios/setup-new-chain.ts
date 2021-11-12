import councilSetup from '../flows/council/setup'
import leaderSetup from '../flows/workingGroup/leaderSetup'
import mockContentFlow from '../sumer/mockContentFlow'
import updateAccountsFlow from '../sumer/updateAllWorkerRoleAccountsFlow'

import { scenario } from '../Scenario'

scenario(async ({ job }) => {
  const council = job('Create Council', councilSetup)

  const leads = job('Setup WorkingGroup Leads', [leaderSetup.storage, leaderSetup.content])

  const updateWorkerAccounts = job('Update worker accounts', updateAccountsFlow).after(leads)

  // Create some mock content in content directory - without assets or any real metadata
  const mockContent = job('Create Mock Content', mockContentFlow).after(updateWorkerAccounts)

  // assign members known accounts?
  // assign council known accounts?
})
