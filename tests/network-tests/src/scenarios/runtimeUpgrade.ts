import electCouncil from '../flows/council/elect'
import runtimeUpgradeProposal from '../flows/proposals/runtimeUpgradeProposal'
import { scenario } from '../Scenario'
import postRuntimeUpdateChecks from '../misc/postRuntimUpdateChecks'

// eslint-disable-next-line @typescript-eslint/no-floating-promises
scenario('Full', async ({ job, env, debug }) => {
  // Runtime upgrade should always be first job
  // (except councilJob, which is required for voting and should probably depend on the "source" runtime)
  const councilJob = job('electing council', electCouncil)
  const runtimeUpgradeProposalJob = job('runtime upgrade proposal', runtimeUpgradeProposal).requires(councilJob)

  // Runtime checks
  job('Run Post Upgrade Checks', postRuntimeUpdateChecks).requires(runtimeUpgradeProposalJob)
})
