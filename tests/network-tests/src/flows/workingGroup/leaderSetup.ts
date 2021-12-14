import { Api } from '../../Api'
import { WorkingGroups } from '../../WorkingGroups'
import { FlowProps } from '../../Flow'
import BN from 'bn.js'
import { PaidTermId } from '@joystream/types/members'
import { SudoHireLeadFixture } from '../../fixtures/sudoHireLead'
import { assert } from 'chai'
// import { KeyringPair } from '@polkadot/keyring/types'
import { FixtureRunner } from '../../Fixture'
import { extendDebug } from '../../Debugger'

export default function (group: WorkingGroups, canSkip = false) {
  return async function ({ api, env }: FlowProps): Promise<void> {
    return leaderSetup(api, env, group, canSkip)
  }
}

// Worker application happy case scenario
async function leaderSetup(
  api: Api,
  env: NodeJS.ProcessEnv,
  group: WorkingGroups,
  skipIfAlreadySet = false
): Promise<void> {
  const debug = extendDebug(`flow:leaderSetup:${group}`)
  debug('Started')

  const existingLead = await api.getGroupLead(group)

  if (skipIfAlreadySet && existingLead !== undefined) {
    debug('Skipping create lead, already exists.')
    return
  }

  assert.equal(existingLead, undefined, 'Lead is already set')

  const leadKeyPair = api.createKeyPairs(1)[0].key
  const paidTerms: PaidTermId = api.createPaidTermId(new BN(+env.MEMBERSHIP_PAID_TERMS!))
  const applicationStake: BN = new BN(env.WORKING_GROUP_APPLICATION_STAKE!)
  const roleStake: BN = new BN(env.WORKING_GROUP_ROLE_STAKE!)
  const firstRewardInterval: BN = new BN(env.LONG_REWARD_INTERVAL!)
  const rewardInterval: BN = new BN(env.LONG_REWARD_INTERVAL!)
  const payoutAmount: BN = new BN(env.PAYOUT_AMOUNT!)
  const openingActivationDelay: BN = new BN(0)

  const leaderHiringHappyCaseFixture = new SudoHireLeadFixture(
    api,
    leadKeyPair.address,
    paidTerms,
    applicationStake,
    roleStake,
    openingActivationDelay,
    rewardInterval,
    firstRewardInterval,
    payoutAmount,
    group
  )
  await new FixtureRunner(leaderHiringHappyCaseFixture).run()

  const hiredLead = await api.getGroupLead(group)
  assert.notEqual(hiredLead, undefined, `${group} group Lead was not hired!`)
  assert(hiredLead!.role_account_id.eq(leadKeyPair.address))

  debug('Done')

  // Who ever needs it will need to get it from the Api layer
  // return leadKeyPair
}
