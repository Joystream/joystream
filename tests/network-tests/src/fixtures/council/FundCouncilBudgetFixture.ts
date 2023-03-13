import { MemberId } from '@joystream/types/primitives'
import { SubmittableExtrinsic } from '@polkadot/api/types'
import { ISubmittableResult } from '@polkadot/types/types/'
import BN from 'bn.js'
import { assert } from 'chai'
import { Api } from '../../Api'
import { StandardizedFixture } from '../../Fixture'
import { CouncilBudgetFundedEventFieldsFragment } from '../../graphql/generated/queries'
import { QueryNodeApi } from '../../QueryNodeApi'
import { EventDetails, EventType } from '../../types'

type CouncilBudgetFundedEventDetails = EventDetails<EventType<'council', 'CouncilBudgetFunded'>>

export type FundCouncilBudgetParams = {
  asMember: MemberId
  amount: BN
  rationale: string
}

export class FundCouncilBudgetFixture extends StandardizedFixture {
  protected fundCouncilBudgetParams: FundCouncilBudgetParams

  public constructor(api: Api, query: QueryNodeApi, fundCouncilBudgetParams: FundCouncilBudgetParams) {
    super(api, query)
    this.fundCouncilBudgetParams = fundCouncilBudgetParams
  }

  protected async getEventFromResult(result: ISubmittableResult): Promise<CouncilBudgetFundedEventDetails> {
    return this.api.getEventDetails(result, 'council', 'CouncilBudgetFunded')
  }

  protected async getSignerAccountOrAccounts(): Promise<string> {
    return (await this.api.query.members.membershipById(this.fundCouncilBudgetParams.asMember))
      .unwrap()
      .controllerAccount.toString()
  }

  protected async getExtrinsics(): Promise<SubmittableExtrinsic<'promise'>[]> {
    return [
      this.api.tx.council.fundCouncilBudget(
        this.fundCouncilBudgetParams.asMember,
        this.fundCouncilBudgetParams.amount,
        this.fundCouncilBudgetParams.rationale
      ),
    ]
  }

  protected assertQueryNodeEventIsValid(qEvent: CouncilBudgetFundedEventFieldsFragment): void {
    const params = this.fundCouncilBudgetParams
    assert.equal(qEvent.memberId, params.asMember.toNumber())
    assert.equal(qEvent.amount, params.amount.toString())
  }

  async runQueryNodeChecks(): Promise<void> {
    await super.runQueryNodeChecks()
    // Query the events
    await this.query.tryQueryWithTimeout(
      () => this.query.getCouncilBudgetFundedEvents(this.events),
      (qEvents) => this.assertQueryNodeEventsAreValid(qEvents)
    )
  }
}
