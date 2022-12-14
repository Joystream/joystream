import { Api } from '../../Api'
import { QueryNodeApi } from '../../QueryNodeApi'
import { EventType, MetadataInput } from '../../types'
import { SubmittableExtrinsic } from '@polkadot/api/types'
import { Utils } from '../../utils'
import { ISubmittableResult } from '@polkadot/types/types/'
import { ForumThreadWithInitialPostFragment, ThreadCreatedEventFieldsFragment } from '../../graphql/generated/queries'
import { assert } from 'chai'
import { StandardizedFixture } from '../../Fixture'
import { MemberId, ForumThreadId, ForumCategoryId, ForumPostId } from '@joystream/types/primitives'
import { ForumThreadMetadata, IForumThreadMetadata } from '@joystream/metadata-protobuf'
import { isSet } from '@joystream/metadata-protobuf/utils'
import { EventDetails } from '@joystream/cli/src/Types'
import { createType } from '@joystream/types'

export type ThreadParams = {
  metadata: MetadataInput<IForumThreadMetadata>
  text: string
  categoryId: ForumCategoryId
  asMember: MemberId
}

type ThreadCreatedEventDetails = EventDetails<EventType<'forum', 'ThreadCreated'>>

export class CreateThreadsFixture extends StandardizedFixture {
  protected events: ThreadCreatedEventDetails[] = []

  protected threadsParams: ThreadParams[]

  public constructor(api: Api, query: QueryNodeApi, threadsParams: ThreadParams[]) {
    super(api, query)
    this.threadsParams = threadsParams
  }

  public getCreatedThreadsIds(): ForumThreadId[] {
    if (!this.events.length) {
      throw new Error('Trying to get created threads ids before they were created!')
    }
    return this.events.map((e) => e.event.data[1])
  }

  public getCreatedInitialPostByThreadsIds(): Map<number, ForumPostId> {
    if (!this.events.length) {
      throw new Error('Trying to get created threads and initial posts Ids before they were created!')
    }
    return new Map(this.events.map((e) => [e.event.data[1].toNumber(), e.event.data[2]]))
  }

  protected async getSignerAccountOrAccounts(): Promise<string[]> {
    return await Promise.all(
      this.threadsParams.map(async ({ asMember }) =>
        (await this.api.query.members.membershipById(asMember)).unwrap().controllerAccount.toString()
      )
    )
  }

  public async execute(): Promise<void> {
    const accounts = await this.getSignerAccountOrAccounts()
    // Send required funds to accounts (ThreadDeposit + PostDeposit)
    const funds = this.api.consts.forum.postDeposit.add(this.api.consts.forum.threadDeposit)
    await Promise.all(accounts.map((a) => this.api.treasuryTransferBalance(a, funds)))
    await super.execute()
  }

  protected async getExtrinsics(): Promise<SubmittableExtrinsic<'promise'>[]> {
    return this.threadsParams.map((params) =>
      this.api.tx.forum.createThread(
        params.asMember,
        params.categoryId,
        Utils.getMetadataBytesFromInput(ForumThreadMetadata, params.metadata),
        params.text
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
