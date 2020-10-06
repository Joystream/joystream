import { KeyringPair } from '@polkadot/keyring/types'
import { Keyring } from '@polkadot/api'
import BN from 'bn.js'
import { setTestTimeout } from '../../utils/setTestTimeout'
import { ApiWrapper, WorkingGroups } from '../../utils/apiWrapper'
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
import { Utils } from '../../utils/utils'
import { PaidTermId } from '@joystream/types/members'
import { OpeningId } from '@joystream/types/hiring'
import { ProposalId } from '@joystream/types/proposals'
import { DbService } from '../../services/dbService'
import { CouncilElectionHappyCaseFixture } from '../../fixtures/councilElectionHappyCase'

export default async function manageLeaderRole(apiWrapper: ApiWrapper, env: NodeJS.ProcessEnv, db: DbService) {
  const sudoUri: string = env.SUDO_ACCOUNT_URI!
  const keyring = new Keyring({ type: 'sr25519' })
  const sudo: KeyringPair = keyring.addFromUri(sudoUri)

  const N: number = +env.MEMBERSHIP_CREATION_N!
  let m1KeyPairs: KeyringPair[] = Utils.createKeyPairs(keyring, N)
  let m2KeyPairs: KeyringPair[] = Utils.createKeyPairs(keyring, N)
  const leadKeyPair: KeyringPair[] = Utils.createKeyPairs(keyring, 1)

  const paidTerms: PaidTermId = apiWrapper.createPaidTermId(new BN(+env.MEMBERSHIP_PAID_TERMS!))
  const K: number = +env.COUNCIL_ELECTION_K!
  const greaterStake: BN = new BN(+env.COUNCIL_STAKE_GREATER_AMOUNT!)
  const lesserStake: BN = new BN(+env.COUNCIL_STAKE_LESSER_AMOUNT!)
  const applicationStake: BN = new BN(env.WORKING_GROUP_APPLICATION_STAKE!)
  const roleStake: BN = new BN(env.WORKING_GROUP_ROLE_STAKE!)
  const firstRewardInterval: BN = new BN(env.LONG_REWARD_INTERVAL!)
  const rewardInterval: BN = new BN(env.LONG_REWARD_INTERVAL!)
  const payoutAmount: BN = new BN(env.PAYOUT_AMOUNT!)
  const alteredPayoutAmount: BN = new BN(env.ALTERED_PAYOUT_AMOUNT!)
  const stakeDecrement: BN = new BN(env.STAKE_DECREMENT!)
  const slashAmount: BN = new BN(env.SLASH_AMOUNT!)
  const durationInBlocks = 70

  setTestTimeout(apiWrapper, durationInBlocks)

  if (db.hasCouncil()) {
    m1KeyPairs = db.getMembers()
    m2KeyPairs = db.getCouncil()
  } else {
    const councilElectionHappyCaseFixture = new CouncilElectionHappyCaseFixture(
      apiWrapper,
      sudo,
      m1KeyPairs,
      m2KeyPairs,
      paidTerms,
      K,
      greaterStake,
      lesserStake
    )
    await councilElectionHappyCaseFixture.runner(false)
  }

  const leaderMembershipFixture: BuyMembershipHappyCaseFixture = new BuyMembershipHappyCaseFixture(
    apiWrapper,
    sudo,
    leadKeyPair,
    paidTerms
  )
  // Buy membership for lead
  await leaderMembershipFixture.runner(false)

  const createWorkingGroupLeaderOpeningFixture: CreateWorkingGroupLeaderOpeningFixture = new CreateWorkingGroupLeaderOpeningFixture(
    apiWrapper,
    m1KeyPairs,
    sudo,
    applicationStake,
    roleStake,
    'Storage'
  )
  // Propose create leader opening
  await createWorkingGroupLeaderOpeningFixture.runner(false)

  let voteForCreateOpeningProposalFixture: VoteForProposalFixture
  const expectLeadOpeningAddedFixture: ExpectLeadOpeningAddedFixture = new ExpectLeadOpeningAddedFixture(apiWrapper)
  // Approve add opening proposal
  await (async () => {
    voteForCreateOpeningProposalFixture = new VoteForProposalFixture(
      apiWrapper,
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
      apiWrapper,
      leadKeyPair,
      sudo,
      applicationStake,
      roleStake,
      expectLeadOpeningAddedFixture.getCreatedOpeningId() as OpeningId,
      WorkingGroups.StorageWorkingGroup
    )
    await applyForLeaderOpeningFixture.runner(false)
  })()

  const beginWorkingGroupLeaderApplicationReviewFixture: BeginWorkingGroupLeaderApplicationReviewFixture = new BeginWorkingGroupLeaderApplicationReviewFixture(
    apiWrapper,
    m1KeyPairs,
    sudo,
    expectLeadOpeningAddedFixture.getCreatedOpeningId() as OpeningId,
    'Storage'
  )

  // Propose begin leader application review
  await beginWorkingGroupLeaderApplicationReviewFixture.runner(false)

  let voteForBeginReviewProposal: VoteForProposalFixture
  const expectBeganApplicationReviewFixture: ExpectBeganApplicationReviewFixture = new ExpectBeganApplicationReviewFixture(
    apiWrapper
  )
  // Approve begin application review
  await (async () => {
    voteForBeginReviewProposal = new VoteForProposalFixture(
      apiWrapper,
      m2KeyPairs,
      sudo,
      beginWorkingGroupLeaderApplicationReviewFixture.getCreatedProposalId() as ProposalId
    )
    voteForBeginReviewProposal.runner(false)
    await expectBeganApplicationReviewFixture.runner(false)
  })()

  const fillLeaderOpeningProposalFixture: FillLeaderOpeningProposalFixture = new FillLeaderOpeningProposalFixture(
    apiWrapper,
    m1KeyPairs,
    leadKeyPair[0].address,
    sudo,
    firstRewardInterval,
    rewardInterval,
    payoutAmount,
    expectLeadOpeningAddedFixture.getCreatedOpeningId() as OpeningId,
    WorkingGroups.StorageWorkingGroup
  )
  // Propose fill leader opening
  await fillLeaderOpeningProposalFixture.runner(false)

  const voteForFillLeaderProposalFixture: VoteForProposalFixture = new VoteForProposalFixture(
    apiWrapper,
    m2KeyPairs,
    sudo,
    fillLeaderOpeningProposalFixture.getCreatedProposalId() as ProposalId
  )
  const expectLeaderSetFixture: ExpectLeaderSetFixture = new ExpectLeaderSetFixture(
    apiWrapper,
    leadKeyPair[0].address,
    WorkingGroups.StorageWorkingGroup
  )
  // Approve fill leader opening
  voteForFillLeaderProposalFixture.runner(false)
  await expectLeaderSetFixture.runner(false)

  const setLeaderRewardProposalFixture: SetLeaderRewardProposalFixture = new SetLeaderRewardProposalFixture(
    apiWrapper,
    m1KeyPairs,
    sudo,
    alteredPayoutAmount,
    WorkingGroups.StorageWorkingGroup
  )
  // Propose leader reward
  await setLeaderRewardProposalFixture.runner(false)

  const voteForeLeaderRewardFixture: VoteForProposalFixture = new VoteForProposalFixture(
    apiWrapper,
    m2KeyPairs,
    sudo,
    setLeaderRewardProposalFixture.getCreatedProposalId() as ProposalId
  )
  const expectLeaderRewardAmountUpdatedFixture: ExpectLeaderRewardAmountUpdatedFixture = new ExpectLeaderRewardAmountUpdatedFixture(
    apiWrapper,
    alteredPayoutAmount,
    WorkingGroups.StorageWorkingGroup
  )
  // Approve new leader reward
  voteForeLeaderRewardFixture.runner(false)
  await expectLeaderRewardAmountUpdatedFixture.runner(false)

  const decreaseLeaderStakeProposalFixture: DecreaseLeaderStakeProposalFixture = new DecreaseLeaderStakeProposalFixture(
    apiWrapper,
    m1KeyPairs,
    sudo,
    stakeDecrement,
    WorkingGroups.StorageWorkingGroup
  )

  // Propose decrease stake
  await decreaseLeaderStakeProposalFixture.runner(false)

  let voteForDecreaseStakeProposal: VoteForProposalFixture
  let expectLeaderStakeDecreasedFixture: ExpectLeaderStakeDecreasedFixture
  let newStake: BN = applicationStake.sub(stakeDecrement)
  // Approve decreased leader stake
  await (async () => {
    voteForDecreaseStakeProposal = new VoteForProposalFixture(
      apiWrapper,
      m2KeyPairs,
      sudo,
      decreaseLeaderStakeProposalFixture.getCreatedProposalId() as ProposalId
    )
    voteForDecreaseStakeProposal.runner(false)
    expectLeaderStakeDecreasedFixture = new ExpectLeaderStakeDecreasedFixture(
      apiWrapper,
      newStake,
      WorkingGroups.StorageWorkingGroup
    )
    await expectLeaderStakeDecreasedFixture.runner(false)
  })()

  const slashLeaderProposalFixture: SlashLeaderProposalFixture = new SlashLeaderProposalFixture(
    apiWrapper,
    m1KeyPairs,
    sudo,
    slashAmount,
    WorkingGroups.StorageWorkingGroup
  )
  // Propose leader slash
  await slashLeaderProposalFixture.runner(false)

  let voteForSlashProposalFixture: VoteForProposalFixture
  let expectLeaderSlashedFixture: ExpectLeaderSlashedFixture
  // Approve leader slash
  await (async () => {
    newStake = newStake.sub(slashAmount)
    voteForSlashProposalFixture = new VoteForProposalFixture(
      apiWrapper,
      m2KeyPairs,
      sudo,
      slashLeaderProposalFixture.getCreatedProposalId() as ProposalId
    )
    voteForSlashProposalFixture.runner(false)
    expectLeaderSlashedFixture = new ExpectLeaderSlashedFixture(apiWrapper, newStake, WorkingGroups.StorageWorkingGroup)
    await expectLeaderSlashedFixture.runner(false)
  })()

  const terminateLeaderRoleProposalFixture: TerminateLeaderRoleProposalFixture = new TerminateLeaderRoleProposalFixture(
    apiWrapper,
    m1KeyPairs,
    leadKeyPair[0].address,
    sudo,
    false,
    WorkingGroups.StorageWorkingGroup
  )
  // Propose terminate leader role
  await terminateLeaderRoleProposalFixture.runner(false)

  let voteForLeaderRoleTerminationFixture: VoteForProposalFixture
  const expectLeaderRoleTerminatedFixture: ExpectLeaderRoleTerminatedFixture = new ExpectLeaderRoleTerminatedFixture(
    apiWrapper,
    WorkingGroups.StorageWorkingGroup
  )
  // Approve leader role termination
  await (async () => {
    voteForLeaderRoleTerminationFixture = new VoteForProposalFixture(
      apiWrapper,
      m2KeyPairs,
      sudo,
      terminateLeaderRoleProposalFixture.getCreatedProposalId() as ProposalId
    )
    voteForLeaderRoleTerminationFixture.runner(false)
    await expectLeaderRoleTerminatedFixture.runner(false)
  })()
}
