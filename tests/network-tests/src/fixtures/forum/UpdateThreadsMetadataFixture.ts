import { Api } from '../../Api'
import { QueryNodeApi } from '../../QueryNodeApi'
import { EventDetails, MemberContext, MetadataInput } from '../../types'
import { SubmittableExtrinsic } from '@polkadot/api/types'
import { Utils } from '../../utils'
import { ISubmittableResult } from '@polkadot/types/types/'
import {
  ForumThreadWithInitialPostFragment,
  ThreadMetadataUpdatedEventFieldsFragment,
} from '../../graphql/generated/queries'
import { assert } from 'chai'
import { CategoryId } from '@joystream/types/forum'
import { StandardizedFixture } from '../../Fixture'
import { ThreadId } from '@joystream/types/common'
import _ from 'lodash'
import { ForumThreadMetadata, IForumThreadMetadata } from '@joystream/metadata-protobuf'
import { isSet } from '@joystream/metadata-protobuf/utils'

export type ThreadMetadataUpdate = {
  categoryId: CategoryId
  threadId: ThreadId
  newMetadata: MetadataInput<IForumThreadMetadata>
  preUpdateValues?: {
    title: string
    tags: string[]
  }
}

export class UpdateThreadsMetadataFixture extends StandardizedFixture {
  protected threadAuthors: MemberContext[] = []
  protected updates: ThreadMetadataUpdate[]

  public constructor(api: Api, query: QueryNodeApi, updates: ThreadMetadataUpdate[]) {
    super(api, query)
    this.updates = updates
  }

  protected async loadAuthors(): Promise<void> {
    this.threadAuthors = await Promise.all(
      this.updates.map(async (u) => {
        const thread = await this.api.query.forum.threadById(u.categoryId, u.threadId)
        const member = await this.api.query.members.membershipById(thread.author_id)
        return { account: member.controller_account.toString(), memberId: thread.author_id }
      })
    )
  }

  protected async getSignerAccountOrAccounts(): Promise<string[]> {
    return this.threadAuthors.map((a) => a.account)
  }

  protected async getExtrinsics(): Promise<SubmittableExtrinsic<'promise'>[]> {
    return this.updates.map((u, i) =>
      this.api.tx.forum.editThreadMetadata(
        this.threadAuthors[i].memberId,
        u.categoryId,
        u.threadId,
        Utils.getMetadataBytesFromInput(ForumThreadMetadata, u.newMetadata)
      )
    )
  }

  protected async getEventFromResult(result: ISubmittableResult): Promise<EventDetails> {
    return this.api.getEventDetails(result, 'forum', 'ThreadMetadataUpdated')
  }

  public async execute(): Promise<void> {
    await this.loadAuthors()
    await super.execute()
  }

  protected getNewThreadTitle({ newMetadata: inputMeta }: ThreadMetadataUpdate): string | null {
    const meta = Utils.getDeserializedMetadataFormInput(ForumThreadMetadata, inputMeta)
    const metaBytes = Utils.getMetadataBytesFromInput(ForumThreadMetadata, inputMeta)
    return meta ? meta.title || null : Utils.bytesToString(metaBytes)
  }

  protected getNewThreadTags({ newMetadata: inputMeta }: ThreadMetadataUpdate): string[] | null {
    const meta = Utils.getDeserializedMetadataFormInput(ForumThreadMetadata, inputMeta)
    return meta && isSet(meta.tags) ? meta.tags : null
  }

  protected assertQueriedThreadsAreValid(
    qThreads: ForumThreadWithInitialPostFragment[],
    qEvents: ThreadMetadataUpdatedEventFieldsFragment[]
  ): void {
    // Check metadataUpdates array
    this.events.forEach((e, i) => {
      const update = this.updates[i]
      const qThread = qThreads.find((t) => t.id === update.threadId.toString())
      const qEvent = this.findMatchingQueryNodeEvent(e, qEvents)
      Utils.assert(qThread, 'Query node: Thread not found')
      assert.include(
        qThread.metadataUpdates.map((u) => u.id),
        qEvent.id
      )
    })

    // Check updated titles/tags (against lastest update per thread that affected them)
    _.uniq(this.updates.map((u) => u.threadId)).map((threadId) => {
      const qThread = qThreads.find((t) => t.id === threadId.toString())
      Utils.assert(qThread, 'Query node: Thread not found')
      const threadUpdates = this.updates.filter((u) => u.threadId === threadId)
      const lastNewTitle = _.last(threadUpdates.map((u) => this.getNewThreadTitle(u)).filter((v) => v !== null))
      const lastNewTags = _.last(threadUpdates.map((u) => this.getNewThreadTags(u)).filter((v) => v !== null))
      const expectedTitle = lastNewTitle ?? (threadUpdates[0].preUpdateValues?.title || qThread.createdInEvent.title)
      const expectedTags = (lastNewTags ?? (threadUpdates[0].preUpdateValues?.tags || [])).filter((v) => v)
      assert.equal(qThread.title, expectedTitle)
      assert.sameMembers(
        qThread.tags.map((t) => t.id),
        expectedTags
      )
    })
  }

  protected assertQueryNodeEventIsValid(qEvent: ThreadMetadataUpdatedEventFieldsFragment, i: number): void {
    const update = this.updates[i]
    const newTitle = this.getNewThreadTitle(update)
    assert.equal(qEvent.thread.id, update.threadId.toString())
    assert.equal(qEvent.newTitle, newTitle)
  }

  async runQueryNodeChecks(): Promise<void> {
    await super.runQueryNodeChecks()
    // Query the events
    const qEvents = await this.query.tryQueryWithTimeout(
      () => this.query.getThreadMetadataUpdatedEvents(this.events),
      (qEvents) => this.assertQueryNodeEventsAreValid(qEvents)
    )

    // Query the threads
    const qThreads = await this.query.getThreadsWithInitialPostsByIds(this.updates.map((u) => u.threadId))
    this.assertQueriedThreadsAreValid(qThreads, qEvents)
  }
}
