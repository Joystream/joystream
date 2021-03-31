import { Api, WorkingGroups } from '../../Api'
import { FlowProps } from '../../Flow'
import {
  ApplyForOpeningFixture,
  AddWorkerOpeningFixture,
  BeginApplicationReviewFixture,
  FillOpeningFixture,
  DecreaseStakeFixture,
  SlashFixture,
  TerminateRoleFixture,
} from '../../fixtures/workingGroupModule'
import { BuyMembershipHappyCaseFixture } from '../../fixtures/membershipModule'
import BN from 'bn.js'
import { OpeningId } from '@joystream/types/hiring'
import { assert } from 'chai'
import { extendDebug } from '../../Debugger'
import { FixtureRunner } from '../../Fixture'

export default {
  storage: async function ({ api, env }: FlowProps): Promise<void> {
    return manageWorkerAsLead(api, env, WorkingGroups.StorageWorkingGroup)
  },
  content: async function ({ api, env }: FlowProps): Promise<void> {
    return manageWorkerAsLead(api, env, WorkingGroups.ContentDirectoryWorkingGroup)
  },
}

async function manageWorkerAsLead(api: Api, env: NodeJS.ProcessEnv, group: WorkingGroups): Promise<void> {
  const debug = extendDebug(`flow:manageWorkerAsLead:${group}`)
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

  const applicants = api.createKeyPairs(5).map((key) => key.address)
  const memberSetFixture = new BuyMembershipHappyCaseFixture(api, applicants, paidTerms)
  await new FixtureRunner(memberSetFixture).run()

  const addWorkerOpeningFixture: AddWorkerOpeningFixture = new AddWorkerOpeningFixture(
    api,
    applicationStake,
    roleStake,
    openingActivationDelay,
    unstakingPeriod,
    group
  )
  // Add worker opening
  await new FixtureRunner(addWorkerOpeningFixture).run()
  assert(addWorkerOpeningFixture.getCreatedOpeningId())

  // First apply for worker opening
  const applyForWorkerOpeningFixture = new ApplyForOpeningFixture(
    api,
    applicants,
    applicationStake,
    roleStake,
    addWorkerOpeningFixture.getCreatedOpeningId() as OpeningId,
    group
  )
  await new FixtureRunner(applyForWorkerOpeningFixture).run()
  const applicationIds = applyForWorkerOpeningFixture.getApplicationIds()
  assert.equal(applicants.length, applicationIds.length)

  const applicationIdsToHire = applicationIds.slice(0, 2)

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
    applicationIdsToHire,
    addWorkerOpeningFixture.getCreatedOpeningId() as OpeningId,
    firstRewardInterval,
    rewardInterval,
    payoutAmount,
    group
  )
  await new FixtureRunner(fillOpeningFixture).run()

  const firstWorkerId = fillOpeningFixture.getWorkerIds()[0]

  const decreaseStakeFixture = new DecreaseStakeFixture(api, firstWorkerId, group)
  // Decrease worker stake
  await new FixtureRunner(decreaseStakeFixture).run()

  const slashFixture: SlashFixture = new SlashFixture(api, firstWorkerId, group)
  // Slash worker
  await new FixtureRunner(slashFixture).run()

  const terminateRoleFixture = new TerminateRoleFixture(api, firstWorkerId, group)

  // Terminate workers
  await new FixtureRunner(terminateRoleFixture).run()

  debug('Done')
}
