import { IChannelOwnerRemarked, IModerateComment, ChannelOwnerRemarked } from '@joystream/metadata-protobuf'
import { MemberId } from '@joystream/types/primitives'
import { SubmittableExtrinsic } from '@polkadot/api/types'
import { ISubmittableResult } from '@polkadot/types/types/'
import { assert } from 'chai'
import { Api } from '../../../Api'
import { StandardizedFixture } from '../../../Fixture'
import { CommentModeratedEventFieldsFragment, CommentFieldsFragment } from '../../../graphql/generated/queries'
import { CommentStatus } from '../../../graphql/generated/schema'
import { QueryNodeApi } from '../../../QueryNodeApi'
import { EventDetails, EventType } from '../../../types'
import { Utils } from '../../../utils'

type ChannelOwnerRemarkedEventDetails = EventDetails<EventType<'content', 'ChannelOwnerRemarked'>>

export type ModerateCommentParams = {
  asMember: MemberId
  channelId: number
  msg: IModerateComment
}

export class ModerateCommentsFixture extends StandardizedFixture {
  protected moderateCommentParams: ModerateCommentParams[]

  public constructor(api: Api, query: QueryNodeApi, moderateCommentParams: ModerateCommentParams[]) {
    super(api, query)
    this.moderateCommentParams = moderateCommentParams
  }

  public async getModeratedCommentsIds(): Promise<string[]> {
    const qEvents = await this.query.tryQueryWithTimeout(
      () => this.query.getCommentCreatedEvents(this.events),
      (qEvents) => this.assertQueryNodeEventsAreValid(qEvents)
    )
    return qEvents.map((e) => e.comment.id)
  }

  protected async getEventFromResult(result: ISubmittableResult): Promise<ChannelOwnerRemarkedEventDetails> {
    return this.api.getEventDetails(result, 'content', 'ChannelOwnerRemarked')
  }

  protected async getSignerAccountOrAccounts(): Promise<string[]> {
    return await Promise.all(
      this.moderateCommentParams.map(async ({ asMember }) =>
        (await this.api.query.members.membershipById(asMember)).unwrap().controllerAccount.toString()
      )
    )
  }

  protected async getExtrinsics(): Promise<SubmittableExtrinsic<'promise'>[]> {
    return this.moderateCommentParams.map((params) => {
      const msg: IChannelOwnerRemarked = {
        moderateComment: {
          commentId: params.msg.commentId,
          rationale: params.msg.rationale,
        },
      }
      return this.api.tx.content.channelOwnerRemark(params.channelId, Utils.metadataToBytes(ChannelOwnerRemarked, msg))
    })
  }

  protected assertQueriedCommentsAreValid(
    qComments: CommentFieldsFragment[],
    qEvents: CommentModeratedEventFieldsFragment[]
  ): void {
    this.events.map((e) => {
      const qEvent = this.findMatchingQueryNodeEvent(e, qEvents)
      const qComment = qComments.find((comment) => comment.id === qEvent.comment.id.toString())
      Utils.assert(qComment, 'Query node: Comment not found')
      assert.equal(qComment.status, CommentStatus.Moderated)
      assert.equal(qComment.text, '')
    })
  }

  protected assertQueryNodeEventIsValid(qEvent: CommentModeratedEventFieldsFragment, i: number): void {
    const params = this.moderateCommentParams[i]
    assert.equal(qEvent.comment.id, params.msg.commentId.toString())
    assert.equal(qEvent.comment.status, CommentStatus.Moderated)
    assert.equal(qEvent.rationale, params.msg.rationale)
  }

  async runQueryNodeChecks(): Promise<void> {
    await super.runQueryNodeChecks()
    // Query the events
    const qEvents = await this.query.tryQueryWithTimeout(
      () => this.query.getCommentModeratedEvents(this.events),
      (qEvents) => this.assertQueryNodeEventsAreValid(qEvents)
    )

    // Query the comments
    const qComments = await this.query.getCommentsByIds(qEvents.map((e) => e.comment.id))
    this.assertQueriedCommentsAreValid(qComments, qEvents)
  }
}
