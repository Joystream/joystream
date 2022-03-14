import { IMemberRemarked, IReactComment, MemberRemarked, ReactVideo } from '@joystream/metadata-protobuf'
import { MemberId } from '@joystream/types/common'
import { SubmittableExtrinsic } from '@polkadot/api/types'
import { ISubmittableResult } from '@polkadot/types/types/'
import { assert } from 'chai'
import { Api } from '../../../Api'
import { StandardizedFixture } from '../../../Fixture'
import { CommentReactedEventFieldsFragment, CommentReactionFieldsFragment } from '../../../graphql/generated/queries'
import { VideoReactionOptions } from '../../../graphql/generated/schema'
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

  public async getAddedVideoReactionsIds(): Promise<VideoReactionOptions[]> {
    const qEvents = await this.query.tryQueryWithTimeout(
      () => this.query.getVideoReactedEvents(this.events),
      (qEvents) => this.assertQueryNodeEventsAreValid(qEvents)
    )
    return qEvents.map((e) => e.reactionResult)
  }

  protected async getEventFromResult(result: ISubmittableResult): Promise<MemberRemarkedEventDetails> {
    return this.api.getEventDetails(result, 'members', 'MemberRemarked')
  }

  protected async getSignerAccountOrAccounts(): Promise<string[]> {
    return await Promise.all(
      this.reactCommentParams.map(async ({ asMember }) =>
        (await this.api.query.members.membershipById(asMember)).controller_account.toString()
      )
    )
  }

  public async execute(): Promise<void> {
    const accounts = await this.getSignerAccountOrAccounts()
    await super.execute()
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

  protected assertQueriedCommentReactionsAreValid(
    qCommentReactions: CommentReactionFieldsFragment[],
    qEvents: CommentReactedEventFieldsFragment[]
  ): void {
    qEvents.map((qEvent, i) => {
      const qCommentReaction = qCommentReactions.find(
        (videoReaction) => videoReaction.id === qEvent.comment.id.toString()
      )
      const reactVideoParams = this.reactCommentParams[i]
      Utils.assert(qCommentReaction, 'Query node: Video reaction not found')
      assert.equal(qCommentReaction.comment.id, reactVideoParams.msg.commentId.toString())
      assert.equal(qCommentReaction.member.id, reactVideoParams.asMember.toString())
      assert.equal(qCommentReaction.reactionId, reactVideoParams.msg.reactionId)
    })
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

    // Query the video reactions
    const qCommentReactions = await this.query.getCommentReactionsByIds(qEvents.map((e) => e.id))
    this.assertQueriedCommentReactionsAreValid(qCommentReactions, qEvents)
  }
}
