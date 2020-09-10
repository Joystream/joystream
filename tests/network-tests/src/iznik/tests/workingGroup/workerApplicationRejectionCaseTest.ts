import { initConfig } from '../../utils/config'
import { closeApi } from '../../utils/closeApi'
import { ApiWrapper, WorkingGroups } from '../../utils/apiWrapper'
import { WsProvider, Keyring } from '@polkadot/api'
import { KeyringPair } from '@polkadot/keyring/types'
import { setTestTimeout } from '../../utils/setTestTimeout'
import BN from 'bn.js'
import tap from 'tap'
import { Utils } from '../../utils/utils'
import {
  AcceptApplicationsFixture,
  AddWorkerOpeningFixture,
  ApplyForOpeningFixture,
  LeaveRoleFixture,
  TerminateApplicationsFixture,
} from '../fixtures/workingGroupModule'
import { PaidTermId } from '@alexandria/types/members'
import { OpeningId } from '@alexandria/types/hiring'
import { DbService } from '../../services/dbService'
import { LeaderHiringHappyCaseFixture } from '../fixtures/leaderHiringHappyCase'

tap.mocha.describe('Worker application rejection case scenario', async () => {
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
  const nonMemberKeyPairs = Utils.createKeyPairs(keyring, N)

  const paidTerms: PaidTermId = apiWrapper.createPaidTermId(new BN(+process.env.MEMBERSHIP_PAID_TERMS!))
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
      leadOpeningActivationDelay,
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

  let applyForWorkerOpeningBeforeAcceptanceFixture: ApplyForOpeningFixture
  tap.test('Apply for worker opening, expect failure', async () => {
    applyForWorkerOpeningBeforeAcceptanceFixture = new ApplyForOpeningFixture(
      apiWrapper,
      nKeyPairs,
      sudo,
      applicationStake,
      roleStake,
      addWorkerOpeningFixture.getCreatedOpeningId() as OpeningId,
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
      addWorkerOpeningFixture.getCreatedOpeningId() as OpeningId,
      WorkingGroups.StorageWorkingGroup
    )
    await acceptApplicationsFixture.runner(false)
  })

  let applyForWorkerOpeningAsNonMemberFixture: ApplyForOpeningFixture
  tap.test('Apply for worker opening as non-member, expect failure', async () => {
    applyForWorkerOpeningAsNonMemberFixture = new ApplyForOpeningFixture(
      apiWrapper,
      nonMemberKeyPairs,
      sudo,
      applicationStake,
      roleStake,
      addWorkerOpeningFixture.getCreatedOpeningId() as OpeningId,
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
      addWorkerOpeningFixture.getCreatedOpeningId() as OpeningId,
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
  tap.test('Terminate worker applicaitons', async () => await terminateApplicationsFixture.runner(false))

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
