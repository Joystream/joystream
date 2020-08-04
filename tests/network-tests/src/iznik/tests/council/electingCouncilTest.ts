import { KeyringPair } from '@polkadot/keyring/types'
import { initConfig } from '../../utils/config'
import { Keyring, WsProvider } from '@polkadot/api'
import { setTestTimeout } from '../../utils/setTestTimeout'
import BN from 'bn.js'
import tap from 'tap'
import { registerJoystreamTypes } from '@nicaea/types'
import { ApiWrapper } from '../../utils/apiWrapper'
import { closeApi } from '../../utils/closeApi'
import { BuyMembershipHappyCaseFixture } from '../fixtures/membershipModule'
import { ElectCouncilFixture } from '../fixtures/councilElectionModule'
import { Utils } from '../../utils/utils'
import { PaidTermId } from '@nicaea/types/members'

tap.mocha.describe('Electing council scenario', async () => {
  initConfig()
  registerJoystreamTypes()

  const nodeUrl: string = process.env.NODE_URL!
  const sudoUri: string = process.env.SUDO_ACCOUNT_URI!
  const keyring = new Keyring({ type: 'sr25519' })
  const provider = new WsProvider(nodeUrl)
  const apiWrapper: ApiWrapper = await ApiWrapper.create(provider)
  const sudo: KeyringPair = keyring.addFromUri(sudoUri)

  const N: number = +process.env.MEMBERSHIP_CREATION_N!
  const m1KeyPairs: KeyringPair[] = Utils.createKeyPairs(keyring, N)
  const m2KeyPairs: KeyringPair[] = Utils.createKeyPairs(keyring, N)
  const paidTerms: PaidTermId = new PaidTermId(+process.env.MEMBERSHIP_PAID_TERMS!)
  const K: number = +process.env.COUNCIL_ELECTION_K!
  const greaterStake: BN = new BN(+process.env.COUNCIL_STAKE_GREATER_AMOUNT!)
  const lesserStake: BN = new BN(+process.env.COUNCIL_STAKE_LESSER_AMOUNT!)

  const durationInBlocks = 25

  setTestTimeout(apiWrapper, durationInBlocks)

  const firstMemberSetFixture: BuyMembershipHappyCaseFixture = new BuyMembershipHappyCaseFixture(
    apiWrapper,
    sudo,
    m1KeyPairs,
    paidTerms
  )
  tap.test('Creating first set of members', async () => firstMemberSetFixture.runner(false))

  const secondMemberSetFixture: BuyMembershipHappyCaseFixture = new BuyMembershipHappyCaseFixture(
    apiWrapper,
    sudo,
    m2KeyPairs,
    paidTerms
  )
  tap.test('Creating second set of members', async () => secondMemberSetFixture.runner(false))

  const electCouncilFixture: ElectCouncilFixture = new ElectCouncilFixture(
    apiWrapper,
    m1KeyPairs,
    m2KeyPairs,
    K,
    sudo,
    greaterStake,
    lesserStake
  )
  tap.test('Elect council', async () => electCouncilFixture.runner(false))

  closeApi(apiWrapper)
})
