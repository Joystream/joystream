import { ChannelPayoutsMetadata } from '@joystream/metadata-protobuf'
import { createType } from '@joystream/types'
import { MemberId } from '@joystream/types/primitives'
import { SubmittableExtrinsic } from '@polkadot/api/types'
import { PalletCommonMerkleTreeProofElementRecord } from '@polkadot/types/lookup'
import { ISubmittableResult } from '@polkadot/types/types/'
import { u8aToHex } from '@polkadot/util'
import { BN } from 'bn.js'
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
      const pullPayment = createType('PalletContentPullPaymentElement', {
        channelId: params.payoutProof.channelId,
        cumulativeRewardEarned: new BN(params.payoutProof.cumulativeRewardEarned),
        reason: u8aToHex(Buffer.from(params.payoutProof.reason, 'hex')),
      })

      const merkleBranch: PalletCommonMerkleTreeProofElementRecord[] = []
      params.payoutProof.merkleBranch.forEach((m) => {
        const proofElement = createType('PalletCommonMerkleTreeProofElementRecord', {
          hash_: u8aToHex(Buffer.from(m.hash, 'hex')),
          side: m.side ? { Right: null } : { Left: null },
        })
        merkleBranch.push(proofElement)
      })

      return this.api.tx.content.claimChannelReward({ Member: params.asMember }, merkleBranch, pullPayment)
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
