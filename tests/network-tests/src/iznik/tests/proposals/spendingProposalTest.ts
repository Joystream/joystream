import { KeyringPair } from '@polkadot/keyring/types'
import { initConfig } from '../../utils/config'
import { Keyring, WsProvider } from '@polkadot/api'
import BN from 'bn.js'
import { setTestTimeout } from '../../utils/setTestTimeout'
import tap from 'tap'
import { closeApi } from '../../utils/closeApi'
import { ApiWrapper } from '../../utils/apiWrapper'
import { Utils } from '../../utils/utils'
import { SpendingProposalFixture } from '../fixtures/proposalsModule'
import { PaidTermId } from '@alexandria/types/members'
import { CouncilElectionHappyCaseFixture } from '../fixtures/councilElectionHappyCase'
import { DbService } from '../../services/dbService'

tap.mocha.describe('Spending proposal scenario', async () => {
  initConfig()

  const nodeUrl: string = process.env.NODE_URL!
  const sudoUri: string = process.env.SUDO_ACCOUNT_URI!
  const keyring = new Keyring({ type: 'sr25519' })
  const provider = new WsProvider(nodeUrl)
  const apiWrapper: ApiWrapper = await ApiWrapper.create(provider)
  const sudo: KeyringPair = keyring.addFromUri(sudoUri)
  const db: DbService = DbService.getInstance()

  const N: number = +process.env.MEMBERSHIP_CREATION_N!
  let m1KeyPairs: KeyringPair[] = Utils.createKeyPairs(keyring, N)
  let m2KeyPairs: KeyringPair[] = Utils.createKeyPairs(keyring, N)

  const paidTerms: PaidTermId = apiWrapper.createPaidTermId(new BN(+process.env.MEMBERSHIP_PAID_TERMS!))
  const K: number = +process.env.COUNCIL_ELECTION_K!
  const greaterStake: BN = new BN(+process.env.COUNCIL_STAKE_GREATER_AMOUNT!)
  const lesserStake: BN = new BN(+process.env.COUNCIL_STAKE_LESSER_AMOUNT!)
  const spendingBalance: BN = new BN(+process.env.SPENDING_BALANCE!)
  const mintCapacity: BN = new BN(+process.env.COUNCIL_MINTING_CAPACITY!)
  const durationInBlocks = 29

  setTestTimeout(apiWrapper, durationInBlocks)

  if (db.hasCouncil()) {
    m1KeyPairs = db.getMembers()
    m2KeyPairs = db.getCouncil()
  } else {
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
  }

  const spendingProposalFixture: SpendingProposalFixture = new SpendingProposalFixture(
    apiWrapper,
    m1KeyPairs,
    m2KeyPairs,
    sudo,
    spendingBalance,
    mintCapacity
  )
  tap.test('Spending proposal test', async () => await spendingProposalFixture.runner(false))

  closeApi(apiWrapper)
})
