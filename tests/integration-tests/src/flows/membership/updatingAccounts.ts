import { FlowProps } from '../../Flow'
import { BuyMembershipHappyCaseFixture, UpdateAccountsHappyCaseFixture } from '../../fixtures/membershipModule'

import Debugger from 'debug'
import { FixtureRunner } from '../../Fixture'

export default async function updatingAccounts({ api, query }: FlowProps): Promise<void> {
  const debug = Debugger('flow:member-accounts-update')
  debug('Started')
  api.enableDebugTxLogs()

  const [account] = (await api.createKeyPairs(1)).map((key) => key.address)
  const buyMembershipHappyCaseFixture = new BuyMembershipHappyCaseFixture(api, query, [account])
  await new FixtureRunner(buyMembershipHappyCaseFixture).run()
  const [memberId] = buyMembershipHappyCaseFixture.getCreatedMembers()
  const [newRootAccount, newControllerAccount] = (await api.createKeyPairs(2)).map((key) => key.address)
  const updateAccountsHappyCaseFixture = new UpdateAccountsHappyCaseFixture(
    api,
    query,
    {
      account,
      memberId,
    },
    newRootAccount,
    newControllerAccount
  )
  await new FixtureRunner(updateAccountsHappyCaseFixture).runWithQueryNodeChecks()

  debug('Done')
}
