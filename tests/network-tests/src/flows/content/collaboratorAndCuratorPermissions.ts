import BN from 'bn.js'
import { FlowProps } from '../../Flow'
import { extendDebug } from '../../Debugger'
import { FixtureRunner } from '../../Fixture'
import {
  AddCuratorToCuratorGroupFixture,
  AddCuratorToGroupParams,
  CreateChannelsAndVideosFixture,
  CreateCuratorGroupFixture,
  CreateMembersFixture,
  CuratorGroupParams,
  UpdateChannelCollaboratorsFixture,
  DeleteChannelWithVideosFixture,
} from '../../fixtures/content'
import { createJoystreamCli } from '../utils'

export default async function collaboratorCuratorPermissions({ api, query, env }: FlowProps): Promise<void> {
  const debug = extendDebug('flow:collaborator-and-curator-permissions')
  debug('Started')
  api.enableDebugTxLogs()

  // create Joystream CLI
  const joystreamCli = await createJoystreamCli()

  // settings
  const testingPermissions = ['AddVideo', 'DeleteVideo'] as AddCuratorToGroupParams['permissions']
  const extraTestingPermissions = ['UpdateVideoMetadata'] as AddCuratorToGroupParams['permissions']
  const memberCount = 1
  const curatorCount = 1
  const sufficientTopupAmount = new BN(10_000_000_000_000) // some very big number to cover fees of all transactions

  // flow itself

  // create curator
  const createMembersFixture = new CreateMembersFixture(api, query, memberCount, curatorCount, sufficientTopupAmount)
  await new FixtureRunner(createMembersFixture).run()

  const {
    members: [author],
    curators: [curatorId],
  } = createMembersFixture.getCreatedItems()

  // create curator group
  const createCuratorGroupParams: CuratorGroupParams[] = [
    {
      isActive: true,
      permissionsByLevel: [],
    },
  ]

  const createCuratorGroupFixture = new CreateCuratorGroupFixture(api, query, createCuratorGroupParams)
  await new FixtureRunner(createCuratorGroupFixture).run()

  // add curator to group
  const curatorGroupId = createCuratorGroupFixture.getCreatedCuratorGroupId()
  const addCuratorToGroupParams: AddCuratorToGroupParams[] = [
    {
      curatorGroupId,
      curatorId,
      permissions: testingPermissions,
    },
  ]

  const addCuratorToGroupFixture = new AddCuratorToCuratorGroupFixture(api, query, addCuratorToGroupParams)
  await new FixtureRunner(addCuratorToGroupFixture).run()

  const firstCuratorIndex = 0
  await addCuratorToGroupFixture.checkCuratorPermissions(firstCuratorIndex)

  // create channel
  const notUsed = 0
  const notUsedString = ''
  const oneChannel = 1
  const collaborators = [{ memberId: curatorId.toNumber(), permissions: testingPermissions }]
  const nextCollaborators = [
    { memberId: curatorId.toNumber(), permissions: testingPermissions.concat(extraTestingPermissions) },
  ]

  const createChannelsAndVideosFixture = new CreateChannelsAndVideosFixture(
    api,
    query,
    joystreamCli,
    oneChannel,
    notUsed,
    notUsedString,
    author,
    collaborators
  )
  await new FixtureRunner(createChannelsAndVideosFixture).run()
  const {
    channelIds: [channelId],
  } = createChannelsAndVideosFixture.getCreatedItems()

  // update channel collaborators

  const updateChannelCollaboratorsFixture = new UpdateChannelCollaboratorsFixture(
    api,
    query,
    joystreamCli,
    channelId,
    collaborators,
    nextCollaborators
  )
  await new FixtureRunner(updateChannelCollaboratorsFixture).run()

  // Delete videos & channels (to ensure all referencing relations are properly removed without causing QN processor crash)
  const deleteChannelWithVideosFixture = new DeleteChannelWithVideosFixture(api, query, joystreamCli, [channelId])
  await new FixtureRunner(deleteChannelWithVideosFixture).run()

  debug('Done')
}
