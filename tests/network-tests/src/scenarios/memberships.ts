import buyingMemberships from '../flows/membership/buyingMemberships'
import creatingFoundingMembers from '../flows/membership/creatingFoundingMembers'
import creatingMembers from '../flows/membership/creatingMembers'
import giftingMemberships from '../flows/membership/giftingMemberships'
import updatingMemberProfile from '../flows/membership/updatingProfile'
import updatingMemberAccounts from '../flows/membership/updatingAccounts'
import invitingMembers from '../flows/membership/invitingMembers'
import transferringInvites from '../flows/membership/transferringInvites'
import managingStakingAccounts from '../flows/membership/managingStakingAccounts'
import { scenario } from '../Scenario'
import updatingVerificationStatus from '../flows/membership/updateVerificationStatus'
import leadOpening from '../flows/working-groups/leadOpening'

// eslint-disable-next-line @typescript-eslint/no-floating-promises
scenario('Memberships', async ({ job }) => {
  const sudoHireLead = job('sudo lead opening', leadOpening(true, ['membershipWorkingGroup']))

  // All other job should be executed after, otherwise changing membershipPrice etc. may break them
  job('buying members', buyingMemberships)
  job('updating member profile', updatingMemberProfile)
  job('updating member accounts', updatingMemberAccounts)
  job('creating founding members', creatingFoundingMembers)
  job('creating members', creatingMembers)
  job('gifting members', giftingMemberships)
  job('inviting members', invitingMembers)
  job('transferring invites', transferringInvites)
  job('managing staking accounts', managingStakingAccounts)
  job('updating member verification status', updatingVerificationStatus).after(sudoHireLead)
})
