import { IMakeChannelPayment, IMemberRemarked, MemberRemarked } from '@joystream/metadata-protobuf'
import { MemberId } from '@joystream/types/primitives'
import { SubmittableExtrinsic } from '@polkadot/api/types'
import { ISubmittableResult } from '@polkadot/types/types/'
import BN from 'bn.js'
import { assert } from 'chai'
import { Api } from '../../../Api'
import { StandardizedFixture } from '../../../Fixture'
import { QueryNodeApi } from '../../../QueryNodeApi'
import { ChannelPaymentMadeEventFieldsFragment } from '../../../graphql/generated/queries'
import { EventDetails, EventType } from '../../../types'
import { Utils } from '../../../utils'

type MemberRemarkedEventDetails = EventDetails<EventType<'members', 'MemberRemarked'>>

export type ChannelPaymentParams = {
  asMember: MemberId
  msg: IMakeChannelPayment
  payment: [string, BN]
}

export class DirectChannelPaymentsHappyCaseFixture extends StandardizedFixture {
  protected paymentParams: ChannelPaymentParams[]

  public constructor(api: Api, query: QueryNodeApi, paymentParams: ChannelPaymentParams[]) {
    super(api, query)
    this.paymentParams = paymentParams
  }

  protected async getEventFromResult(result: ISubmittableResult): Promise<MemberRemarkedEventDetails> {
    return this.api.getEventDetails(result, 'members', 'MemberRemarked')
  }

  protected async getSignerAccountOrAccounts(): Promise<string[]> {
    return await Promise.all(
      this.paymentParams.map(async ({ asMember }) =>
        (await this.api.query.members.membershipById(asMember)).unwrap().controllerAccount.toString()
      )
    )
  }

  protected async getExtrinsics(): Promise<SubmittableExtrinsic<'promise'>[]> {
    return this.paymentParams.map((params) => {
      const msg: IMemberRemarked = {
        makeChannelPayment: params.msg,
      }
      return this.api.tx.members.memberRemark(
        params.asMember,
        Utils.metadataToBytes(MemberRemarked, msg),
        params.payment
      )
    })
  }

  protected assertQueryNodeEventIsValid(qEvent: ChannelPaymentMadeEventFieldsFragment, i: number): void {
    const params = this.paymentParams[i]
    assert.equal(qEvent.rationale, params.msg.rationale)
    assert.equal(qEvent.payer.id, params.asMember.toString())
    assert.equal(qEvent.amount, params.payment[1])
    assert.equal(qEvent.payeeChannel?.rewardAccount, params.payment[0])
    Utils.assert(qEvent.paymentContext)
    if (params.msg.videoId) {
      Utils.assert(qEvent.paymentContext?.__typename === 'PaymentContextVideo')
      assert.equal(qEvent.paymentContext?.video?.id, params.msg.videoId.toString())
    } else {
      Utils.assert(qEvent.paymentContext?.__typename === 'PaymentContextChannel')
    }
  }

  async runQueryNodeChecks(): Promise<void> {
    await super.runQueryNodeChecks()
    // Query the events
    await this.query.tryQueryWithTimeout(
      () => this.query.getChannelPaymentMadeEvents(this.events),
      (qEvents) => this.assertQueryNodeEventsAreValid(qEvents)
    )
  }
}
