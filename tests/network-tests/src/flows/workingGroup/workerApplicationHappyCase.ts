import { Api, WorkingGroups } from '../../Api'
import { Keyring } from '@polkadot/api'
import { KeyringPair } from '@polkadot/keyring/types'
import BN from 'bn.js'
import { Utils } from '../../utils'
import {
  AddWorkerOpeningFixture,
  ApplyForOpeningFixture,
  BeginApplicationReviewFixture,
  FillOpeningFixture,
  WithdrawApplicationFixture,
} from '../../fixtures/workingGroupModule'
import { OpeningId } from '@joystream/types/hiring'
import { DbService } from '../../DbService'
import { assert } from 'chai'

// Worker application happy case scenario
export default async function workerApplication(api: Api, env: NodeJS.ProcessEnv, db: DbService, group: WorkingGroups) {
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

  // const durationInBlocks = 48
  // setTestTimeout(api, durationInBlocks)

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

  let firstApplyForWorkerOpeningFixture: ApplyForOpeningFixture
  // First apply for worker opening
  await (async () => {
    firstApplyForWorkerOpeningFixture = new ApplyForOpeningFixture(
      api,
      nKeyPairs,
      sudo,
      applicationStake,
      roleStake,
      addWorkerOpeningFixture.getCreatedOpeningId() as OpeningId,
      group
    )
    await firstApplyForWorkerOpeningFixture.runner(false)
  })()

  const withdrawApplicationFixture: WithdrawApplicationFixture = new WithdrawApplicationFixture(
    api,
    nKeyPairs,
    sudo,
    group
  )
  // Withdraw worker application
  await withdrawApplicationFixture.runner(false)

  let secondApplyForWorkerOpeningFixture: ApplyForOpeningFixture
  // Second apply for worker opening
  await (async () => {
    secondApplyForWorkerOpeningFixture = new ApplyForOpeningFixture(
      api,
      nKeyPairs,
      sudo,
      applicationStake,
      roleStake,
      addWorkerOpeningFixture.getCreatedOpeningId() as OpeningId,
      group
    )
    await secondApplyForWorkerOpeningFixture.runner(false)
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
}
