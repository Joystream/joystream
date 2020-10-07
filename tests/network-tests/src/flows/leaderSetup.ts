import { Api, WorkingGroups } from '../Api'
import { Keyring } from '@polkadot/api'
import { KeyringPair } from '@polkadot/keyring/types'
import BN from 'bn.js'
import { Utils } from '../utils'
import { PaidTermId } from '@joystream/types/members'
import { DbService } from '../DbService'
import { LeaderHiringHappyCaseFixture } from '../fixtures/leaderHiringHappyCase'

// Worker application happy case scenario
export default async function leaderSetup(api: Api, env: NodeJS.ProcessEnv, db: DbService, group: WorkingGroups) {
  const sudoUri: string = env.SUDO_ACCOUNT_URI!
  const keyring = new Keyring({ type: 'sr25519' })
  if (db.hasLeader(api.getWorkingGroupString(WorkingGroups.StorageWorkingGroup))) {
    return
  }

  const sudo: KeyringPair = keyring.addFromUri(sudoUri)
  const N: number = +env.WORKING_GROUP_N!
  const nKeyPairs: KeyringPair[] = Utils.createKeyPairs(keyring, N)
  const leadKeyPair: KeyringPair[] = Utils.createKeyPairs(keyring, 1)

  const paidTerms: PaidTermId = api.createPaidTermId(new BN(+env.MEMBERSHIP_PAID_TERMS!))
  const applicationStake: BN = new BN(env.WORKING_GROUP_APPLICATION_STAKE!)
  const roleStake: BN = new BN(env.WORKING_GROUP_ROLE_STAKE!)
  const firstRewardInterval: BN = new BN(env.LONG_REWARD_INTERVAL!)
  const rewardInterval: BN = new BN(env.LONG_REWARD_INTERVAL!)
  const payoutAmount: BN = new BN(env.PAYOUT_AMOUNT!)
  const openingActivationDelay: BN = new BN(0)

  // const durationInBlocks = 48
  // setTestTimeout(api, durationInBlocks)

  const leaderHiringHappyCaseFixture: LeaderHiringHappyCaseFixture = new LeaderHiringHappyCaseFixture(
    api,
    sudo,
    nKeyPairs,
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

  db.setMembers(nKeyPairs)
  db.setLeader(leadKeyPair[0], api.getWorkingGroupString(group))
}
