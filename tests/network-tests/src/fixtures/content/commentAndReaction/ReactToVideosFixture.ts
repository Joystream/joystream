import { IMemberRemarked, IReactVideo, MemberRemarked, ReactVideo } from '@joystream/metadata-protobuf'
import { MemberId } from '@joystream/types/primitives'
import { SubmittableExtrinsic } from '@polkadot/api/types'
import { ISubmittableResult } from '@polkadot/types/types/'
import { assert } from 'chai'
import _ from 'lodash'
import { Api } from '../../../Api'
import { StandardizedFixture } from '../../../Fixture'
import { VideoFieldsFragment, VideoReactedEventFieldsFragment } from '../../../graphql/generated/queries'
import { VideoReactionOptions } from '../../../graphql/generated/schema'
import { QueryNodeApi } from '../../../QueryNodeApi'
import { EventDetails, EventType } from '../../../types'
import { Utils } from '../../../utils'

type MemberRemarkedEventDetails = EventDetails<EventType<'members', 'MemberRemarked'>>

export type ReactVideoParams = {
  asMember: MemberId
  msg: IReactVideo
}

export class ReactToVideosFixture extends StandardizedFixture {
  protected reactVideoParams: ReactVideoParams[]

  public constructor(api: Api, query: QueryNodeApi, reactVideoParams: ReactVideoParams[]) {
    super(api, query)
    this.reactVideoParams = reactVideoParams
  }

  protected async getEventFromResult(result: ISubmittableResult): Promise<MemberRemarkedEventDetails> {
    return this.api.getEventDetails(result, 'members', 'MemberRemarked')
  }

  protected async getSignerAccountOrAccounts(): Promise<string[]> {
    return await Promise.all(
      this.reactVideoParams.map(async ({ asMember }) =>
        (await this.api.query.members.membershipById(asMember)).unwrap().controllerAccount.toString()
      )
    )
  }

  protected async getExtrinsics(): Promise<SubmittableExtrinsic<'promise'>[]> {
    return this.reactVideoParams.map((params) => {
      const msg: IMemberRemarked = {
        reactVideo: {
          videoId: params.msg.videoId,
          reaction: params.msg.reaction,
        },
      }
      return this.api.tx.members.memberRemark(params.asMember, Utils.metadataToBytes(MemberRemarked, msg), null)
    })
  }

  protected getExpectedReaction(reaction: ReactVideo.Reaction): VideoReactionOptions {
    return reaction === ReactVideo.Reaction.LIKE ? VideoReactionOptions.Like : VideoReactionOptions.Unlike
  }

  protected assertQueriedVideosAreValid(qVideos: VideoFieldsFragment[]): void {
    // remove 'even' instances of same reaction since they entails unreacting
    this.reactVideoParams = this.reactVideoParams.filter((param) => {
      return this.reactVideoParams.filter((elem) => _.isEqual(elem, param)).length % 2 === 1
    })
    // Check against latest reaction per user per video
    _.uniqBy(this.reactVideoParams.reverse(), (p) => `${p.asMember}:${p.msg.videoId}`).map((param) => {
      const expectedReaction = this.getExpectedReaction(param.msg.reaction)
      const qVideo = qVideos.find((v) => v.id === param.msg.videoId.toString())
      Utils.assert(qVideo, 'Query node: Video not found')

      const qReaction = qVideo.reactions.find((r) => r.member.id === param.asMember.toString())
      Utils.assert(qReaction, `Query node: Expected video reaction by member ${param.asMember} not found!`)
      assert.equal(qReaction.reaction, expectedReaction)
    })
  }

  protected assertQueryNodeEventIsValid(qEvent: VideoReactedEventFieldsFragment, i: number): void {
    const params = this.reactVideoParams[i]
    assert.equal(qEvent.reactionResult, this.getExpectedReaction(params.msg.reaction))
    assert.equal(qEvent.video.id, params.msg.videoId.toString())
    assert.equal(qEvent.reactingMember.id, params.asMember.toString())
  }

  async runQueryNodeChecks(): Promise<void> {
    await super.runQueryNodeChecks()
    // Query the events
    const qEvents = await this.query.tryQueryWithTimeout(
      () => this.query.getVideoReactedEvents(this.events),
      (qEvents) => this.assertQueryNodeEventsAreValid(qEvents)
    )

    // Query the videos that have been reacted
    const qVideos = await this.query.getVideosByIds(qEvents.map((e) => e.video.id))
    this.assertQueriedVideosAreValid(qVideos)
  }
}
