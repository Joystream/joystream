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
import sleep from 'sleep-promise'

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
  const sufficientTopupAmount = new BN(10_000_000_000_000) // some very big number to cover fees of all transactions

  // flow itself

  // create channel categories and video categories
  const createContentStructureFixture = new CreateContentStructureFixture(api, query, joystreamCli, videoCategoryCount)
  await new FixtureRunner(createContentStructureFixture).run()

  const { videoCategoryIds } = createContentStructureFixture.getCreatedItems()

  // create author of channels and videos
  const createMembersFixture = new CreateMembersFixture(api, query, 1, 0, sufficientTopupAmount)
  await new FixtureRunner(createMembersFixture).run()
  const author = createMembersFixture.getCreatedItems().members[0]

  // create channels and videos
  const createChannelsAndVideos = new CreateChannelsAndVideosFixture(
    api,
    query,
    joystreamCli,
    channelCount,
    videoCount,
    videoCategoryIds[0],
    author
  )
  await new FixtureRunner(createChannelsAndVideos).run()
  const { channelIds, videosData } = createChannelsAndVideos.getCreatedItems()

  // Allow time for processor to process videos created
  await sleep(10 * 1000)

  // check that active video counters are working
  const activeVideoCountersFixture = new ActiveVideoCountersFixture(
    api,
    query,
    joystreamCli,
    channelIds,
    videosData,
    videoCategoryIds
  )
  await new FixtureRunner(activeVideoCountersFixture).run()

  debug('Done')
}
