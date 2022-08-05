import electCouncil from '../flows/council/elect'
import proposalsDiscussion from '../flows/proposalsDiscussion'
import { scenario } from '../Scenario'

// eslint-disable-next-line @typescript-eslint/no-floating-promises
scenario('Proposals discussion', async ({ job, env }) => {
  const councilJob = job('electing council', electCouncil)
  job('proposal discussion', [proposalsDiscussion]).requires(councilJob)
})
