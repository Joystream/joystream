import electCouncil from '../flows/council/elect'
import leaderSetup from '../flows/working-groups/leadOpening'
import updateAccountsFlow from '../misc/updateAllWorkerRoleAccountsFlow'
import { scenario } from '../Scenario'

scenario(async ({ job }) => {
  job('Elect Council', electCouncil)
  const leads = job('Set WorkingGroup Leads', leaderSetup)
  job('Update worker accounts', updateAccountsFlow).after(leads)

  // TODO: Mock content
  // assign members known accounts?
  // assign council known accounts?
})
