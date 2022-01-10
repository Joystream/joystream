import { FlowProps } from '../../Flow'
import { extendDebug } from '../../Debugger'
import { FixtureRunner } from '../../Fixture'
import { ActiveVideoCountersFixture } from '../../fixtures/content'
import { PaidTermId } from '@joystream/types/members'
import BN from 'bn.js'

export default async function activeVideoCounters({ api, query, cli, env }: FlowProps): Promise<void> {
  const debug = extendDebug('flow:active-video-counters')
  debug('Started')
  api.enableDebugTxLogs()

  const paidTerms: PaidTermId = api.createPaidTermId(new BN(+env.MEMBERSHIP_PAID_TERMS!))

  const electCouncilFixture = new ActiveVideoCountersFixture(api, query, cli, env, paidTerms)
  await new FixtureRunner(electCouncilFixture).run()

  debug('Done')
}
