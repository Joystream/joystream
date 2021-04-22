import { FlowProps } from '../../Flow'
import { CreateUpcomingOpeningFixture, RemoveUpcomingOpeningFixture } from '../../fixtures/workingGroupsModule'

import Debugger from 'debug'
import { FixtureRunner } from '../../Fixture'
import { workingGroups } from '../../types'

export default async function upcomingOpenings({ api, query, env }: FlowProps): Promise<void> {
  await Promise.all(
    workingGroups.map(async (group) => {
      const debug = Debugger(`flow:upcoming-openings:${group}`)
      debug('Started')
      api.enableDebugTxLogs()

      const createUpcomingOpeningFixture = new CreateUpcomingOpeningFixture(api, query, group)
      await new FixtureRunner(createUpcomingOpeningFixture).runWithQueryNodeChecks()
      const createdUpcomingOpeningId = createUpcomingOpeningFixture.getCreatedUpcomingOpeningId()

      const removeUpcomingOpeningFixture = new RemoveUpcomingOpeningFixture(api, query, group, createdUpcomingOpeningId)
      await new FixtureRunner(removeUpcomingOpeningFixture).runWithQueryNodeChecks()

      debug('Done')
    })
  )
}
