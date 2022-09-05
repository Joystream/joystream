import creatingMemberships from '../flows/membership/creatingMemberships'
import creatingFoundingMembers from '../flows/membership/creatingFoundingMembers'
import giftingMemberships from '../flows/membership/giftingMemberships'
import updatingMemberProfile from '../flows/membership/updatingProfile'
import updatingMemberAccounts from '../flows/membership/updatingAccounts'
import invitingMembers from '../flows/membership/invitingMembers'
import transferringInvites from '../flows/membership/transferringInvites'
import managingStakingAccounts from '../flows/membership/managingStakingAccounts'
import membershipSystem from '../flows/membership/membershipSystem'
import { scenario } from '../Scenario'
import updatingVerificationStatus from '../flows/membership/updateVerificationStatus'
import leadOpening from '../flows/working-groups/leadOpening'

// eslint-disable-next-line @typescript-eslint/no-floating-promises
scenario('Memberships', async ({ job }) => {
  const membershipSystemJob = job('membership system', membershipSystem)
  const sudoHireLead = job('sudo lead opening', leadOpening(true, ['membershipWorkingGroup'])).after(
    membershipSystemJob
  )
  // All other job should be executed after, otherwise changing membershipPrice etc. may break them
  job('creating members', creatingMemberships).after(membershipSystemJob)
  job('updating member profile', updatingMemberProfile).after(membershipSystemJob)
  job('updating member accounts', updatingMemberAccounts).after(membershipSystemJob)
  job('creating founding members', creatingFoundingMembers).after(membershipSystemJob)
  job('gifting members', giftingMemberships).after(membershipSystemJob)
  job('inviting members', invitingMembers).after(membershipSystemJob)
  job('transferring invites', transferringInvites).after(membershipSystemJob)
  job('managing staking accounts', managingStakingAccounts).after(membershipSystemJob)
  job('updating member verification status', updatingVerificationStatus).after(sudoHireLead)
})
