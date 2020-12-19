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

scenario(async ({ api, env, debug }) => {
  debug('Enabling failed tx logs')
  api.enableTxLogs()

  await Promise.all([creatingMemberships(api, env), councilSetup(api, env)])

  // Runtime is configured for MaxActiveProposalLimit = 5
  // So we should ensure we don't exceed that number of active proposals
  // which limits the number of concurrent tests that create proposals
  await Promise.all([
    electionParametersProposal(api, env),
    spendingProposal(api, env),
    textProposal(api, env),
    validatorCountProposal(api, env),
  ])

  await Promise.all([
    wgMintCapacityProposal.storage(api, env),
    wgMintCapacityProposal.content(api, env),
    manageLeaderRole.storage(api, env),
    manageLeaderRole.content(api, env),
  ])

  await Promise.all([leaderSetup.storage(api, env), leaderSetup.content(api, env)])

  // All tests below require an active Lead for each group
  // Test bug only on one instance of working group is sufficient
  await atLeastValueBug(api, env)

  await Promise.all([
    manageWorkerAsLead.storage(api, env),
    manageWorkerAsWorker.storage(api, env),
    workerPayout.storage(api, env),
    manageWorkerAsLead.content(api, env),
    manageWorkerAsWorker.content(api, env),
    workerPayout.content(api, env),
  ])
})
