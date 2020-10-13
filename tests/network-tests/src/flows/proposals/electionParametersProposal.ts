import { Api } from '../../Api'
import { ElectionParametersProposalFixture } from '../../fixtures/proposalsModule'
import { assert } from 'chai'

// Election parameters proposal scenario
export default async function electionParametersProposal(api: Api, env: NodeJS.ProcessEnv) {
  // Pre-Conditions: some members and an elected council
  const council = await api.getCouncil()
  assert(council.length)

  const proposer = council[0].member.toString()

  const electionParametersProposalFixture = new ElectionParametersProposalFixture(api, proposer)
  await electionParametersProposalFixture.runner(false)
}
