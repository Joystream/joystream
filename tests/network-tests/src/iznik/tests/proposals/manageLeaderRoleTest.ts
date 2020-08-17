import { KeyringPair } from '@polkadot/keyring/types'
import { initConfig } from '../../utils/config'
import { Keyring, WsProvider } from '@polkadot/api'
import BN from 'bn.js'
import { setTestTimeout } from '../../utils/setTestTimeout'
import tap from 'tap'
import { closeApi } from '../../utils/closeApi'
import { ApiWrapper, WorkingGroups } from '../../utils/apiWrapper'
import { BuyMembershipHappyCaseFixture } from '../fixtures/membershipModule'
import {
  BeginWorkingGroupLeaderApplicationReviewFixture,
  CreateWorkingGroupLeaderOpeningFixture,
  DecreaseLeaderStakeProposalFixture,
  FillLeaderOpeningProposalFixture,
  SetLeaderRewardProposalFixture,
  SlashLeaderProposalFixture,
  TerminateLeaderRoleProposalFixture,
  VoteForProposalFixture,
} from '../fixtures/proposalsModule'
import {
  ApplyForOpeningFixture,
  ExpectBeganApplicationReviewFixture,
  ExpectLeaderRewardAmountUpdatedFixture,
  ExpectLeaderRoleTerminatedFixture,
  ExpectLeaderSetFixture,
  ExpectLeaderSlashedFixture,
  ExpectLeaderStakeDecreasedFixture,
  ExpectLeadOpeningAddedFixture,
} from '../fixtures/workingGroupModule'
import { Utils } from '../../utils/utils'
import { PaidTermId } from '@alexandria/types/members'
import { OpeningId } from '@alexandria/types/hiring'
import { ProposalId } from '@alexandria/types/proposals'
import { DbService } from '../../services/dbService'
import { CouncilElectionHappyCaseFixture } from '../fixtures/councilElectionHappyCase'

tap.mocha.describe('Set lead proposal scenario', async () => {
  initConfig()

  const nodeUrl: string = process.env.NODE_URL!
  const sudoUri: string = process.env.SUDO_ACCOUNT_URI!
  const keyring = new Keyring({ type: 'sr25519' })
  const db: DbService = DbService.getInstance()

  const provider = new WsProvider(nodeUrl)
  const apiWrapper: ApiWrapper = await ApiWrapper.create(provider)
  const sudo: KeyringPair = keyring.addFromUri(sudoUri)

  const N: number = +process.env.MEMBERSHIP_CREATION_N!
  let m1KeyPairs: KeyringPair[] = Utils.createKeyPairs(keyring, N)
  let m2KeyPairs: KeyringPair[] = Utils.createKeyPairs(keyring, N)
  const leadKeyPair: KeyringPair[] = Utils.createKeyPairs(keyring, 1)

  const paidTerms: PaidTermId = apiWrapper.createPaidTermId(new BN(+process.env.MEMBERSHIP_PAID_TERMS!))
  const K: number = +process.env.COUNCIL_ELECTION_K!
  const greaterStake: BN = new BN(+process.env.COUNCIL_STAKE_GREATER_AMOUNT!)
  const lesserStake: BN = new BN(+process.env.COUNCIL_STAKE_LESSER_AMOUNT!)
  const applicationStake: BN = new BN(process.env.WORKING_GROUP_APPLICATION_STAKE!)
  const roleStake: BN = new BN(process.env.WORKING_GROUP_ROLE_STAKE!)
  const firstRewardInterval: BN = new BN(process.env.LONG_REWARD_INTERVAL!)
  const rewardInterval: BN = new BN(process.env.LONG_REWARD_INTERVAL!)
  const payoutAmount: BN = new BN(process.env.PAYOUT_AMOUNT!)
  const alteredPayoutAmount: BN = new BN(process.env.ALTERED_PAYOUT_AMOUNT!)
  const stakeDecrement: BN = new BN(process.env.STAKE_DECREMENT!)
  const slashAmount: BN = new BN(process.env.SLASH_AMOUNT!)
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
    councilElectionHappyCaseFixture.runner(false)
  }

  const leaderMembershipFixture: BuyMembershipHappyCaseFixture = new BuyMembershipHappyCaseFixture(
    apiWrapper,
    sudo,
    leadKeyPair,
    paidTerms
  )
  tap.test('Buy membership for lead', async () => leaderMembershipFixture.runner(false))

  const createWorkingGroupLeaderOpeningFixture: CreateWorkingGroupLeaderOpeningFixture = new CreateWorkingGroupLeaderOpeningFixture(
    apiWrapper,
    m1KeyPairs,
    sudo,
    applicationStake,
    roleStake,
    'Storage'
  )
  tap.test('Propose create leader opening', async () => createWorkingGroupLeaderOpeningFixture.runner(false))

  let voteForCreateOpeningProposalFixture: VoteForProposalFixture
  const expectLeadOpeningAddedFixture: ExpectLeadOpeningAddedFixture = new ExpectLeadOpeningAddedFixture(apiWrapper)
  tap.test('Approve add opening proposal', async () => {
    voteForCreateOpeningProposalFixture = new VoteForProposalFixture(
      apiWrapper,
      m2KeyPairs,
      sudo,
      createWorkingGroupLeaderOpeningFixture.getCreatedProposalId() as OpeningId
    )
    voteForCreateOpeningProposalFixture.runner(false)
    await expectLeadOpeningAddedFixture.runner(false)
  })

  let applyForLeaderOpeningFixture: ApplyForOpeningFixture
  tap.test('Apply for lead opening', async () => {
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
  })

  let beginWorkingGroupLeaderApplicationReviewFixture: BeginWorkingGroupLeaderApplicationReviewFixture
  tap.test('Propose begin leader application review', async () => {
    beginWorkingGroupLeaderApplicationReviewFixture = new BeginWorkingGroupLeaderApplicationReviewFixture(
      apiWrapper,
      m1KeyPairs,
      sudo,
      expectLeadOpeningAddedFixture.getCreatedOpeningId() as OpeningId,
      'Storage'
    )
    await beginWorkingGroupLeaderApplicationReviewFixture.runner(false)
  })

  let voteForBeginReviewProposal: VoteForProposalFixture
  const expectBeganApplicationReviewFixture: ExpectBeganApplicationReviewFixture = new ExpectBeganApplicationReviewFixture(
    apiWrapper
  )
  tap.test('Approve begin application review', async () => {
    voteForBeginReviewProposal = new VoteForProposalFixture(
      apiWrapper,
      m2KeyPairs,
      sudo,
      beginWorkingGroupLeaderApplicationReviewFixture.getCreatedProposalId() as ProposalId
    )
    voteForBeginReviewProposal.runner(false)
    await expectBeganApplicationReviewFixture.runner(false)
  })

  let fillLeaderOpeningProposalFixture: FillLeaderOpeningProposalFixture
  tap.test('Propose fill leader opening', async () => {
    fillLeaderOpeningProposalFixture = new FillLeaderOpeningProposalFixture(
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
    await fillLeaderOpeningProposalFixture.runner(false)
  })

  let voteForFillLeaderProposalFixture: VoteForProposalFixture
  const expectLeaderSetFixture: ExpectLeaderSetFixture = new ExpectLeaderSetFixture(
    apiWrapper,
    leadKeyPair[0].address,
    WorkingGroups.StorageWorkingGroup
  )
  tap.test('Approve fill leader opening', async () => {
    voteForFillLeaderProposalFixture = new VoteForProposalFixture(
      apiWrapper,
      m2KeyPairs,
      sudo,
      fillLeaderOpeningProposalFixture.getCreatedProposalId() as ProposalId
    )
    voteForFillLeaderProposalFixture.runner(false)
    await expectLeaderSetFixture.runner(false)
  })

  const setLeaderRewardProposalFixture: SetLeaderRewardProposalFixture = new SetLeaderRewardProposalFixture(
    apiWrapper,
    m1KeyPairs,
    sudo,
    alteredPayoutAmount,
    WorkingGroups.StorageWorkingGroup
  )
  tap.test('Propose leader reward', async () => setLeaderRewardProposalFixture.runner(false))

  let voteForeLeaderRewardFixture: VoteForProposalFixture
  const expectLeaderRewardAmountUpdatedFixture: ExpectLeaderRewardAmountUpdatedFixture = new ExpectLeaderRewardAmountUpdatedFixture(
    apiWrapper,
    alteredPayoutAmount,
    WorkingGroups.StorageWorkingGroup
  )
  tap.test('Approve new leader reward', async () => {
    voteForeLeaderRewardFixture = new VoteForProposalFixture(
      apiWrapper,
      m2KeyPairs,
      sudo,
      setLeaderRewardProposalFixture.getCreatedProposalId() as ProposalId
    )
    voteForeLeaderRewardFixture.runner(false)
    await expectLeaderRewardAmountUpdatedFixture.runner(false)
  })

  const decreaseLeaderStakeProposalFixture: DecreaseLeaderStakeProposalFixture = new DecreaseLeaderStakeProposalFixture(
    apiWrapper,
    m1KeyPairs,
    sudo,
    stakeDecrement,
    WorkingGroups.StorageWorkingGroup
  )
  let newStake: BN
  tap.test('Propose decrease stake', async () => decreaseLeaderStakeProposalFixture.runner(false))

  let voteForDecreaseStakeProposal: VoteForProposalFixture
  let expectLeaderStakeDecreasedFixture: ExpectLeaderStakeDecreasedFixture
  tap.test('Approve decreased leader stake', async () => {
    newStake = applicationStake.sub(stakeDecrement)
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
  })

  const slashLeaderProposalFixture: SlashLeaderProposalFixture = new SlashLeaderProposalFixture(
    apiWrapper,
    m1KeyPairs,
    sudo,
    slashAmount,
    WorkingGroups.StorageWorkingGroup
  )
  tap.test('Propose leader slash', async () => slashLeaderProposalFixture.runner(false))

  let voteForSlashProposalFixture: VoteForProposalFixture
  let expectLeaderSlashedFixture: ExpectLeaderSlashedFixture
  tap.test('Approve leader slash', async () => {
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
  })

  const terminateLeaderRoleProposalFixture: TerminateLeaderRoleProposalFixture = new TerminateLeaderRoleProposalFixture(
    apiWrapper,
    m1KeyPairs,
    leadKeyPair[0].address,
    sudo,
    false,
    WorkingGroups.StorageWorkingGroup
  )
  tap.test('Propose terminate leader role', async () => terminateLeaderRoleProposalFixture.runner(false))

  let voteForLeaderRoleTerminationFixture: VoteForProposalFixture
  const expectLeaderRoleTerminatedFixture: ExpectLeaderRoleTerminatedFixture = new ExpectLeaderRoleTerminatedFixture(
    apiWrapper,
    WorkingGroups.StorageWorkingGroup
  )
  tap.test('Approve leader role termination', async () => {
    voteForLeaderRoleTerminationFixture = new VoteForProposalFixture(
      apiWrapper,
      m2KeyPairs,
      sudo,
      terminateLeaderRoleProposalFixture.getCreatedProposalId() as ProposalId
    )
    voteForLeaderRoleTerminationFixture.runner(false)
    await expectLeaderRoleTerminatedFixture.runner(false)
  })

  closeApi(apiWrapper)
})
