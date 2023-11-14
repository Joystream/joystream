import electCouncil from '../flows/council/electOnlyIfNoElected'
import runtimeUpgradeProposal from '../flows/proposals/runtimeUpgradeProposal'
import { scenario } from '../Scenario'

// eslint-disable-next-line @typescript-eslint/no-floating-promises
scenario('Runtime Upgrade', async ({ job }) => {
  job('Perform runtime upgrade', runtimeUpgradeProposal).requires(job('electing council', electCouncil))
})
