import { FlowProps } from '../../Flow'
import { extendDebug } from '../../Debugger'
import { FixtureRunner } from '../../Fixture'
import {
  ActiveVideoCountersFixture,
  CreateChannelsAndVideosFixture,
  CreateContentStructureFixture,
  CreateMembersFixture,
} from '../../fixtures/content'
import BN from 'bn.js'
import { createJoystreamCli } from '../utils'

export default async function activeVideoCounters({ api, query, env }: FlowProps): Promise<void> {
  const debug = extendDebug('flow:active-video-counters')
  debug('Started')
  api.enableDebugTxLogs()

  // create Joystream CLI
  const joystreamCli = await createJoystreamCli()

  // settings
  const videoCount = 2
  const videoCategoryCount = 2
  const channelCount = 2
  const channelCategoryCount = 2
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
  const { channelIds, videosData } = createChannelsAndVideos.getCreatedItems()

  // check that active video counters are working
  const activeVideoCountersFixture = new ActiveVideoCountersFixture(
    api,
    query,
    joystreamCli,
    channelCategoryIds,
    videosData,
    channelIds,
    videoCategoryIds
  )
  await new FixtureRunner(activeVideoCountersFixture).run()

  debug('Done')
}
