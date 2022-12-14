import electCouncil from '../flows/council/elect'
import failToElectCouncil from '../flows/council/failToElect'
import { scenario } from '../Scenario'

// eslint-disable-next-line @typescript-eslint/no-floating-promises
scenario('Council', async ({ job }) => {
  const councilJob = job('electing council', electCouncil)
  const secondCouncilJob = job('electing second council', electCouncil).requires(councilJob)

  job('council election failures', failToElectCouncil).requires(secondCouncilJob)
})
