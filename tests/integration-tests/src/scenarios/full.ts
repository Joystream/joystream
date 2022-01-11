import categories from '../flows/forum/categories'
import polls from '../flows/forum/polls'
import threads from '../flows/forum/threads'
import posts from '../flows/forum/posts'
import moderation from '../flows/forum/moderation'
import threadTags from '../flows/forum/threadTags'
import leadOpening from '../flows/working-groups/leadOpening'
import creatingMemberships from '../flows/membership/creatingMemberships'
import updatingMemberProfile from '../flows/membership/updatingProfile'
import updatingMemberAccounts from '../flows/membership/updatingAccounts'
import invitingMebers from '../flows/membership/invitingMembers'
import transferringInvites from '../flows/membership/transferringInvites'
import managingStakingAccounts from '../flows/membership/managingStakingAccounts'
import membershipSystem from '../flows/membership/membershipSystem'
import openingsAndApplications from '../flows/working-groups/openingsAndApplications'
import upcomingOpenings from '../flows/working-groups/upcomingOpenings'
import groupStatus from '../flows/working-groups/groupStatus'
import workerActions from '../flows/working-groups/workerActions'
import groupBudget from '../flows/working-groups/groupBudget'
import proposals from '../flows/proposals'
import cancellingProposals from '../flows/proposals/cancellingProposal'
import vetoProposal from '../flows/proposals/vetoProposal'
import electCouncil from '../flows/council/elect'
import failToElect from '../flows/council/failToElect'
import runtimeUpgradeProposal from '../flows/proposals/runtimeUpgradeProposal'
import exactExecutionBlock from '../flows/proposals/exactExecutionBlock'
import expireProposal from '../flows/proposals/expireProposal'
import proposalsDiscussion from '../flows/proposalsDiscussion'
import { scenario } from '../Scenario'

scenario(async ({ job, env }) => {
  // Runtime upgrade should always be first job
  // (except councilJob, which is required for voting and should probably depend on the "source" runtime)
  const councilJob = job('electing council', electCouncil)
  const runtimeUpgradeProposalJob = env.RUNTIME_UPGRADE_TARGET_WASM_PATH
    ? job('runtime upgrade proposal', runtimeUpgradeProposal).requires(councilJob)
    : undefined

  const membershipSystemJob = job('membership system', membershipSystem).requires(
    runtimeUpgradeProposalJob || councilJob
  )

  // All other jobs should be executed after membershipSystemJob,
  // otherwise changing membershipPrice etc. may break them

  // Membership:
  job('creating members', creatingMemberships).after(membershipSystemJob)
  job('updating member profile', updatingMemberProfile).after(membershipSystemJob)
  job('updating member accounts', updatingMemberAccounts).after(membershipSystemJob)
  job('inviting members', invitingMebers).after(membershipSystemJob)
  job('transferring invites', transferringInvites).after(membershipSystemJob)
  job('managing staking accounts', managingStakingAccounts).after(membershipSystemJob)

  // Proposals:
  const proposalsJob = job('proposals & proposal discussion', [
    proposals,
    cancellingProposals,
    vetoProposal,
    exactExecutionBlock,
    expireProposal,
    proposalsDiscussion,
  ]).requires(membershipSystemJob)

  // Working groups
  const sudoHireLead = job('sudo lead opening', leadOpening).after(proposalsJob)
  job('openings and applications', openingsAndApplications).requires(sudoHireLead)
  job('upcoming openings', upcomingOpenings).requires(sudoHireLead)
  job('group status', groupStatus).requires(sudoHireLead)
  job('worker actions', workerActions).requires(sudoHireLead)
  job('group budget', groupBudget).requires(sudoHireLead)

  // Forum:
  job('forum categories', categories).requires(sudoHireLead)
  job('forum threads', threads).requires(sudoHireLead)
  job('forum thread tags', threadTags).requires(sudoHireLead)
  job('forum polls', polls).requires(sudoHireLead)
  job('forum posts', posts).requires(sudoHireLead)
  job('forum moderation', moderation).requires(sudoHireLead)

  // Council
  const secondCouncilJob = job('electing second council', electCouncil).requires(membershipSystemJob)
  job('council election failures', failToElect).requires(secondCouncilJob)
})
