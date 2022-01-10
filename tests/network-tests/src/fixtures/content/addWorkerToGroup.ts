// this file could be used by more fixtures - adding worker to group is quite common

import {
  AddWorkerOpeningFixture,
  ApplyForOpeningFixture,
  BeginApplicationReviewFixture,
  FillOpeningFixture,
  IncreaseStakeFixture,
  UpdateRewardAccountFixture,
} from '../../fixtures/workingGroupModule'
import { FixtureRunner } from '../../Fixture'
import { OpeningId } from '@joystream/types/hiring'
import { Api, WorkingGroups } from '../../Api'
import BN from 'bn.js'
import { WorkerId } from '@joystream/types/working-group'

export async function addWorkerToGroup(
  api: Api,
  env: NodeJS.ProcessEnv,
  group: WorkingGroups,
  applicant: string
): Promise<WorkerId> {
  const applicationStake: BN = new BN(env.WORKING_GROUP_APPLICATION_STAKE!)
  const roleStake: BN = new BN(env.WORKING_GROUP_ROLE_STAKE!)
  const firstRewardInterval: BN = new BN(env.LONG_REWARD_INTERVAL!)
  const rewardInterval: BN = new BN(env.LONG_REWARD_INTERVAL!)
  const payoutAmount: BN = new BN(env.PAYOUT_AMOUNT!)
  const unstakingPeriod: BN = new BN(env.STORAGE_WORKING_GROUP_UNSTAKING_PERIOD!)
  const openingActivationDelay: BN = new BN(0)
  const paidTerms = api.createPaidTermId(new BN(+env.MEMBERSHIP_PAID_TERMS!))

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

  return fillOpeningFixture.getWorkerIds()[0]
}
