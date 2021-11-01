import BN from 'bn.js'
import { Api, WorkingGroups } from '../../Api'
import { FlowProps } from '../../Flow'
import { BuyMembershipHappyCaseFixture } from '../../fixtures/membershipModule'
import {
  BeginWorkingGroupLeaderApplicationReviewFixture,
  CreateWorkingGroupLeaderOpeningFixture,
  DecreaseLeaderStakeProposalFixture,
  FillLeaderOpeningProposalFixture,
  SetLeaderRewardProposalFixture,
  SlashLeaderProposalFixture,
  TerminateLeaderRoleProposalFixture,
  VoteForProposalAndExpectExecutionFixture,
} from '../../fixtures/proposalsModule'
import { ApplyForOpeningFixture } from '../../fixtures/workingGroupModule'
import { PaidTermId } from '@joystream/types/members'
import { OpeningId } from '@joystream/types/hiring'
import { ProposalId } from '@joystream/types/proposals'
import { WorkerId } from '@joystream/types/working-group'
import { assert } from 'chai'
import { FixtureRunner } from '../../Fixture'
import { extendDebug } from '../../Debugger'
import { Resource, ResourceLocker } from '../../Resources'

export default {
  storage: async function ({ api, env, lock }: FlowProps): Promise<void> {
    return manageLeaderRole(api, env, WorkingGroups.StorageWorkingGroup, lock)
  },
  content: async function ({ api, env, lock }: FlowProps): Promise<void> {
    return manageLeaderRole(api, env, WorkingGroups.ContentWorkingGroup, lock)
  },
}

async function manageLeaderRole(api: Api, env: NodeJS.ProcessEnv, group: WorkingGroups, lock: ResourceLocker) {
  const debug = extendDebug(`flow:managerLeaderRole:${group}`)
  debug('Started')
  await lock(Resource.Proposals)

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
  await new FixtureRunner(createWorkingGroupLeaderOpeningFixture).run()

  // Approve add opening proposal
  const voteForCreateOpeningProposalFixture = new VoteForProposalAndExpectExecutionFixture(
    api,
    createWorkingGroupLeaderOpeningFixture.getCreatedProposalId() as ProposalId
  )

  await new FixtureRunner(voteForCreateOpeningProposalFixture).run()

  const openingId = api.findOpeningAddedEvent(voteForCreateOpeningProposalFixture.events, group) as OpeningId
  assert(openingId)

  const applyForLeaderOpeningFixture = new ApplyForOpeningFixture(
    api,
    [leaderAccount],
    applicationStake,
    roleStake,
    openingId,
    group
  )
  await new FixtureRunner(applyForLeaderOpeningFixture).run()
  const applicationId = applyForLeaderOpeningFixture.getApplicationIds()[0]

  const beginWorkingGroupLeaderApplicationReviewFixture = new BeginWorkingGroupLeaderApplicationReviewFixture(
    api,
    proposer,
    openingId,
    api.getWorkingGroupString(group)
  )
  // Propose begin leader application review
  await new FixtureRunner(beginWorkingGroupLeaderApplicationReviewFixture).run()

  const voteForBeginReviewProposal = new VoteForProposalAndExpectExecutionFixture(
    api,
    beginWorkingGroupLeaderApplicationReviewFixture.getCreatedProposalId() as ProposalId
  )

  await new FixtureRunner(voteForBeginReviewProposal).run()

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
  await new FixtureRunner(fillLeaderOpeningProposalFixture).run()

  const voteForFillLeaderProposalFixture = new VoteForProposalAndExpectExecutionFixture(
    api,
    fillLeaderOpeningProposalFixture.getCreatedProposalId() as ProposalId
  )
  // Approve fill leader opening
  await new FixtureRunner(voteForFillLeaderProposalFixture).run()

  const hiredLead = await api.getGroupLead(group)
  assert(hiredLead)

  const setLeaderRewardProposalFixture = new SetLeaderRewardProposalFixture(api, proposer, alteredPayoutAmount, group)
  // Propose leader reward
  await new FixtureRunner(setLeaderRewardProposalFixture).run()

  const voteForeLeaderRewardFixture = new VoteForProposalAndExpectExecutionFixture(
    api,
    setLeaderRewardProposalFixture.getCreatedProposalId() as ProposalId
  )

  // Approve new leader reward
  await new FixtureRunner(voteForeLeaderRewardFixture).run()

  const leadId = (await api.getLeadWorkerId(group)) as WorkerId
  assert(leadId)
  const workerId = api.findWorkerRewardAmountUpdatedEvent(voteForeLeaderRewardFixture.events, group, leadId) as WorkerId
  assert(workerId)
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
  await new FixtureRunner(decreaseLeaderStakeProposalFixture).run()

  // let newStake: BN = applicationStake.sub(stakeDecrement)
  // Approve decreased leader stake
  const voteForDecreaseStakeProposal = new VoteForProposalAndExpectExecutionFixture(
    api,
    decreaseLeaderStakeProposalFixture.getCreatedProposalId() as ProposalId
  )
  await new FixtureRunner(voteForDecreaseStakeProposal).run()

  const slashLeaderProposalFixture = new SlashLeaderProposalFixture(api, proposer, slashAmount, group)
  // Propose leader slash
  await new FixtureRunner(slashLeaderProposalFixture).run()

  // Approve leader slash
  // newStake = newStake.sub(slashAmount)
  const voteForSlashProposalFixture = new VoteForProposalAndExpectExecutionFixture(
    api,
    slashLeaderProposalFixture.getCreatedProposalId() as ProposalId
  )
  await new FixtureRunner(voteForSlashProposalFixture).run()

  const terminateLeaderRoleProposalFixture = new TerminateLeaderRoleProposalFixture(api, proposer, false, group)
  // Propose terminate leader role
  await new FixtureRunner(terminateLeaderRoleProposalFixture).run()

  const voteForLeaderRoleTerminationFixture = new VoteForProposalAndExpectExecutionFixture(
    api,
    terminateLeaderRoleProposalFixture.getCreatedProposalId() as ProposalId
  )
  await new FixtureRunner(voteForLeaderRoleTerminationFixture).run()

  const maybeLead = await api.getGroupLead(group)
  assert(!maybeLead)

  debug('Done')
}
