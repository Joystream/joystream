import { FlowProps } from '../../Flow'
import { extendDebug } from '../../Debugger'
import { FixtureRunner } from '../../Fixture'
import { ElectCouncilFixture } from '../../fixtures/council'

export default async function failToElectWithBlacklist({ api, query }: FlowProps): Promise<void> {
  const debug = extendDebug('flow:elect-council')
  debug('Started')
  api.enableDebugTxLogs()

  const votersOptOut = new ElectCouncilFixture(api, query, true)
  await new FixtureRunner(votersOptOut).run()
  debug('Done')
}
