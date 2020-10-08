import { Api, WorkingGroups } from '../../Api'
import { Keyring } from '@polkadot/api'
import { KeyringPair } from '@polkadot/keyring/types'
import {
  AddWorkerOpeningFixture,
  ApplyForOpeningFixture,
  BeginApplicationReviewFixture,
  FillOpeningFixture,
  IncreaseStakeFixture,
  UpdateRewardAccountFixture,
} from '../../fixtures/workingGroupModule'
import { Utils } from '../../utils'
import BN from 'bn.js'
import { OpeningId } from '@joystream/types/hiring'
import { DbService } from '../../DbService'
import { assert } from 'chai'

// Manage worker as worker
export default async function manageWorkerAsWorker(
  api: Api,
  env: NodeJS.ProcessEnv,
  db: DbService,
  group: WorkingGroups
) {
  const sudoUri: string = env.SUDO_ACCOUNT_URI!
  const keyring = new Keyring({ type: 'sr25519' })
  const sudo: KeyringPair = keyring.addFromUri(sudoUri)

  const leadKeyPair: KeyringPair[] = Utils.createKeyPairs(keyring, 1)
  const applicationStake: BN = new BN(env.WORKING_GROUP_APPLICATION_STAKE!)
  const roleStake: BN = new BN(env.WORKING_GROUP_ROLE_STAKE!)
  const firstRewardInterval: BN = new BN(env.LONG_REWARD_INTERVAL!)
  const rewardInterval: BN = new BN(env.LONG_REWARD_INTERVAL!)
  const payoutAmount: BN = new BN(env.PAYOUT_AMOUNT!)
  const unstakingPeriod: BN = new BN(env.STORAGE_WORKING_GROUP_UNSTAKING_PERIOD!)
  const openingActivationDelay: BN = new BN(0)

  assert(db.hasLeader(api.getWorkingGroupString(group)))
  const nKeyPairs = db.getMembers()
  leadKeyPair[0] = db.getLeader(api.getWorkingGroupString(group))

  const addWorkerOpeningFixture: AddWorkerOpeningFixture = new AddWorkerOpeningFixture(
    api,
    nKeyPairs,
    leadKeyPair[0],
    sudo,
    applicationStake,
    roleStake,
    openingActivationDelay,
    unstakingPeriod,
    group
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
      group
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
      group
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
      group
    )
    await fillOpeningFixture.runner(false)
  })()

  const increaseStakeFixture: IncreaseStakeFixture = new IncreaseStakeFixture(api, nKeyPairs, sudo, group)
  // Increase worker stake
  await increaseStakeFixture.runner(false)

  const updateRewardAccountFixture: UpdateRewardAccountFixture = new UpdateRewardAccountFixture(
    api,
    nKeyPairs,
    keyring,
    sudo,
    group
  )
  // Update reward account
  await updateRewardAccountFixture.runner(false)

  const updateRoleAccountFixture: UpdateRewardAccountFixture = new UpdateRewardAccountFixture(
    api,
    nKeyPairs,
    keyring,
    sudo,
    group
  )
  // Update role account
  await updateRoleAccountFixture.runner(false)
}
