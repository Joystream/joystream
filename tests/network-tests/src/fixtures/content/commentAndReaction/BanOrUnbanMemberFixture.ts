import {
  BanOrUnbanMemberFromChannel,
  ChannelOwnerRemarked,
  IBanOrUnbanMemberFromChannel,
  IChannelOwnerRemarked,
} from '@joystream/metadata-protobuf'
import { ChannelId, MemberId } from '@joystream/types/common'
import { SubmittableExtrinsic } from '@polkadot/api/types'
import { ISubmittableResult } from '@polkadot/types/types/'
import { assert } from 'chai'
import _ from 'lodash'
import { Api } from '../../../Api'
import { StandardizedFixture } from '../../../Fixture'
import { ChannelFieldsFragment, MemberBannedFromChannelEventFieldsFragment } from '../../../graphql/generated/queries'
import { QueryNodeApi } from '../../../QueryNodeApi'
import { EventDetails, EventType } from '../../../types'
import { Utils } from '../../../utils'

type ChannelOwnerRemarkedEventDetails = EventDetails<EventType<'content', 'ChannelOwnerRemarked'>>

export type BanOrUnbanMemberParams = {
  asMember: MemberId
  channelId: ChannelId
  msg: IBanOrUnbanMemberFromChannel
}

export class BanOrUnbanMembersFixture extends StandardizedFixture {
  protected banOrUnbanMemberParams: BanOrUnbanMemberParams[]

  public constructor(api: Api, query: QueryNodeApi, banOrUnbanMemberParams: BanOrUnbanMemberParams[]) {
    super(api, query)
    this.banOrUnbanMemberParams = banOrUnbanMemberParams
  }

  protected async getEventFromResult(result: ISubmittableResult): Promise<ChannelOwnerRemarkedEventDetails> {
    return this.api.getEventDetails(result, 'content', 'ChannelOwnerRemarked')
  }

  protected async getSignerAccountOrAccounts(): Promise<string[]> {
    return await Promise.all(
      this.banOrUnbanMemberParams.map(async ({ asMember }) =>
        (await this.api.query.members.membershipById(asMember)).controller_account.toString()
      )
    )
  }

  protected async getExtrinsics(): Promise<SubmittableExtrinsic<'promise'>[]> {
    return this.banOrUnbanMemberParams.map((params) => {
      const msg: IChannelOwnerRemarked = {
        banOrUnbanMemberFromChannel: {
          memberId: params.msg.memberId,
          option: params.msg.option,
        },
      }
      return this.api.tx.members.memberRemark(params.asMember, Utils.metadataToBytes(ChannelOwnerRemarked, msg))
    })
  }

  protected assertQueriedBannedOrUnbannedMembersAreValid(qChannels: ChannelFieldsFragment[]): void {
    // Check against the latest ban/unban action by channel owner
    _.uniqBy(
      [...this.banOrUnbanMemberParams].reverse(),
      (p) => `${p.channelId.toString()}:${p.msg.memberId.toString()}`
    ).map((action) => {
      const qChannel = qChannels.find((c) => c.id === action.channelId.toString())
      Utils.assert(qChannel, 'Query node: Channel not found')

      if (action.msg.option === BanOrUnbanMemberFromChannel.Option.BAN) {
        const qBannedMember = qChannel.bannedMembers.find((m) => m.id === action.asMember.toString())
        Utils.assert(
          qBannedMember,
          `Query node: Expected member ${action.msg.memberId.toString()}  banned from channel ${
            action.channelId
          } not found!`
        )
        assert.equal(qBannedMember.id, action.msg.memberId.toString())
      }
    })
  }

  protected assertQueryNodeEventIsValid(qEvent: MemberBannedFromChannelEventFieldsFragment, i: number): void {
    const params = this.banOrUnbanMemberParams[i]
    assert.equal(qEvent.member.id, params.msg.memberId.toString())
    assert.equal(qEvent.channel.id, params.channelId.toString())
  }

  async runQueryNodeChecks(): Promise<void> {
    await super.runQueryNodeChecks()
    // Query the events
    const qEvents = await this.query.tryQueryWithTimeout(
      () => this.query.getMemberBannedFromChannelEvents(this.events),
      (qEvents) => this.assertQueryNodeEventsAreValid(qEvents)
    )

    // Query the channels
    const qChannels = await this.query.channelsByIds(qEvents.map((e) => e.channel.id))
    this.assertQueriedBannedOrUnbannedMembersAreValid(qChannels)
  }
}
