import { Api, WorkingGroups } from '../../Api'
import { FlowProps } from '../../Flow'
import {
  AddWorkerOpeningFixture,
  ApplyForOpeningFixture,
  AwaitPayoutFixture,
  BeginApplicationReviewFixture,
  FillOpeningFixture,
} from '../../fixtures/workingGroupModule'
import BN from 'bn.js'
import {
  VoteForProposalAndExpectExecutionFixture,
  WorkingGroupMintCapacityProposalFixture,
} from '../../fixtures/proposalsModule'
import { PaidTermId } from '@joystream/types/members'
import { OpeningId } from '@joystream/types/hiring'
import { ProposalId } from '@joystream/types/proposals'
import { BuyMembershipHappyCaseFixture } from '../../fixtures/membershipModule'
import { assert } from 'chai'
import { FixtureRunner } from '../../Fixture'
import { extendDebug } from '../../Debugger'
import { Resource, ResourceLocker } from '../../Resources'

export default {
  storage: async function ({ api, env, lock }: FlowProps): Promise<void> {
    return workerPayouts(api, env, WorkingGroups.StorageWorkingGroup, lock)
  },
  content: async function ({ api, env, lock }: FlowProps): Promise<void> {
    return workerPayouts(api, env, WorkingGroups.ContentDirectoryWorkingGroup, lock)
  },
}

async function workerPayouts(api: Api, env: NodeJS.ProcessEnv, group: WorkingGroups, lock: ResourceLocker) {
  const debug = extendDebug(`flow:workerPayout:${group}`)
  debug('Started')
  await lock(Resource.Proposals)

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
  assert(lead)

  const newMembers = api.createKeyPairs(5).map((key) => key.address)

  const memberSetFixture = new BuyMembershipHappyCaseFixture(api, newMembers, paidTerms)
  // Recreating set of members
  await new FixtureRunner(memberSetFixture).run()

  const workingGroupMintCapacityProposalFixture = new WorkingGroupMintCapacityProposalFixture(
    api,
    newMembers[0],
    mintCapacity,
    group
  )
  // Propose mint capacity
  await new FixtureRunner(workingGroupMintCapacityProposalFixture).run()

  // Approve mint capacity
  const voteForProposalFixture = new VoteForProposalAndExpectExecutionFixture(
    api,
    workingGroupMintCapacityProposalFixture.getCreatedProposalId() as ProposalId
  )
  await new FixtureRunner(voteForProposalFixture).run()

  const addWorkerOpeningFixture = new AddWorkerOpeningFixture(
    api,
    applicationStake,
    roleStake,
    openingActivationDelay,
    unstakingPeriod,
    group
  )
  // Add worker opening
  await new FixtureRunner(addWorkerOpeningFixture).run()

  // First apply for worker opening
  const applyForWorkerOpeningFixture = new ApplyForOpeningFixture(
    api,
    newMembers,
    applicationStake,
    roleStake,
    addWorkerOpeningFixture.getCreatedOpeningId() as OpeningId,
    group
  )
  await new FixtureRunner(applyForWorkerOpeningFixture).run()
  const applicationId = applyForWorkerOpeningFixture.getApplicationIds()[0]

  // Begin application review
  const beginApplicationReviewFixture = new BeginApplicationReviewFixture(
    api,
    addWorkerOpeningFixture.getCreatedOpeningId() as OpeningId,
    group
  )
  await new FixtureRunner(beginApplicationReviewFixture).run()

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
  await new FixtureRunner(fillOpeningFixture).run()
  const workerId = fillOpeningFixture.getWorkerIds()[0]
  const awaitPayoutFixture: AwaitPayoutFixture = new AwaitPayoutFixture(api, workerId, group)
  // Await worker payout
  await new FixtureRunner(awaitPayoutFixture).run()

  debug('Done')
}
