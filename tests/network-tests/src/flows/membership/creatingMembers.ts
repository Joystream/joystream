import { FlowProps } from '../../Flow'
import { CreateMemberHappyCaseFixture } from '../../fixtures/membership'

import { extendDebug } from '../../Debugger'
import { FixtureRunner } from '../../Fixture'
import { assert } from 'chai'

export default async function creatingMembers({ api, query, env }: FlowProps): Promise<void> {
  const debug = extendDebug('flow:creating-founding-members')
  debug('Started')
  api.enableDebugTxLogs()

  const N: number = +env.MEMBERSHIP_CREATION_N!
  assert(N > 0)

  const nAccounts = (await api.createKeyPairs(N)).map(({ key }) => key.address)
  const happyCaseFixture = new CreateMemberHappyCaseFixture(api, query, nAccounts)
  await new FixtureRunner(happyCaseFixture).runWithQueryNodeChecks()

  debug('Done')
}
