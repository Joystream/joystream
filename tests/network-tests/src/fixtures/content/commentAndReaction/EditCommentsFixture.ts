import { IEditComment, IMemberRemarked, MemberRemarked } from '@joystream/metadata-protobuf'
import { MemberId } from '@joystream/types/common'
import { SubmittableExtrinsic } from '@polkadot/api/types'
import { ISubmittableResult } from '@polkadot/types/types/'
import { assert } from 'chai'
import { Api } from '../../../Api'
import { StandardizedFixture } from '../../../Fixture'
import {
  CommentDeletedEventFieldsFragment,
  CommentTextUpdatedEventFieldsFragment,
  VideoCommentFieldsFragment,
} from '../../../graphql/generated/queries'
import { CommentStatus } from '../../../graphql/generated/schema'
import { QueryNodeApi } from '../../../QueryNodeApi'
import { EventDetails, EventType } from '../../../types'
import { Utils } from '../../../utils'

type MemberRemarkedEventDetails = EventDetails<EventType<'members', 'MemberRemarked'>>

export type EditCommentParams = {
  asMember: MemberId
  msg: IEditComment
}

export class EditCommentsFixture extends StandardizedFixture {
  protected editCommentParams: EditCommentParams[]

  public constructor(api: Api, query: QueryNodeApi, editCommentParams: EditCommentParams[]) {
    super(api, query)
    this.editCommentParams = editCommentParams
  }

  public async getEditedCommentsIds(): Promise<string[]> {
    const qEvents = await this.query.tryQueryWithTimeout(
      () => this.query.getCommentEditedEvents(this.events),
      (qEvents) => this.assertQueryNodeEventsAreValid(qEvents)
    )
    return qEvents.map((e) => e.comment.id)
  }

  protected async getEventFromResult(result: ISubmittableResult): Promise<MemberRemarkedEventDetails> {
    return this.api.getEventDetails(result, 'members', 'MemberRemarked')
  }

  protected async getSignerAccountOrAccounts(): Promise<string[]> {
    return await Promise.all(
      this.editCommentParams.map(async ({ asMember }) =>
        (await this.api.query.members.membershipById(asMember)).controller_account.toString()
      )
    )
  }

  protected async getExtrinsics(): Promise<SubmittableExtrinsic<'promise'>[]> {
    return this.editCommentParams.map((params) => {
      const msg: IMemberRemarked = {
        editComment: {
          commentId: params.msg.commentId,
          newBody: params.msg.newBody,
        },
      }
      return this.api.tx.members.memberRemark(params.asMember, Utils.metadataToBytes(MemberRemarked, msg))
    })
  }

  protected assertQueriedCommentsAreValid(
    qComments: VideoCommentFieldsFragment[],
    qEvents: CommentTextUpdatedEventFieldsFragment[]
  ): void {
    qEvents.map((qEvent, i) => {
      const qComment = qComments.find((comment) => comment.id === qEvent.comment.id.toString())
      const commentParams = this.editCommentParams[i]
      Utils.assert(qComment, 'Query node: Comment not found')
      assert.equal(qComment.author.id, commentParams.asMember.toString())
      assert.equal(qComment.status, CommentStatus.Visible)
      assert.equal(qComment.isEdited, true)
    })
  }

  protected assertQueryNodeEventIsValid(qEvent: CommentTextUpdatedEventFieldsFragment, i: number): void {
    const params = this.editCommentParams[i]
    assert.equal(qEvent.comment.id, params.msg.commentId.toString())
  }

  async runQueryNodeChecks(): Promise<void> {
    await super.runQueryNodeChecks()
    // Query the events
    const qEvents = await this.query.tryQueryWithTimeout(
      () => this.query.getCommentEditedEvents(this.events),
      (qEvents) => this.assertQueryNodeEventsAreValid(qEvents)
    )

    // Query the comments
    const qComments = await this.query.getCommentsByIds(qEvents.map((e) => e.comment.id))
    this.assertQueriedCommentsAreValid(qComments, qEvents)
  }
}
