import creatingMemberships from '../flows/membership/creatingMemberships'
import updatingMemberProfile from '../flows/membership/updatingProfile'
import updatingMemberAccounts from '../flows/membership/updatingAccounts'
import { scenario } from '../Scenario'

scenario(async ({ job }) => {
  job('creating members', creatingMemberships)
  job('updating member profile', updatingMemberProfile)
  job('updating member accounts', updatingMemberAccounts)
})
