import { Api, WorkingGroups } from '../../Api'
import { Keyring } from '@polkadot/api'
import { KeyringPair } from '@polkadot/keyring/types'
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
} from '../../fixtures/workingGroupModule'
import { Utils } from '../../utils'
import BN from 'bn.js'
import { PaidTermId } from '@joystream/types/members'
import { OpeningId } from '@joystream/types/hiring'
import { DbService } from '../../DbService'
import { LeaderHiringHappyCaseFixture } from '../../fixtures/leaderHiringHappyCase'

// Manage worker as lead scenario
export default async function manageWorker(api: Api, env: NodeJS.ProcessEnv, db: DbService) {
  const sudoUri: string = env.SUDO_ACCOUNT_URI!
  const keyring = new Keyring({ type: 'sr25519' })
  const sudo: KeyringPair = keyring.addFromUri(sudoUri)

  const N: number = +env.WORKING_GROUP_N!
  let nKeyPairs: KeyringPair[] = Utils.createKeyPairs(keyring, N)
  const leadKeyPair: KeyringPair[] = Utils.createKeyPairs(keyring, 1)

  const paidTerms: PaidTermId = api.createPaidTermId(new BN(+env.MEMBERSHIP_PAID_TERMS!))
  const applicationStake: BN = new BN(env.WORKING_GROUP_APPLICATION_STAKE!)
  const roleStake: BN = new BN(env.WORKING_GROUP_ROLE_STAKE!)
  const firstRewardInterval: BN = new BN(env.LONG_REWARD_INTERVAL!)
  const rewardInterval: BN = new BN(env.LONG_REWARD_INTERVAL!)
  const payoutAmount: BN = new BN(env.PAYOUT_AMOUNT!)
  const unstakingPeriod: BN = new BN(env.STORAGE_WORKING_GROUP_UNSTAKING_PERIOD!)
  const openingActivationDelay: BN = new BN(0)

  // const durationInBlocks = 60
  // setTestTimeout(api, durationInBlocks)

  if (db.hasLeader(api.getWorkingGroupString(WorkingGroups.StorageWorkingGroup))) {
    nKeyPairs = db.getMembers()
    leadKeyPair[0] = db.getLeader(api.getWorkingGroupString(WorkingGroups.StorageWorkingGroup))
  } else {
    const leaderHiringHappyCaseFixture: LeaderHiringHappyCaseFixture = new LeaderHiringHappyCaseFixture(
      api,
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
    api,
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

  let applyForWorkerOpeningFixture: ApplyForOpeningFixture
  // First apply for worker opening
  await (async () => {
    applyForWorkerOpeningFixture = new ApplyForOpeningFixture(
      api,
      nKeyPairs,
      sudo,
      applicationStake,
      roleStake,
      addWorkerOpeningFixture.getCreatedOpeningId() as OpeningId,
      WorkingGroups.StorageWorkingGroup
    )
    await applyForWorkerOpeningFixture.runner(false)
  })()

  let beginApplicationReviewFixture: BeginApplicationReviewFixture
  // Begin application review
  await (async () => {
    beginApplicationReviewFixture = new BeginApplicationReviewFixture(
      api,
      leadKeyPair[0],
      sudo,
      addWorkerOpeningFixture.getCreatedOpeningId() as OpeningId,
      WorkingGroups.StorageWorkingGroup
    )
    await beginApplicationReviewFixture.runner(false)
  })()

  let fillOpeningFixture: FillOpeningFixture
  // Fill worker opening
  await (async () => {
    fillOpeningFixture = new FillOpeningFixture(
      api,
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
  })()

  const leaveRoleFixture: LeaveRoleFixture = new LeaveRoleFixture(
    api,
    leadKeyPair,
    sudo,
    WorkingGroups.StorageWorkingGroup
  )
  // Leaving lead role
  await leaveRoleFixture.runner(false)

  const decreaseStakeFailureFixture: DecreaseStakeFixture = new DecreaseStakeFixture(
    api,
    nKeyPairs,
    leadKeyPair[0],
    sudo,
    WorkingGroups.StorageWorkingGroup
  )
  // Decrease worker stake, expect failure
  await decreaseStakeFailureFixture.runner(true)

  const addNewLeaderOpeningFixture: AddLeaderOpeningFixture = new AddLeaderOpeningFixture(
    api,
    nKeyPairs,
    sudo,
    applicationStake,
    roleStake,
    openingActivationDelay,
    WorkingGroups.StorageWorkingGroup
  )
  // Add lead opening
  await addNewLeaderOpeningFixture.runner(false)

  let applyForNewLeaderOpeningFixture: ApplyForOpeningFixture
  // Apply for lead opening
  await (async () => {
    applyForNewLeaderOpeningFixture = new ApplyForOpeningFixture(
      api,
      leadKeyPair,
      sudo,
      applicationStake,
      roleStake,
      addNewLeaderOpeningFixture.getCreatedOpeningId() as OpeningId,
      WorkingGroups.StorageWorkingGroup
    )
    await applyForNewLeaderOpeningFixture.runner(false)
  })()

  let beginNewLeaderApplicationReviewFixture: BeginLeaderApplicationReviewFixture
  // Begin lead application review
  await (async () => {
    beginNewLeaderApplicationReviewFixture = new BeginLeaderApplicationReviewFixture(
      api,
      sudo,
      addNewLeaderOpeningFixture.getCreatedOpeningId() as OpeningId,
      WorkingGroups.StorageWorkingGroup
    )
    await beginNewLeaderApplicationReviewFixture.runner(false)
  })()

  let fillNewLeaderOpeningFixture: FillLeaderOpeningFixture
  // Fill lead opening
  await (async () => {
    fillNewLeaderOpeningFixture = new FillLeaderOpeningFixture(
      api,
      leadKeyPair,
      sudo,
      addNewLeaderOpeningFixture.getCreatedOpeningId() as OpeningId,
      firstRewardInterval,
      rewardInterval,
      payoutAmount,
      WorkingGroups.StorageWorkingGroup
    )
    await fillNewLeaderOpeningFixture.runner(false)
  })()

  const decreaseStakeFixture: DecreaseStakeFixture = new DecreaseStakeFixture(
    api,
    nKeyPairs,
    leadKeyPair[0],
    sudo,
    WorkingGroups.StorageWorkingGroup
  )
  // Decrease worker stake
  await decreaseStakeFixture.runner(false)

  const slashFixture: SlashFixture = new SlashFixture(
    api,
    nKeyPairs,
    leadKeyPair[0],
    sudo,
    WorkingGroups.StorageWorkingGroup
  )
  // Slash worker
  await slashFixture.runner(false)

  const terminateRoleFixture: TerminateRoleFixture = new TerminateRoleFixture(
    api,
    nKeyPairs,
    leadKeyPair[0],
    sudo,
    WorkingGroups.StorageWorkingGroup
  )
  // Terminate worker role
  await terminateRoleFixture.runner(false)

  if (!db.hasLeader(api.getWorkingGroupString(WorkingGroups.StorageWorkingGroup))) {
    const leaveRoleFixture: LeaveRoleFixture = new LeaveRoleFixture(
      api,
      leadKeyPair,
      sudo,
      WorkingGroups.StorageWorkingGroup
    )
    // Leaving lead role
    await leaveRoleFixture.runner(false)
  }
}
