import { FlowProps } from '../../Flow'
import Debugger from 'debug'
import { FixtureRunner } from '../../Fixture'
import {
  AddPostsFixture,
  InitializeForumFixture,
  PostParams,
  PostReactionParams,
  PostTextUpdate,
  ReactToPostsFixture,
  UpdatePostsTextFixture,
} from '../../fixtures/forum'
import { ForumPostReaction } from '@joystream/metadata-protobuf'

export default async function threads({ api, query }: FlowProps): Promise<void> {
  const debug = Debugger(`flow:threads`)
  debug('Started')
  api.enableDebugTxLogs()

  const initializeForumFixture = new InitializeForumFixture(api, query, {
    numberOfForumMembers: 5,
    numberOfCategories: 2,
    threadsPerCategory: 2,
  })
  await new FixtureRunner(initializeForumFixture).runWithQueryNodeChecks()

  const memberIds = initializeForumFixture.getCreatedForumMemberIds()
  const threadPaths = initializeForumFixture.getThreadPaths()

  // Create posts
  const posts: PostParams[] = [
    // Valid cases:
    {
      ...threadPaths[0],
      metadata: { value: { text: 'Example post' } },
      asMember: memberIds[0],
    },
    {
      ...threadPaths[1],
      metadata: { value: { text: 'Non-editable post' } },
      editable: false,
      asMember: memberIds[1],
    },
    {
      ...threadPaths[2],
      metadata: { value: { text: null } },
      asMember: memberIds[2],
    },
    {
      ...threadPaths[3],
      metadata: { value: { text: '' } },
      asMember: memberIds[3],
    },
    // Invalid cases
    {
      ...threadPaths[0],
      metadata: { value: '0x000001000100', expectFailure: true },
      asMember: memberIds[0],
    },
  ]

  const addPostsFixture = new AddPostsFixture(api, query, posts)
  const addPostsRunner = new FixtureRunner(addPostsFixture)
  await addPostsRunner.run()
  const postIds = addPostsFixture.getCreatedPostsIds()

  // Create replies
  const postReplies: PostParams[] = [
    // Valid reply case:
    {
      ...threadPaths[0],
      metadata: { value: { text: 'Reply post', repliesTo: postIds[0].toNumber() } },
      asMember: memberIds[1],
    },
    // Invalid reply postId case:
    {
      ...threadPaths[0],
      metadata: { value: { text: 'Reply post', repliesTo: 999999 }, expectReplyFailure: true },
      asMember: memberIds[1],
    },
  ]

  const addRepliesFixture = new AddPostsFixture(api, query, postReplies)
  const addRepliesRunner = new FixtureRunner(addRepliesFixture)
  await addRepliesRunner.run()

  // Post reactions
  const postReactions: PostReactionParams[] = [
    {
      ...threadPaths[0],
      postId: postIds[0],
      reactionId: ForumPostReaction.Reaction.LIKE,
      asMember: memberIds[0],
    },
    {
      ...threadPaths[1],
      postId: postIds[1],
      reactionId: ForumPostReaction.Reaction.LIKE,
      asMember: memberIds[1],
    },
    {
      ...threadPaths[1],
      postId: postIds[1],
      reactionId: 0, // Cancel previous one
      asMember: memberIds[1],
    },
    {
      ...threadPaths[2],
      postId: postIds[2],
      reactionId: ForumPostReaction.Reaction.LIKE,
      asMember: memberIds[2],
    },
    {
      ...threadPaths[2],
      postId: postIds[2],
      reactionId: 999, // Cancel previous one by providing invalid id
      asMember: memberIds[2],
    },
  ]
  const reactToPostsFixture = new ReactToPostsFixture(api, query, postReactions)
  const reactToPostsRunner = new FixtureRunner(reactToPostsFixture)
  await reactToPostsRunner.run()

  // Run compound query node checks
  await Promise.all([
    addPostsFixture.runQueryNodeChecks(),
    addRepliesRunner.runQueryNodeChecks(),
    reactToPostsRunner.runQueryNodeChecks(),
  ])

  // Post text updates
  const postTextUpdates: PostTextUpdate[] = [
    {
      ...threadPaths[0],
      postId: postIds[0],
      newText: 'New post 0 text',
    },
    {
      ...threadPaths[2],
      postId: postIds[2],
      newText: 'New post 2 text',
    },
    {
      ...threadPaths[2],
      postId: postIds[2],
      newText: '',
    },
  ]
  const updatePostsTextFixture = new UpdatePostsTextFixture(api, query, postTextUpdates)
  const updatePostsTextRunner = new FixtureRunner(updatePostsTextFixture)
  await updatePostsTextRunner.runWithQueryNodeChecks()

  debug('Done')
}
