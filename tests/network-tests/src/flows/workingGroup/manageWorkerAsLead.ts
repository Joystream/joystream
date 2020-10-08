import { Api, WorkingGroups } from '../../Api'
import { Keyring } from '@polkadot/api'
import { KeyringPair } from '@polkadot/keyring/types'
import {
  ApplyForOpeningFixture,
  AddWorkerOpeningFixture,
  BeginApplicationReviewFixture,
  FillOpeningFixture,
  DecreaseStakeFixture,
  SlashFixture,
  TerminateRoleFixture,
} from '../../fixtures/workingGroupModule'
import { Utils } from '../../utils'
import BN from 'bn.js'
import { OpeningId } from '@joystream/types/hiring'
import { DbService } from '../../DbService'
import { assert } from 'chai'

// Manage worker as lead scenario
export default async function manageWorker(api: Api, env: NodeJS.ProcessEnv, db: DbService, group: WorkingGroups) {
  const sudoUri: string = env.SUDO_ACCOUNT_URI!
  const keyring = new Keyring({ type: 'sr25519' })
  const sudo: KeyringPair = keyring.addFromUri(sudoUri)

  // const N: number = +env.WORKING_GROUP_N!
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

  const decreaseStakeFixture: DecreaseStakeFixture = new DecreaseStakeFixture(
    api,
    nKeyPairs,
    leadKeyPair[0],
    sudo,
    group
  )
  // Decrease worker stake
  await decreaseStakeFixture.runner(false)

  const slashFixture: SlashFixture = new SlashFixture(api, nKeyPairs, leadKeyPair[0], sudo, group)
  // Slash worker
  await slashFixture.runner(false)

  const terminateRoleFixture: TerminateRoleFixture = new TerminateRoleFixture(
    api,
    nKeyPairs,
    leadKeyPair[0],
    sudo,
    group
  )

  // Terminate workers
  await terminateRoleFixture.runner(false)
}
