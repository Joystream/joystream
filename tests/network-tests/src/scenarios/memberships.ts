import buyingMemberships from '../flows/membership/buyingMemberships'
import giftingMemberships from '../flows/membership/giftingMemberships'
import updatingMemberProfile from '../flows/membership/updatingProfile'
import updatingMemberAccounts from '../flows/membership/updatingAccounts'
import invitingMembers from '../flows/membership/invitingMembers'
import transferringInvites from '../flows/membership/transferringInvites'
import managingStakingAccounts from '../flows/membership/managingStakingAccounts'
import { scenario } from '../Scenario'
import updateValidatorVerificationStatus from '../flows/membership/updateValidatorVerifications'
import updatingVerificationStatus from '../flows/membership/updateVerificationStatus'
import leadOpening from '../flows/working-groups/leadOpening'
import electCouncil from '../flows/council/elect'

// eslint-disable-next-line @typescript-eslint/no-floating-promises
scenario('Memberships', async ({ job }) => {
  const councilJob = job('electing council', electCouncil)
  const hireLeads = job('hire leads', leadOpening(true, ['membershipWorkingGroup'])).after(councilJob)

  // All other job should be executed after, otherwise changing membershipPrice etc. may break them
  job('buying members', buyingMemberships)
  job('updating member profile', updatingMemberProfile)
  job('updating member accounts', updatingMemberAccounts)
  job('gifting members', giftingMemberships)
  job('inviting members', invitingMembers).after(hireLeads)
  job('transferring invites', transferringInvites)
  job('managing staking accounts', managingStakingAccounts)
  job('updating member verification status', updatingVerificationStatus).after(hireLeads)
  job('updating validator verification status', updateValidatorVerificationStatus).after(hireLeads)
})
