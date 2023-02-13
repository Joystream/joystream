import { FlowProps } from '../../Flow'
import { extendDebug } from '../../Debugger'
import { FixtureRunner } from '../../Fixture'
import { ElectCouncilFixture } from '../../fixtures/council/ElectCouncilFixture'
import { assert } from 'chai'

function createSingleCouncilorAddress({ api, env }: FlowProps) {
  const suri = env.COUNCILLOR_SURI
  assert(suri, 'suri for single councelor not specified')
  const candidate = api.createCustomKeyPair(suri.toString(), true)
  return [candidate.address]
}
export default async function electCouncil(props: FlowProps): Promise<void> {
  const debug = extendDebug('flow:elect-council')
  const { api, query } = props
  debug('Started')
  api.enableDebugTxLogs()

  const councilSize = api.consts.council.councilSize.toNumber()

  // if single councilor (playground setting) use custom key
  const candidates = councilSize === 1 ? createSingleCouncilorAddress(props) : undefined
  const electCouncilFixture = new ElectCouncilFixture(api, query, candidates)
  await new FixtureRunner(electCouncilFixture).run()

  debug('Done')
}
