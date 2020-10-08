import { Api, WorkingGroups } from '../Api'
import { Keyring } from '@polkadot/api'
import { KeyringPair } from '@polkadot/keyring/types'
import BN from 'bn.js'
import { Utils } from '../utils'
import { PaidTermId } from '@joystream/types/members'
import { DbService } from '../DbService'
import { SudoHireLeadFixture } from '../fixtures/sudoHireLead'

// Worker application happy case scenario
export default async function leaderSetup(api: Api, env: NodeJS.ProcessEnv, db: DbService, group: WorkingGroups) {
  if (db.hasLeader(api.getWorkingGroupString(group))) {
    return
  }

  const sudoUri: string = env.SUDO_ACCOUNT_URI!
  const keyring = new Keyring({ type: 'sr25519' })
  const sudo: KeyringPair = keyring.addFromUri(sudoUri)
  const leadKeyPair = Utils.createKeyPairs(keyring, 1)[0]
  const paidTerms: PaidTermId = api.createPaidTermId(new BN(+env.MEMBERSHIP_PAID_TERMS!))
  const applicationStake: BN = new BN(env.WORKING_GROUP_APPLICATION_STAKE!)
  const roleStake: BN = new BN(env.WORKING_GROUP_ROLE_STAKE!)
  const firstRewardInterval: BN = new BN(env.LONG_REWARD_INTERVAL!)
  const rewardInterval: BN = new BN(env.LONG_REWARD_INTERVAL!)
  const payoutAmount: BN = new BN(env.PAYOUT_AMOUNT!)
  const openingActivationDelay: BN = new BN(0)

  const leaderHiringHappyCaseFixture = new SudoHireLeadFixture(
    api,
    sudo,
    leadKeyPair,
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

  db.setLeader(leadKeyPair, api.getWorkingGroupString(group))
}

/* 
    // Add some test to ensure Lead can leave their role..
    const leaveRoleFixture: LeaveRoleFixture = new LeaveRoleFixture(
      api,
      leadKeyPair,
      sudo,
      WorkingGroups.StorageWorkingGroup
    )
    // Leaving lead role
    await leaveRoleFixture.runner(false)
*/
