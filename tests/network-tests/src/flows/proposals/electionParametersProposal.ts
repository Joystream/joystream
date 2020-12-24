import { FlowProps } from '../../Flow'
import { ElectionParametersProposalFixture } from '../../fixtures/proposalsModule'
import { assert } from 'chai'
import { FixtureRunner } from '../../Fixture'
import Debugger from 'debug'

// Election parameters proposal scenario
export default async function electionParametersProposal({ api }: FlowProps): Promise<void> {
  const debug = Debugger('flow:electionParametersProposal')
  debug('Started')

  // Pre-Conditions: some members and an elected council
  const council = await api.getCouncil()
  assert.notEqual(council.length, 0)

  const proposer = council[0].member.toString()

  const electionParametersProposalFixture = new ElectionParametersProposalFixture(api, proposer)
  await new FixtureRunner(electionParametersProposalFixture).run()

  debug('Done')
}
