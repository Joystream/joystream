import { FlowProps } from '../../Flow'
import {
  BuyMembershipHappyCaseFixture,
  BuyMembershipWithInsufficienFundsFixture,
} from '../../fixtures/membershipModule'

import Debugger from 'debug'
import { FixtureRunner } from '../../Fixture'
import { assert } from 'chai'

export default async function creatingMemberships({ api, query, env }: FlowProps): Promise<void> {
  const debug = Debugger('flow:creating-members')
  debug('Started')
  api.enableDebugTxLogs()

  const N: number = +env.MEMBERSHIP_CREATION_N!
  assert(N > 0)

  // Assert membership can be bought if sufficient funds are available
  const nAccounts = (await api.createKeyPairs(N)).map((key) => key.address)
  const happyCaseFixture = new BuyMembershipHappyCaseFixture(api, query, nAccounts)
  await new FixtureRunner(happyCaseFixture).runWithQueryNodeChecks()

  // Assert account can not buy the membership with insufficient funds
  const aAccount = (await api.createKeyPairs(1))[0].address
  const insufficientFundsFixture = new BuyMembershipWithInsufficienFundsFixture(api, query, aAccount)
  await new FixtureRunner(insufficientFundsFixture).run()

  debug('Done')
}
