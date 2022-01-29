import { FlowProps } from '../../Flow'
import { extendDebug } from '../../Debugger'
import { FixtureRunner } from '../../Fixture'
import {
  ActiveVideoCountersFixture,
  CreateChannelsAndVideosFixture,
  CreateContentStructureFixture,
} from '../../fixtures/content'
import { PaidTermId } from '@joystream/types/members'
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

  const paidTerms: PaidTermId = api.createPaidTermId(new BN(+env.MEMBERSHIP_PAID_TERMS!))

  // flow itself

  const createContentStructureFixture = new CreateContentStructureFixture(
    api,
    query,
    joystreamCli,
    videoCategoryCount,
    channelCategoryCount
  )
  await new FixtureRunner(createContentStructureFixture).run()

  const { channelCategoryIds, videoCategoryIds } = createContentStructureFixture.getCreatedItems()

  const createChannelsAndVideos = new CreateChannelsAndVideosFixture(
    api,
    query,
    joystreamCli,
    paidTerms,
    videoCount,
    channelCount,
    channelCategoryIds[0],
    videoCategoryIds[0]
  )
  await new FixtureRunner(createChannelsAndVideos).run()

  const { channelIds, videosData } = createChannelsAndVideos.getCreatedItems()

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
