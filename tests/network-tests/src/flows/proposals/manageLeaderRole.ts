import { KeyringPair } from '@polkadot/keyring/types'
import { Keyring } from '@polkadot/api'
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
import {
  ApplyForOpeningFixture,
  ExpectBeganApplicationReviewFixture,
  ExpectLeaderRewardAmountUpdatedFixture,
  ExpectLeaderRoleTerminatedFixture,
  ExpectLeaderSetFixture,
  ExpectLeaderSlashedFixture,
  ExpectLeaderStakeDecreasedFixture,
  ExpectLeadOpeningAddedFixture,
} from '../../fixtures/workingGroupModule'
import { Utils } from '../../utils'
import { PaidTermId } from '@joystream/types/members'
import { OpeningId } from '@joystream/types/hiring'
import { ProposalId } from '@joystream/types/proposals'
import { DbService } from '../../DbService'
import { assert } from 'chai'

export default async function manageLeaderRole(api: Api, env: NodeJS.ProcessEnv, db: DbService, group: WorkingGroups) {
  const sudoUri: string = env.SUDO_ACCOUNT_URI!
  const keyring = new Keyring({ type: 'sr25519' })
  const sudo: KeyringPair = keyring.addFromUri(sudoUri)

  const leadKeyPair: KeyringPair[] = Utils.createKeyPairs(keyring, 1)

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
  assert(!db.hasLeader(group))
  const m1KeyPairs = db.getMembers()
  const m2KeyPairs = db.getCouncil()

  const leaderMembershipFixture: BuyMembershipHappyCaseFixture = new BuyMembershipHappyCaseFixture(
    api,
    sudo,
    leadKeyPair,
    paidTerms
  )
  // Buy membership for lead
  await leaderMembershipFixture.runner(false)

  const createWorkingGroupLeaderOpeningFixture: CreateWorkingGroupLeaderOpeningFixture = new CreateWorkingGroupLeaderOpeningFixture(
    api,
    m1KeyPairs,
    sudo,
    applicationStake,
    roleStake,
    api.getWorkingGroupString(group)
  )
  // Propose create leader opening
  await createWorkingGroupLeaderOpeningFixture.runner(false)

  let voteForCreateOpeningProposalFixture: VoteForProposalFixture
  const expectLeadOpeningAddedFixture: ExpectLeadOpeningAddedFixture = new ExpectLeadOpeningAddedFixture(api)
  // Approve add opening proposal
  await (async () => {
    voteForCreateOpeningProposalFixture = new VoteForProposalFixture(
      api,
      m2KeyPairs,
      sudo,
      createWorkingGroupLeaderOpeningFixture.getCreatedProposalId() as OpeningId
    )
    voteForCreateOpeningProposalFixture.runner(false)
    await expectLeadOpeningAddedFixture.runner(false)
  })()

  let applyForLeaderOpeningFixture: ApplyForOpeningFixture
  // Apply for lead opening
  await (async () => {
    applyForLeaderOpeningFixture = new ApplyForOpeningFixture(
      api,
      leadKeyPair,
      sudo,
      applicationStake,
      roleStake,
      expectLeadOpeningAddedFixture.getCreatedOpeningId() as OpeningId,
      group
    )
    await applyForLeaderOpeningFixture.runner(false)
  })()

  const beginWorkingGroupLeaderApplicationReviewFixture: BeginWorkingGroupLeaderApplicationReviewFixture = new BeginWorkingGroupLeaderApplicationReviewFixture(
    api,
    m1KeyPairs,
    sudo,
    expectLeadOpeningAddedFixture.getCreatedOpeningId() as OpeningId,
    api.getWorkingGroupString(group)
  )

  // Propose begin leader application review
  await beginWorkingGroupLeaderApplicationReviewFixture.runner(false)

  let voteForBeginReviewProposal: VoteForProposalFixture
  const expectBeganApplicationReviewFixture: ExpectBeganApplicationReviewFixture = new ExpectBeganApplicationReviewFixture(
    api
  )
  // Approve begin application review
  await (async () => {
    voteForBeginReviewProposal = new VoteForProposalFixture(
      api,
      m2KeyPairs,
      sudo,
      beginWorkingGroupLeaderApplicationReviewFixture.getCreatedProposalId() as ProposalId
    )
    voteForBeginReviewProposal.runner(false)
    await expectBeganApplicationReviewFixture.runner(false)
  })()

  const fillLeaderOpeningProposalFixture: FillLeaderOpeningProposalFixture = new FillLeaderOpeningProposalFixture(
    api,
    m1KeyPairs,
    leadKeyPair[0].address,
    sudo,
    firstRewardInterval,
    rewardInterval,
    payoutAmount,
    expectLeadOpeningAddedFixture.getCreatedOpeningId() as OpeningId,
    group
  )
  // Propose fill leader opening
  await fillLeaderOpeningProposalFixture.runner(false)

  const voteForFillLeaderProposalFixture: VoteForProposalFixture = new VoteForProposalFixture(
    api,
    m2KeyPairs,
    sudo,
    fillLeaderOpeningProposalFixture.getCreatedProposalId() as ProposalId
  )
  const expectLeaderSetFixture: ExpectLeaderSetFixture = new ExpectLeaderSetFixture(api, leadKeyPair[0].address, group)
  // Approve fill leader opening
  voteForFillLeaderProposalFixture.runner(false)
  await expectLeaderSetFixture.runner(false)

  const setLeaderRewardProposalFixture: SetLeaderRewardProposalFixture = new SetLeaderRewardProposalFixture(
    api,
    m1KeyPairs,
    sudo,
    alteredPayoutAmount,
    group
  )
  // Propose leader reward
  await setLeaderRewardProposalFixture.runner(false)

  const voteForeLeaderRewardFixture: VoteForProposalFixture = new VoteForProposalFixture(
    api,
    m2KeyPairs,
    sudo,
    setLeaderRewardProposalFixture.getCreatedProposalId() as ProposalId
  )
  const expectLeaderRewardAmountUpdatedFixture: ExpectLeaderRewardAmountUpdatedFixture = new ExpectLeaderRewardAmountUpdatedFixture(
    api,
    alteredPayoutAmount,
    group
  )
  // Approve new leader reward
  voteForeLeaderRewardFixture.runner(false)
  await expectLeaderRewardAmountUpdatedFixture.runner(false)

  const decreaseLeaderStakeProposalFixture: DecreaseLeaderStakeProposalFixture = new DecreaseLeaderStakeProposalFixture(
    api,
    m1KeyPairs,
    sudo,
    stakeDecrement,
    group
  )

  // Propose decrease stake
  await decreaseLeaderStakeProposalFixture.runner(false)

  let voteForDecreaseStakeProposal: VoteForProposalFixture
  let expectLeaderStakeDecreasedFixture: ExpectLeaderStakeDecreasedFixture
  let newStake: BN = applicationStake.sub(stakeDecrement)
  // Approve decreased leader stake
  await (async () => {
    voteForDecreaseStakeProposal = new VoteForProposalFixture(
      api,
      m2KeyPairs,
      sudo,
      decreaseLeaderStakeProposalFixture.getCreatedProposalId() as ProposalId
    )
    voteForDecreaseStakeProposal.runner(false)
    expectLeaderStakeDecreasedFixture = new ExpectLeaderStakeDecreasedFixture(api, newStake, group)
    await expectLeaderStakeDecreasedFixture.runner(false)
  })()

  const slashLeaderProposalFixture: SlashLeaderProposalFixture = new SlashLeaderProposalFixture(
    api,
    m1KeyPairs,
    sudo,
    slashAmount,
    group
  )
  // Propose leader slash
  await slashLeaderProposalFixture.runner(false)

  let voteForSlashProposalFixture: VoteForProposalFixture
  let expectLeaderSlashedFixture: ExpectLeaderSlashedFixture
  // Approve leader slash
  await (async () => {
    newStake = newStake.sub(slashAmount)
    voteForSlashProposalFixture = new VoteForProposalFixture(
      api,
      m2KeyPairs,
      sudo,
      slashLeaderProposalFixture.getCreatedProposalId() as ProposalId
    )
    voteForSlashProposalFixture.runner(false)
    expectLeaderSlashedFixture = new ExpectLeaderSlashedFixture(api, newStake, group)
    await expectLeaderSlashedFixture.runner(false)
  })()

  const terminateLeaderRoleProposalFixture: TerminateLeaderRoleProposalFixture = new TerminateLeaderRoleProposalFixture(
    api,
    m1KeyPairs,
    leadKeyPair[0].address,
    sudo,
    false,
    group
  )
  // Propose terminate leader role
  await terminateLeaderRoleProposalFixture.runner(false)

  let voteForLeaderRoleTerminationFixture: VoteForProposalFixture
  const expectLeaderRoleTerminatedFixture: ExpectLeaderRoleTerminatedFixture = new ExpectLeaderRoleTerminatedFixture(
    api,
    group
  )
  // Approve leader role termination
  await (async () => {
    voteForLeaderRoleTerminationFixture = new VoteForProposalFixture(
      api,
      m2KeyPairs,
      sudo,
      terminateLeaderRoleProposalFixture.getCreatedProposalId() as ProposalId
    )
    voteForLeaderRoleTerminationFixture.runner(false)
    await expectLeaderRoleTerminatedFixture.runner(false)
  })()
}
