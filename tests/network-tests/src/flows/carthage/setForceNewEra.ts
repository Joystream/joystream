import { extendDebug } from 'src/Debugger'
import { FixtureRunner } from 'src/Fixture'
import { SetForceEraForcingNewFixture } from 'src/fixtures/staking/SetForceEraForcingNewFixture'
import { FlowProps } from 'src/Flow'

export default async function setForceNewEra({ api, query, env }: FlowProps): Promise<void> {
  const debug = extendDebug('flow: setting ForceEra to ForceNew ')
  debug('started')
  api.enableDebugTxLogs()
  const setForceEraForcingNewFixture = new SetForceEraForcingNewFixture(api)
  const fixtureRunner = new FixtureRunner(setForceEraForcingNewFixture)
  await fixtureRunner.run()
}
