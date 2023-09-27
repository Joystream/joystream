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

export type ValidaotrAccountInput = {
  memberId: ForumPostId
  validatorAccount: string
  asWorker?: WorkerId
}

export class VerifyValidatorAccountFixture extends WithForumWorkersFixture {
  protected verifyValidator: ValidaotrAccountInput[]

  public constructor(api: Api, query: QueryNodeApi, verifyValidator: ValidaotrAccountInput[]) {
    super(api, query)
    this.verifyValidator = verifyValidator
  }

  protected async getExtrinsics(): Promise<SubmittableExtrinsic<'promise'>[]> {
    return this.verifyValidator.map((u) => {
      const metadata = Utils.metadataToBytes(RemarkMetadataAction, {
        verifyValidator: { memberId: Long.fromString(String(u.memberId)), validatorAccount: u.validatorAccount },
      })
      return u.asWorker
        ? this.api.tx.operationsWorkingGroupBeta.workerRemark(u.asWorker, metadata)
        : this.api.tx.operationsWorkingGroupBeta.leadRemark(metadata)
    })
  }

  protected async getEventFromResult(result: ISubmittableResult): Promise<EventDetails> {
    if (this.api.findEvent(result, 'operationsWorkingGroupBeta', 'WorkerRemarked')) {
      return this.api.getEventDetails(result, 'operationsWorkingGroupBeta', 'WorkerRemarked')
    } else {
      return this.api.getEventDetails(result, 'operationsWorkingGroupBeta', 'LeadRemarked')
    }
  }

  protected assertQueriedVerifyValidaot(
    qPosts: ForumPostFieldsFragment[],
    qEvents: PostModeratedEventFieldsFragment[]
  ): void {
    const moderatedSuccessfully = this.verifyValidator.filter((m) => !m.expectFailure).length
    assert.equal(qEvents.length, moderatedSuccessfully, 'Too many posts were moderated')

    this.events.map((e, i) => {
      const moderation = this.verifyValidator[i]
      if (moderation.expectFailure) return

      const qPost = qPosts.find((p) => p.id === moderation.postId.toString())
      Utils.assert(qPost, 'Query node: Post not found')

      const qEvent = this.findMatchingQueryNodeEvent(e, qEvents)
      Utils.assert(qPost.status.verifyValidatorEvent, 'Query node: Missing verifyValidatorEvent ref')
      assert.equal(qPost.status.verifyValidatorEvent.memberId, qEvent.memberId)
      assert.equal(qPost.isVisible, false)
    })
  }

  async runQueryNodeChecks(): Promise<void> {
    await super.runQueryNodeChecks()

    const expectFailureAtIndexes = this.verifyValidator.flatMap((m, i) => (m.expectFailure ? [i] : []))
    // Query the events
    const qEvents = await this.query.tryQueryWithTimeout(
      () => this.query.getPostModeratedEvents(this.events),
      (qEvents) => this.assertQueryNodeEventsAreValid(qEvents, expectFailureAtIndexes)
    )

    // Query the threads
    const qPosts = await this.query.getPostsByIds(this.verifyValidator.map((m) => m.memberId))
    this.assertQueriedVerifyValidaot(qPosts, qEvents)
  }
}
