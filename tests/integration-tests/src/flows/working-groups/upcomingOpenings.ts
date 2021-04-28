import { FlowProps } from '../../Flow'
import { CreateUpcomingOpeningsFixture, RemoveUpcomingOpeningsFixture } from '../../fixtures/workingGroups'

import Debugger from 'debug'
import { FixtureRunner } from '../../Fixture'
import { workingGroups } from '../../consts'
import { UpcomingOpeningParams } from '../../fixtures/workingGroups/BaseCreateOpeningFixture'

export default async function upcomingOpenings({ api, query, env }: FlowProps): Promise<void> {
  await Promise.all(
    workingGroups.map(async (group) => {
      const debug = Debugger(`flow:upcoming-openings:${group}`)
      debug('Started')
      api.enableDebugTxLogs()

      const upcomingOpeningsParams: Partial<UpcomingOpeningParams>[] = [
        // All defaults case:
        {},
        // Invalid metadata case:
        {
          metadata: '0xff',
          expectMetadataFailue: true,
        },
        // Edge-case valid metadata:
        {
          metadata: {
            shortDescription: '',
            description: '',
            expectedEndingTimestamp: 0,
            hiringLimit: 0,
            applicationDetails: '',
            applicationFormQuestions: [],
          },
        },
      ]
      const createUpcomingOpeningFixture = new CreateUpcomingOpeningsFixture(api, query, group, upcomingOpeningsParams)
      await new FixtureRunner(createUpcomingOpeningFixture).runWithQueryNodeChecks()
      const [createdUpcomingOpeningId] = createUpcomingOpeningFixture.getCreatedUpcomingOpeningIds()

      const removeUpcomingOpeningFixture = new RemoveUpcomingOpeningsFixture(api, query, group, [
        createdUpcomingOpeningId,
      ])
      await new FixtureRunner(removeUpcomingOpeningFixture).runWithQueryNodeChecks()

      debug('Done')
    })
  )
}
