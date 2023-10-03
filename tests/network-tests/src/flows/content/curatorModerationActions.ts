import BN from 'bn.js'
import { extendDebug } from '../../Debugger'
import { FixtureRunner } from '../../Fixture'
import { FlowProps } from '../../Flow'
import {
  CreateChannelsAndVideosFixture,
  CreateContentStructureFixture,
  CreateMembersFixture,
} from '../../fixtures/content'
import {
  AddCuratorToCuratorGroupFixture,
  AddCuratorToGroupParams,
} from '../../fixtures/content/collaboratorAndCurator/addCuratorsToCuratorGroupFixture'
import { CreateCuratorGroupFixture, CuratorGroupParams } from '../../fixtures/content/createCuratorGroupFixture'
import {
  DeleteChannelAssetsAsModeratorFixture,
  DeleteChannelAssetsAsModeratorParams,
} from '../../fixtures/content/curatorModeration/DeleteChannelAssetByModerator'
import {
  DeleteVideoAssetsAsModeratorFixture,
  DeleteVideoAssetsAsModeratorParams,
} from '../../fixtures/content/curatorModeration/DeleteVideoAssetsByModerator'
import { createJoystreamCli } from '../utils'

export default async function curatorModerationActions({ api, query }: FlowProps): Promise<void> {
  const debug = extendDebug('flow:curator-moderation-actions')
  debug('Started')
  api.enableDebugTxLogs()

  // create Joystream CLI
  const joystreamCli = await createJoystreamCli()

  // settings
  const videoCount = 2 // should be equal to number of uses of `nextVideo()` below
  const videoCategoryCount = 1
  const channelCount = 1
  const channelOwnerCount = channelCount
  const curatorCount = 1
  const sufficientTopupAmount = new BN(10_000_000_000_000) // some very big number to cover fees of all transactions

  // prepare content

  const createContentStructureFixture = new CreateContentStructureFixture(api, query, joystreamCli, videoCategoryCount)
  await new FixtureRunner(createContentStructureFixture).run()

  const { videoCategoryIds } = createContentStructureFixture.getCreatedItems()

  // create author of channels and videos as well as auction participants
  const createMembersFixture = new CreateMembersFixture(
    api,
    query,
    channelOwnerCount,
    curatorCount,
    sufficientTopupAmount
  )
  await new FixtureRunner(createMembersFixture).run()

  const {
    members: [channelOwner],
    curators: [curatorId],
  } = createMembersFixture.getCreatedItems()

  const createChannelsAndVideos = new CreateChannelsAndVideosFixture(
    api,
    query,
    joystreamCli,
    channelCount,
    videoCount,
    videoCategoryIds[0],
    channelOwner
  )
  await new FixtureRunner(createChannelsAndVideos).run()

  const { videosData, channelIds } = createChannelsAndVideos.getCreatedItems()

  // create curator & curator group

  const createCuratorGroupParams: CuratorGroupParams[] = [
    {
      isActive: true,
      permissionsByLevel: [
        {
          channelPrivilegeLevel: 0,
          contentModerationActionSet: ['DeleteVideoAssets', 'DeleteNonVideoChannelAssets'],
          permissionToDeleteNftAssets: false,
        },
      ],
    },
  ]

  const createCuratorGroupFixture = new CreateCuratorGroupFixture(api, query, createCuratorGroupParams)
  await new FixtureRunner(createCuratorGroupFixture).run()

  const curatorGroupId = createCuratorGroupFixture.getCreatedCuratorGroupId()

  const addCuratorToGroupParams: AddCuratorToGroupParams[] = [
    {
      curatorGroupId,
      curatorId,
      permissions: ['AddVideo', 'DeleteVideo'],
    },
  ]

  const addCuratorToGroupFixture = new AddCuratorToCuratorGroupFixture(api, query, addCuratorToGroupParams)
  await new FixtureRunner(addCuratorToGroupFixture).run()

  // test curator moderation actions

  /**
   * delete channel assets as moderator
   */

  const channelAssetsToRemove = (await query.dataObjectsByChannelId(channelIds[0].toString())).map(({ id }) =>
    Number(id)
  )
  const deleteChannelAssetsAsModeratorParams: DeleteChannelAssetsAsModeratorParams[] = [
    {
      asCurator: [curatorGroupId, curatorId],
      channelId: channelIds[0], // first channel
      assetsToRemove: channelAssetsToRemove,
      rationale: 'Deleted channel assets due to pirated content',
    },
  ]

  const deleteChannelAssetsAsModeratorFixture = new DeleteChannelAssetsAsModeratorFixture(
    api,
    query,
    deleteChannelAssetsAsModeratorParams
  )
  await new FixtureRunner(deleteChannelAssetsAsModeratorFixture).runWithQueryNodeChecks()

  /**
   * delete video assets as moderator
   */

  const videoAssetsToRemove = (await query.dataObjectsByVideoId(videosData[1].videoId.toString())).map(({ id }) =>
    Number(id)
  )
  const deleteVideoAssetsAsModeratorParams: DeleteVideoAssetsAsModeratorParams[] = [
    {
      asCurator: [curatorGroupId, curatorId],
      videoId: videosData[1].videoId, // second video
      assetsToRemove: videoAssetsToRemove,
      rationale: 'Deleted video assets due to pirated content',
    },
  ]

  const deleteVideoAssetsAsModeratorFixture = new DeleteVideoAssetsAsModeratorFixture(
    api,
    query,
    deleteVideoAssetsAsModeratorParams
  )
  await new FixtureRunner(deleteVideoAssetsAsModeratorFixture).runWithQueryNodeChecks()

  debug('Done')
}
