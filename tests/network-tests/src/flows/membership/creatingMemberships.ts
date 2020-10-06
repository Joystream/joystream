import { KeyringPair } from '@polkadot/keyring/types'
import { Keyring } from '@polkadot/api'
import { Api } from '../../Api'
import {
  BuyMembershipHappyCaseFixture,
  BuyMembershipWithInsufficienFundsFixture,
} from '../../fixtures/membershipModule'
import { Utils } from '../../utils'
import { PaidTermId } from '@joystream/types/members'
import BN from 'bn.js'
import Debugger from 'debug'

const debug = Debugger('flow:memberships')

// Membership creation scenario
export default async function memberShipCreation(api: Api, env: NodeJS.ProcessEnv) {
  const sudoUri: string = env.SUDO_ACCOUNT_URI!
  const keyring = new Keyring({ type: 'sr25519' })
  const sudo: KeyringPair = keyring.addFromUri(sudoUri)

  const N: number = +env.MEMBERSHIP_CREATION_N!
  const nKeyPairs: KeyringPair[] = Utils.createKeyPairs(keyring, N)
  const aKeyPair: KeyringPair[] = Utils.createKeyPairs(keyring, 1)
  const paidTerms: PaidTermId = api.createPaidTermId(new BN(+env.MEMBERSHIP_PAID_TERMS!))

  debug(`creating ${N} new members`)
  const happyCaseFixture = new BuyMembershipHappyCaseFixture(api, sudo, nKeyPairs, paidTerms)
  // Buy membeship is accepted with sufficient funds
  await happyCaseFixture.runner(false)

  const insufficientFundsFixture: BuyMembershipWithInsufficienFundsFixture = new BuyMembershipWithInsufficienFundsFixture(
    api,
    sudo,
    aKeyPair[0],
    paidTerms
  )
  // Account A can not buy the membership with insufficient funds
  await insufficientFundsFixture.runner(false)

  const buyMembershipAfterAccountTopUp = new BuyMembershipHappyCaseFixture(api, sudo, aKeyPair, paidTerms)
  // Account A was able to buy the membership with sufficient funds
  await buyMembershipAfterAccountTopUp.runner(false)
}
