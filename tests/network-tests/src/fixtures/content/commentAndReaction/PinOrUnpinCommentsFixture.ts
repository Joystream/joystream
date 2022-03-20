import {
  ChannelOwnerRemarked,
  IChannelOwnerRemarked,
  IPinOrUnpinComment,
  PinOrUnpinComment,
} from '@joystream/metadata-protobuf'
import { MemberId } from '@joystream/types/common'
import { VideoId } from '@joystream/types/content'
import { SubmittableExtrinsic } from '@polkadot/api/types'
import { ISubmittableResult } from '@polkadot/types/types/'
import { assert } from 'chai'
import _ from 'lodash'
import { Api } from '../../../Api'
import { StandardizedFixture } from '../../../Fixture'
import { CommentPinnedEventFieldsFragment, VideoFieldsFragment } from '../../../graphql/generated/queries'
import { QueryNodeApi } from '../../../QueryNodeApi'
import { EventDetails, EventType } from '../../../types'
import { Utils } from '../../../utils'

type ChannelOwnerRemarkedEventDetails = EventDetails<EventType<'content', 'ChannelOwnerRemarked'>>

export type PinOrUnpinCommentParams = {
  asMember: MemberId
  msg: IPinOrUnpinComment
}

export class PinCommentsFixture extends StandardizedFixture {
  protected pinOrUnpinCommentParams: PinOrUnpinCommentParams[]

  public constructor(api: Api, query: QueryNodeApi, pinOrUnpinCommentParams: PinOrUnpinCommentParams[]) {
    super(api, query)
    this.pinOrUnpinCommentParams = pinOrUnpinCommentParams
  }

  protected async getEventFromResult(result: ISubmittableResult): Promise<ChannelOwnerRemarkedEventDetails> {
    return this.api.getEventDetails(result, 'content', 'ChannelOwnerRemarked')
  }

  protected async getSignerAccountOrAccounts(): Promise<string[]> {
    return await Promise.all(
      this.pinOrUnpinCommentParams.map(async ({ asMember }) =>
        (await this.api.query.members.membershipById(asMember)).controller_account.toString()
      )
    )
  }

  protected async getExtrinsics(): Promise<SubmittableExtrinsic<'promise'>[]> {
    return this.pinOrUnpinCommentParams.map((params) => {
      const msg: IChannelOwnerRemarked = {
        pinOrUnpinComment: {
          videoId: params.msg.videoId,
          commentId: params.msg.commentId,
          option: params.msg.option,
        },
      }
      return this.api.tx.members.memberRemark(params.asMember, Utils.metadataToBytes(ChannelOwnerRemarked, msg))
    })
  }

  protected assertQueriedPinnedCommentsAreValid(qVideos: VideoFieldsFragment[]): void {
    // Check against the latest pin/unpin comment action by channel owner
    _.uniqBy([...this.pinOrUnpinCommentParams].reverse(), (p) => `${p.msg.videoId.toString()}`).map((action) => {
      const qVideo = qVideos.find((v) => v.id === action.msg.videoId.toString())
      Utils.assert(qVideo, 'Query node: Channel not found')

      if (action.msg.option === PinOrUnpinComment.Option.PIN) {
        Utils.assert(qVideo.pinnedComment, `Query node: Pinned comment not found`)
        assert.equal(qVideo.pinnedComment.id, action.msg.commentId.toString())
      }
    })
  }

  protected assertQueryNodeEventIsValid(qEvent: CommentPinnedEventFieldsFragment, i: number): void {
    const params = this.pinOrUnpinCommentParams[i]
    assert.equal(qEvent.comment.id, params.msg.commentId)
  }

  async runQueryNodeChecks(): Promise<void> {
    await super.runQueryNodeChecks()
    // Query the events
    const qEvents = await this.query.tryQueryWithTimeout(
      () => this.query.getCommentPinnedEvents(this.events),
      (qEvents) => this.assertQueryNodeEventsAreValid(qEvents)
    )

    // Query the pinned comments
    const qVideos = await this.query.getVideosByIds(qEvents.map((e) => (e.comment.video.id as unknown) as VideoId))
    this.assertQueriedPinnedCommentsAreValid(qVideos)
  }
}
