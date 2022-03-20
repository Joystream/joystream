import {
  ChannelOwnerRemarked,
  CommentSectionPreference,
  IChannelOwnerRemarked,
  ICommentSectionPreference,
} from '@joystream/metadata-protobuf'
import { MemberId } from '@joystream/types/common'
import { VideoId } from '@joystream/types/content'
import { SubmittableExtrinsic } from '@polkadot/api/types'
import { ISubmittableResult } from '@polkadot/types/types/'
import { assert } from 'chai'
import _ from 'lodash'
import { Api } from '../../../Api'
import { StandardizedFixture } from '../../../Fixture'
import { CommentSectionPreferenceEventFieldsFragment, VideoFieldsFragment } from '../../../graphql/generated/queries'
import { QueryNodeApi } from '../../../QueryNodeApi'
import { EventDetails, EventType } from '../../../types'
import { Utils } from '../../../utils'

type ChannelOwnerRemarkedEventDetails = EventDetails<EventType<'content', 'ChannelOwnerRemarked'>>

export type CommentSectionPreferenceParams = {
  asMember: MemberId
  msg: ICommentSectionPreference
}

export class EnableOrDisableCommentSectionFixture extends StandardizedFixture {
  protected commentSectionPreferenceParams: CommentSectionPreferenceParams[]

  public constructor(api: Api, query: QueryNodeApi, commentSectionPreferenceParams: CommentSectionPreferenceParams[]) {
    super(api, query)
    this.commentSectionPreferenceParams = commentSectionPreferenceParams
  }

  protected async getEventFromResult(result: ISubmittableResult): Promise<ChannelOwnerRemarkedEventDetails> {
    return this.api.getEventDetails(result, 'content', 'ChannelOwnerRemarked')
  }

  protected async getSignerAccountOrAccounts(): Promise<string[]> {
    return await Promise.all(
      this.commentSectionPreferenceParams.map(async ({ asMember }) =>
        (await this.api.query.members.membershipById(asMember)).controller_account.toString()
      )
    )
  }

  protected async getExtrinsics(): Promise<SubmittableExtrinsic<'promise'>[]> {
    return this.commentSectionPreferenceParams.map((params) => {
      const msg: IChannelOwnerRemarked = {
        commentSectionPreference: {
          videoId: params.msg.videoId,
          option: params.msg.option,
        },
      }
      return this.api.tx.members.memberRemark(params.asMember, Utils.metadataToBytes(ChannelOwnerRemarked, msg))
    })
  }

  protected assertQueriedCommentSectionPreferencesAreValid(qVideos: VideoFieldsFragment[]): void {
    // Check against the latest comment section preference , enable/disable for each video
    _.uniqBy([...this.commentSectionPreferenceParams].reverse(), (p) => `${p.msg.videoId.toString()}`).map((action) => {
      const qVideo = qVideos.find((c) => c.id === action.msg.videoId.toString())
      Utils.assert(qVideo, 'Query node: Video not found')

      assert.equal(
        qVideo.isCommentSectionEnabled,
        // eslint-disable-next-line no-unneeded-ternary
        action.msg.option === CommentSectionPreference.Option.ENABLE ? true : false
      )
    })
  }

  protected assertQueryNodeEventIsValid(qEvent: CommentSectionPreferenceEventFieldsFragment, i: number): void {
    const params = this.commentSectionPreferenceParams[i]
    assert.equal(qEvent.video.id, params.msg.videoId.toString())
  }

  async runQueryNodeChecks(): Promise<void> {
    await super.runQueryNodeChecks()
    // Query the events
    const qEvents = await this.query.tryQueryWithTimeout(
      () => this.query.getCommentSectionPreferenceEvents(this.events),
      (qEvents) => this.assertQueryNodeEventsAreValid(qEvents)
    )

    // Query the videos
    const qVideos = await this.query.getVideosByIds(qEvents.map((e) => (e.video.id as unknown) as VideoId))
    this.assertQueriedCommentSectionPreferencesAreValid(qVideos)
  }
}
