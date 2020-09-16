import { KeyringPair } from '@polkadot/keyring/types'
import { Keyring, WsProvider } from '@polkadot/api'
import BN from 'bn.js'
import tap from 'tap'
import { PaidTermId } from '@alexandria/types/members'
import { DbService } from '../services/dbService'
import { initConfig } from '../utils/config'
import { ApiWrapper } from '../utils/apiWrapper'
import { Utils } from '../utils/utils'
import { setTestTimeout } from '../utils/setTestTimeout'
import { closeApi } from '../utils/closeApi'
import { CouncilElectionHappyCaseFixture } from './fixtures/councilElectionHappyCase'

tap.mocha.describe('Electing council scenario', async () => {
  initConfig()

  const nodeUrl: string = process.env.NODE_URL!
  const sudoUri: string = process.env.SUDO_ACCOUNT_URI!
  const keyring = new Keyring({ type: 'sr25519' })
  const db: DbService = DbService.getInstance()
  if (db.hasCouncil()) {
    return
  }

  const provider = new WsProvider(nodeUrl)
  const apiWrapper: ApiWrapper = await ApiWrapper.create(provider)
  const sudo: KeyringPair = keyring.addFromUri(sudoUri)

  const N: number = +process.env.MEMBERSHIP_CREATION_N!
  const m1KeyPairs: KeyringPair[] = Utils.createKeyPairs(keyring, N)
  const m2KeyPairs: KeyringPair[] = Utils.createKeyPairs(keyring, N)
  const paidTerms: PaidTermId = apiWrapper.createPaidTermId(new BN(+process.env.MEMBERSHIP_PAID_TERMS!))
  const K: number = +process.env.COUNCIL_ELECTION_K!
  const greaterStake: BN = new BN(+process.env.COUNCIL_STAKE_GREATER_AMOUNT!)
  const lesserStake: BN = new BN(+process.env.COUNCIL_STAKE_LESSER_AMOUNT!)

  const durationInBlocks = 25

  setTestTimeout(apiWrapper, durationInBlocks)

  const councilElectionHappyCaseFixture = new CouncilElectionHappyCaseFixture(
    apiWrapper,
    sudo,
    m1KeyPairs,
    m2KeyPairs,
    paidTerms,
    K,
    greaterStake,
    lesserStake
  )
  await councilElectionHappyCaseFixture.runner(false)

  db.setMembers(m1KeyPairs)
  db.setCouncil(m2KeyPairs)

  closeApi(apiWrapper)
})
