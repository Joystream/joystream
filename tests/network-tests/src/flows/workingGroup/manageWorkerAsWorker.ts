import { ApiWrapper, WorkingGroups } from '../../utils/apiWrapper'
import { Keyring } from '@polkadot/api'
import { KeyringPair } from '@polkadot/keyring/types'
import {
  AddWorkerOpeningFixture,
  ApplyForOpeningFixture,
  BeginApplicationReviewFixture,
  FillOpeningFixture,
  IncreaseStakeFixture,
  LeaveRoleFixture,
  UpdateRewardAccountFixture,
} from '../../fixtures/workingGroupModule'
import { Utils } from '../../utils/utils'
import BN from 'bn.js'
import { PaidTermId } from '@joystream/types/members'
import { OpeningId } from '@joystream/types/hiring'
import { DbService } from '../../services/dbService'
import { LeaderHiringHappyCaseFixture } from '../../fixtures/leaderHiringHappyCase'

// Manage worker as worker
export default async function manageWorkerAsWorker(apiWrapper: ApiWrapper, env: NodeJS.ProcessEnv, db: DbService) {
  const sudoUri: string = env.SUDO_ACCOUNT_URI!
  const keyring = new Keyring({ type: 'sr25519' })
  const sudo: KeyringPair = keyring.addFromUri(sudoUri)

  const N: number = +env.WORKING_GROUP_N!
  let nKeyPairs: KeyringPair[] = Utils.createKeyPairs(keyring, N)
  const leadKeyPair: KeyringPair[] = Utils.createKeyPairs(keyring, 1)

  const paidTerms: PaidTermId = apiWrapper.createPaidTermId(new BN(+env.MEMBERSHIP_PAID_TERMS!))
  const applicationStake: BN = new BN(env.WORKING_GROUP_APPLICATION_STAKE!)
  const roleStake: BN = new BN(env.WORKING_GROUP_ROLE_STAKE!)
  const firstRewardInterval: BN = new BN(env.LONG_REWARD_INTERVAL!)
  const rewardInterval: BN = new BN(env.LONG_REWARD_INTERVAL!)
  const payoutAmount: BN = new BN(env.PAYOUT_AMOUNT!)
  const unstakingPeriod: BN = new BN(env.STORAGE_WORKING_GROUP_UNSTAKING_PERIOD!)
  const openingActivationDelay: BN = new BN(0)

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
  // Add worker opening
  await addWorkerOpeningFixture.runner(false)

  let applyForWorkerOpeningFixture: ApplyForOpeningFixture
  // First apply for worker opening
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

  let beginApplicationReviewFixture: BeginApplicationReviewFixture
  // Begin application review
  await (async () => {
    beginApplicationReviewFixture = new BeginApplicationReviewFixture(
      apiWrapper,
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
  })()

  const increaseStakeFixture: IncreaseStakeFixture = new IncreaseStakeFixture(
    apiWrapper,
    nKeyPairs,
    sudo,
    WorkingGroups.StorageWorkingGroup
  )
  // Increase worker stake
  await increaseStakeFixture.runner(false)

  const updateRewardAccountFixture: UpdateRewardAccountFixture = new UpdateRewardAccountFixture(
    apiWrapper,
    nKeyPairs,
    keyring,
    sudo,
    WorkingGroups.StorageWorkingGroup
  )
  // Update reward account
  await updateRewardAccountFixture.runner(false)

  const updateRoleAccountFixture: UpdateRewardAccountFixture = new UpdateRewardAccountFixture(
    apiWrapper,
    nKeyPairs,
    keyring,
    sudo,
    WorkingGroups.StorageWorkingGroup
  )
  // Update role account
  await updateRoleAccountFixture.runner(false)

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
