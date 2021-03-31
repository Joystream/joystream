import { FlowProps } from '../../Flow'
import { TextProposalFixture } from '../../fixtures/proposalsModule'
import { assert } from 'chai'
import { FixtureRunner } from '../../Fixture'
import { extendDebug } from '../../Debugger'
import { Resource } from '../../Resources'

export default async function textProposal({ api, lock }: FlowProps): Promise<void> {
  const debug = extendDebug('flow:textProposal')
  debug('Started')
  await lock(Resource.Proposals)

  // Pre-conditions: members and council
  const council = await api.getCouncil()
  assert(council.length)

  const proposer = council[0].member.toString()

  const textProposalFixture: TextProposalFixture = new TextProposalFixture(api, proposer)
  await new FixtureRunner(textProposalFixture).run()

  debug('Done')
}
