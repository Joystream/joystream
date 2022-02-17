import { FlowProps } from '../../Flow'
import { extendDebug } from '../../Debugger'
import { FixtureRunner } from '../../Fixture'
import { ElectCouncilFixture } from '../../fixtures/council/ElectCouncilFixture'

// Currently only used by proposals flow

export default async function electCouncil({ api, query }: FlowProps): Promise<void> {
  const debug = extendDebug('flow:elect-council')
  debug('Started')
  api.enableDebugTxLogs()

  const electCouncilFixture = new ElectCouncilFixture(api, query)
  await new FixtureRunner(electCouncilFixture).run()

  debug('Done')
}
