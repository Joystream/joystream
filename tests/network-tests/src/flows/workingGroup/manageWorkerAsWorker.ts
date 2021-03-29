import { Api, WorkingGroups } from '../../Api'
import { FlowProps } from '../../Flow'
import {
  AddWorkerOpeningFixture,
  ApplyForOpeningFixture,
  BeginApplicationReviewFixture,
  FillOpeningFixture,
  IncreaseStakeFixture,
  UpdateRewardAccountFixture,
} from '../../fixtures/workingGroupModule'
import BN from 'bn.js'
import { OpeningId } from '@joystream/types/hiring'
import { BuyMembershipHappyCaseFixture } from '../../fixtures/membershipModule'
import { assert } from 'chai'
import { FixtureRunner } from '../../Fixture'
import { extendDebug } from '../../Debugger'

export default {
  storage: async function ({ api, env }: FlowProps): Promise<void> {
    return manageWorkerAsWorker(api, env, WorkingGroups.StorageWorkingGroup)
  },
  content: async function ({ api, env }: FlowProps): Promise<void> {
    return manageWorkerAsWorker(api, env, WorkingGroups.ContentDirectoryWorkingGroup)
  },
}

// Manage worker as worker
async function manageWorkerAsWorker(api: Api, env: NodeJS.ProcessEnv, group: WorkingGroups) {
  const debug = extendDebug(`flow:manageWorkerAsWorker:${group}`)
  debug('Started')

  const applicationStake: BN = new BN(env.WORKING_GROUP_APPLICATION_STAKE!)
  const roleStake: BN = new BN(env.WORKING_GROUP_ROLE_STAKE!)
  const firstRewardInterval: BN = new BN(env.LONG_REWARD_INTERVAL!)
  const rewardInterval: BN = new BN(env.LONG_REWARD_INTERVAL!)
  const payoutAmount: BN = new BN(env.PAYOUT_AMOUNT!)
  const unstakingPeriod: BN = new BN(env.STORAGE_WORKING_GROUP_UNSTAKING_PERIOD!)
  const openingActivationDelay: BN = new BN(0)
  const paidTerms = api.createPaidTermId(new BN(+env.MEMBERSHIP_PAID_TERMS!))

  const lead = await api.getGroupLead(group)
  assert(lead)

  const newMembers = api.createKeyPairs(1).map((key) => key.address)

  const memberSetFixture = new BuyMembershipHappyCaseFixture(api, newMembers, paidTerms)
  // Recreating set of members
  await new FixtureRunner(memberSetFixture).run()
  const applicant = newMembers[0]

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
    [applicant],
    applicationStake,
    roleStake,
    addWorkerOpeningFixture.getCreatedOpeningId() as OpeningId,
    group
  )
  await new FixtureRunner(applyForWorkerOpeningFixture).run()
  const applicationIdToHire = applyForWorkerOpeningFixture.getApplicationIds()[0]

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
    [applicationIdToHire],
    addWorkerOpeningFixture.getCreatedOpeningId() as OpeningId,
    firstRewardInterval,
    rewardInterval,
    payoutAmount,
    group
  )
  await new FixtureRunner(fillOpeningFixture).run()
  const workerId = fillOpeningFixture.getWorkerIds()[0]
  const increaseStakeFixture: IncreaseStakeFixture = new IncreaseStakeFixture(api, workerId, group)
  // Increase worker stake
  await new FixtureRunner(increaseStakeFixture).run()

  const updateRewardAccountFixture: UpdateRewardAccountFixture = new UpdateRewardAccountFixture(api, workerId, group)
  // Update reward account
  await new FixtureRunner(updateRewardAccountFixture).run()

  const updateRoleAccountFixture: UpdateRewardAccountFixture = new UpdateRewardAccountFixture(api, workerId, group)
  // Update role account
  await new FixtureRunner(updateRoleAccountFixture).run()

  debug('Done')
}
