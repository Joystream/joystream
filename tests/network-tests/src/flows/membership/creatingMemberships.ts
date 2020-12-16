import { Api } from '../../Api'
import {
  BuyMembershipHappyCaseFixture,
  BuyMembershipWithInsufficienFundsFixture,
} from '../../fixtures/membershipModule'
import { PaidTermId } from '@joystream/types/members'
import BN from 'bn.js'
import Debugger from 'debug'
import { FixtureRunner } from '../../Fixture'
import { assert } from 'chai'

export default async function membershipCreation(api: Api, env: NodeJS.ProcessEnv): Promise<void> {
  const debug = Debugger('flow:memberships')
  debug('started')

  const N: number = +env.MEMBERSHIP_CREATION_N!
  assert(N > 0)
  const nAccounts = api.createKeyPairs(N).map((key) => key.address)
  const aAccount = api.createKeyPairs(1)[0].address
  const paidTerms: PaidTermId = api.createPaidTermId(new BN(+env.MEMBERSHIP_PAID_TERMS!))

  // Assert membership can be bought if sufficient funds are available
  const happyCaseFixture = new BuyMembershipHappyCaseFixture(api, nAccounts, paidTerms)
  assert.equal(await new FixtureRunner(happyCaseFixture).run(), undefined)

  // Assert account can not buy the membership with insufficient funds
  const insufficientFundsFixture: BuyMembershipWithInsufficienFundsFixture = new BuyMembershipWithInsufficienFundsFixture(
    api,
    aAccount,
    paidTerms
  )
  assert.equal(await new FixtureRunner(insufficientFundsFixture).run(), undefined)

  // Assert account was able to buy the membership with sufficient funds
  const buyMembershipAfterAccountTopUp = new BuyMembershipHappyCaseFixture(api, [aAccount], paidTerms)
  assert.equal(await new FixtureRunner(buyMembershipAfterAccountTopUp).run(), undefined)
}
