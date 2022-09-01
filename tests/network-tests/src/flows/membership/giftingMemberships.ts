import { FlowProps } from '../../Flow'
import { GiftMembershipHappyCaseFixture } from '../../fixtures/membership'

import { extendDebug } from '../../Debugger'
import { FixtureRunner } from '../../Fixture'
import { assert } from 'chai'

export default async function giftingMemberships({ api, query, env }: FlowProps): Promise<void> {
  const debug = extendDebug('flow:gifting-membership')
  debug('Started')
  api.enableDebugTxLogs()

  const N: number = +env.MEMBERS_INVITE_N!
  assert(N > 0)

  const accounts = (await api.createKeyPairs(N)).map(({ key }) => key.address)
  const gifterAccount = (await api.createKeyPairs(1))[0].key.address
  const happyCaseFixture = new GiftMembershipHappyCaseFixture(api, query, gifterAccount, accounts)
  await new FixtureRunner(happyCaseFixture).runWithQueryNodeChecks()

  debug('Done')
}
