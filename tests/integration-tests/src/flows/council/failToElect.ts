import { FlowProps } from '../../Flow'
import { extendDebug } from '../../Debugger'
import { FixtureRunner } from '../../Fixture'
import { FailToElectCouncilFixture } from '../../fixtures/council/FailToElectCouncilFixture'

// Currently only used by Olympia flow

export default async function failToElectCouncil({ api, query }: FlowProps): Promise<void> {
  const debug = extendDebug('flow:fail-to-elect-council')
  debug('Started')
  api.enableDebugTxLogs()

  const failToElectCouncilFixture = new FailToElectCouncilFixture(api, query)
  await new FixtureRunner(failToElectCouncilFixture).run()

  debug('Done')
}
