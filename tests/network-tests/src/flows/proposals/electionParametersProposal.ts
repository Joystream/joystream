import { FlowProps } from '../../Flow'
import { ElectionParametersProposalFixture } from '../../fixtures/proposalsModule'
import { assert } from 'chai'
import { FixtureRunner } from '../../Fixture'
import Debugger from 'debug'
import { Resource } from '../../Resources'

// Election parameters proposal scenario
export default async function electionParametersProposal({ api, lock }: FlowProps): Promise<void> {
  const debug = Debugger('integration-tests:flow:electionParametersProposal')
  debug('Started')
  await lock(Resource.Proposals)
  debug('lock acquired contining flow')
  // Pre-Conditions: some members and an elected council
  const council = await api.getCouncil()
  assert.notEqual(council.length, 0)
  debug('selected proposer')
  const proposer = council[0].member.toString()

  const electionParametersProposalFixture = new ElectionParametersProposalFixture(api, proposer)
  debug('created fixture, running it')
  await new FixtureRunner(electionParametersProposalFixture).run()

  debug('Done')
}
