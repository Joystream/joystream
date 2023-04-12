import {
  ChannelOwnerRemarked,
  IChannelOwnerRemarked,
  IVideoReactionsPreference,
  VideoReactionsPreference,
} from '@joystream/metadata-protobuf'
import { MemberId } from '@joystream/types/primitives'
import { SubmittableExtrinsic } from '@polkadot/api/types'
import { ISubmittableResult } from '@polkadot/types/types/'
import { assert } from 'chai'
import _ from 'lodash'
import { Api } from '../../../Api'
import { StandardizedFixture } from '../../../Fixture'
import { VideoFieldsFragment, VideoReactionsPreferenceEventFieldsFragment } from '../../../graphql/generated/queries'
import { QueryNodeApi } from '../../../QueryNodeApi'
import { EventDetails, EventType } from '../../../types'
import { Utils } from '../../../utils'

type ChannelOwnerRemarkedEventDetails = EventDetails<EventType<'content', 'ChannelOwnerRemarked'>>

export type VideoReactionsPreferenceParams = {
  asMember: MemberId
  msg: IVideoReactionsPreference
}

export class EnableOrDisableCommentSectionFixture extends StandardizedFixture {
  protected videoReactionsPreferenceParams: VideoReactionsPreferenceParams[]

  public constructor(api: Api, query: QueryNodeApi, videoReactionsPreferenceParams: VideoReactionsPreferenceParams[]) {
    super(api, query)
    this.videoReactionsPreferenceParams = videoReactionsPreferenceParams
  }

  protected async getEventFromResult(result: ISubmittableResult): Promise<ChannelOwnerRemarkedEventDetails> {
    return this.api.getEventDetails(result, 'content', 'ChannelOwnerRemarked')
  }

  protected async getSignerAccountOrAccounts(): Promise<string[]> {
    return await Promise.all(
      this.videoReactionsPreferenceParams.map(async ({ asMember }) =>
        (await this.api.query.members.membershipById(asMember)).unwrap().controllerAccount.toString()
      )
    )
  }

  protected async getExtrinsics(): Promise<SubmittableExtrinsic<'promise'>[]> {
    return this.videoReactionsPreferenceParams.map((params) => {
      const msg: IChannelOwnerRemarked = {
        videoReactionsPreference: {
          videoId: params.msg.videoId,
          option: params.msg.option,
        },
      }
      return this.api.tx.members.memberRemark(params.asMember, Utils.metadataToBytes(ChannelOwnerRemarked, msg), null)
    })
  }

  protected assertQueriedVideoReactionsPreferencesAreValid(qVideos: VideoFieldsFragment[]): void {
    // Check against the latest video reactions preference ,i.e. enable/disable for each video
    _.uniqBy([...this.videoReactionsPreferenceParams].reverse(), (p) => `${p.msg.videoId.toString()}`).map((action) => {
      const qVideo = qVideos.find((c) => c.id === action.msg.videoId.toString())
      Utils.assert(qVideo, 'Query node: Video not found')

      assert.equal(qVideo.isCommentSectionEnabled, action.msg.option === VideoReactionsPreference.Option.ENABLE)
    })
  }

  protected assertQueryNodeEventIsValid(qEvent: VideoReactionsPreferenceEventFieldsFragment, i: number): void {
    const params = this.videoReactionsPreferenceParams[i]
    assert.equal(qEvent.video.id, params.msg.videoId.toString())
  }

  async runQueryNodeChecks(): Promise<void> {
    await super.runQueryNodeChecks()
    // Query the events
    const qEvents = await this.query.tryQueryWithTimeout(
      () => this.query.getVideoReactionsPreferenceEvents(this.events),
      (qEvents) => this.assertQueryNodeEventsAreValid(qEvents)
    )

    // Query the videos
    const qVideos = await this.query.getVideosByIds(qEvents.map((e) => e.video.id))
    this.assertQueriedVideoReactionsPreferencesAreValid(qVideos)
  }
}
