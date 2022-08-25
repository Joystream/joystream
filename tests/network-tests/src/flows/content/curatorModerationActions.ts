import BN from 'bn.js'
import {
  AddCuratorToCuratorGroupFixture,
  AddCuratorToGroupParams,
} from '../../fixtures/content/collaboratorAndCurator/addCuratorsToCuratorGroupFixture'
import { CreateCuratorGroupFixture, CuratorGroupParams } from '../../fixtures/content/createCuratorGroupFixture'
import { extendDebug } from '../../Debugger'
import { FixtureRunner } from '../../Fixture'
import {
  CreateChannelsAndVideosFixture,
  CreateContentStructureFixture,
  CreateMembersFixture,
} from '../../fixtures/content'
import { FlowProps } from '../../Flow'
import { createJoystreamCli } from '../utils'
import {
  DeleteVideoAsModeratorFixture,
  DeleteVideoAsModeratorParams,
} from '../../fixtures/content/curatorModeration/DeleteVideoByModerator'
import {
  DeleteVideoAssetsAsModeratorFixture,
  DeleteVideoAssetsAsModeratorParams,
} from '../../fixtures/content/curatorModeration/DeleteVideoAssetsByModerator'
import {
  DeleteChannelAsModeratorFixture,
  DeleteChannelAsModeratorParams,
} from '../../fixtures/content/curatorModeration/DeleteChannelAsModerator'

export default async function curatorModerationActions({ api, query, env }: FlowProps): Promise<void> {
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

  const { channelIds, videosData } = createChannelsAndVideos.getCreatedItems()

  // create curator & curator group

  const createCuratorGroupParams: CuratorGroupParams[] = [
    {
      isActive: true,
      permissionsByLevel: [
        {
          channelPrivilegeLevel: 0,
          contentModerationActionSet: ['DeleteChannel', 'DeleteVideo', 'DeleteVideoAssets'],
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
   * delete video as moderator
   */

  const numOfVideoObjectsToDelete = (await query.dataObjectsByVideoId(videosData[0].videoId.toString())).length
  const deleteVideoAsModeratorParams: DeleteVideoAsModeratorParams[] = [
    {
      asCurator: [curatorGroupId, curatorId],
      videoId: videosData[0].videoId, // first video
      numOfObjectsToDelete: numOfVideoObjectsToDelete,
      rationale: 'Deleted video due to offensive content',
    },
  ]

  const deleteVideoAsModeratorFixture = new DeleteVideoAsModeratorFixture(api, query, deleteVideoAsModeratorParams)
  await new FixtureRunner(deleteVideoAsModeratorFixture).runWithQueryNodeChecks()

  /**
   * delete video assets as moderator
   */

  const assetsToRemove = (await query.dataObjectsByVideoId(videosData[1].videoId.toString())).map(({ id }) =>
    Number(id)
  )
  const deleteVideoAssetsAsModeratorParams: DeleteVideoAssetsAsModeratorParams[] = [
    {
      asCurator: [curatorGroupId, curatorId],
      videoId: videosData[1].videoId, // second video
      assetsToRemove,
      rationale: 'Deleted video assets due to pirated content',
    },
  ]

  const deleteVideoAssetsAsModeratorFixture = new DeleteVideoAssetsAsModeratorFixture(
    api,
    query,
    deleteVideoAssetsAsModeratorParams
  )
  await new FixtureRunner(deleteVideoAssetsAsModeratorFixture).runWithQueryNodeChecks()

  /**
   * delete channel as moderator
   */

  // delete other video as well because for channel to be deleted, it should have no video
  const deleteSecondVideoAsModeratorParams: DeleteVideoAsModeratorParams[] = [
    {
      asCurator: [curatorGroupId, curatorId],
      videoId: videosData[1].videoId, // second video
      numOfObjectsToDelete: 0,
      rationale: 'Deleted 2nd video',
    },
  ]

  const deleteSecondVideoAsModeratorFixture = new DeleteVideoAsModeratorFixture(
    api,
    query,
    deleteSecondVideoAsModeratorParams
  )
  await new FixtureRunner(deleteSecondVideoAsModeratorFixture).runWithQueryNodeChecks()

  const deleteChannelAsModeratorParams: DeleteChannelAsModeratorParams[] = [
    {
      asCurator: [curatorGroupId, curatorId],
      channelId: channelIds[0],
      numOfObjectsToDelete: 2,
      rationale: 'Deleted channel due to repeated violations of ToS',
    },
  ]

  const deleteChannelAsModeratorFixture = new DeleteChannelAsModeratorFixture(
    api,
    query,
    deleteChannelAsModeratorParams
  )
  await new FixtureRunner(deleteChannelAsModeratorFixture).runWithQueryNodeChecks()

  debug('Done')
}
