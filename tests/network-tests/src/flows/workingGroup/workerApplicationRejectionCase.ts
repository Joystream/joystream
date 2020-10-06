import { ApiWrapper, WorkingGroups } from '../../utils/apiWrapper'
import { Keyring } from '@polkadot/api'
import { KeyringPair } from '@polkadot/keyring/types'
import BN from 'bn.js'
import { Utils } from '../../utils/utils'
import {
  AcceptApplicationsFixture,
  AddWorkerOpeningFixture,
  ApplyForOpeningFixture,
  LeaveRoleFixture,
  TerminateApplicationsFixture,
} from '../../fixtures/workingGroupModule'
import { PaidTermId } from '@joystream/types/members'
import { OpeningId } from '@joystream/types/hiring'
import { DbService } from '../../services/dbService'
import { LeaderHiringHappyCaseFixture } from '../../fixtures/leaderHiringHappyCase'

// Worker application rejection case scenario
export default async function workerApplicationRejection(
  apiWrapper: ApiWrapper,
  env: NodeJS.ProcessEnv,
  db: DbService
) {
  const sudoUri: string = env.SUDO_ACCOUNT_URI!
  const keyring = new Keyring({ type: 'sr25519' })
  const sudo: KeyringPair = keyring.addFromUri(sudoUri)

  const N: number = +env.WORKING_GROUP_N!
  let nKeyPairs: KeyringPair[] = Utils.createKeyPairs(keyring, N)
  const leadKeyPair: KeyringPair[] = Utils.createKeyPairs(keyring, 1)
  const nonMemberKeyPairs = Utils.createKeyPairs(keyring, N)

  const paidTerms: PaidTermId = apiWrapper.createPaidTermId(new BN(+env.MEMBERSHIP_PAID_TERMS!))
  const applicationStake: BN = new BN(env.WORKING_GROUP_APPLICATION_STAKE!)
  const roleStake: BN = new BN(env.WORKING_GROUP_ROLE_STAKE!)
  const firstRewardInterval: BN = new BN(env.LONG_REWARD_INTERVAL!)
  const rewardInterval: BN = new BN(env.LONG_REWARD_INTERVAL!)
  const payoutAmount: BN = new BN(env.PAYOUT_AMOUNT!)
  const unstakingPeriod: BN = new BN(env.STORAGE_WORKING_GROUP_UNSTAKING_PERIOD!)
  const openingActivationDelay: BN = new BN(100)
  const leadOpeningActivationDelay: BN = new BN(0)

  // const durationInBlocks = 38
  // setTestTimeout(apiWrapper, durationInBlocks)

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
  // Add worker opening
  await addWorkerOpeningFixture.runner(false)

  let applyForWorkerOpeningBeforeAcceptanceFixture: ApplyForOpeningFixture
  // Apply for worker opening, expect failure
  await (async () => {
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
  })()

  let acceptApplicationsFixture: AcceptApplicationsFixture
  // Begin accepting worker applications
  await (async () => {
    acceptApplicationsFixture = new AcceptApplicationsFixture(
      apiWrapper,
      leadKeyPair[0],
      sudo,
      addWorkerOpeningFixture.getCreatedOpeningId() as OpeningId,
      WorkingGroups.StorageWorkingGroup
    )
    await acceptApplicationsFixture.runner(false)
  })()

  let applyForWorkerOpeningAsNonMemberFixture: ApplyForOpeningFixture
  // Apply for worker opening as non-member, expect failure
  await (async () => {
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
  })()

  let applyForWorkerOpeningFixture: ApplyForOpeningFixture
  // Apply for worker opening
  await (async () => {
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
  })()

  const terminateApplicationsFixture: TerminateApplicationsFixture = new TerminateApplicationsFixture(
    apiWrapper,
    nKeyPairs,
    leadKeyPair[0],
    sudo,
    WorkingGroups.StorageWorkingGroup
  )
  // Terminate worker applicaitons
  await terminateApplicationsFixture.runner(false)

  if (!db.hasLeader(apiWrapper.getWorkingGroupString(WorkingGroups.StorageWorkingGroup))) {
    const leaveRoleFixture: LeaveRoleFixture = new LeaveRoleFixture(
      apiWrapper,
      leadKeyPair,
      sudo,
      WorkingGroups.StorageWorkingGroup
    )
    // Leaving lead role
    await leaveRoleFixture.runner(false)
  }
}
