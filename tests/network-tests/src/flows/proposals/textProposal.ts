import { FlowArgs } from '../../Flow'
import { TextProposalFixture } from '../../fixtures/proposalsModule'
import { assert } from 'chai'
import { FixtureRunner } from '../../Fixture'
import Debugger from 'debug'

export default async function textProposal({ api }: FlowArgs): Promise<void> {
  const debug = Debugger('flow:textProposal')
  debug('Started')

  // Pre-conditions: members and council
  const council = await api.getCouncil()
  assert(council.length)

  const proposer = council[0].member.toString()

  const textProposalFixture: TextProposalFixture = new TextProposalFixture(api, proposer)
  await new FixtureRunner(textProposalFixture).run()

  debug('Done')
}
