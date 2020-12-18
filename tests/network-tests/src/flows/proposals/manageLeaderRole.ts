import BN from 'bn.js'
import { Api, WorkingGroups } from '../../Api'
import { BuyMembershipHappyCaseFixture } from '../../fixtures/membershipModule'
import {
  BeginWorkingGroupLeaderApplicationReviewFixture,
  CreateWorkingGroupLeaderOpeningFixture,
  DecreaseLeaderStakeProposalFixture,
  FillLeaderOpeningProposalFixture,
  SetLeaderRewardProposalFixture,
  SlashLeaderProposalFixture,
  TerminateLeaderRoleProposalFixture,
  VoteForProposalFixture,
} from '../../fixtures/proposalsModule'
import { ApplyForOpeningFixture } from '../../fixtures/workingGroupModule'
import { PaidTermId } from '@joystream/types/members'
import { OpeningId } from '@joystream/types/hiring'
import { ProposalId } from '@joystream/types/proposals'
import { assert } from 'chai'
import { FixtureRunner } from '../../Fixture'

export default async function manageLeaderRole(api: Api, env: NodeJS.ProcessEnv, group: WorkingGroups) {
  const leaderAccount = api.createKeyPairs(1)[0].address

  const paidTerms: PaidTermId = api.createPaidTermId(new BN(+env.MEMBERSHIP_PAID_TERMS!))
  const applicationStake: BN = new BN(env.WORKING_GROUP_APPLICATION_STAKE!)
  const roleStake: BN = new BN(env.WORKING_GROUP_ROLE_STAKE!)
  const firstRewardInterval: BN = new BN(env.LONG_REWARD_INTERVAL!)
  const rewardInterval: BN = new BN(env.LONG_REWARD_INTERVAL!)
  const payoutAmount: BN = new BN(env.PAYOUT_AMOUNT!)
  const alteredPayoutAmount: BN = new BN(env.ALTERED_PAYOUT_AMOUNT!)
  const stakeDecrement: BN = new BN(env.STAKE_DECREMENT!)
  const slashAmount: BN = new BN(env.SLASH_AMOUNT!)

  // Pre-conditions - members and council
  // No Hired Lead
  const existingLead = await api.getGroupLead(group)
  assert(!existingLead)

  const council = await api.getCouncil()
  assert(council.length)
  const proposer = council[0].member.toString()

  const leaderMembershipFixture: BuyMembershipHappyCaseFixture = new BuyMembershipHappyCaseFixture(
    api,
    [leaderAccount],
    paidTerms
  )
  // Buy membership for lead
  await new FixtureRunner(leaderMembershipFixture).run()

  const createWorkingGroupLeaderOpeningFixture: CreateWorkingGroupLeaderOpeningFixture = new CreateWorkingGroupLeaderOpeningFixture(
    api,
    proposer,
    applicationStake,
    roleStake,
    api.getWorkingGroupString(group)
  )
  // Propose create leader opening
  await createWorkingGroupLeaderOpeningFixture.runner()

  // Approve add opening proposal
  const voteForCreateOpeningProposalFixture = new VoteForProposalFixture(
    api,
    createWorkingGroupLeaderOpeningFixture.getCreatedProposalId() as OpeningId
  )

  await voteForCreateOpeningProposalFixture.runner()
  const openingId = api.expectOpeningAddedEvent(voteForCreateOpeningProposalFixture.getEvents())

  const applyForLeaderOpeningFixture = new ApplyForOpeningFixture(
    api,
    [leaderAccount],
    applicationStake,
    roleStake,
    openingId,
    group
  )
  await applyForLeaderOpeningFixture.runner()
  const applicationId = applyForLeaderOpeningFixture.getApplicationIds()[0]

  const beginWorkingGroupLeaderApplicationReviewFixture = new BeginWorkingGroupLeaderApplicationReviewFixture(
    api,
    proposer,
    openingId,
    api.getWorkingGroupString(group)
  )
  // Propose begin leader application review
  await beginWorkingGroupLeaderApplicationReviewFixture.runner()

  const voteForBeginReviewProposal = new VoteForProposalFixture(
    api,
    beginWorkingGroupLeaderApplicationReviewFixture.getCreatedProposalId() as ProposalId
  )
  await voteForBeginReviewProposal.runner()

  const fillLeaderOpeningProposalFixture = new FillLeaderOpeningProposalFixture(
    api,
    proposer,
    applicationId,
    firstRewardInterval,
    rewardInterval,
    payoutAmount,
    openingId,
    group
  )
  // Propose fill leader opening
  await fillLeaderOpeningProposalFixture.runner()

  const voteForFillLeaderProposalFixture = new VoteForProposalFixture(
    api,
    fillLeaderOpeningProposalFixture.getCreatedProposalId() as ProposalId
  )
  // Approve fill leader opening
  await voteForFillLeaderProposalFixture.runner()

  const hiredLead = await api.getGroupLead(group)
  assert(hiredLead)

  const setLeaderRewardProposalFixture = new SetLeaderRewardProposalFixture(api, proposer, alteredPayoutAmount, group)
  // Propose leader reward
  await setLeaderRewardProposalFixture.runner()

  const voteForeLeaderRewardFixture = new VoteForProposalFixture(
    api,
    setLeaderRewardProposalFixture.getCreatedProposalId() as ProposalId
  )

  // Approve new leader reward
  await voteForeLeaderRewardFixture.runner()

  const leadId = await api.getLeadWorkerId(group)
  // This check is prone to failure if more than one worker's reward amount was updated
  const workerId = api.expectWorkerRewardAmountUpdatedEvent(voteForeLeaderRewardFixture.getEvents())
  assert(leadId!.eq(workerId))
  const rewardRelationship = await api.getWorkerRewardRelationship(leadId!, group)
  assert(rewardRelationship.amount_per_payout.eq(alteredPayoutAmount))

  const decreaseLeaderStakeProposalFixture = new DecreaseLeaderStakeProposalFixture(
    api,
    proposer,
    stakeDecrement,
    group
  )

  // Propose decrease stake
  await decreaseLeaderStakeProposalFixture.runner()

  let newStake: BN = applicationStake.sub(stakeDecrement)
  // Approve decreased leader stake
  const voteForDecreaseStakeProposal = new VoteForProposalFixture(
    api,
    decreaseLeaderStakeProposalFixture.getCreatedProposalId() as ProposalId
  )
  await voteForDecreaseStakeProposal.runner()

  const slashLeaderProposalFixture = new SlashLeaderProposalFixture(api, proposer, slashAmount, group)
  // Propose leader slash
  await slashLeaderProposalFixture.runner()

  // Approve leader slash
  newStake = newStake.sub(slashAmount)
  const voteForSlashProposalFixture = new VoteForProposalFixture(
    api,
    slashLeaderProposalFixture.getCreatedProposalId() as ProposalId
  )
  await voteForSlashProposalFixture.runner()

  const terminateLeaderRoleProposalFixture = new TerminateLeaderRoleProposalFixture(api, proposer, false, group)
  // Propose terminate leader role
  await terminateLeaderRoleProposalFixture.runner()

  const voteForLeaderRoleTerminationFixture = new VoteForProposalFixture(
    api,
    terminateLeaderRoleProposalFixture.getCreatedProposalId() as ProposalId
  )
  await voteForLeaderRoleTerminationFixture.runner()

  const maybeLead = await api.getGroupLead(group)
  assert(!maybeLead)
}
