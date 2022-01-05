import { FlowProps } from '../../Flow'
import {
  BuyMembershipHappyCaseFixture,
  BuyMembershipWithInsufficienFundsFixture,
} from '../../fixtures/membershipModule'
import { PaidTermId } from '@joystream/types/members'
import BN from 'bn.js'
import { extendDebug } from '../../Debugger'
import { FixtureRunner } from '../../Fixture'
import { assert } from 'chai'

export default async function membershipCreation({ api, env }: FlowProps): Promise<void> {
  const debug = extendDebug('flow:memberships')
  debug('Started')

  const N: number = +env.MEMBERSHIP_CREATION_N!
  assert(N > 0)
  const nAccounts = api.createKeyPairs(N).map(({ key }) => key.address)
  const aAccount = api.createKeyPairs(1)[0].key.address
  const paidTerms: PaidTermId = api.createPaidTermId(new BN(+env.MEMBERSHIP_PAID_TERMS!))

  // Assert membership can be bought if sufficient funds are available
  const happyCaseFixture = new BuyMembershipHappyCaseFixture(api, nAccounts, paidTerms)
  await new FixtureRunner(happyCaseFixture).run()

  // Assert account can not buy the membership with insufficient funds
  const insufficientFundsFixture = new BuyMembershipWithInsufficienFundsFixture(api, aAccount, paidTerms)
  await new FixtureRunner(insufficientFundsFixture).run()

  // Assert account was able to buy the membership with sufficient funds
  const buyMembershipAfterAccountTopUp = new BuyMembershipHappyCaseFixture(api, [aAccount], paidTerms)
  await new FixtureRunner(buyMembershipAfterAccountTopUp).run()

  debug('Done')
}
