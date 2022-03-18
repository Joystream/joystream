import { Api } from '../../Api'
import { QueryNodeApi } from '../../QueryNodeApi'
import { EventType, MetadataInput } from '../../types'
import { SubmittableExtrinsic } from '@polkadot/api/types'
import { Utils } from '../../utils'
import { ISubmittableResult } from '@polkadot/types/types/'
import { ForumThreadWithInitialPostFragment, ThreadCreatedEventFieldsFragment } from '../../graphql/generated/queries'
import { assert } from 'chai'
import { StandardizedFixture } from '../../Fixture'
import { CategoryId, PollInput } from '@joystream/types/forum'
import { MemberId, ThreadId } from '@joystream/types/common'
import { CreateInterface } from '@joystream/types'
import { POST_DEPOSIT, THREAD_DEPOSIT } from '../../consts'
import { ForumThreadMetadata, IForumThreadMetadata } from '@joystream/metadata-protobuf'
import { isSet } from '@joystream/metadata-protobuf/utils'
import { EventDetails } from '@joystream/cli/src/Types'

export type PollParams = {
  description: string
  endTime: Date
  alternatives: string[]
}

export type ThreadParams = {
  metadata: MetadataInput<IForumThreadMetadata>
  text: string
  categoryId: CategoryId
  asMember: MemberId
  poll?: PollParams
}

type ThreadCreatedEventDetails = EventDetails<EventType<'forum', 'ThreadCreated'>>

export class CreateThreadsFixture extends StandardizedFixture {
  protected events: ThreadCreatedEventDetails[] = []

  protected threadsParams: ThreadParams[]

  public constructor(api: Api, query: QueryNodeApi, threadsParams: ThreadParams[]) {
    super(api, query)
    this.threadsParams = threadsParams
  }

  public getCreatedThreadsIds(): ThreadId[] {
    if (!this.events.length) {
      throw new Error('Trying to get created threads ids before they were created!')
    }
    return this.events.map((e) => e.event.data[1])
  }

  protected async getSignerAccountOrAccounts(): Promise<string[]> {
    return await Promise.all(
      this.threadsParams.map(async ({ asMember }) =>
        (await this.api.query.members.membershipById(asMember)).controller_account.toString()
      )
    )
  }

  public async execute(): Promise<void> {
    const accounts = await this.getSignerAccountOrAccounts()
    // Send required funds to accounts (ThreadDeposit + PostDeposit)
    await Promise.all(accounts.map((a) => this.api.treasuryTransferBalance(a, THREAD_DEPOSIT.add(POST_DEPOSIT))))
    await super.execute()
  }

  protected parsePollParams(pollParams?: PollParams): CreateInterface<PollInput> | null {
    if (!pollParams) {
      return null
    }

    return {
      description: pollParams.description,
      end_time: pollParams.endTime.getTime(),
      poll_alternatives: pollParams.alternatives,
    }
  }

  protected async getExtrinsics(): Promise<SubmittableExtrinsic<'promise'>[]> {
    return this.threadsParams.map((params) =>
      this.api.tx.forum.createThread(
        params.asMember,
        params.categoryId,
        Utils.getMetadataBytesFromInput(ForumThreadMetadata, params.metadata),
        params.text,
        this.parsePollParams(params.poll)
      )
    )
  }

  protected async getEventFromResult(result: ISubmittableResult): Promise<ThreadCreatedEventDetails> {
    return this.api.getEventDetails(result, 'forum', 'ThreadCreated')
  }

  protected getExpectedThreadTitle({ metadata: inputMeta }: ThreadParams): string {
    const meta = Utils.getDeserializedMetadataFormInput(ForumThreadMetadata, inputMeta)
    const metaBytes = Utils.getMetadataBytesFromInput(ForumThreadMetadata, inputMeta)
    return meta ? meta.title || '' : Utils.bytesToString(metaBytes)
  }

  protected assertQueriedThreadsAreValid(
    qThreads: ForumThreadWithInitialPostFragment[],
    qEvents: ThreadCreatedEventFieldsFragment[]
  ): void {
    this.events.map((e, i) => {
      const qThread = qThreads.find((t) => t.id === e.event.data[1].toString())
      const qEvent = this.findMatchingQueryNodeEvent(e, qEvents)
      const threadParams = this.threadsParams[i]
      const metadata = Utils.getDeserializedMetadataFormInput(ForumThreadMetadata, threadParams.metadata)
      const expectedTitle = this.getExpectedThreadTitle(threadParams)
      Utils.assert(qThread, 'Query node: Thread not found')
      assert.equal(qThread.title, expectedTitle)
      assert.equal(qThread.category.id, threadParams.categoryId.toString())
      assert.equal(qThread.author.id, threadParams.asMember.toString())
      assert.equal(qThread.status.__typename, 'ThreadStatusActive')
      assert.equal(qThread.isVisible, true)
      assert.equal(qThread.isSticky, false)
      assert.equal(qThread.createdInEvent.id, qEvent.id)
      const { initialPost } = qThread
      Utils.assert(initialPost, "Query node: Thread's initial post is empty!")
      assert.equal(initialPost.id, e.event.data[2].toString())
      assert.equal(initialPost.text, threadParams.text)
      Utils.assert(initialPost.origin.__typename === 'PostOriginThreadInitial')
      // FIXME: Temporarly not working (https://github.com/Joystream/hydra/issues/396)
      // Utils.assert(initialPost.origin.threadCreatedEvent, 'Query node: Post origin ThreadCreatedEvent ref missing')
      // assert.equal(initialPost.origin.threadCreatedEvent.id, qEvent.id)
      assert.equal(initialPost.author.id, threadParams.asMember.toString())
      assert.equal(initialPost.status.__typename, 'PostStatusActive')
      if (threadParams.poll) {
        Utils.assert(qThread.poll, 'Query node: Thread poll is missing')
        assert.equal(qThread.poll.description, threadParams.poll.description)
        assert.sameDeepMembers(
          qThread.poll.pollAlternatives.map((a) => [a.text, a.index]),
          threadParams.poll.alternatives.map((text, index) => [text, index])
        )
        assert.equal(new Date(qThread.poll.endTime).getTime(), threadParams.poll.endTime.getTime())
      }
      if (metadata && isSet(metadata?.tags)) {
        assert.sameDeepMembers(
          qThread.tags.map((t) => t.id),
          metadata.tags
        )
      }
    })
  }

  protected assertQueryNodeEventIsValid(qEvent: ThreadCreatedEventFieldsFragment, i: number): void {
    assert.equal(qEvent.thread.id, this.events[i].event.data[1].toString())
    assert.equal(qEvent.title, this.getExpectedThreadTitle(this.threadsParams[i]))
    assert.equal(qEvent.text, this.threadsParams[i].text)
  }

  async runQueryNodeChecks(): Promise<void> {
    await super.runQueryNodeChecks()
    // Query the events
    const qEvents = await this.query.tryQueryWithTimeout(
      () => this.query.getThreadCreatedEvents(this.events),
      (qEvents) => this.assertQueryNodeEventsAreValid(qEvents)
    )

    // Query the threads
    const qThreads = await this.query.getThreadsWithInitialPostsByIds(this.events.map((e) => e.event.data[1]))
    this.assertQueriedThreadsAreValid(qThreads, qEvents)
  }
}
