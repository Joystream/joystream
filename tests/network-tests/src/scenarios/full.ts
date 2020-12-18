import { WsProvider } from '@polkadot/api'
import { Api, WorkingGroups } from '../Api'
import { config } from 'dotenv'
import Debugger from 'debug'

import creatingMemberships from '../flows/membership/creatingMemberships'
import councilSetup from '../flows/proposals/councilSetup'
import leaderSetup from '../flows/workingGroup/leaderSetup'
import electionParametersProposal from '../flows/proposals/electionParametersProposal'
import manageLeaderRole from '../flows/proposals/manageLeaderRole'
import spendingProposal from '../flows/proposals/spendingProposal'
import textProposal from '../flows/proposals/textProposal'
import validatorCountProposal from '../flows/proposals/validatorCountProposal'
import workingGroupMintCapacityProposal from '../flows/proposals/workingGroupMintCapacityProposal'
import atLeastValueBug from '../flows/workingGroup/atLeastValueBug'
import manageWorkerAsLead from '../flows/workingGroup/manageWorkerAsLead'
import manageWorkerAsWorker from '../flows/workingGroup/manageWorkerAsWorker'
import workerPayout from '../flows/workingGroup/workerPayout'

const scenario = async () => {
  const debug = Debugger('scenario:full')

  // Load env variables
  config()
  const env = process.env

  // Connect api to the chain
  const nodeUrl: string = env.NODE_URL || 'ws://127.0.0.1:9944'
  const provider = new WsProvider(nodeUrl)
  const api: Api = await Api.create(provider, env.TREASURY_ACCOUNT_URI || '//Alice', env.SUDO_ACCOUNT_URI || '//Alice')

  await Promise.all([creatingMemberships(api, env), councilSetup(api, env)])

  // Runtime is configured for MaxActiveProposalLimit = 5
  // So we should ensure we don't exceed that number of active proposals
  // which limits the number of concurrent tests that create proposals
  api.enableTxLogs()
  await Promise.all([
    electionParametersProposal(api, env),
    spendingProposal(api, env),
    textProposal(api, env),
    validatorCountProposal(api, env),
  ])

  await Promise.all([
    workingGroupMintCapacityProposal(api, env, WorkingGroups.StorageWorkingGroup),
    workingGroupMintCapacityProposal(api, env, WorkingGroups.ContentDirectoryWorkingGroup),
    manageLeaderRole(api, env, WorkingGroups.StorageWorkingGroup),
    manageLeaderRole(api, env, WorkingGroups.ContentDirectoryWorkingGroup),
  ])

  await Promise.all([
    leaderSetup(api, env, WorkingGroups.StorageWorkingGroup),
    leaderSetup(api, env, WorkingGroups.ContentDirectoryWorkingGroup),
  ])

  // All tests below require an active Lead for each group
  // Test bug only on one instance of working group is sufficient
  await atLeastValueBug(api, env)

  await Promise.all([
    manageWorkerAsLead(api, env, WorkingGroups.StorageWorkingGroup),
    manageWorkerAsWorker(api, env, WorkingGroups.StorageWorkingGroup),
    workerPayout(api, env, WorkingGroups.StorageWorkingGroup),
    manageWorkerAsLead(api, env, WorkingGroups.ContentDirectoryWorkingGroup),
    manageWorkerAsWorker(api, env, WorkingGroups.ContentDirectoryWorkingGroup),
    workerPayout(api, env, WorkingGroups.ContentDirectoryWorkingGroup),
  ])

  // Note: disconnecting and then reconnecting to the chain in the same process
  // doesn't seem to work!
  api.close()
}

scenario()
