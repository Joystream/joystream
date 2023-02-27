import { assert } from 'chai'
import { Api } from '../../Api'
import { QueryNodeApi } from '../../QueryNodeApi'
import { EventDetails, WorkingGroupModuleName } from '../../types'
import { BaseWorkingGroupFixture } from './BaseWorkingGroupFixture'
import { SubmittableExtrinsic } from '@polkadot/api/types'
import { ISubmittableResult } from '@polkadot/types/types/'
import { Utils } from '../../utils'
import { BudgetFundedEventFieldsFragment } from '../../graphql/generated/queries'
import { u64 } from '@polkadot/types'
import BN from 'bn.js'

export type FundWorkingGroupBudgetParams = {
  memberId: u64
  amount: BN
}

export class FundWorkingGroupBudgetFixture extends BaseWorkingGroupFixture {
  protected params: FundWorkingGroupBudgetParams[]
  protected expectedBudgetPost: BN | undefined

  public constructor(
    api: Api,
    query: QueryNodeApi,
    group: WorkingGroupModuleName,
    params: FundWorkingGroupBudgetParams[]
  ) {
    super(api, query, group)
    this.params = params
  }

  protected async getSignerAccountOrAccounts(): Promise<string[]> {
    return Promise.all(this.params.map(({ memberId }) => this.api.getControllerAccountOfMember(memberId)))
  }

  protected async getExtrinsics(): Promise<SubmittableExtrinsic<'promise'>[]> {
    return this.params.map(({ memberId, amount }, i) =>
      this.api.tx[this.group].fundWorkingGroupBudget(memberId, amount, `Test ${i}`)
    )
  }

  protected async getEventFromResult(result: ISubmittableResult): Promise<EventDetails> {
    return this.api.getEventDetails(result, this.group, 'WorkingGroupBudgetFunded')
  }

  protected assertQueryNodeEventIsValid(qEvent: BudgetFundedEventFieldsFragment, i: number): void {
    assert.equal(qEvent.group.name, this.group)
    assert.equal(qEvent.member.id, this.params[i].memberId.toString())
    assert.equal(qEvent.rationale, `Test ${i}`)
    assert.equal(qEvent.amount.toString(), this.params[i].amount.toString())
  }

  public async execute(): Promise<void> {
    const budgetPre = await this.api.query[this.group].budget()
    await super.execute()
    this.expectedBudgetPost = budgetPre.add(this.params.reduce((sum, p) => sum.add(p.amount), new BN(0)))
    const budgetPost = await this.api.query[this.group].budget()
    assert.equal(budgetPost.toString(), this.expectedBudgetPost.toString())
  }

  async runQueryNodeChecks(): Promise<void> {
    await super.runQueryNodeChecks()
    await this.query.tryQueryWithTimeout(
      () => this.query.getBudgetFundedEvents(this.events),
      (qEvents) => this.assertQueryNodeEventsAreValid(qEvents)
    )
    const qGroup = await this.query.getWorkingGroup(this.group)
    Utils.assert(this.expectedBudgetPost, 'Expected budget not set')
    assert.equal(qGroup?.budget.toString(), this.expectedBudgetPost.toString())
  }
}
