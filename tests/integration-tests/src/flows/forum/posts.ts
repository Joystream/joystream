import { FlowProps } from '../../Flow'
import Debugger from 'debug'
import { FixtureRunner } from '../../Fixture'
import { AddPostsFixture, CategoryParams, CreateCategoriesFixture, PostParams } from '../../fixtures/forum'
import { CreateThreadsFixture, ThreadParams } from '../../fixtures/forum/CreateThreadsFixture'
import { BuyMembershipHappyCaseFixture } from '../../fixtures/membership'

export default async function threads({ api, query }: FlowProps): Promise<void> {
  const debug = Debugger(`flow:threads`)
  debug('Started')
  api.enableDebugTxLogs()

  // TODO: Refactor creating initial categories and threads to separate fixture
  // Create test member(s)
  const accounts = (await api.createKeyPairs(5)).map((kp) => kp.address)
  const buyMembershipFixture = new BuyMembershipHappyCaseFixture(api, query, accounts)
  await new FixtureRunner(buyMembershipFixture).run()
  const memberIds = buyMembershipFixture.getCreatedMembers()

  // Create some test categories first
  const categories: CategoryParams[] = [
    { title: 'Test 1', description: 'Test category 1' },
    { title: 'Test 2', description: 'Test category 2' },
  ]
  const createCategoriesFixture = new CreateCategoriesFixture(api, query, categories)
  await new FixtureRunner(createCategoriesFixture).run()
  const categoryIds = createCategoriesFixture.getCreatedCategoriesIds()

  // Create threads
  const threads: ThreadParams[] = categoryIds.reduce(
    (threadsArray, categoryId) =>
      threadsArray.concat(
        memberIds.map((memberId) => ({
          categoryId,
          asMember: memberId,
          title: `Thread ${categoryId}/${memberId}`,
          text: `Example thread of member ${memberId.toString()} in category ${categoryId.toString()}`,
        }))
      ),
    [] as ThreadParams[]
  )

  const createThreadsFixture = new CreateThreadsFixture(api, query, threads)
  const createThreadsRunner = new FixtureRunner(createThreadsFixture)
  await createThreadsRunner.run()
  const threadIds = createThreadsFixture.getCreatedThreadsIds()

  // Create posts
  const posts: PostParams[] = [
    // Valid cases:
    {
      threadId: threadIds[0],
      categoryId: categoryIds[0],
      metadata: { value: { text: 'Example post' } },
      asMember: memberIds[0],
    },
    {
      threadId: threadIds[1],
      categoryId: categoryIds[0],
      metadata: { value: { text: 'Non-editable post' } },
      editable: false,
      asMember: memberIds[1],
    },
    {
      threadId: threadIds[memberIds.length],
      categoryId: categoryIds[1],
      metadata: { value: { text: null } },
      asMember: memberIds[2],
    },
    {
      threadId: threadIds[memberIds.length + 1],
      categoryId: categoryIds[1],
      metadata: { value: { text: '' } },
      asMember: memberIds[3],
    },
    // Invalid cases
    {
      threadId: threadIds[0],
      categoryId: categoryIds[0],
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
      threadId: threadIds[0],
      categoryId: categoryIds[0],
      metadata: { value: { text: 'Reply post', repliesTo: postIds[0].toNumber() } },
      asMember: memberIds[1],
    },
    // Invalid reply postId case:
    {
      threadId: threadIds[0],
      categoryId: categoryIds[0],
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
