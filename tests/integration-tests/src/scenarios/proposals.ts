import proposals from '../flows/proposals'
import cancellingProposals from '../flows/proposals/cancellingProposal'
import vetoProposal from '../flows/proposals/vetoProposal'
import electCouncil from '../flows/council/elect'
import { scenario } from '../Scenario'

scenario(async ({ job }) => {
  const councilJob = job('electing council', electCouncil)
  job('proposals', [proposals, cancellingProposals, vetoProposal]).requires(councilJob)
})
