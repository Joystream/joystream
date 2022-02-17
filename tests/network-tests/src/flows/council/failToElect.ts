import { FlowProps } from '../../Flow'
import { extendDebug } from '../../Debugger'
import { FixtureRunner } from '../../Fixture'
import { NotEnoughCandidatesFixture, NotEnoughCandidatesWithVotesFixture } from '../../fixtures/council'

// Currently only used by Olympia flow

export default async function failToElectCouncil({ api, query }: FlowProps): Promise<void> {
  const debug = extendDebug('flow:fail-to-elect-council')
  debug('Started')
  api.enableDebugTxLogs()

  const notEnoughCandidatesFixture = new NotEnoughCandidatesFixture(api, query)
  await new FixtureRunner(notEnoughCandidatesFixture).runWithQueryNodeChecks()

  const notEnoughCandidatesWithVotesFixture = new NotEnoughCandidatesWithVotesFixture(api, query)
  await new FixtureRunner(notEnoughCandidatesWithVotesFixture).runWithQueryNodeChecks()

  debug('Done')
}
