import creatingMemberships from '../flows/membership/creatingMemberships'
import councilSetup from '../flows/council/setup'
import electionParametersProposal from '../flows/proposals/electionParametersProposal'
import manageLeaderRole from '../flows/proposals/manageLeaderRole'
import spendingProposal from '../flows/proposals/spendingProposal'
import textProposal from '../flows/proposals/textProposal'
import validatorCountProposal from '../flows/proposals/validatorCountProposal'
import wgMintCapacityProposal from '../flows/proposals/workingGroupMintCapacityProposal'
import { scenario } from '../Scenario'

scenario('Proposals', async ({ job }) => {
  job('creating members', creatingMemberships)

  const councilJob = job('council setup', councilSetup)

  job('proposals', [
    electionParametersProposal,
    spendingProposal,
    textProposal,
    validatorCountProposal,
    wgMintCapacityProposal.storage,
    wgMintCapacityProposal.content,
    wgMintCapacityProposal.distribution,
    manageLeaderRole.storage,
    manageLeaderRole.content,
    manageLeaderRole.distribution,
  ]).requires(councilJob)
})
