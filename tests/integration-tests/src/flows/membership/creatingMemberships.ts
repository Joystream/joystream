import { FlowProps } from '../../Flow'
import {
  BuyMembershipHappyCaseFixture,
  BuyMembershipWithInsufficienFundsFixture,
} from '../../fixtures/membershipModule'

import Debugger from 'debug'
import { FixtureRunner } from '../../Fixture'
import { assert } from 'chai'

export default async function membershipCreation({ api, query, env }: FlowProps): Promise<void> {
  const debug = Debugger('flow:memberships')
  debug('Started')
  api.enableDebugTxLogs()

  const N: number = +env.MEMBERSHIP_CREATION_N!
  assert(N > 0)

  // Assert membership can be bought if sufficient funds are available
  const nAccounts = api.createKeyPairs(N).map((key) => key.address)
  const happyCaseFixture = new BuyMembershipHappyCaseFixture(api, query, nAccounts)
  await new FixtureRunner(happyCaseFixture).run()

  // Assert account can not buy the membership with insufficient funds
  const aAccount = api.createKeyPairs(1)[0].address
  const insufficientFundsFixture = new BuyMembershipWithInsufficienFundsFixture(api, aAccount)
  await new FixtureRunner(insufficientFundsFixture).run()

  debug('Done')
}
