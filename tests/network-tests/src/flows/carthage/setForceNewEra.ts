import { extendDebug } from '../../Debugger'
import { FixtureRunner } from '../../Fixture'
import { SetForceEraForcingNewFixture } from '../../fixtures/staking/SetForceEraForcingNewFixture'
import { FlowProps } from '../../Flow'

export default async function setForceNewEra({ api, query, env }: FlowProps): Promise<void> {
  const debug = extendDebug('flow: setting ForceEra to ForceNew ')
  debug('started')
  api.enableDebugTxLogs()
  const setForceEraForcingNewFixture = new SetForceEraForcingNewFixture(api)
  const fixtureRunner = new FixtureRunner(setForceEraForcingNewFixture)
  await fixtureRunner.run()
}
