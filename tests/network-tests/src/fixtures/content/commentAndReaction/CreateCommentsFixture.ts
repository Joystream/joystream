import { ICreateComment, IMemberRemarked, MemberRemarked } from '@joystream/metadata-protobuf'
import { MemberId } from '@joystream/types/primitives'
import { SubmittableExtrinsic } from '@polkadot/api/types'
import { ISubmittableResult } from '@polkadot/types/types/'
import { assert } from 'chai'
import { Api } from '../../../Api'
import { StandardizedFixture } from '../../../Fixture'
import { CommentCreatedEventFieldsFragment, CommentFieldsFragment } from '../../../graphql/generated/queries'
import { CommentStatus } from '../../../graphql/generated/schema'
import { QueryNodeApi } from '../../../QueryNodeApi'
import { EventDetails, EventType } from '../../../types'
import { Utils } from '../../../utils'

type MemberRemarkedEventDetails = EventDetails<EventType<'members', 'MemberRemarked'>>

export type CreateCommentParams = {
  asMember: MemberId
  msg: ICreateComment
}

export class CreateCommentsFixture extends StandardizedFixture {
  protected commentsParams: CreateCommentParams[]

  public constructor(api: Api, query: QueryNodeApi, commentsParams: CreateCommentParams[]) {
    super(api, query)
    this.commentsParams = commentsParams
  }

  public async getCreatedCommentsIds(): Promise<string[]> {
    const qEvents = await this.query.tryQueryWithTimeout(
      () => this.query.getCommentCreatedEvents(this.events),
      (qEvents) => this.assertQueryNodeEventsAreValid(qEvents)
    )
    return qEvents.map((e) => e.comment.id)
  }

  protected async getEventFromResult(result: ISubmittableResult): Promise<MemberRemarkedEventDetails> {
    return this.api.getEventDetails(result, 'members', 'MemberRemarked')
  }

  protected async getSignerAccountOrAccounts(): Promise<string[]> {
    return await Promise.all(
      this.commentsParams.map(async ({ asMember }) =>
        (await this.api.query.members.membershipById(asMember)).unwrap().controllerAccount.toString()
      )
    )
  }

  protected async getExtrinsics(): Promise<SubmittableExtrinsic<'promise'>[]> {
    return this.commentsParams.map((params) => {
      const msg: IMemberRemarked = {
        createComment: {
          videoId: params.msg.videoId,
          body: params.msg.body,
          parentCommentId: params.msg.parentCommentId,
        },
      }
      return this.api.tx.members.memberRemark(params.asMember, Utils.metadataToBytes(MemberRemarked, msg), null)
    })
  }

  protected assertQueriedCommentsAreValid(
    qComments: CommentFieldsFragment[],
    qEvents: CommentCreatedEventFieldsFragment[]
  ): void {
    this.events.map((e, i) => {
      const qEvent = this.findMatchingQueryNodeEvent(e, qEvents)
      const qComment = qComments.find((comment) => comment.id === qEvent.comment.id.toString())
      const commentParams = this.commentsParams[i]
      Utils.assert(qComment, 'Query node: Comment not found')
      assert.equal(qComment.video.id, commentParams.msg.videoId.toString())
      assert.equal(qComment.author.id, commentParams.asMember.toString())
      assert.equal(qComment.status, CommentStatus.Visible)
      assert.equal(qComment.text, commentParams.msg.body)
    })
  }

  protected assertQueryNodeEventIsValid(qEvent: CommentCreatedEventFieldsFragment, i: number): void {
    const params = this.commentsParams[i]
    assert.equal(qEvent.text, params.msg.body)
  }

  async runQueryNodeChecks(): Promise<void> {
    await super.runQueryNodeChecks()
    // Query the events
    const qEvents = await this.query.tryQueryWithTimeout(
      () => this.query.getCommentCreatedEvents(this.events),
      (qEvents) => this.assertQueryNodeEventsAreValid(qEvents)
    )

    // Query the comments
    const qComments = await this.query.getCommentsByIds(qEvents.map((e) => e.comment.id))
    this.assertQueriedCommentsAreValid(qComments, qEvents)
  }
}
