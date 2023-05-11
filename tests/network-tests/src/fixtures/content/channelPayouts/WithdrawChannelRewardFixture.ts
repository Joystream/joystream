import { MemberId } from '@joystream/types/primitives'
import { SubmittableExtrinsic } from '@polkadot/api/types'
import { ISubmittableResult } from '@polkadot/types/types/'
import BN from 'bn.js'
import { assert } from 'chai'
import { Api } from '../../../Api'
import { StandardizedFixture } from '../../../Fixture'
import { ChannelFundsWithdrawnEventFieldsFragment } from '../../../graphql/generated/queries'
import { QueryNodeApi } from '../../../QueryNodeApi'
import { EventDetails, EventType } from '../../../types'

type ChannelFundsWithdrawnEventDetails = EventDetails<EventType<'content', 'ChannelFundsWithdrawn'>>

export type WithdrawChannelRewardParams = {
  asMember: MemberId
  channelId: number
  amount: BN
}

export class WithdrawChannelRewardFixture extends StandardizedFixture {
  protected withdrawChannelRewardParams: WithdrawChannelRewardParams[]

  public constructor(api: Api, query: QueryNodeApi, withdrawChannelRewardParams: WithdrawChannelRewardParams[]) {
    super(api, query)
    this.withdrawChannelRewardParams = withdrawChannelRewardParams
  }

  protected async getEventFromResult(result: ISubmittableResult): Promise<ChannelFundsWithdrawnEventDetails> {
    return this.api.getEventDetails(result, 'content', 'ChannelFundsWithdrawn')
  }

  protected async getSignerAccountOrAccounts(): Promise<string[]> {
    return await Promise.all(
      this.withdrawChannelRewardParams.map(async ({ asMember }) =>
        (await this.api.query.members.membershipById(asMember)).unwrap().controllerAccount.toString()
      )
    )
  }

  protected async getExtrinsics(): Promise<SubmittableExtrinsic<'promise'>[]> {
    return this.withdrawChannelRewardParams.map((params) => {
      return this.api.tx.content.withdrawFromChannelBalance(
        { Member: params.asMember },
        params.channelId,
        params.amount
      )
    })
  }

  protected assertQueryNodeEventIsValid(qEvent: ChannelFundsWithdrawnEventFieldsFragment, i: number): void {
    const params = this.withdrawChannelRewardParams[i]
    assert.equal(qEvent.channel.id, params.channelId.toString())
    assert.equal(qEvent.amount, params.amount)
  }

  async runQueryNodeChecks(): Promise<void> {
    await super.runQueryNodeChecks()
    // Query the events
    await this.query.tryQueryWithTimeout(
      () => this.query.getChannelFundsWithdrawnEvents(this.events),
      (qEvents) => this.assertQueryNodeEventsAreValid(qEvents)
    )
  }
}
