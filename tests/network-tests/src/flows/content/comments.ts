import BN from 'bn.js'
import { extendDebug } from '../../Debugger'
import { FixtureRunner } from '../../Fixture'
import {
  CommentParams,
  CreateChannelsAndVideosFixture,
  CreateCommentsFixture,
  CreateContentStructureFixture,
  CreateMembersFixture,
} from '../../fixtures/content'
import { FlowProps } from '../../Flow'
import { createJoystreamCli } from '../utils'
import Long from 'long'

export default async function comments({ api, query, env }: FlowProps): Promise<void> {
  const debug = extendDebug('flow:video-comments')
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
  const author = createMembersFixture.getCreatedItems()

  // create channels and videos
  const createChannelsAndVideos = new CreateChannelsAndVideosFixture(
    api,
    query,
    joystreamCli,
    channelCount,
    videoCount,
    channelCategoryIds[0],
    videoCategoryIds[0],
    author[0]
  )
  await new FixtureRunner(createChannelsAndVideos).run()
  const { videosData } = createChannelsAndVideos.getCreatedItems()

  // Create comments
  const comments: CommentParams[] = [
    // Valid cases:
    {
      msg: {
        videoId: Long.fromNumber(videosData[0].videoId),
        body: 'Some text',
      },
      asMember: author[1].memberId,
    },

    // Invalid cases
  ]

  // check that comments on videos are working
  const createCommentsFixture = new CreateCommentsFixture(api, query, comments)
  await new FixtureRunner(createCommentsFixture).run()

  debug('Done')
}
