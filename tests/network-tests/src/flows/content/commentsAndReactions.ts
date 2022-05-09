import { ReactVideo } from '@joystream/metadata-protobuf'
import BN from 'bn.js'
import Long from 'long'
import { extendDebug } from '../../Debugger'
import { FixtureRunner } from '../../Fixture'
import {
  CreateChannelsAndVideosFixture,
  CreateCommentParams,
  CreateCommentsFixture,
  CreateContentStructureFixture,
  CreateMembersFixture,
  DeleteCommentParams,
  DeleteCommentsFixture,
  ReactCommentParams,
  ReactToCommentsFixture,
  ReactToVideosFixture,
  ReactVideoParams,
  EditCommentParams,
  EditCommentsFixture,
  ModerateCommentParams,
  ModerateCommentsFixture,
} from '../../fixtures/content'
import { FlowProps } from '../../Flow'
import { createJoystreamCli } from '../utils'

export default async function commentsAndReactions({ api, query }: FlowProps): Promise<void> {
  const debug = extendDebug('flow:comments and reactions')
  debug('Started')
  api.enableDebugTxLogs()

  // create Joystream CLI
  const joystreamCli = await createJoystreamCli()

  // settings
  const videoCount = 2
  const videoCategoryCount = 2
  const channelCount = 1
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
  const { channelIds, videosData } = createChannelsAndVideos.getCreatedItems()

  // Comments input
  const comments: CreateCommentParams[] = [
    // Create comments:
    {
      msg: {
        videoId: Long.fromNumber(videosData[0].videoId),
        body: 'video 0 comment by participant 0',
      },
      asMember: participants[0].memberId,
    },
    {
      msg: {
        videoId: Long.fromNumber(videosData[0].videoId),
        body: 'video 0 comment by participant 1',
      },
      asMember: participants[1].memberId,
    },
    {
      msg: {
        videoId: Long.fromNumber(videosData[1].videoId),
        body: 'video 1 comment by participant 0',
      },
      asMember: participants[0].memberId,
    },
    {
      msg: {
        videoId: Long.fromNumber(videosData[1].videoId),
        body: 'video 1 comment by participant 1',
      },
      asMember: participants[1].memberId,
    },
  ]

  // check that comments on videos are working
  const createCommentsFixture = new CreateCommentsFixture(api, query, comments)
  await new FixtureRunner(createCommentsFixture).runWithQueryNodeChecks()

  const createdCommentsIds = await createCommentsFixture.getCreatedCommentsIds()

  // Comments input
  const replies: CreateCommentParams[] = [
    // Create replies
    {
      msg: {
        videoId: Long.fromNumber(videosData[1].videoId),
        parentCommentId: createdCommentsIds[0],
        body: 'video 1 comment by participant 1',
      },
      asMember: participants[1].memberId,
    },
  ]

  // check that comment replies are working
  const createRepliesFixture = new CreateCommentsFixture(api, query, replies)
  await new FixtureRunner(createRepliesFixture).runWithQueryNodeChecks()

  const createdRepliesIds = await createRepliesFixture.getCreatedCommentsIds()

  // Comment reactions input
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

    // Invalid cases
  ]

  // check that reactions on videos are working
  const reactToCommentsFixture = new ReactToCommentsFixture(api, query, commentReactions)
  await new FixtureRunner(reactToCommentsFixture).runWithQueryNodeChecks()

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
        reaction: ReactVideo.Reaction.LIKE,
      },
      asMember: participants[1].memberId,
    },

    // Revert video reactions:
    {
      msg: {
        videoId: Long.fromNumber(videosData[0].videoId),
        reaction: ReactVideo.Reaction.LIKE,
      },
      asMember: participants[0].memberId,
    },

    // Change video reactions:
    {
      msg: {
        videoId: Long.fromNumber(videosData[0].videoId),
        reaction: ReactVideo.Reaction.UNLIKE,
      },
      asMember: participants[1].memberId,
    },

    // Invalid cases
  ]

  // check that reactions on videos are working
  const reactToVideosFixture = new ReactToVideosFixture(api, query, videoReactions)
  await new FixtureRunner(reactToVideosFixture).runWithQueryNodeChecks()

  // Edit Comment
  const editComments: EditCommentParams[] = [
    {
      asMember: participants[0].memberId,
      msg: {
        commentId: createdCommentsIds[2], // third comment was created by participant[0]
        newBody: 'comment edited by participant 0',
      },
    },
  ]

  const editCommentsFixture = new EditCommentsFixture(api, query, editComments)
  await new FixtureRunner(editCommentsFixture).runWithQueryNodeChecks()

  // Delete comments
  const deleteComments: DeleteCommentParams[] = [
    // delete comments
    {
      asMember: participants[0].memberId,
      msg: {
        commentId: createdCommentsIds[0], // first comment was created by participant[0]
      },
    },

    // delete replies
    {
      asMember: participants[1].memberId,
      msg: {
        commentId: createdRepliesIds[0], // first reply was created by participant[1]
      },
    },
  ]

  const deleteCommentsFixture = new DeleteCommentsFixture(api, query, deleteComments)
  await new FixtureRunner(deleteCommentsFixture).runWithQueryNodeChecks()

  // Moderate comments
  const moderateComments: ModerateCommentParams[] = [
    {
      asMember: channelOwner.memberId,
      channelId: channelIds[0],
      msg: {
        commentId: createdCommentsIds[3], // moderate fourth comment
        rationale: 'abusive comment',
      },
    },
  ]

  const moderateCommentsFixture = new ModerateCommentsFixture(api, query, moderateComments)
  await new FixtureRunner(moderateCommentsFixture).runWithQueryNodeChecks()

  debug('Done')
}
