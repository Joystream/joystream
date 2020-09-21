import { initConfig } from '../../utils/config'
import { closeApi } from '../../utils/closeApi'
import { ApiWrapper, WorkingGroups } from '../../utils/apiWrapper'
import { WsProvider, Keyring } from '@polkadot/api'
import { KeyringPair } from '@polkadot/keyring/types'
import { setTestTimeout } from '../../utils/setTestTimeout'
import {
  AddLeaderOpeningFixture,
  ApplyForOpeningFixture,
  BeginLeaderApplicationReviewFixture,
  FillLeaderOpeningFixture,
  AddWorkerOpeningFixture,
  BeginApplicationReviewFixture,
  FillOpeningFixture,
  LeaveRoleFixture,
  DecreaseStakeFixture,
  SlashFixture,
  TerminateRoleFixture,
} from '../fixtures/workingGroupModule'
import { Utils } from '../../utils/utils'
import BN from 'bn.js'
import tap from 'tap'
import { PaidTermId } from '@alexandria/types/members'
import { OpeningId } from '@alexandria/types/hiring'
import { DbService } from '../../services/dbService'
import { LeaderHiringHappyCaseFixture } from '../fixtures/leaderHiringHappyCase'

tap.mocha.describe('Manage worker as lead scenario', async () => {
  initConfig()

  const nodeUrl: string = process.env.NODE_URL!
  const sudoUri: string = process.env.SUDO_ACCOUNT_URI!
  const keyring = new Keyring({ type: 'sr25519' })
  const db: DbService = DbService.getInstance()

  const provider = new WsProvider(nodeUrl)
  const apiWrapper: ApiWrapper = await ApiWrapper.create(provider)
  const sudo: KeyringPair = keyring.addFromUri(sudoUri)

  const N: number = +process.env.WORKING_GROUP_N!
  let nKeyPairs: KeyringPair[] = Utils.createKeyPairs(keyring, N)
  const leadKeyPair: KeyringPair[] = Utils.createKeyPairs(keyring, 1)

  const paidTerms: PaidTermId = apiWrapper.createPaidTermId(new BN(+process.env.MEMBERSHIP_PAID_TERMS!))
  const applicationStake: BN = new BN(process.env.WORKING_GROUP_APPLICATION_STAKE!)
  const roleStake: BN = new BN(process.env.WORKING_GROUP_ROLE_STAKE!)
  const firstRewardInterval: BN = new BN(process.env.LONG_REWARD_INTERVAL!)
  const rewardInterval: BN = new BN(process.env.LONG_REWARD_INTERVAL!)
  const payoutAmount: BN = new BN(process.env.PAYOUT_AMOUNT!)
  const unstakingPeriod: BN = new BN(process.env.STORAGE_WORKING_GROUP_UNSTAKING_PERIOD!)
  const durationInBlocks = 60
  const openingActivationDelay: BN = new BN(0)

  setTestTimeout(apiWrapper, durationInBlocks)

  if (db.hasLeader(apiWrapper.getWorkingGroupString(WorkingGroups.StorageWorkingGroup))) {
    nKeyPairs = db.getMembers()
    leadKeyPair[0] = db.getLeader(apiWrapper.getWorkingGroupString(WorkingGroups.StorageWorkingGroup))
  } else {
    const leaderHiringHappyCaseFixture: LeaderHiringHappyCaseFixture = new LeaderHiringHappyCaseFixture(
      apiWrapper,
      sudo,
      nKeyPairs,
      leadKeyPair,
      paidTerms,
      applicationStake,
      roleStake,
      openingActivationDelay,
      rewardInterval,
      firstRewardInterval,
      payoutAmount,
      WorkingGroups.StorageWorkingGroup
    )
    await leaderHiringHappyCaseFixture.runner(false)
  }

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
  tap.test('Add worker opening', async () => await addWorkerOpeningFixture.runner(false))

  let applyForWorkerOpeningFixture: ApplyForOpeningFixture
  tap.test('First apply for worker opening', async () => {
    applyForWorkerOpeningFixture = new ApplyForOpeningFixture(
      apiWrapper,
      nKeyPairs,
      sudo,
      applicationStake,
      roleStake,
      addWorkerOpeningFixture.getCreatedOpeningId() as OpeningId,
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
      addWorkerOpeningFixture.getCreatedOpeningId() as OpeningId,
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
      addWorkerOpeningFixture.getCreatedOpeningId() as OpeningId,
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
  tap.test('Leaving lead role', async () => await leaveRoleFixture.runner(false))

  const decreaseStakeFailureFixture: DecreaseStakeFixture = new DecreaseStakeFixture(
    apiWrapper,
    nKeyPairs,
    leadKeyPair[0],
    sudo,
    WorkingGroups.StorageWorkingGroup
  )
  tap.test('Decrease worker stake, expect failure', async () => await decreaseStakeFailureFixture.runner(true))

  const addNewLeaderOpeningFixture: AddLeaderOpeningFixture = new AddLeaderOpeningFixture(
    apiWrapper,
    nKeyPairs,
    sudo,
    applicationStake,
    roleStake,
    openingActivationDelay,
    WorkingGroups.StorageWorkingGroup
  )
  tap.test('Add lead opening', async () => await addNewLeaderOpeningFixture.runner(false))

  let applyForNewLeaderOpeningFixture: ApplyForOpeningFixture
  tap.test('Apply for lead opening', async () => {
    applyForNewLeaderOpeningFixture = new ApplyForOpeningFixture(
      apiWrapper,
      leadKeyPair,
      sudo,
      applicationStake,
      roleStake,
      addNewLeaderOpeningFixture.getCreatedOpeningId() as OpeningId,
      WorkingGroups.StorageWorkingGroup
    )
    await applyForNewLeaderOpeningFixture.runner(false)
  })

  let beginNewLeaderApplicationReviewFixture: BeginLeaderApplicationReviewFixture
  tap.test('Begin lead application review', async () => {
    beginNewLeaderApplicationReviewFixture = new BeginLeaderApplicationReviewFixture(
      apiWrapper,
      sudo,
      addNewLeaderOpeningFixture.getCreatedOpeningId() as OpeningId,
      WorkingGroups.StorageWorkingGroup
    )
    await beginNewLeaderApplicationReviewFixture.runner(false)
  })

  let fillNewLeaderOpeningFixture: FillLeaderOpeningFixture
  tap.test('Fill lead opening', async () => {
    fillNewLeaderOpeningFixture = new FillLeaderOpeningFixture(
      apiWrapper,
      leadKeyPair,
      sudo,
      addNewLeaderOpeningFixture.getCreatedOpeningId() as OpeningId,
      firstRewardInterval,
      rewardInterval,
      payoutAmount,
      WorkingGroups.StorageWorkingGroup
    )
    await fillNewLeaderOpeningFixture.runner(false)
  })

  const decreaseStakeFixture: DecreaseStakeFixture = new DecreaseStakeFixture(
    apiWrapper,
    nKeyPairs,
    leadKeyPair[0],
    sudo,
    WorkingGroups.StorageWorkingGroup
  )
  tap.test('Decrease worker stake', async () => await decreaseStakeFixture.runner(false))

  const slashFixture: SlashFixture = new SlashFixture(
    apiWrapper,
    nKeyPairs,
    leadKeyPair[0],
    sudo,
    WorkingGroups.StorageWorkingGroup
  )
  tap.test('Slash worker', async () => await slashFixture.runner(false))

  const terminateRoleFixture: TerminateRoleFixture = new TerminateRoleFixture(
    apiWrapper,
    nKeyPairs,
    leadKeyPair[0],
    sudo,
    WorkingGroups.StorageWorkingGroup
  )
  tap.test('Terminate worker role', async () => await terminateRoleFixture.runner(false))

  if (!db.hasLeader(apiWrapper.getWorkingGroupString(WorkingGroups.StorageWorkingGroup))) {
    const leaveRoleFixture: LeaveRoleFixture = new LeaveRoleFixture(
      apiWrapper,
      leadKeyPair,
      sudo,
      WorkingGroups.StorageWorkingGroup
    )
    tap.test('Leaving lead role', async () => await leaveRoleFixture.runner(false))
  }

  closeApi(apiWrapper)
})
