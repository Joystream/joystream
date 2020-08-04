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
  AcceptApplicationsFixture,
  AddLeaderOpeningFixture,
  AddWorkerOpeningFixture,
  ApplyForOpeningFixture,
  BeginLeaderApplicationReviewFixture,
  FillLeaderOpeningFixture,
  LeaveRoleFixture,
  TerminateApplicationsFixture,
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
  const nonMemberKeyPairs = Utils.createKeyPairs(keyring, N)

  const paidTerms: PaidTermId = new PaidTermId(+process.env.MEMBERSHIP_PAID_TERMS!)
  const applicationStake: BN = new BN(process.env.WORKING_GROUP_APPLICATION_STAKE!)
  const roleStake: BN = new BN(process.env.WORKING_GROUP_ROLE_STAKE!)
  const firstRewardInterval: BN = new BN(process.env.LONG_REWARD_INTERVAL!)
  const rewardInterval: BN = new BN(process.env.LONG_REWARD_INTERVAL!)
  const payoutAmount: BN = new BN(process.env.PAYOUT_AMOUNT!)
  const unstakingPeriod: BN = new BN(process.env.STORAGE_WORKING_GROUP_UNSTAKING_PERIOD!)
  const durationInBlocks = 38
  const openingActivationDelay: BN = new BN(100)
  const leadOpeningActivationDelay: BN = new BN(0)

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
    leadOpeningActivationDelay,
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

  let applyForWorkerOpeningBeforeAcceptanceFixture: ApplyForOpeningFixture
  tap.test('Apply for worker opening, expect failure', async () => {
    applyForWorkerOpeningBeforeAcceptanceFixture = new ApplyForOpeningFixture(
      apiWrapper,
      nKeyPairs,
      sudo,
      applicationStake,
      roleStake,
      addWorkerOpeningFixture.getResult() as OpeningId,
      WorkingGroups.StorageWorkingGroup
    )
    await applyForWorkerOpeningBeforeAcceptanceFixture.runner(true)
  })

  let acceptApplicationsFixture: AcceptApplicationsFixture
  tap.test('Begin accepting worker applications', async () => {
    acceptApplicationsFixture = new AcceptApplicationsFixture(
      apiWrapper,
      leadKeyPair[0],
      sudo,
      addWorkerOpeningFixture.getResult() as OpeningId,
      WorkingGroups.StorageWorkingGroup
    )
    acceptApplicationsFixture.runner(false)
  })

  let applyForWorkerOpeningAsNonMemberFixture: ApplyForOpeningFixture
  tap.test('Apply for worker opening as non-member, expect failure', async () => {
    applyForWorkerOpeningAsNonMemberFixture = new ApplyForOpeningFixture(
      apiWrapper,
      nonMemberKeyPairs,
      sudo,
      applicationStake,
      roleStake,
      addWorkerOpeningFixture.getResult() as OpeningId,
      WorkingGroups.StorageWorkingGroup
    )
    await applyForWorkerOpeningAsNonMemberFixture.runner(true)
  })

  let applyForWorkerOpeningFixture: ApplyForOpeningFixture
  tap.test('Apply for worker opening', async () => {
    applyForWorkerOpeningFixture = new ApplyForOpeningFixture(
      apiWrapper,
      nKeyPairs,
      sudo,
      applicationStake,
      roleStake,
      addWorkerOpeningFixture.getResult() as OpeningId,
      WorkingGroups.StorageWorkingGroup
    )
    await applyForWorkerOpeningFixture.runner(false)
  })

  const terminateApplicationsFixture: TerminateApplicationsFixture = new TerminateApplicationsFixture(
    apiWrapper,
    nKeyPairs,
    leadKeyPair[0],
    sudo,
    WorkingGroups.StorageWorkingGroup
  )
  tap.test('Terminate worker applicaitons', async () => terminateApplicationsFixture.runner(false))

  const leaveRoleFixture: LeaveRoleFixture = new LeaveRoleFixture(
    apiWrapper,
    leadKeyPair,
    sudo,
    WorkingGroups.StorageWorkingGroup
  )
  tap.test('Leaving lead role', async () => leaveRoleFixture.runner(false))

  closeApi(apiWrapper)
})
