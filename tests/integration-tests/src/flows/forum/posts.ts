import { FlowProps } from '../../Flow'
import Debugger from 'debug'
import { FixtureRunner } from '../../Fixture'
import { AddPostsFixture, InitializeForumFixture, PostParams } from '../../fixtures/forum'

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

  await Promise.all([addPostsFixture.runQueryNodeChecks(), addRepliesRunner.runQueryNodeChecks()])

  debug('Done')
}
