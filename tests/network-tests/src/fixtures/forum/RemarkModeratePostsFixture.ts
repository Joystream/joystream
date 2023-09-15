import { assert } from 'chai'
import Long from 'long'
import { SubmittableExtrinsic } from '@polkadot/api/types'
import { ISubmittableResult } from '@polkadot/types/types/'
import { WorkerId, ForumPostId } from '@joystream/types/primitives'
import { RemarkMetadataAction } from '@joystream/metadata-protobuf'
import { Api } from '../../Api'
import { QueryNodeApi } from '../../QueryNodeApi'
import { EventDetails } from '../../types'
import { Utils } from '../../utils'
import { ForumPostFieldsFragment, PostModeratedEventFieldsFragment } from '../../graphql/generated/queries'
import { WithForumWorkersFixture } from './WithForumWorkersFixture'

export type RemarkPostModerationInput = {
  postId: ForumPostId
  rationale: string
  asWorker?: WorkerId
  expectFailure?: boolean
}

export class RemarkModeratePostsFixture extends WithForumWorkersFixture {
  protected moderations: RemarkPostModerationInput[]

  public constructor(api: Api, query: QueryNodeApi, moderations: RemarkPostModerationInput[]) {
    super(api, query)
    this.moderations = moderations
  }

  protected async getSignerAccountOrAccounts(): Promise<string[]> {
    return this.getSignersFromInput(this.moderations)
  }

  protected async getExtrinsics(): Promise<SubmittableExtrinsic<'promise'>[]> {
    return this.moderations.map((u) => {
      const metadata = Utils.metadataToBytes(RemarkMetadataAction, {
        moderatePost: {
          postId: Long.fromString(String(u.postId)),
          rationale: u.rationale,
        },
      })
      return u.asWorker
        ? this.api.tx.forumWorkingGroup.workerRemark(u.asWorker, metadata)
        : this.api.tx.forumWorkingGroup.leadRemark(metadata)
    })
  }

  protected async getEventFromResult(result: ISubmittableResult): Promise<EventDetails> {
    if (this.api.findEvent(result, 'forumWorkingGroup', 'WorkerRemarked')) {
      return this.api.getEventDetails(result, 'forumWorkingGroup', 'WorkerRemarked')
    } else {
      return this.api.getEventDetails(result, 'forumWorkingGroup', 'LeadRemarked')
    }
  }

  protected assertQueriedPostsAreValid(
    qPosts: ForumPostFieldsFragment[],
    qEvents: PostModeratedEventFieldsFragment[]
  ): void {
    const moderatedSuccessfully = this.moderations.filter((m) => !m.expectFailure).length
    assert.equal(qEvents.length, moderatedSuccessfully, 'Too many posts were moderated')

    this.events.map((e, i) => {
      const moderation = this.moderations[i]
      if (moderation.expectFailure) return

      const qPost = qPosts.find((p) => p.id === moderation.postId.toString())
      Utils.assert(qPost, 'Query node: Post not found')

      const qEvent = this.findMatchingQueryNodeEvent(e, qEvents)
      Utils.assert(qPost.status.__typename === 'PostStatusModerated', 'Invalid post status')
      Utils.assert(qPost.status.postModeratedEvent, 'Query node: Missing PostModeratedEvent ref')
      assert.equal(qPost.status.postModeratedEvent.id, qEvent.id)
      assert.equal(qPost.isVisible, false)
    })
  }

  protected assertQueryNodeEventIsValid(qEvent: PostModeratedEventFieldsFragment, i: number): void {
    const { postId, asWorker, rationale } = this.moderations[i]
    assert.equal(qEvent.post.id, postId.toString())
    assert.equal(qEvent.actor.id, `forumWorkingGroup-${asWorker ? asWorker.toString() : this.forumLeadId!.toString()}`)
    assert.equal(qEvent.rationale, rationale)
  }

  async runQueryNodeChecks(): Promise<void> {
    await super.runQueryNodeChecks()

    const expectFailureAtIndexes = this.moderations.flatMap((m, i) => (m.expectFailure ? [i] : []))
    // Query the events
    const qEvents = await this.query.tryQueryWithTimeout(
      () => this.query.getPostModeratedEvents(this.events),
      (qEvents) => this.assertQueryNodeEventsAreValid(qEvents, expectFailureAtIndexes)
    )

    // Query the threads
    const qPosts = await this.query.getPostsByIds(this.moderations.map((m) => m.postId))
    this.assertQueriedPostsAreValid(qPosts, qEvents)
  }
}
