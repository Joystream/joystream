import { FlowProps } from '../../Flow'
import { UpdateGroupStatusFixture } from '../../fixtures/workingGroups'

import Debugger from 'debug'
import { FixtureRunner } from '../../Fixture'
import { workingGroups } from '../../consts'
import { IWorkingGroupMetadata } from '@joystream/metadata-protobuf'
import _ from 'lodash'

export default async function groupStatus({ api, query, env }: FlowProps): Promise<void> {
  await Promise.all(
    workingGroups.map(async (group) => {
      const updates: IWorkingGroupMetadata[] = [
        { description: `${_.startCase(group)} Test Description`, about: `${_.startCase(group)} Test About Text` },
        {
          status: 'Testing',
          statusMessage: `${_.startCase(group)} is beeing tested`,
        },
        {
          description: `${_.startCase(group)} New Test Description`,
        },
        {
          status: 'Testing continues',
          statusMessage: `${_.startCase(group)} testing continues`,
        },
        {
          about: `${_.startCase(group)} New Test About`,
        },
        // Some edge cases:
        // Should not change anything:
        {},
        // Should not change anything:
        {
          status: null,
          statusMessage: null,
          about: null,
          description: null,
        },
        // Should change everything to empty strings:
        {
          status: '',
          statusMessage: '',
          about: '',
          description: '',
        },
        {
          status: 'Testing finished',
          statusMessage: '',
          description: `${_.startCase(group)} Test Description`,
          about: `${_.startCase(group)} Test About Text`,
        },
      ]

      const debug = Debugger(`flow:group-status:${group}`)
      debug('Started')
      api.enableDebugTxLogs()

      const updateGroupStatusFixture = new UpdateGroupStatusFixture(api, query, group, updates)
      await new FixtureRunner(updateGroupStatusFixture).runWithQueryNodeChecks()

      debug('Done')
    })
  )
}
