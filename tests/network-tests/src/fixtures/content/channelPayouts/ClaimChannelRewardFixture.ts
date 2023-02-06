import { prepareClaimChannelRewardExtrinsicArgs } from '@joystream/js/content'
import { ChannelPayoutsMetadata } from '@joystream/metadata-protobuf'
import { MemberId } from '@joystream/types/primitives'
import { SubmittableExtrinsic } from '@polkadot/api/types'
import { ISubmittableResult } from '@polkadot/types/types/'
import { assert } from 'chai'
import { Utils } from '../../../utils'
import { Api } from '../../../Api'
import { StandardizedFixture } from '../../../Fixture'
import { ChannelFieldsFragment, ChannelRewardClaimedEventFieldsFragment } from '../../../graphql/generated/queries'
import { QueryNodeApi } from '../../../QueryNodeApi'
import { EventDetails, EventType } from '../../../types'
import BN from 'bn.js'

type ClaimChannelRewardEventDetails = EventDetails<EventType<'content', 'ChannelRewardUpdated'>>

export type ClaimChannelRewardParams = {
  asMember: MemberId
  payoutProof: ChannelPayoutsMetadata.Body.ChannelPayoutProof
}

export async function getExpectedClaims(api: Api, params: ClaimChannelRewardParams[]): Promise<string[]> {
  return Promise.all(
    params.map(async ({ payoutProof: { channelId, cumulativeRewardEarned } }) => {
      const channel = await api.query.content.channelById(channelId)
      return new BN(cumulativeRewardEarned).sub(channel.cumulativeRewardClaimed).toString()
    })
  )
}

export class ClaimChannelRewardFixture extends StandardizedFixture {
  protected claimChannelRewardParams: ClaimChannelRewardParams[]
  protected expectedClaims: string[] = []

  public constructor(api: Api, query: QueryNodeApi, claimChannelRewardParams: ClaimChannelRewardParams[]) {
    super(api, query)
    this.claimChannelRewardParams = claimChannelRewardParams
  }

  protected async getEventFromResult(result: ISubmittableResult): Promise<ClaimChannelRewardEventDetails> {
    return this.api.getEventDetails(result, 'content', 'ChannelRewardUpdated')
  }

  protected async getSignerAccountOrAccounts(): Promise<string[]> {
    return await Promise.all(
      this.claimChannelRewardParams.map(async ({ asMember }) =>
        (await this.api.query.members.membershipById(asMember)).unwrap().controllerAccount.toString()
      )
    )
  }

  protected async getExtrinsics(): Promise<SubmittableExtrinsic<'promise'>[]> {
    return this.claimChannelRewardParams.map((params) => {
      // Prepare extrinsic arguments
      const { pullPayment, proofElements } = prepareClaimChannelRewardExtrinsicArgs(params.payoutProof)

      return this.api.tx.content.claimChannelReward({ Member: params.asMember }, proofElements, pullPayment)
    })
  }

  protected assertQueryNodeEventIsValid(qEvent: ChannelRewardClaimedEventFieldsFragment, i: number): void {
    const params = this.claimChannelRewardParams[i]
    assert.equal(qEvent.channel.id, params.payoutProof.channelId.toString())
    assert.equal(
      qEvent.amount,
      this.expectedClaims[i],
      `query node ${qEvent.amount} is not equal to claimed ${this.expectedClaims[i]}`
    )
  }

  protected assertQueryNodeChannelsAreValid(qChannels: ChannelFieldsFragment[]): void {
    this.claimChannelRewardParams.forEach((p) => {
      const channelId = p.payoutProof.channelId.toString()
      const qChannel = qChannels.find((c) => c.id === channelId)
      Utils.assert(qChannel, `Channel not found by id: ${channelId}`)
      assert.equal(qChannel.cumulativeRewardClaimed, p.payoutProof.cumulativeRewardEarned)
    })
  }

  public async execute(): Promise<void> {
    this.expectedClaims = await getExpectedClaims(this.api, this.claimChannelRewardParams)
    await super.execute()
  }

  async runQueryNodeChecks(): Promise<void> {
    await super.runQueryNodeChecks()
    // Query the events
    await this.query.tryQueryWithTimeout(
      () => this.query.getChannelRewardClaimedEvents(this.events),
      (qEvents) => this.assertQueryNodeEventsAreValid(qEvents)
    )
    // Query the channels
    const channelIds = this.claimChannelRewardParams.map((p) => p.payoutProof.channelId.toString())
    await this.query.tryQueryWithTimeout(
      () => this.query.channelsByIds(channelIds),
      (qChannels) => this.assertQueryNodeChannelsAreValid(qChannels)
    )
  }
}
