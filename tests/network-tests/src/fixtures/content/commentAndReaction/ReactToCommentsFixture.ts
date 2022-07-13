import { IMemberRemarked, IReactComment, MemberRemarked } from '@joystream/metadata-protobuf'
import { MemberId } from '@joystream/types/primitives'
import { SubmittableExtrinsic } from '@polkadot/api/types'
import { ISubmittableResult } from '@polkadot/types/types/'
import { assert } from 'chai'
import _ from 'lodash'
import { Api } from '../../../Api'
import { StandardizedFixture } from '../../../Fixture'
import { CommentFieldsFragment, CommentReactedEventFieldsFragment } from '../../../graphql/generated/queries'
import { QueryNodeApi } from '../../../QueryNodeApi'
import { EventDetails, EventType } from '../../../types'
import { Utils } from '../../../utils'

type MemberRemarkedEventDetails = EventDetails<EventType<'members', 'MemberRemarked'>>

export type ReactCommentParams = {
  asMember: MemberId
  msg: IReactComment
}

export class ReactToCommentsFixture extends StandardizedFixture {
  protected reactCommentParams: ReactCommentParams[]

  public constructor(api: Api, query: QueryNodeApi, reactVideoParams: ReactCommentParams[]) {
    super(api, query)
    this.reactCommentParams = reactVideoParams
  }

  protected async getEventFromResult(result: ISubmittableResult): Promise<MemberRemarkedEventDetails> {
    return this.api.getEventDetails(result, 'members', 'MemberRemarked')
  }

  protected async getSignerAccountOrAccounts(): Promise<string[]> {
    return await Promise.all(
      this.reactCommentParams.map(async ({ asMember }) =>
        (await this.api.query.members.membershipById(asMember)).unwrap().controllerAccount.toString()
      )
    )
  }

  protected async getExtrinsics(): Promise<SubmittableExtrinsic<'promise'>[]> {
    return this.reactCommentParams.map((params) => {
      const msg: IMemberRemarked = {
        reactComment: {
          commentId: params.msg.commentId,
          reactionId: params.msg.reactionId,
        },
      }
      return this.api.tx.members.memberRemark(params.asMember, Utils.metadataToBytes(MemberRemarked, msg))
    })
  }

  protected assertQueriedCommentsAreValid(qComments: CommentFieldsFragment[]): void {
    // remove 'even' instances of same reaction since they entail unreacting
    this.reactCommentParams = this.reactCommentParams.filter((param) => {
      return this.reactCommentParams.filter((elem) => _.isEqual(elem, param)).length % 2 === 1
    })
    // Check against lastest reaction per user per comment
    _.uniqBy(this.reactCommentParams.reverse(), (p) => `${p.asMember}:${p.msg.commentId}:${p.msg.reactionId}`).map(
      (param) => {
        const expectedReaction = param.msg.reactionId
        const qComment = qComments.find((c) => c.id === param.msg.commentId)
        Utils.assert(qComment, 'Query node: Comment not found')

        const qReaction = qComment.reactions.find(
          (r) => r.member.id === param.asMember.toString() && r.reactionId === expectedReaction
        )
        Utils.assert(qReaction, `Query node: Expected comment reaction by member ${param.asMember} not found!`)
      }
    )
  }

  protected assertQueryNodeEventIsValid(qEvent: CommentReactedEventFieldsFragment, i: number): void {
    const params = this.reactCommentParams[i]
    assert.equal(qEvent.reactionResult, params.msg.reactionId)
    assert.equal(qEvent.comment.id, params.msg.commentId.toString())
    assert.equal(qEvent.reactingMember.id, params.asMember.toString())
  }

  async runQueryNodeChecks(): Promise<void> {
    await super.runQueryNodeChecks()
    // Query the events
    const qEvents = await this.query.tryQueryWithTimeout(
      () => this.query.getCommentReactedEvents(this.events),
      (qEvents) => this.assertQueryNodeEventsAreValid(qEvents)
    )

    // Query the comments
    const qCommentReactions = await this.query.getCommentsByIds(qEvents.map((e) => e.comment.id))
    this.assertQueriedCommentsAreValid(qCommentReactions)
  }
}
