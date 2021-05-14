import { FlowProps } from '../../Flow'
import Debugger from 'debug'
import { FixtureRunner } from '../../Fixture'
import { CategoryParams, CreateCategoriesFixture, DeleteThreadsFixture, ThreadRemovalInput } from '../../fixtures/forum'
import { CreateThreadsFixture, ThreadParams } from '../../fixtures/forum/CreateThreadsFixture'
import { BuyMembershipHappyCaseFixture } from '../../fixtures/membership'

export default async function threads({ api, query }: FlowProps): Promise<void> {
  const debug = Debugger(`flow:threads`)
  debug('Started')
  api.enableDebugTxLogs()

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
  await createThreadsRunner.runWithQueryNodeChecks()
  const threadIds = createThreadsFixture.getCreatedThreadsIds()

  // TODO: Threads updates

  // Remove threads
  const threadRemovals: ThreadRemovalInput[] = threads.map((t, i) => ({
    threadId: threadIds[i],
    categoryId: t.categoryId,
    hide: i >= 1, // Test both cases
  }))
  const removeThreadsFixture = new DeleteThreadsFixture(api, query, threadRemovals)
  await new FixtureRunner(removeThreadsFixture).runWithQueryNodeChecks()

  debug('Done')
}
