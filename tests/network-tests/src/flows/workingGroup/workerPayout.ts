import { Api, WorkingGroups } from '../../Api'
import { Keyring } from '@polkadot/api'
import { KeyringPair } from '@polkadot/keyring/types'
import {
  AddWorkerOpeningFixture,
  ApplyForOpeningFixture,
  AwaitPayoutFixture,
  BeginApplicationReviewFixture,
  ExpectMintCapacityChangedFixture,
  FillOpeningFixture,
} from '../../fixtures/workingGroupModule'
import BN from 'bn.js'
import { Utils } from '../../utils'
import { VoteForProposalFixture, WorkingGroupMintCapacityProposalFixture } from '../../fixtures/proposalsModule'
import { PaidTermId } from '@joystream/types/members'
import { OpeningId } from '@joystream/types/hiring'
import { ProposalId } from '@joystream/types/proposals'
import { DbService } from '../../DbService'
import { BuyMembershipHappyCaseFixture } from '../../fixtures/membershipModule'
import { assert } from 'chai'

// Worker payout scenario
export default async function workerPayouts(api: Api, env: NodeJS.ProcessEnv, db: DbService, group: WorkingGroups) {
  const sudoUri: string = env.SUDO_ACCOUNT_URI!
  const keyring = new Keyring({ type: 'sr25519' })
  const sudo: KeyringPair = keyring.addFromUri(sudoUri)

  const N: number = +env.WORKING_GROUP_N!
  const m1KeyPairs: KeyringPair[] = Utils.createKeyPairs(keyring, N)
  const leadKeyPair: KeyringPair[] = Utils.createKeyPairs(keyring, 1)

  const paidTerms: PaidTermId = api.createPaidTermId(new BN(+env.MEMBERSHIP_PAID_TERMS!))
  const applicationStake: BN = new BN(env.WORKING_GROUP_APPLICATION_STAKE!)
  const roleStake: BN = new BN(env.WORKING_GROUP_ROLE_STAKE!)
  const firstRewardInterval: BN = new BN(env.SHORT_FIRST_REWARD_INTERVAL!)
  const rewardInterval: BN = new BN(env.SHORT_REWARD_INTERVAL!)
  const payoutAmount: BN = new BN(env.PAYOUT_AMOUNT!)
  const unstakingPeriod: BN = new BN(env.STORAGE_WORKING_GROUP_UNSTAKING_PERIOD!)
  const mintCapacity: BN = new BN(env.STORAGE_WORKING_GROUP_MINTING_CAPACITY!)
  const openingActivationDelay: BN = new BN(0)

  assert(db.hasCouncil())
  assert(db.hasLeader(api.getWorkingGroupString(group)))

  const m2KeyPairs = db.getCouncil()
  const memberSetFixture: BuyMembershipHappyCaseFixture = new BuyMembershipHappyCaseFixture(
    api,
    sudo,
    m1KeyPairs,
    paidTerms
  )
  // Recreating set of members
  await memberSetFixture.runner(false)

  leadKeyPair[0] = db.getLeader(api.getWorkingGroupString(group))

  const workingGroupMintCapacityProposalFixture: WorkingGroupMintCapacityProposalFixture = new WorkingGroupMintCapacityProposalFixture(
    api,
    m1KeyPairs,
    sudo,
    mintCapacity,
    group
  )
  // Propose mint capacity
  await workingGroupMintCapacityProposalFixture.runner(false)

  let voteForProposalFixture: VoteForProposalFixture
  const expectMintCapacityChanged: ExpectMintCapacityChangedFixture = new ExpectMintCapacityChangedFixture(
    api,
    mintCapacity
  )
  // Approve mint capacity
  await (async () => {
    voteForProposalFixture = new VoteForProposalFixture(
      api,
      m2KeyPairs,
      sudo,
      workingGroupMintCapacityProposalFixture.getCreatedProposalId() as ProposalId
    )
    voteForProposalFixture.runner(false)
    await expectMintCapacityChanged.runner(false)
  })()

  const addWorkerOpeningFixture: AddWorkerOpeningFixture = new AddWorkerOpeningFixture(
    api,
    m1KeyPairs,
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
      m1KeyPairs,
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
      m1KeyPairs,
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

  const awaitPayoutFixture: AwaitPayoutFixture = new AwaitPayoutFixture(api, m1KeyPairs, group)
  // Await worker payout
  await awaitPayoutFixture.runner(false)
}
