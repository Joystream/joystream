import proposals from '../flows/proposals'
import cancellingProposals from '../flows/proposals/cancellingProposal'
import vetoProposal from '../flows/proposals/vetoProposal'
import electCouncil from '../flows/council/elect'
import runtimeUpgradeProposal from '../flows/proposals/runtimeUpgradeProposal'
import exactExecutionBlock from '../flows/proposals/exactExecutionBlock'
import expireProposal from '../flows/proposals/expireProposal'
import proposalsDiscussion from '../flows/proposalsDiscussion'
import { scenario } from '../Scenario'
import channelPayouts from '../flows/proposals/channelPayouts'
import invitingMembers from '../flows/membership/invitingMembers'

// eslint-disable-next-line @typescript-eslint/no-floating-promises
scenario('Proposals', async ({ job, env }) => {
  const councilJob = job('electing council', electCouncil)
  const runtimeUpgradeProposalJob = env.RUNTIME_UPGRADE_TARGET_WASM_PATH
    ? job('runtime upgrade proposal', runtimeUpgradeProposal).requires(councilJob)
    : undefined

  const channelPayoutsProposalJob = job('channel payouts proposal', channelPayouts).requires(councilJob)

  const coreJob = job('proposals & proposal discussion', [
    proposals,
    cancellingProposals,
    vetoProposal,
    exactExecutionBlock,
    expireProposal,
    proposalsDiscussion,
  ]).requires(runtimeUpgradeProposalJob || councilJob)

  coreJob.requires(channelPayoutsProposalJob)
})
