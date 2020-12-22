import creatingMemberships from '../flows/membership/creatingMemberships'
import councilSetup from '../flows/proposals/councilSetup'
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
// import workerPayout from '../flows/workingGroup/workerPayout'
import { scenario } from '../Scenario'

scenario(async ({ api, debug, job }) => {
  debug('Enabling failed tx logs')
  api.enableTxLogs()

  job('creating members', creatingMemberships)

  const councilJob = job('council setup', councilSetup)

  // Runtime is configured for MaxActiveProposalLimit = 5
  // So we should ensure we don't exceed that number of active proposals
  // which limits the number of concurrent tests that create proposals
  const proposalsJob1 = job('proposals 1', [
    electionParametersProposal,
    spendingProposal,
    textProposal,
    validatorCountProposal,
  ]).requires(councilJob)

  const proposalsJob2 = job('proposals 2', [wgMintCapacityProposal.storage, wgMintCapacityProposal.content])
    .requires(councilJob)
    .after(proposalsJob1)

  const leadRolesJob = job('lead roles', [manageLeaderRole.storage, manageLeaderRole.content])
    .requires(councilJob)
    .after(proposalsJob2)

  const leadSetupJob = job('setup leads', [leaderSetup.storage, leaderSetup.content]).after(leadRolesJob)

  // Test bug only on one instance of working group is sufficient
  const bugJob = job('at least value bug', atLeastValueBug).requires(leadSetupJob)

  job('working group tests', [
    manageWorkerAsLead.storage,
    manageWorkerAsWorker.storage,
    // workerPayout.storage, // this is stalling waiting for payout if council isn't created!?
    manageWorkerAsLead.content,
    manageWorkerAsWorker.content,
    // workerPayout.content, // this is stalling waiting for payout if council isn't created!?
  ])
    .requires(leadSetupJob)
    .after(bugJob)
})
