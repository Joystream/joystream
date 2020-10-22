import { Api, WorkingGroups } from '../../Api'
import BN from 'bn.js'
import { PaidTermId } from '@joystream/types/members'
import { SudoHireLeadFixture } from '../../fixtures/sudoHireLead'
import { assert } from 'chai'
import { KeyringPair } from '@polkadot/keyring/types'

// Worker application happy case scenario
export default async function leaderSetup(api: Api, env: NodeJS.ProcessEnv, group: WorkingGroups): Promise<KeyringPair> {
  const lead = await api.getGroupLead(group)

  assert(!lead, `Lead is already set`)

  const leadKeyPair = api.createKeyPairs(1)[0]
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
  await leaderHiringHappyCaseFixture.runner(false)

  const hiredLead = await api.getGroupLead(group)
  assert(hiredLead, `${group} group Lead was not hired!`)
  assert(hiredLead!.role_account_id.eq(leadKeyPair.address))

  return leadKeyPair
}
