import { IDeleteComment, IMemberRemarked, MemberRemarked } from '@joystream/metadata-protobuf'
import { MemberId } from '@joystream/types/common'
import { SubmittableExtrinsic } from '@polkadot/api/types'
import { ISubmittableResult } from '@polkadot/types/types/'
import { assert } from 'chai'
import { Api } from '../../../Api'
import { StandardizedFixture } from '../../../Fixture'
import { CommentDeletedEventFieldsFragment, VideoCommentFieldsFragment } from '../../../graphql/generated/queries'
import { CommentStatus } from '../../../graphql/generated/schema'
import { QueryNodeApi } from '../../../QueryNodeApi'
import { EventDetails, EventType } from '../../../types'
import { Utils } from '../../../utils'

type MemberRemarkedEventDetails = EventDetails<EventType<'members', 'MemberRemarked'>>

export type DeleteCommentParams = {
  asMember: MemberId
  msg: IDeleteComment
}

export class DeleteCommentsFixture extends StandardizedFixture {
  protected deleteCommentParams: DeleteCommentParams[]

  public constructor(api: Api, query: QueryNodeApi, deleteCommentParams: DeleteCommentParams[]) {
    super(api, query)
    this.deleteCommentParams = deleteCommentParams
  }

  public async getDeletedCommentsIds(): Promise<string[]> {
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
      this.deleteCommentParams.map(async ({ asMember }) =>
        (await this.api.query.members.membershipById(asMember)).controller_account.toString()
      )
    )
  }

  protected async getExtrinsics(): Promise<SubmittableExtrinsic<'promise'>[]> {
    return this.deleteCommentParams.map((params) => {
      const msg: IMemberRemarked = {
        deleteComment: {
          videoId: params.msg.videoId,
          commentId: params.msg.commentId,
        },
      }
      return this.api.tx.members.memberRemark(params.asMember, Utils.metadataToBytes(MemberRemarked, msg))
    })
  }

  protected assertQueriedCommentsAreValid(
    qComments: VideoCommentFieldsFragment[],
    qEvents: CommentDeletedEventFieldsFragment[]
  ): void {
    qEvents.map((qEvent, i) => {
      const qComment = qComments.find((comment) => comment.id === qEvent.comment.id.toString())
      const commentParams = this.deleteCommentParams[i]
      Utils.assert(qComment, 'Query node: Comment not found')
      assert.equal(qComment.video.id, commentParams.msg.videoId.toString())
      assert.equal(qComment.author.id, commentParams.asMember.toString())
      assert.equal(qComment.status, CommentStatus.Deleted)
    })
  }

  protected assertQueryNodeEventIsValid(qEvent: CommentDeletedEventFieldsFragment, i: number): void {
    const params = this.deleteCommentParams[i]
    assert.equal(qEvent.comment.id, params.msg.commentId.toString())
    assert.equal(qEvent.comment.status, CommentStatus.Deleted)
  }

  async runQueryNodeChecks(): Promise<void> {
    await super.runQueryNodeChecks()
    // Query the events
    const qEvents = await this.query.tryQueryWithTimeout(
      () => this.query.getCommentDeletedEvents(this.events),
      (qEvents) => this.assertQueryNodeEventsAreValid(qEvents)
    )

    // Query the comments
    const qComments = await this.query.getCommentsByIds(qEvents.map((e) => e.comment.id))
    this.assertQueriedCommentsAreValid(qComments, qEvents)
  }
}
