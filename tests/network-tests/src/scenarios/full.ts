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
import workerPayout from '../flows/workingGroup/workerPayout'
import { scenario } from '../Scenario'

scenario(async ({ api, debug, job }) => {
  debug('Enabling failed tx logs')
  api.enableTxLogs()

  job([creatingMemberships])

  const councilJob = job([councilSetup])

  // Runtime is configured for MaxActiveProposalLimit = 5
  // So we should ensure we don't exceed that number of active proposals
  // which limits the number of concurrent tests that create proposals
  const proposalsJob1 = job([
    electionParametersProposal,
    spendingProposal,
    textProposal,
    validatorCountProposal,
  ]).afterSuccessOf(councilJob)

  job([wgMintCapacityProposal.storage, wgMintCapacityProposal.content])
    .afterSuccessOf(councilJob)
    .afterSuccessOf(proposalsJob1)

  const leadRolesJob = job([manageLeaderRole.storage, manageLeaderRole.content])
    .afterSuccessOf(councilJob)
    .afterSuccessOf(proposalsJob1)

  const leadSetupJob = job([leaderSetup.storage, leaderSetup.content]).afterSuccessOf(leadRolesJob)

  /* All tests below require an active Lead for each group */

  // Test bug only on one instance of working group is sufficient
  job([atLeastValueBug]).afterSuccessOf(leadSetupJob)

  job([
    manageWorkerAsLead.storage,
    manageWorkerAsWorker.storage,
    workerPayout.storage,
    manageWorkerAsLead.content,
    manageWorkerAsWorker.content,
    workerPayout.content,
  ]).afterSuccessOf(leadSetupJob)
})
