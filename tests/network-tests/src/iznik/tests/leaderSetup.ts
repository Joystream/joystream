import { initConfig } from '../utils/config'
import { closeApi } from '../utils/closeApi'
import { ApiWrapper, WorkingGroups } from '../utils/apiWrapper'
import { WsProvider, Keyring } from '@polkadot/api'
import { KeyringPair } from '@polkadot/keyring/types'
import { setTestTimeout } from '../utils/setTestTimeout'
import BN from 'bn.js'
import tap from 'tap'
import { Utils } from '../utils/utils'
import { PaidTermId } from '@alexandria/types/members'
import { DbService } from '../services/dbService'
import { LeaderHiringHappyCaseFixture } from './fixtures/leaderHiringHappyCase'

tap.mocha.describe('Worker application happy case scenario', async () => {
  initConfig()
  const nodeUrl: string = process.env.NODE_URL!
  const sudoUri: string = process.env.SUDO_ACCOUNT_URI!
  const keyring = new Keyring({ type: 'sr25519' })
  const db: DbService = DbService.getInstance()
  const provider = new WsProvider(nodeUrl)
  const apiWrapper: ApiWrapper = await ApiWrapper.create(provider)
  if (db.hasLeader(apiWrapper.getWorkingGroupString(WorkingGroups.StorageWorkingGroup))) {
    return
  }

  const sudo: KeyringPair = keyring.addFromUri(sudoUri)
  const N: number = +process.env.WORKING_GROUP_N!
  const nKeyPairs: KeyringPair[] = Utils.createKeyPairs(keyring, N)
  const leadKeyPair: KeyringPair[] = Utils.createKeyPairs(keyring, 1)

  const paidTerms: PaidTermId = apiWrapper.createPaidTermId(new BN(+process.env.MEMBERSHIP_PAID_TERMS!))
  const applicationStake: BN = new BN(process.env.WORKING_GROUP_APPLICATION_STAKE!)
  const roleStake: BN = new BN(process.env.WORKING_GROUP_ROLE_STAKE!)
  const firstRewardInterval: BN = new BN(process.env.LONG_REWARD_INTERVAL!)
  const rewardInterval: BN = new BN(process.env.LONG_REWARD_INTERVAL!)
  const payoutAmount: BN = new BN(process.env.PAYOUT_AMOUNT!)
  const durationInBlocks = 48
  const openingActivationDelay: BN = new BN(0)

  setTestTimeout(apiWrapper, durationInBlocks)

  const leaderHiringHappyCaseFixture: LeaderHiringHappyCaseFixture = new LeaderHiringHappyCaseFixture(
    apiWrapper,
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
    WorkingGroups.StorageWorkingGroup
  )
  await leaderHiringHappyCaseFixture.runner(false)

  db.setMembers(nKeyPairs)
  db.setLeader(leadKeyPair[0], apiWrapper.getWorkingGroupString(WorkingGroups.StorageWorkingGroup))

  closeApi(apiWrapper)
})
