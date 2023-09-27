import electCouncil from '../flows/council/elect'
import runtimeUpgradeProposal from '../flows/proposals/runtimeUpgradeProposal'
import { scenario } from '../Scenario'

// eslint-disable-next-line @typescript-eslint/no-floating-promises
scenario('Full', async ({ job }) => {
  const councilJob = job('electing council', electCouncil)
  job('runtime upgrade proposal', runtimeUpgradeProposal).requires(councilJob)
})
