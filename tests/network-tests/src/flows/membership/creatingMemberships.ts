import { KeyringPair } from '@polkadot/keyring/types'
import { Keyring } from '@polkadot/api'
import { ApiWrapper } from '../../utils/apiWrapper'
import {
  BuyMembershipHappyCaseFixture,
  BuyMembershipWithInsufficienFundsFixture,
} from '../../fixtures/membershipModule'
import { Utils } from '../../utils/utils'
import { PaidTermId } from '@joystream/types/members'
import BN from 'bn.js'

// Membership creation scenario
export default async function memberShipCreation(apiWrapper: ApiWrapper, env: NodeJS.ProcessEnv) {
  const sudoUri: string = env.SUDO_ACCOUNT_URI!
  const keyring = new Keyring({ type: 'sr25519' })
  const sudo: KeyringPair = keyring.addFromUri(sudoUri)

  const N: number = +env.MEMBERSHIP_CREATION_N!
  const nKeyPairs: KeyringPair[] = Utils.createKeyPairs(keyring, N)
  const aKeyPair: KeyringPair[] = Utils.createKeyPairs(keyring, 1)
  const paidTerms: PaidTermId = apiWrapper.createPaidTermId(new BN(+env.MEMBERSHIP_PAID_TERMS!))

  // const durationInBlocks = 7
  // setTestTimeout(apiWrapper, durationInBlocks)

  const happyCaseFixture: BuyMembershipHappyCaseFixture = new BuyMembershipHappyCaseFixture(
    apiWrapper,
    sudo,
    nKeyPairs,
    paidTerms
  )
  // Buy membeship is accepted with sufficient funds
  await happyCaseFixture.runner(false)

  const insufficientFundsFixture: BuyMembershipWithInsufficienFundsFixture = new BuyMembershipWithInsufficienFundsFixture(
    apiWrapper,
    sudo,
    aKeyPair[0],
    paidTerms
  )
  // Account A can not buy the membership with insufficient funds
  await insufficientFundsFixture.runner(false)

  const buyMembershipAfterAccountTopUp = new BuyMembershipHappyCaseFixture(apiWrapper, sudo, aKeyPair, paidTerms)
  // Account A was able to buy the membership with sufficient funds
  await buyMembershipAfterAccountTopUp.runner(false)
}
