import { IMemberRemarked, IReactVideo, MemberRemarked, ReactVideo } from '@joystream/metadata-protobuf'
import { MemberId } from '@joystream/types/common'
import { VideoId } from '@joystream/types/content'
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
        (await this.api.query.members.membershipById(asMember)).controller_account.toString()
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
      return this.api.tx.members.memberRemark(params.asMember, Utils.metadataToBytes(MemberRemarked, msg))
    })
  }

  protected getExpectedReaction(reaction: ReactVideo.Reaction): VideoReactionOptions {
    if (reaction === ReactVideo.Reaction.LIKE) {
      return VideoReactionOptions.Like
    }

    if (reaction === ReactVideo.Reaction.UNLIKE) {
      return VideoReactionOptions.Unlike
    }
    return VideoReactionOptions.Like
  }

  protected assertQueriedVideoReactionsAreValid(qVideos: VideoFieldsFragment[]): void {
    // Check against latest reaction per user per video
    _.uniqBy([...this.reactVideoParams].reverse(), (p) => `${p.msg.videoId.toString()}:${p.asMember.toString()}`).map(
      (param) => {
        const qVideo = qVideos.find((v) => v.id === param.msg.videoId.toString())
        Utils.assert(qVideo, 'Query node: Video not found')

        const qReaction = qVideo.reactions.find((r) => r.member.id === param.asMember.toString())
        Utils.assert(qReaction, `Query node: Expected video reaction by member ${param.asMember.toString()} not found!`)
        assert.equal(qReaction.reaction, this.getExpectedReaction(param.msg.reaction))
      }
    )
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
    const qVideos = await this.query.getVideosByIds(qEvents.map((e) => (e.video.id as unknown) as VideoId))
    this.assertQueriedVideoReactionsAreValid(qVideos)
  }
}
