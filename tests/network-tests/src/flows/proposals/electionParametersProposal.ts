import { Api } from '../../Api'
import { ElectionParametersProposalFixture } from '../../fixtures/proposalsModule'
import { assert } from 'chai'
import { FixtureRunner } from '../../Fixture'

// Election parameters proposal scenario
export default async function electionParametersProposal(api: Api, env: NodeJS.ProcessEnv) {
  // Pre-Conditions: some members and an elected council
  const council = await api.getCouncil()
  assert.notEqual(council.length, 0)

  const proposer = council[0].member.toString()

  const electionParametersProposalFixture = new ElectionParametersProposalFixture(api, proposer)
  await new FixtureRunner(electionParametersProposalFixture).run()
}
