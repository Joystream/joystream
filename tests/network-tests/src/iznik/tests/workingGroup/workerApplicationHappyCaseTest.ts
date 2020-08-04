import { initConfig } from '../../utils/config'
import { registerJoystreamTypes } from '@nicaea/types'
import { closeApi } from '../../utils/closeApi'
import { ApiWrapper, WorkingGroups } from '../../utils/apiWrapper'
import { WsProvider, Keyring } from '@polkadot/api'
import { KeyringPair } from '@polkadot/keyring/types'
import { setTestTimeout } from '../../utils/setTestTimeout'
import BN from 'bn.js'
import tap from 'tap'
import { BuyMembershipHappyCaseFixture } from '../fixtures/membershipModule'
import { Utils } from '../../utils/utils'
import {
  AddLeaderOpeningFixture,
  AddWorkerOpeningFixture,
  ApplyForOpeningFixture,
  BeginApplicationReviewFixture,
  BeginLeaderApplicationReviewFixture,
  FillLeaderOpeningFixture,
  FillOpeningFixture,
  LeaveRoleFixture,
  WithdrawApplicationFixture,
} from '../fixtures/workingGroupModule'
import { PaidTermId } from '@nicaea/types/members'
import { OpeningId } from '@nicaea/types/hiring'

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
  const nKeyPairs: KeyringPair[] = Utils.createKeyPairs(keyring, N)
  const leadKeyPair: KeyringPair[] = Utils.createKeyPairs(keyring, 1)

  const paidTerms: PaidTermId = new PaidTermId(+process.env.MEMBERSHIP_PAID_TERMS!)
  const applicationStake: BN = new BN(process.env.WORKING_GROUP_APPLICATION_STAKE!)
  const roleStake: BN = new BN(process.env.WORKING_GROUP_ROLE_STAKE!)
  const firstRewardInterval: BN = new BN(process.env.LONG_REWARD_INTERVAL!)
  const rewardInterval: BN = new BN(process.env.LONG_REWARD_INTERVAL!)
  const payoutAmount: BN = new BN(process.env.PAYOUT_AMOUNT!)
  const unstakingPeriod: BN = new BN(process.env.STORAGE_WORKING_GROUP_UNSTAKING_PERIOD!)
  const durationInBlocks = 48
  const openingActivationDelay: BN = new BN(0)

  setTestTimeout(apiWrapper, durationInBlocks)

  const happyCaseFixture: BuyMembershipHappyCaseFixture = new BuyMembershipHappyCaseFixture(
    apiWrapper,
    sudo,
    nKeyPairs,
    paidTerms
  )
  tap.test('Creating a set of members', async () => happyCaseFixture.runner(false))

  const leaderHappyCaseFixture: BuyMembershipHappyCaseFixture = new BuyMembershipHappyCaseFixture(
    apiWrapper,
    sudo,
    leadKeyPair,
    paidTerms
  )
  tap.test('Buying membership for leader account', async () => leaderHappyCaseFixture.runner(false))

  const addLeaderOpeningFixture: AddLeaderOpeningFixture = new AddLeaderOpeningFixture(
    apiWrapper,
    nKeyPairs,
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
      firstRewardInterval,
      rewardInterval,
      payoutAmount,
      WorkingGroups.StorageWorkingGroup
    )
    await fillLeaderOpeningFixture.runner(false)
  })

  const addWorkerOpeningFixture: AddWorkerOpeningFixture = new AddWorkerOpeningFixture(
    apiWrapper,
    nKeyPairs,
    leadKeyPair[0],
    sudo,
    applicationStake,
    roleStake,
    openingActivationDelay,
    unstakingPeriod,
    WorkingGroups.StorageWorkingGroup
  )
  tap.test('Add worker opening', async () => addWorkerOpeningFixture.runner(false))

  let firstApplyForWorkerOpeningFixture: ApplyForOpeningFixture
  tap.test('First apply for worker opening', async () => {
    firstApplyForWorkerOpeningFixture = new ApplyForOpeningFixture(
      apiWrapper,
      nKeyPairs,
      sudo,
      applicationStake,
      roleStake,
      addWorkerOpeningFixture.getResult() as OpeningId,
      WorkingGroups.StorageWorkingGroup
    )
    await firstApplyForWorkerOpeningFixture.runner(false)
  })

  const withdrawApplicationFixture: WithdrawApplicationFixture = new WithdrawApplicationFixture(
    apiWrapper,
    nKeyPairs,
    sudo,
    WorkingGroups.StorageWorkingGroup
  )
  tap.test('Withdraw worker application', async () => withdrawApplicationFixture.runner(false))

  let secondApplyForWorkerOpeningFixture: ApplyForOpeningFixture
  tap.test('Second apply for worker opening', async () => {
    secondApplyForWorkerOpeningFixture = new ApplyForOpeningFixture(
      apiWrapper,
      nKeyPairs,
      sudo,
      applicationStake,
      roleStake,
      addWorkerOpeningFixture.getResult() as OpeningId,
      WorkingGroups.StorageWorkingGroup
    )
    await secondApplyForWorkerOpeningFixture.runner(false)
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
      nKeyPairs,
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

  const leaveRoleFixture: LeaveRoleFixture = new LeaveRoleFixture(
    apiWrapper,
    leadKeyPair,
    sudo,
    WorkingGroups.StorageWorkingGroup
  )
  tap.test('Leaving lead role', async () => leaveRoleFixture.runner(false))

  closeApi(apiWrapper)
})
