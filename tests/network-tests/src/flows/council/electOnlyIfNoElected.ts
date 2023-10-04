import { FlowProps } from '../../Flow'
import { extendDebug } from '../../Debugger'
import { FixtureRunner } from '../../Fixture'
import { ElectCouncilFixture } from '../../fixtures/council/ElectCouncilFixture'

export default async function electCouncil({ api, query }: FlowProps): Promise<void> {
  const debug = extendDebug('flow:elect-council-if-no-members')
  debug('Started')
  api.enableDebugTxLogs()

  const councilMembers = await api.query.council.councilMembers()
  if (councilMembers.length === 0) {
    const electCouncilFixture = new ElectCouncilFixture(api, query)
    await new FixtureRunner(electCouncilFixture).run()
  } else {
    debug('Council exists, not electing new council.')
  }
  debug('Done')
}
