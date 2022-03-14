import BN from 'bn.js'
import { extendDebug } from '../../Debugger'
import { FixtureRunner } from '../../Fixture'
import {
  CreateCommentParams,
  CreateChannelsAndVideosFixture,
  CreateCommentsFixture,
  CreateContentStructureFixture,
  CreateMembersFixture,
  ReactToVideosFixture,
  ReactVideoParams,
  ReactCommentParams,
  ReactToCommentsFixture,
} from '../../fixtures/content'
import { FlowProps } from '../../Flow'
import { createJoystreamCli } from '../utils'
import Long from 'long'
import { ReactVideo } from '@joystream/metadata-protobuf'

export default async function comments({ api, query, env }: FlowProps): Promise<void> {
  const debug = extendDebug('flow:comments and reactions')
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
  const createMembersFixture = new CreateMembersFixture(api, query, 3, sufficientTopupAmount)
  await new FixtureRunner(createMembersFixture).run()
  const [channelOwner, ...participants] = createMembersFixture.getCreatedItems()

  // create channels and videos
  const createChannelsAndVideos = new CreateChannelsAndVideosFixture(
    api,
    query,
    joystreamCli,
    channelCount,
    videoCount,
    channelCategoryIds[0],
    videoCategoryIds[0],
    channelOwner
  )
  await new FixtureRunner(createChannelsAndVideos).run()
  const { videosData } = createChannelsAndVideos.getCreatedItems()

  // Create comments
  const comments: CreateCommentParams[] = [
    // Valid cases:
    {
      msg: {
        videoId: Long.fromNumber(videosData[0].videoId),
        body: 'Some text',
      },
      asMember: participants[0].memberId,
    },
    {
      msg: {
        videoId: Long.fromNumber(videosData[0].videoId),
        body: 'Some text',
      },
      asMember: participants[1].memberId,
    },
    {
      msg: {
        videoId: Long.fromNumber(videosData[1].videoId),
        body: 'Some text',
      },
      asMember: participants[0].memberId,
    },
    {
      msg: {
        videoId: Long.fromNumber(videosData[1].videoId),
        body: 'Some text',
      },
      asMember: participants[1].memberId,
    },
    // Invalid cases
  ]

  // check that comments on videos are working
  const createCommentsFixture = new CreateCommentsFixture(api, query, comments)
  await new FixtureRunner(createCommentsFixture).run()

  const createdCommentsIds = await createCommentsFixture.getCreatedCommentsIds()

  console.log(createdCommentsIds)

  // Create comment reactions
  const commentReactions: ReactCommentParams[] = [
    // comment reactions:
    {
      msg: {
        commentId: createdCommentsIds[0],
        reactionId: 1,
      },
      asMember: participants[0].memberId,
    },
    {
      msg: {
        commentId: createdCommentsIds[0],
        reactionId: 2,
      },
      asMember: participants[0].memberId,
    },
    {
      msg: {
        commentId: createdCommentsIds[0],
        reactionId: 2,
      },
      asMember: participants[1].memberId,
    },
    // Revert video reactions:
    {
      msg: {
        commentId: createdCommentsIds[0],
        reactionId: 1,
      },
      asMember: participants[0].memberId,
    },
  ]

  // check that reactions on videos are working
  const reactToCommentsFixture = new ReactToCommentsFixture(api, query, commentReactions)
  await new FixtureRunner(reactToCommentsFixture).run()

  // Create video reactions
  const videoReactions: ReactVideoParams[] = [
    // Video reactions:
    {
      msg: {
        videoId: Long.fromNumber(videosData[0].videoId),
        reaction: ReactVideo.Reaction.LIKE,
      },
      asMember: participants[0].memberId,
    },
    {
      msg: {
        videoId: Long.fromNumber(videosData[0].videoId),
        reaction: ReactVideo.Reaction.UNLIKE,
      },
      asMember: participants[1].memberId,
    },
    // Revert video reactions:
    {
      msg: {
        videoId: Long.fromNumber(videosData[0].videoId),
        reaction: ReactVideo.Reaction.CANCEL,
      },
      asMember: participants[1].memberId,
    },
  ]

  // check that reactions on videos are working
  const reactToVideosFixture = new ReactToVideosFixture(api, query, videoReactions)
  await new FixtureRunner(reactToVideosFixture).run()

  debug('Done')
}
