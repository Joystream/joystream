import { FlowProps } from '../../Flow'
import { extendDebug } from '../../Debugger'
import { FixtureRunner } from '../../Fixture'
import { ElectCouncilFixture } from '../../fixtures/council/ElectCouncilFixture'
import { assert } from 'chai'

async function createCandidatesAddresses(councilSize: number, extraCandidates: number, { api, env }: FlowProps) {
  const candidatesNumber = councilSize + extraCandidates
  if (councilSize > 1) {
    return (await api.createKeyPairs(candidatesNumber)).map(({ key }) => key.address)
  } else {
    assert.equal(extraCandidates, 0, 'no need for extra candidates when testing')
    const suri = env.COUNCILLOR_SURI
    assert(suri, 'suri for single councelor not specified')
    const candidate = api.createCustomKeyPair(suri.toString(), true)
    return [candidate.address]
  }
}
export default async function electCouncil(props: FlowProps): Promise<void> {
  const debug = extendDebug('flow:elect-council')
  const { api, query } = props
  debug('Started')
  api.enableDebugTxLogs()

  const extraCandidates = api.consts.council.minNumberOfExtraCandidates.toNumber()
  const councilSize = api.consts.council.councilSize.toNumber()
  const candidatesAddresses = await createCandidatesAddresses(councilSize, extraCandidates, props)

  const electCouncilFixture = new ElectCouncilFixture(api, query, candidatesAddresses)
  await new FixtureRunner(electCouncilFixture).run()

  debug('Done')
}
