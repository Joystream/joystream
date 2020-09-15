import { KeyringPair } from '@polkadot/keyring/types'
import { Keyring, WsProvider } from '@polkadot/api'
import { initConfig } from '../../utils/config'
import { setTestTimeout } from '../../utils/setTestTimeout'
import tap from 'tap'
import { ApiWrapper } from '../../utils/apiWrapper'
import { closeApi } from '../../utils/closeApi'
import { BuyMembershipHappyCaseFixture, BuyMembershipWithInsufficienFundsFixture } from '../fixtures/membershipModule'
import { Utils } from '../../utils/utils'
import { PaidTermId } from '@alexandria/types/members'
import BN from 'bn.js'

tap.mocha.describe('Membership creation scenario', async () => {
  initConfig()

  const nodeUrl: string = process.env.NODE_URL!
  const sudoUri: string = process.env.SUDO_ACCOUNT_URI!
  const keyring = new Keyring({ type: 'sr25519' })
  const provider = new WsProvider(nodeUrl)
  const apiWrapper: ApiWrapper = await ApiWrapper.create(provider)
  const sudo: KeyringPair = keyring.addFromUri(sudoUri)

  const N: number = +process.env.MEMBERSHIP_CREATION_N!
  const nKeyPairs: KeyringPair[] = Utils.createKeyPairs(keyring, N)
  const aKeyPair: KeyringPair[] = Utils.createKeyPairs(keyring, 1)
  const paidTerms: PaidTermId = apiWrapper.createPaidTermId(new BN(+process.env.MEMBERSHIP_PAID_TERMS!))

  const durationInBlocks = 7

  setTestTimeout(apiWrapper, durationInBlocks)

  const happyCaseFixture: BuyMembershipHappyCaseFixture = new BuyMembershipHappyCaseFixture(
    apiWrapper,
    sudo,
    nKeyPairs,
    paidTerms
  )
  tap.test('Buy membeship is accepted with sufficient funds', async () => happyCaseFixture.runner(false))

  const insufficientFundsFixture: BuyMembershipWithInsufficienFundsFixture = new BuyMembershipWithInsufficienFundsFixture(
    apiWrapper,
    sudo,
    aKeyPair[0],
    paidTerms
  )
  tap.test('Account A can not buy the membership with insufficient funds', async () =>
    insufficientFundsFixture.runner(false)
  )

  const buyMembershipAfterAccountTopUp = new BuyMembershipHappyCaseFixture(apiWrapper, sudo, aKeyPair, paidTerms)
  tap.test('Account A was able to buy the membership with sufficient funds', async () =>
    buyMembershipAfterAccountTopUp.runner(false)
  )

  closeApi(apiWrapper)
})
