import { FlowProps } from '../../Flow'
import { ElectionParametersProposalFixture } from '../../fixtures/proposalsModule'
import { assert } from 'chai'
import { FixtureRunner } from '../../Fixture'
import { extendDebug } from '../../Debugger'
import { Resource } from '../../Resources'

// Election parameters proposal scenario
export default async function electionParametersProposal({ api, lock }: FlowProps): Promise<void> {
  const debug = extendDebug('flow:electionParametersProposal')
  debug('Started')
  await lock(Resource.Proposals)

  // Pre-Conditions: some members and an elected council
  const council = await api.getCouncil()
  assert.notEqual(council.length, 0)

  const proposer = council[0].member.toString()

  const electionParametersProposalFixture = new ElectionParametersProposalFixture(api, proposer)

  await new FixtureRunner(electionParametersProposalFixture).run()

  debug('Done')
}
