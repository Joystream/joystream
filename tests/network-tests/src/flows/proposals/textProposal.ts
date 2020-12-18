import { Api } from '../../Api'
import { TextProposalFixture } from '../../fixtures/proposalsModule'
import { assert } from 'chai'
import { FixtureRunner } from '../../Fixture'

export default async function textProposal(api: Api, env: NodeJS.ProcessEnv) {
  // Pre-conditions: members and council
  const council = await api.getCouncil()
  assert(council.length)

  const proposer = council[0].member.toString()

  const textProposalFixture: TextProposalFixture = new TextProposalFixture(api, proposer)
  await new FixtureRunner(textProposalFixture).run()
}
