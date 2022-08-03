import { Api } from '../../Api'
import { QueryNodeApi } from '../../QueryNodeApi'
import { EventType, MetadataInput } from '../../types'
import { SubmittableExtrinsic } from '@polkadot/api/types'
import { Utils } from '../../utils'
import { ISubmittableResult } from '@polkadot/types/types/'
import {
  ProposalDiscussionPostCreatedEventFieldsFragment,
  ProposalDiscussionPostFieldsFragment,
} from '../../graphql/generated/queries'
import { assert } from 'chai'
import { StandardizedFixture } from '../../Fixture'
import {
  MemberId,
  ProposalDiscussionPostId as PostId,
  ProposalDiscussionThreadId as ThreadId,
} from '@joystream/types/primitives'
import { ProposalsDiscussionPostMetadata, IProposalsDiscussionPostMetadata } from '@joystream/metadata-protobuf'
import { EventDetails } from '@joystream/cli/src/Types'

export type PostParams = {
  threadId: ThreadId | number
  asMember: MemberId
  editable?: boolean // defaults to true
  metadata: MetadataInput<IProposalsDiscussionPostMetadata> & { expectReplyFailure?: boolean }
}

type ProposalDiscussionPostCreatedEventDetails = EventDetails<EventType<'proposalsDiscussion', 'PostCreated'>>

export class CreatePostsFixture extends StandardizedFixture {
  protected events: ProposalDiscussionPostCreatedEventDetails[] = []
  protected postsParams: PostParams[]

  public constructor(api: Api, query: QueryNodeApi, postsParams: PostParams[]) {
    super(api, query)
    this.postsParams = postsParams
  }

  public getCreatedPostsIds(): PostId[] {
    if (!this.events.length) {
      throw new Error('Trying to get created posts ids before they were created!')
    }
    return this.events.map((e) => e.event.data[0])
  }

  protected async getSignerAccountOrAccounts(): Promise<string[]> {
    return this.api.getMemberSigners(this.postsParams)
  }

  public async execute(): Promise<void> {
    const accounts = await this.getSignerAccountOrAccounts()
    // Send required funds to accounts (ProposalsPostDeposit)
    await Promise.all(
      accounts.map((a) => this.api.treasuryTransferBalance(a, this.api.consts.proposalsDiscussion.postDeposit))
    )
    await super.execute()
  }

  protected async getExtrinsics(): Promise<SubmittableExtrinsic<'promise'>[]> {
    return this.postsParams.map((params) =>
      this.api.tx.proposalsDiscussion.addPost(
        params.asMember,
        params.threadId,
        Utils.getMetadataBytesFromInput(ProposalsDiscussionPostMetadata, params.metadata),
        params.editable === undefined || params.editable
      )
    )
  }

  protected async getEventFromResult(result: ISubmittableResult): Promise<ProposalDiscussionPostCreatedEventDetails> {
    return this.api.getEventDetails(result, 'proposalsDiscussion', 'PostCreated')
  }

  protected getPostExpectedText(postParams: PostParams): string {
    const expectedMetadata = Utils.getDeserializedMetadataFormInput(
      ProposalsDiscussionPostMetadata,
      postParams.metadata
    )
    const metadataBytes = Utils.getMetadataBytesFromInput(ProposalsDiscussionPostMetadata, postParams.metadata)
    return typeof expectedMetadata?.text === 'string' ? expectedMetadata.text : Utils.bytesToString(metadataBytes)
  }

  protected assertQueriedPostsAreValid(
    qPosts: ProposalDiscussionPostFieldsFragment[],
    qEvents: ProposalDiscussionPostCreatedEventFieldsFragment[]
  ): void {
    this.events.map((e, i) => {
      const qPost = qPosts.find((p) => p.id === e.event.data[0].toString())
      const qEvent = this.findMatchingQueryNodeEvent(e, qEvents)
      const postParams = this.postsParams[i]
      const expectedStatus =
        postParams.editable === undefined || postParams.editable
          ? 'ProposalDiscussionPostStatusActive'
          : 'ProposalDiscussionPostStatusLocked'
      const expectedMetadata = Utils.getDeserializedMetadataFormInput(
        ProposalsDiscussionPostMetadata,
        postParams.metadata
      )
      Utils.assert(qPost, 'Query node: Post not found')
      assert.equal(qPost.discussionThread.id, postParams.threadId.toString())
      assert.equal(qPost.author.id, postParams.asMember.toString())
      assert.equal(qPost.status.__typename, expectedStatus)
      assert.equal(qPost.isVisible, true)
      assert.equal(qPost.text, this.getPostExpectedText(postParams))
      assert.equal(
        qPost.repliesTo?.id,
        postParams.metadata.expectReplyFailure ? undefined : expectedMetadata?.repliesTo?.toString()
      )
      assert.equal(qPost.createdInEvent.id, qEvent.id)
    })
  }

  protected assertQueryNodeEventIsValid(qEvent: ProposalDiscussionPostCreatedEventFieldsFragment, i: number): void {
    const params = this.postsParams[i]
    assert.equal(qEvent.post.id, this.events[i].event.data[0].toString())
    assert.equal(qEvent.text, this.getPostExpectedText(params))
  }

  async runQueryNodeChecks(): Promise<void> {
    await super.runQueryNodeChecks()
    // Query the events
    const qEvents = await this.query.tryQueryWithTimeout(
      () => this.query.getProposalDiscussionPostCreatedEvents(this.events),
      (qEvents) => this.assertQueryNodeEventsAreValid(qEvents)
    )

    // Query the posts
    const qPosts = await this.query.getProposalDiscussionPostsByIds(this.events.map((e) => e.event.data[0]))
    this.assertQueriedPostsAreValid(qPosts, qEvents)
  }
}
