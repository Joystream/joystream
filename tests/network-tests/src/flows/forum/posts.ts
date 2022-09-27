import { FlowProps } from '../../Flow'
import { extendDebug } from '../../Debugger'
import { FixtureRunner } from '../../Fixture'
import {
  AddPostsFixture,
  DeletePostsFixture,
  InitializeForumFixture,
  PostParams,
  PostsRemovalInput,
  PostTextUpdate,
  UpdatePostsTextFixture,
  RemarkModeratePostsFixture,
} from '../../fixtures/forum'

export default async function posts({ api, query }: FlowProps): Promise<void> {
  const debug = extendDebug(`flow:threads`)
  debug('Started')
  api.enableDebugTxLogs()

  const initializeForumFixture = new InitializeForumFixture(api, query, {
    numberOfForumMembers: 5,
    numberOfCategories: 2,
    threadsPerCategory: 2,
    moderatorsPerCategory: 1,
  })
  await new FixtureRunner(initializeForumFixture).runWithQueryNodeChecks()

  const memberIds = initializeForumFixture.getCreatedForumMemberIds()
  const threadPaths = initializeForumFixture.getThreadPaths()
  const moderatorIds = threadPaths.map(
    ({ categoryId }) => initializeForumFixture.getCreatedForumModeratorsByCategoryId(categoryId)[0]
  )

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
    {
      ...threadPaths[3],
      metadata: { value: { text: 'Second post by member 3' } },
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

  // Run compound query node checks
  await Promise.all([addPostsFixture.runQueryNodeChecks(), addRepliesRunner.runQueryNodeChecks()])

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
  await updatePostsTextRunner.run()

  // Remove posts
  const postRemovals: PostsRemovalInput[] = [
    {
      posts: [
        {
          ...threadPaths[0],
          postId: postIds[0],
          hide: true,
        },
      ],
      asMember: memberIds[0],
      rationale: 'Clearing first post test',
    },
    {
      posts: [
        {
          ...threadPaths[3],
          postId: postIds[3],
          hide: false,
        },
      ],
      asMember: memberIds[3],
      rationale: 'Hide = false test',
    },
    {
      posts: [
        {
          ...threadPaths[3],
          postId: postIds[4],
          hide: false,
        },
      ],
      asMember: memberIds[3],
      rationale: 'Hide = false again',
    },
  ]
  const deletePostsFixture = new DeletePostsFixture(api, query, postRemovals)
  const deletePostsRunner = new FixtureRunner(deletePostsFixture)
  await deletePostsRunner.run()

  // Run compound query node checks
  await Promise.all([updatePostsTextRunner.runQueryNodeChecks(), deletePostsRunner.runQueryNodeChecks()])

  // Moderate removed posts
  const postModerations = [
    {
      postId: postIds[3],
      rationale: 'Moderated by worker',
      asWorker: moderatorIds[3],
    },
    { postId: postIds[4], rationale: 'Moderated by lead' },
    { postId: postIds[2], rationale: 'Not deleted', expectFailure: true },
  ]
  const remarkModerateFixture = new RemarkModeratePostsFixture(api, query, postModerations)
  const remarkModerateRunner = new FixtureRunner(remarkModerateFixture)
  await remarkModerateRunner.run()
  await remarkModerateRunner.runQueryNodeChecks()

  // TODO: Delete posts as any member? Would require waiting PostLifetime (currently 3600 blocks)

  debug('Done')
}
