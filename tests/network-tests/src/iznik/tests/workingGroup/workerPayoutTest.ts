import { initConfig } from '../../utils/config'
import { registerJoystreamTypes } from '@nicaea/types'
import { closeApi } from '../../utils/closeApi'
import { ApiWrapper, WorkingGroups } from '../../utils/apiWrapper'
import { WsProvider, Keyring } from '@polkadot/api'
import { KeyringPair } from '@polkadot/keyring/types'
import { setTestTimeout } from '../../utils/setTestTimeout'
import {
  AddLeaderOpeningFixture,
  AddWorkerOpeningFixture,
  ApplyForOpeningFixture,
  AwaitPayoutFixture,
  BeginApplicationReviewFixture,
  BeginLeaderApplicationReviewFixture,
  ExpectMintCapacityChangedFixture,
  FillLeaderOpeningFixture,
  FillOpeningFixture,
  LeaveRoleFixture,
} from '../fixtures/workingGroupModule'
import BN from 'bn.js'
import tap from 'tap'
import { BuyMembershipHappyCaseFixture } from '../fixtures/membershipModule'
import { Utils } from '../../utils/utils'
import { ElectCouncilFixture } from '../fixtures/councilElectionModule'
import { VoteForProposalFixture, WorkingGroupMintCapacityProposalFixture } from '../fixtures/proposalsModule'
import { PaidTermId } from '@nicaea/types/members'
import { OpeningId } from '@nicaea/types/hiring'
import { ProposalId } from '@nicaea/types/proposals'

tap.mocha.describe('Worker application happy case scenario', async () => {
  initConfig()
  registerJoystreamTypes()

  const nodeUrl: string = process.env.NODE_URL!
  const sudoUri: string = process.env.SUDO_ACCOUNT_URI!
  const keyring = new Keyring({ type: 'sr25519' })
  const provider = new WsProvider(nodeUrl)
  const apiWrapper: ApiWrapper = await ApiWrapper.create(provider)
  const sudo: KeyringPair = keyring.addFromUri(sudoUri)

  const N: number = +process.env.WORKING_GROUP_N!
  const m1KeyPairs: KeyringPair[] = Utils.createKeyPairs(keyring, N)
  const m2KeyPairs: KeyringPair[] = Utils.createKeyPairs(keyring, N)
  const leadKeyPair: KeyringPair[] = Utils.createKeyPairs(keyring, 1)

  const paidTerms: PaidTermId = new PaidTermId(+process.env.MEMBERSHIP_PAID_TERMS!)
  const K: number = +process.env.COUNCIL_ELECTION_K!
  const greaterStake: BN = new BN(+process.env.COUNCIL_STAKE_GREATER_AMOUNT!)
  const lesserStake: BN = new BN(+process.env.COUNCIL_STAKE_LESSER_AMOUNT!)
  const applicationStake: BN = new BN(process.env.WORKING_GROUP_APPLICATION_STAKE!)
  const roleStake: BN = new BN(process.env.WORKING_GROUP_ROLE_STAKE!)
  const leaderFirstRewardInterval: BN = new BN(process.env.LONG_REWARD_INTERVAL!)
  const leaderRewardInterval: BN = new BN(process.env.LONG_REWARD_INTERVAL!)
  const firstRewardInterval: BN = new BN(process.env.SHORT_FIRST_REWARD_INTERVAL!)
  const rewardInterval: BN = new BN(process.env.SHORT_REWARD_INTERVAL!)
  const payoutAmount: BN = new BN(process.env.PAYOUT_AMOUNT!)
  const unstakingPeriod: BN = new BN(process.env.STORAGE_WORKING_GROUP_UNSTAKING_PERIOD!)
  const mintCapacity: BN = new BN(process.env.STORAGE_WORKING_GROUP_MINTING_CAPACITY!)
  const durationInBlocks = 48
  const openingActivationDelay: BN = new BN(0)

  setTestTimeout(apiWrapper, durationInBlocks)

  const firstMemberSetFixture: BuyMembershipHappyCaseFixture = new BuyMembershipHappyCaseFixture(
    apiWrapper,
    sudo,
    m1KeyPairs,
    paidTerms
  )
  tap.test('Creating first set of members', async () => firstMemberSetFixture.runner(false))

  const secondMemberSetFixture: BuyMembershipHappyCaseFixture = new BuyMembershipHappyCaseFixture(
    apiWrapper,
    sudo,
    m2KeyPairs,
    paidTerms
  )
  tap.test('Creating second set of members', async () => secondMemberSetFixture.runner(false))

  const electCouncilFixture: ElectCouncilFixture = new ElectCouncilFixture(
    apiWrapper,
    m1KeyPairs,
    m2KeyPairs,
    K,
    sudo,
    greaterStake,
    lesserStake
  )
  tap.test('Elect council', async () => electCouncilFixture.runner(false))

  const leaderHappyCaseFixture: BuyMembershipHappyCaseFixture = new BuyMembershipHappyCaseFixture(
    apiWrapper,
    sudo,
    leadKeyPair,
    paidTerms
  )
  tap.test('Buying membership for leader account', async () => leaderHappyCaseFixture.runner(false))

  const addLeaderOpeningFixture: AddLeaderOpeningFixture = new AddLeaderOpeningFixture(
    apiWrapper,
    m1KeyPairs,
    sudo,
    applicationStake,
    roleStake,
    openingActivationDelay,
    WorkingGroups.StorageWorkingGroup
  )
  tap.test('Add lead opening', async () => await addLeaderOpeningFixture.runner(false))

  let applyForLeaderOpeningFixture: ApplyForOpeningFixture
  tap.test('Apply for lead opening', async () => {
    applyForLeaderOpeningFixture = new ApplyForOpeningFixture(
      apiWrapper,
      leadKeyPair,
      sudo,
      applicationStake,
      roleStake,
      addLeaderOpeningFixture.getResult() as OpeningId,
      WorkingGroups.StorageWorkingGroup
    )
    await applyForLeaderOpeningFixture.runner(false)
  })

  let beginLeaderApplicationReviewFixture: BeginLeaderApplicationReviewFixture
  tap.test('Begin lead application review', async () => {
    beginLeaderApplicationReviewFixture = new BeginLeaderApplicationReviewFixture(
      apiWrapper,
      sudo,
      addLeaderOpeningFixture.getResult() as OpeningId,
      WorkingGroups.StorageWorkingGroup
    )
    await beginLeaderApplicationReviewFixture.runner(false)
  })

  let fillLeaderOpeningFixture: FillLeaderOpeningFixture
  tap.test('Fill lead opening', async () => {
    fillLeaderOpeningFixture = new FillLeaderOpeningFixture(
      apiWrapper,
      leadKeyPair,
      sudo,
      addLeaderOpeningFixture.getResult() as OpeningId,
      leaderFirstRewardInterval,
      leaderRewardInterval,
      payoutAmount,
      WorkingGroups.StorageWorkingGroup
    )
    await fillLeaderOpeningFixture.runner(false)
  })

  const workingGroupMintCapacityProposalFixture: WorkingGroupMintCapacityProposalFixture = new WorkingGroupMintCapacityProposalFixture(
    apiWrapper,
    m1KeyPairs,
    sudo,
    mintCapacity,
    WorkingGroups.StorageWorkingGroup
  )
  tap.test('Propose mint capacity', async () => workingGroupMintCapacityProposalFixture.runner(false))

  let voteForProposalFixture: VoteForProposalFixture
  const expectMintCapacityChanged: ExpectMintCapacityChangedFixture = new ExpectMintCapacityChangedFixture(
    apiWrapper,
    mintCapacity
  )
  tap.test('Approve mint capacity', async () => {
    voteForProposalFixture = new VoteForProposalFixture(
      apiWrapper,
      m2KeyPairs,
      sudo,
      workingGroupMintCapacityProposalFixture.getResult() as ProposalId
    )
    voteForProposalFixture.runner(false)
    await expectMintCapacityChanged.runner(false)
  })

  const addWorkerOpeningFixture: AddWorkerOpeningFixture = new AddWorkerOpeningFixture(
    apiWrapper,
    m1KeyPairs,
    leadKeyPair[0],
    sudo,
    applicationStake,
    roleStake,
    openingActivationDelay,
    unstakingPeriod,
    WorkingGroups.StorageWorkingGroup
  )
  tap.test('Add worker opening', async () => addWorkerOpeningFixture.runner(false))

  let applyForWorkerOpeningFixture: ApplyForOpeningFixture
  tap.test('First apply for worker opening', async () => {
    applyForWorkerOpeningFixture = new ApplyForOpeningFixture(
      apiWrapper,
      m1KeyPairs,
      sudo,
      applicationStake,
      roleStake,
      addWorkerOpeningFixture.getResult() as OpeningId,
      WorkingGroups.StorageWorkingGroup
    )
    await applyForWorkerOpeningFixture.runner(false)
  })

  let beginApplicationReviewFixture: BeginApplicationReviewFixture
  tap.test('Begin application review', async () => {
    beginApplicationReviewFixture = new BeginApplicationReviewFixture(
      apiWrapper,
      leadKeyPair[0],
      sudo,
      addWorkerOpeningFixture.getResult() as OpeningId,
      WorkingGroups.StorageWorkingGroup
    )
    await beginApplicationReviewFixture.runner(false)
  })

  let fillOpeningFixture: FillOpeningFixture
  tap.test('Fill worker opening', async () => {
    fillOpeningFixture = new FillOpeningFixture(
      apiWrapper,
      m1KeyPairs,
      leadKeyPair[0],
      sudo,
      addWorkerOpeningFixture.getResult() as OpeningId,
      firstRewardInterval,
      rewardInterval,
      payoutAmount,
      WorkingGroups.StorageWorkingGroup
    )
    await fillOpeningFixture.runner(false)
  })

  const awaitPayoutFixture: AwaitPayoutFixture = new AwaitPayoutFixture(
    apiWrapper,
    m1KeyPairs,
    WorkingGroups.StorageWorkingGroup
  )
  tap.test('Await worker payout', async () => awaitPayoutFixture.runner(false))

  const leaveRoleFixture: LeaveRoleFixture = new LeaveRoleFixture(
    apiWrapper,
    leadKeyPair,
    sudo,
    WorkingGroups.StorageWorkingGroup
  )
  tap.test('Leaving lead role', async () => leaveRoleFixture.runner(false))

  closeApi(apiWrapper)
})
