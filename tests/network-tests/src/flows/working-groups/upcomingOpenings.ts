import { FlowProps } from '../../Flow'
import {
  CreateUpcomingOpeningsFixture,
  DEFAULT_UPCOMING_OPENING_META,
  RemoveUpcomingOpeningsFixture,
  UpcomingOpeningParams,
} from '../../fixtures/workingGroups'

import { extendDebug } from '../../Debugger'
import { FixtureRunner } from '../../Fixture'
import { workingGroups } from '../../consts'
import Long from 'long'

const upcomingOpeningsToCreate: UpcomingOpeningParams[] = [
  // All defaults case:
  {
    meta: DEFAULT_UPCOMING_OPENING_META,
  },
  // Invalid metadata case:
  {
    meta: '0xff',
    expectMetadataFailure: true,
  },
  // Valid metadata edge-cases
  {
    meta: {
      expectedStart: 0,
      minApplicationStake: Long.fromString('0'),
      rewardPerBlock: Long.fromString('0'),
      metadata: {
        shortDescription: '',
        description: '',
        expectedEndingTimestamp: 0,
        hiringLimit: 0,
        applicationDetails: '',
        applicationFormQuestions: [],
      },
    },
  },
  {
    meta: {
      expectedStart: null,
      minApplicationStake: null,
      rewardPerBlock: null,
      metadata: {
        shortDescription: null,
        description: null,
        expectedEndingTimestamp: null,
        hiringLimit: null,
        applicationDetails: null,
        applicationFormQuestions: null,
      },
    },
  },
  {
    meta: {},
  },
  {
    meta: {
      metadata: {
        hiringLimit: 1,
        applicationFormQuestions: [{}],
      },
    },
  },
]

export default async function upcomingOpenings({ api, query, env }: FlowProps): Promise<void> {
  await Promise.all(
    workingGroups.map(async (group) => {
      const debug = extendDebug(`flow:upcoming-openings:${group}`)
      debug('Started')
      api.enableDebugTxLogs()
      const createUpcomingOpeningFixture = new CreateUpcomingOpeningsFixture(
        api,
        query,
        group,
        upcomingOpeningsToCreate
      )
      await new FixtureRunner(createUpcomingOpeningFixture).runWithQueryNodeChecks()
      const createdUpcomingOpeningIds = createUpcomingOpeningFixture.getCreatedUpcomingOpeningIds()

      const removeUpcomingOpeningFixture = new RemoveUpcomingOpeningsFixture(
        api,
        query,
        group,
        createdUpcomingOpeningIds
      )
      await new FixtureRunner(removeUpcomingOpeningFixture).runWithQueryNodeChecks()

      debug('Done')
    })
  )
}
