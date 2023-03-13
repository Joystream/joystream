import electCouncil from '../flows/council/elect'
import failToElectCouncil from '../flows/council/failToElect'
import { scenario } from '../Scenario'
import failToElectWithBlacklist from '../flows/council/electWithBlacklist'

// eslint-disable-next-line @typescript-eslint/no-floating-promises
scenario('Council', async ({ job }) => {
  const councilJob = job('electing council', electCouncil)
  const firstElectionFailureJob = job('council election failures after first council', failToElectCouncil).requires(
    councilJob
  )

  const secondCouncilJob = job('electing second council', electCouncil).requires(firstElectionFailureJob)
  const secondElectionFailureJob = job('council election failure with blacklist', failToElectWithBlacklist).requires(
    secondCouncilJob
  )
  job('council election failures after second council', failToElectCouncil).requires(secondElectionFailureJob)
})
