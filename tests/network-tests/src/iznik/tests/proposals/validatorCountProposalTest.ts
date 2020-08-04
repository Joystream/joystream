import { KeyringPair } from '@polkadot/keyring/types'
import { initConfig } from '../../utils/config'
import { Keyring, WsProvider } from '@polkadot/api'
import BN from 'bn.js'
import { setTestTimeout } from '../../utils/setTestTimeout'
import tap from 'tap'
import { registerJoystreamTypes } from '@nicaea/types'
import { closeApi } from '../../utils/closeApi'
import { ApiWrapper } from '../../utils/apiWrapper'
import { Utils } from '../../utils/utils'
import { BuyMembershipHappyCaseFixture } from '../fixtures/membershipModule'
import { ElectCouncilFixture } from '../fixtures/councilElectionModule'
import { ValidatorCountProposalFixture } from '../fixtures/proposalsModule'
import { PaidTermId } from '@nicaea/types/members'

tap.mocha.describe('Validator count proposal scenario', async () => {
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
  const validatorCountIncrement: BN = new BN(+process.env.VALIDATOR_COUNT_INCREMENT!)
  const durationInBlocks = 29

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

  const validatorCountProposalFixture: ValidatorCountProposalFixture = new ValidatorCountProposalFixture(
    apiWrapper,
    m1KeyPairs,
    m2KeyPairs,
    sudo,
    validatorCountIncrement
  )
  tap.test('Validator count proposal', async () => validatorCountProposalFixture.runner(false))

  closeApi(apiWrapper)
})
