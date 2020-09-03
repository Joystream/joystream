import { KeyringPair } from '@polkadot/keyring/types'
import { membershipTest } from '../impl/membershipCreation'
import { councilTest } from '../impl/electingCouncil'
import { spendingProposalTest } from './impl/spendingProposal'
import { initConfig } from '../../utils/config'
import { Keyring, WsProvider } from '@polkadot/api'
import BN from 'bn.js'
import { setTestTimeout } from '../../utils/setTestTimeout'
import tap from 'tap'
import { registerJoystreamTypes } from '@nicaea/types'
import { closeApi } from '../impl/closeApi'
import { ApiWrapper } from '../../utils/apiWrapper'

tap.mocha.describe('Spending proposal scenario', async () => {
  initConfig()
  registerJoystreamTypes()

  const m1KeyPairs: KeyringPair[] = []
  const m2KeyPairs: KeyringPair[] = []

  const keyring = new Keyring({ type: 'sr25519' })
  const N: number = +process.env.MEMBERSHIP_CREATION_N!
  const paidTerms: number = +process.env.MEMBERSHIP_PAID_TERMS!
  const nodeUrl: string = process.env.NODE_URL!
  const sudoUri: string = process.env.SUDO_ACCOUNT_URI!
  const K: number = +process.env.COUNCIL_ELECTION_K!
  const greaterStake: BN = new BN(+process.env.COUNCIL_STAKE_GREATER_AMOUNT!)
  const lesserStake: BN = new BN(+process.env.COUNCIL_STAKE_LESSER_AMOUNT!)
  const spendingBalance: BN = new BN(+process.env.SPENDING_BALANCE!)
  const mintCapacity: BN = new BN(+process.env.COUNCIL_MINTING_CAPACITY!)
  const durationInBlocks = 29

  const provider = new WsProvider(nodeUrl)
  const apiWrapper: ApiWrapper = await ApiWrapper.create(provider)

  setTestTimeout(apiWrapper, durationInBlocks)
  membershipTest(apiWrapper, m1KeyPairs, keyring, N, paidTerms, sudoUri)
  membershipTest(apiWrapper, m2KeyPairs, keyring, N, paidTerms, sudoUri)
  councilTest(apiWrapper, m1KeyPairs, m2KeyPairs, keyring, K, sudoUri, greaterStake, lesserStake)
  spendingProposalTest(apiWrapper, m1KeyPairs, m2KeyPairs, keyring, sudoUri, spendingBalance, mintCapacity)
  closeApi(apiWrapper)
})
