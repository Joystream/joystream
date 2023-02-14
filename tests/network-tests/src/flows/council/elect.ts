import { FlowProps } from '../../Flow'
import { extendDebug } from '../../Debugger'
import { FixtureRunner } from '../../Fixture'
import { ElectCouncilFixture } from '../../fixtures/council/ElectCouncilFixture'
import { assert } from 'chai'

export default async function electCouncil(props: FlowProps): Promise<void> {
  const debug = extendDebug('flow:elect-council')
  const { api, query } = props
  debug('Started')
  api.enableDebugTxLogs()

  const electCouncilFixture = new ElectCouncilFixture(api, query)
  await new FixtureRunner(electCouncilFixture).run()

  debug('Done')
}
