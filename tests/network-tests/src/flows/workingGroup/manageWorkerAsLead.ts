import { Api, WorkingGroups } from '../../Api'
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
import Debugger from 'debug'

// Manage worker as lead scenario
export default async function manageWorker(api: Api, env: NodeJS.ProcessEnv, group: WorkingGroups) {
  const debug = Debugger(`manageWorker:${group}`)
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
  await memberSetFixture.runner(false)

  const addWorkerOpeningFixture: AddWorkerOpeningFixture = new AddWorkerOpeningFixture(
    api,
    applicationStake,
    roleStake,
    openingActivationDelay,
    unstakingPeriod,
    group
  )
  // Add worker opening
  await addWorkerOpeningFixture.runner(false)

  // First apply for worker opening
  const applyForWorkerOpeningFixture = new ApplyForOpeningFixture(
    api,
    applicants,
    applicationStake,
    roleStake,
    addWorkerOpeningFixture.getCreatedOpeningId() as OpeningId,
    group
  )
  await applyForWorkerOpeningFixture.runner(false)
  debug('Applications:', applyForWorkerOpeningFixture.getApplicationIds())
  const applicationIdsToHire = applyForWorkerOpeningFixture.getApplicationIds().slice(0, 2)

  // Begin application review
  const beginApplicationReviewFixture = new BeginApplicationReviewFixture(
    api,
    addWorkerOpeningFixture.getCreatedOpeningId() as OpeningId,
    group
  )
  await beginApplicationReviewFixture.runner(false)

  debug('Filling with ids:', applicationIdsToHire)
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
  await fillOpeningFixture.runner(false)
  debug('Hired worker ids', fillOpeningFixture.getWorkerIds())
  const firstWorkerId = fillOpeningFixture.getWorkerIds()[0]

  const decreaseStakeFixture = new DecreaseStakeFixture(api, firstWorkerId, group)
  // Decrease worker stake
  await decreaseStakeFixture.runner(false)

  const slashFixture: SlashFixture = new SlashFixture(api, firstWorkerId, group)
  // Slash worker
  await slashFixture.runner(false)

  const terminateRoleFixture = new TerminateRoleFixture(api, firstWorkerId, group)

  // Terminate workers
  await terminateRoleFixture.runner(false)
}
