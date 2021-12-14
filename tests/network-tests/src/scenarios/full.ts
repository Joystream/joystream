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
import { manageWorkerFlow } from '../flows/workingGroup/manageWorkerAsLead'
import manageWorkerAsWorker from '../flows/workingGroup/manageWorkerAsWorker'
import workerPayout from '../flows/workingGroup/workerPayout'
import { scenario } from '../Scenario'
import { WorkingGroups } from '../WorkingGroups'

scenario(async ({ job }) => {
  job('creating members', creatingMemberships)

  const councilJob = job('council setup', councilSetup)

  const proposalsJob = job('proposals', [
    electionParametersProposal,
    spendingProposal,
    textProposal,
    validatorCountProposal,
    wgMintCapacityProposal.storage,
    wgMintCapacityProposal.content,
    manageLeaderRole.storage,
    manageLeaderRole.content,
  ]).requires(councilJob)

  const leadSetupJob = job('setup leads', [
    leaderSetup(WorkingGroups.Storage),
    leaderSetup(WorkingGroups.Content),
  ]).after(proposalsJob)

  // Test bug only on one instance of working group is sufficient
  job('at least value bug', atLeastValueBug).requires(leadSetupJob)

  // tests minting payouts (requires council to set mint capacity)
  job('worker payouts', [workerPayout.storage, workerPayout.content]).requires(leadSetupJob).requires(councilJob)

  job('working group tests', [
    manageWorkerFlow(WorkingGroups.Storage),
    manageWorkerAsWorker.storage,
    manageWorkerFlow(WorkingGroups.Content),
    manageWorkerAsWorker.content,
  ]).requires(leadSetupJob)
})
