import BN from 'bn.js'
import { assert } from 'chai'
import { Api } from '../../Api'
import { QueryNodeApi } from '../../QueryNodeApi'
import { EventDetails, WorkingGroupModuleName } from '../../types'
import { BaseWorkingGroupFixture } from './BaseWorkingGroupFixture'
import { SubmittableExtrinsic } from '@polkadot/api/types'
import { ISubmittableResult } from '@polkadot/types/types/'
import { Utils } from '../../utils'
import { BudgetSetEventFieldsFragment, WorkingGroupFieldsFragment } from '../../graphql/generated/queries'

export class SetBudgetFixture extends BaseWorkingGroupFixture {
  protected budgets: BN[]

  public constructor(api: Api, query: QueryNodeApi, group: WorkingGroupModuleName, budgets: BN[]) {
    super(api, query, group)
    this.budgets = budgets
  }

  protected async getSignerAccountOrAccounts(): Promise<string> {
    return (await this.api.query.sudo.key()).toString()
  }

  protected async getExtrinsics(): Promise<SubmittableExtrinsic<'promise'>[]> {
    const extrinsics = this.budgets.map((budget) => this.api.tx[this.group].setBudget(budget))
    return extrinsics.map((tx) => this.api.tx.sudo.sudo(tx))
  }

  protected getEventFromResult(result: ISubmittableResult): Promise<EventDetails> {
    return this.api.retrieveWorkingGroupsEventDetails(result, this.group, 'BudgetSet')
  }

  protected assertQueryNodeEventIsValid(qEvent: BudgetSetEventFieldsFragment, i: number): void {
    assert.equal(qEvent.group.name, this.group)
    assert.equal(qEvent.newBudget, this.budgets[i].toString())
  }

  protected assertQueriedGroupIsValid(qGroup: WorkingGroupFieldsFragment | null): void {
    Utils.assert(qGroup, 'Query node: Working group not found!')
    assert.equal(qGroup.budget, this.budgets[this.budgets.length - 1].toString())
  }

  async runQueryNodeChecks(): Promise<void> {
    await super.runQueryNodeChecks()

    // Query and check the events
    await this.query.tryQueryWithTimeout(
      () => this.query.getBudgetSetEvents(this.events),
      (qEvents) => this.assertQueryNodeEventsAreValid(qEvents)
    )

    // Check the group
    const qGroup = await this.query.getWorkingGroup(this.group)
    this.assertQueriedGroupIsValid(qGroup)
  }
}
