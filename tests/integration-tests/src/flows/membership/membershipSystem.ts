import { FlowProps } from '../../Flow'
import { SudoUpdateMembershipSystem } from '../../fixtures/membershipModule'

import Debugger from 'debug'
import { FixtureRunner } from '../../Fixture'
import BN from 'bn.js'

export default async function membershipSystem({ api, query, env }: FlowProps): Promise<void> {
  const debug = Debugger('flow:membership-system')
  debug('Started')
  api.enableDebugTxLogs()

  const updates = [
    {
      defaultInviteCount: 10,
      membershipPrice: new BN(1000),
      referralCut: 5,
      invitedInitialBalance: new BN(500),
    },
    {
      defaultInviteCount: 5,
      membershipPrice: new BN(500),
    },
    {
      referralCut: 0,
      invitedInitialBalance: new BN(100),
    },
  ]

  const fixtures = updates.map((u) => new SudoUpdateMembershipSystem(api, query, u))
  // Fixtures should be executed one-by-one to not interfere with each other (before->after snapshot checks)
  for (const key in fixtures) {
    const fixture = fixtures[key]
    debug(`Running update fixture number ${key + 1}`)
    await new FixtureRunner(fixture).run()
  }

  debug('Done')
}
