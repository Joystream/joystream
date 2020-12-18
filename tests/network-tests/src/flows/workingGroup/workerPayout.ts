import { Api, WorkingGroups } from '../../Api'
import {
  AddWorkerOpeningFixture,
  ApplyForOpeningFixture,
  AwaitPayoutFixture,
  BeginApplicationReviewFixture,
  FillOpeningFixture,
} from '../../fixtures/workingGroupModule'
import BN from 'bn.js'
import { VoteForProposalFixture, WorkingGroupMintCapacityProposalFixture } from '../../fixtures/proposalsModule'
import { PaidTermId } from '@joystream/types/members'
import { OpeningId } from '@joystream/types/hiring'
import { ProposalId } from '@joystream/types/proposals'
import { BuyMembershipHappyCaseFixture } from '../../fixtures/membershipModule'
import { assert } from 'chai'

// Worker payout scenario
export default async function workerPayouts(api: Api, env: NodeJS.ProcessEnv, group: WorkingGroups) {
  const paidTerms: PaidTermId = api.createPaidTermId(new BN(+env.MEMBERSHIP_PAID_TERMS!))
  const applicationStake: BN = new BN(env.WORKING_GROUP_APPLICATION_STAKE!)
  const roleStake: BN = new BN(env.WORKING_GROUP_ROLE_STAKE!)
  const firstRewardInterval: BN = new BN(env.SHORT_FIRST_REWARD_INTERVAL!)
  const rewardInterval: BN = new BN(env.SHORT_REWARD_INTERVAL!)
  const payoutAmount: BN = new BN(env.PAYOUT_AMOUNT!)
  const unstakingPeriod: BN = new BN(env.STORAGE_WORKING_GROUP_UNSTAKING_PERIOD!)
  const mintCapacity: BN = new BN(env.STORAGE_WORKING_GROUP_MINTING_CAPACITY!)
  const openingActivationDelay: BN = new BN(0)

  const lead = await api.getGroupLead(group)
  const newMembers = api.createKeyPairs(5).map((key) => key.address)

  const memberSetFixture = new BuyMembershipHappyCaseFixture(api, newMembers, paidTerms)
  // Recreating set of members
  await memberSetFixture.runner()

  const workingGroupMintCapacityProposalFixture = new WorkingGroupMintCapacityProposalFixture(
    api,
    newMembers[0],
    mintCapacity,
    group
  )
  // Propose mint capacity
  await workingGroupMintCapacityProposalFixture.runner()

  // Approve mint capacity
  const voteForProposalFixture = new VoteForProposalFixture(
    api,
    workingGroupMintCapacityProposalFixture.getCreatedProposalId() as ProposalId
  )
  await voteForProposalFixture.runner()

  const addWorkerOpeningFixture = new AddWorkerOpeningFixture(
    api,
    applicationStake,
    roleStake,
    openingActivationDelay,
    unstakingPeriod,
    group
  )
  // Add worker opening
  await addWorkerOpeningFixture.runner()

  // First apply for worker opening
  const applyForWorkerOpeningFixture = new ApplyForOpeningFixture(
    api,
    newMembers,
    applicationStake,
    roleStake,
    addWorkerOpeningFixture.getCreatedOpeningId() as OpeningId,
    group
  )
  await applyForWorkerOpeningFixture.runner()
  const applicationId = applyForWorkerOpeningFixture.getApplicationIds()[0]

  // Begin application review
  const beginApplicationReviewFixture = new BeginApplicationReviewFixture(
    api,
    addWorkerOpeningFixture.getCreatedOpeningId() as OpeningId,
    group
  )
  await beginApplicationReviewFixture.runner()

  // Fill worker opening
  const fillOpeningFixture = new FillOpeningFixture(
    api,
    [applicationId],
    addWorkerOpeningFixture.getCreatedOpeningId() as OpeningId,
    firstRewardInterval,
    rewardInterval,
    payoutAmount,
    group
  )
  await fillOpeningFixture.runner()
  const workerId = fillOpeningFixture.getWorkerIds()[0]
  const awaitPayoutFixture: AwaitPayoutFixture = new AwaitPayoutFixture(api, workerId, group)
  // Await worker payout
  await awaitPayoutFixture.runner()
}
