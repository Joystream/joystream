import BN from 'bn.js'
import { extendDebug } from '../../Debugger'
import { FixtureRunner } from '../../Fixture'
import {
  CreateChannelsAndVideosFixture,
  CreateContentStructureFixture,
  CreateMembersFixture,
  PlaylistActionsFixture,
} from '../../fixtures/content'
import { FlowProps } from '../../Flow'
import { createJoystreamCli } from '../utils'

export default async function channelPlaylists({ api, query }: FlowProps): Promise<void> {
  const debug = extendDebug('flow:channel-playlists')
  debug('Started')
  api.enableDebugTxLogs()

  // create Joystream CLI
  const joystreamCli = await createJoystreamCli()

  // settings
  const videoCount = 3
  const videoCategoryCount = 1
  const channelCount = 1
  const channelCategoryCount = 1
  const sufficientTopupAmount = new BN(1000000) // some very big number to cover fees of all transactions

  // flow itself

  // create channel categories and video categories
  const createContentStructureFixture = new CreateContentStructureFixture(
    api,
    query,
    joystreamCli,
    videoCategoryCount,
    channelCategoryCount
  )
  await new FixtureRunner(createContentStructureFixture).run()

  const { channelCategoryIds, videoCategoryIds } = createContentStructureFixture.getCreatedItems()

  // create author of channels and videos
  const createMembersFixture = new CreateMembersFixture(api, query, 1, sufficientTopupAmount)
  await new FixtureRunner(createMembersFixture).run()
  const author = createMembersFixture.getCreatedItems()[0]

  // create channels and videos
  const createChannelsAndVideos = new CreateChannelsAndVideosFixture(
    api,
    query,
    joystreamCli,
    channelCount,
    videoCount,
    channelCategoryIds[0],
    videoCategoryIds[0],
    author
  )
  await new FixtureRunner(createChannelsAndVideos).run()
  const {
    channelIds: [channelId],
    videosData,
  } = createChannelsAndVideos.getCreatedItems()

  // create playlist
  const createPlaylistFixture = new PlaylistActionsFixture(
    api,
    query,
    joystreamCli,
    'CREATE',
    channelId,
    videosData.map((d) => (d.videoId as unknown) as Long),
    author,
    undefined
  )
  await new FixtureRunner(createPlaylistFixture).run()

  const { playlistId } = createPlaylistFixture.getCreatedPlaylist()

  // update playlist (reverse videos in playlist)
  const updatePlaylistFixture = new PlaylistActionsFixture(
    api,
    query,
    joystreamCli,
    'UPDATE',
    channelId,
    videosData.reverse().map((d) => (d.videoId as unknown) as Long),
    author,
    playlistId
  )
  await new FixtureRunner(updatePlaylistFixture).run()

  // deleting playlist
  const deletePlaylistFixture = new PlaylistActionsFixture(
    api,
    query,
    joystreamCli,
    'DELETE',
    channelId,
    [],
    author,
    playlistId
  )
  await new FixtureRunner(deletePlaylistFixture).run()

  debug('Done')
}
