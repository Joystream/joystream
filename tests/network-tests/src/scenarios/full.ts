import creatingMemberships from '../flows/membership/creatingMemberships'
import councilSetup from '../flows/council/setup'
import leaderSetup from '../flows/workingGroup/leaderSetup'
import electionParametersProposal from '../flows/proposals/electionParametersProposal'
import manageLeaderRole from '../flows/proposals/manageLeaderRole'
import spendingProposal from '../flows/proposals/spendingProposal'
import textProposal from '../flows/proposals/textProposal'
import validatorCountProposal from '../flows/proposals/validatorCountProposal'
import wgMintCapacityProposal from '../flows/proposals/workingGroupMintCapacityProposal'
import atLeastValueBug from '../flows/workingGroup/atLeastValueBug'
import manageWorkerAsLead from '../flows/workingGroup/manageWorkerAsLead'
import manageWorkerAsWorker from '../flows/workingGroup/manageWorkerAsWorker'
import workerPayout from '../flows/workingGroup/workerPayout'
import { scenario } from '../Scenario'

scenario(async ({ job }) => {
  job('creating members', creatingMemberships)

  const councilJob = job('council setup', councilSetup)

  job('proposals', [
    electionParametersProposal,
    spendingProposal,
    textProposal,
    validatorCountProposal,
    wgMintCapacityProposal.storage,
    wgMintCapacityProposal.content,
  ]).requires(councilJob)

  const manageLeadsJob = job('lead-roles', [manageLeaderRole.storage, manageLeaderRole.content]).requires(councilJob)

  const leadSetupJob = job('setup leads', [leaderSetup.storage, leaderSetup.content]).after(manageLeadsJob)

  // Test bug only on one instance of working group is sufficient
  job('at least value bug', atLeastValueBug).requires(leadSetupJob)

  // tests minting payouts (requires council to set mint capacity)
  job('worker payouts', [workerPayout.storage, workerPayout.content]).requires(leadSetupJob).requires(councilJob)

  job('working group tests', [
    manageWorkerAsLead.storage,
    manageWorkerAsWorker.storage,
    manageWorkerAsLead.content,
    manageWorkerAsWorker.content,
  ]).requires(leadSetupJob)
})
