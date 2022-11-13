import { prepareClaimChannelRewardExtrinsicArgs } from '@joystream/js/content'
import { ChannelPayoutsMetadata } from '@joystream/metadata-protobuf'
import { MemberId } from '@joystream/types/primitives'
import { SubmittableExtrinsic } from '@polkadot/api/types'
import { ISubmittableResult } from '@polkadot/types/types/'
import { assert } from 'chai'
import { Api } from '../../../Api'
import { StandardizedFixture } from '../../../Fixture'
import { ChannelRewardClaimedEventFieldsFragment } from '../../../graphql/generated/queries'
import { QueryNodeApi } from '../../../QueryNodeApi'
import { EventDetails, EventType } from '../../../types'

type ClaimChannelRewardEventDetails = EventDetails<EventType<'content', 'ChannelRewardUpdated'>>

export type ClaimChannelRewardParams = {
  asMember: MemberId
  payoutProof: ChannelPayoutsMetadata.Body.ChannelPayoutProof
}

export class ClaimChannelRewardFixture extends StandardizedFixture {
  protected claimChannelRewardParams: ClaimChannelRewardParams[]

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
    assert.equal(qEvent.amount, params.payoutProof.cumulativeRewardEarned)
  }

  async runQueryNodeChecks(): Promise<void> {
    await super.runQueryNodeChecks()
    // Query the events
    await this.query.tryQueryWithTimeout(
      () => this.query.getChannelRewardClaimedEvents(this.events),
      (qEvents) => this.assertQueryNodeEventsAreValid(qEvents)
    )
  }
}
