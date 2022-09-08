import { FlowProps } from '../../Flow'
import { CreateFoundingMemberHappyCaseFixture } from '../../fixtures/membership'

import { extendDebug } from '../../Debugger'
import { FixtureRunner } from '../../Fixture'
import { assert } from 'chai'

export default async function creatingFoundingMembers({ api, query, env }: FlowProps): Promise<void> {
  const debug = extendDebug('flow:creating-founding-members')
  debug('Started')
  api.enableDebugTxLogs()

  const N: number = +env.MEMBERSHIP_CREATION_N!
  assert(N > 0)

  // Assert membership can be bought if sufficient funds are available
  const nAccounts = (await api.createKeyPairs(N)).map(({ key }) => key.address)
  const happyCaseFixture = new CreateFoundingMemberHappyCaseFixture(api, query, nAccounts)
  await new FixtureRunner(happyCaseFixture).runWithQueryNodeChecks()

  debug('Done')
}
