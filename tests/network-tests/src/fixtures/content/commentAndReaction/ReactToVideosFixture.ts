import { IMemberRemarked, IReactVideo, MemberRemarked, ReactVideo } from '@joystream/metadata-protobuf'
import { MemberId } from '@joystream/types/common'
import { SubmittableExtrinsic } from '@polkadot/api/types'
import { ISubmittableResult } from '@polkadot/types/types/'
import { assert } from 'chai'
import _ from 'lodash'
import { Api } from '../../../Api'
import { StandardizedFixture } from '../../../Fixture'
import { VideoReactedEventFieldsFragment, VideoReactionFieldsFragment } from '../../../graphql/generated/queries'
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
      this.reactVideoParams.map(async ({ asMember }) =>
        (await this.api.query.members.membershipById(asMember)).controller_account.toString()
      )
    )
  }

  public async execute(): Promise<void> {
    const accounts = await this.getSignerAccountOrAccounts()
    await super.execute()
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

  protected assertQueriedVideoReactionsAreValid(
    qVideoReactions: VideoReactionFieldsFragment[],
    qEvents: VideoReactedEventFieldsFragment[]
  ): void {
    qEvents.map((qEvent, i) => {
      const qVideoReaction = qVideoReactions.find((videoReaction) => videoReaction.id === qEvent.video.id.toString())
      const reactVideoParams = this.reactVideoParams[i]
      Utils.assert(qVideoReaction, 'Query node: Video reaction not found')
      assert.equal(qVideoReaction.video.id, reactVideoParams.msg.videoId.toString())
      assert.equal(qVideoReaction.member.id, reactVideoParams.asMember.toString())
      assert.equal(qVideoReaction.reaction, this.getExpectedReaction(reactVideoParams.msg.reaction))
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

    // Query the video reactions
    const qVideoReactions = await this.query.getVideoReactionsByIds(qEvents.map((e) => e.id))
    this.assertQueriedVideoReactionsAreValid(qVideoReactions, qEvents)
  }
}
