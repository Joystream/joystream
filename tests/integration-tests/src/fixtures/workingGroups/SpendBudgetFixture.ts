import BN from 'bn.js'
import { assert } from 'chai'
import { Api } from '../../Api'
import { QueryNodeApi } from '../../QueryNodeApi'
import { EventDetails, WorkingGroupModuleName } from '../../types'
import { BaseWorkingGroupFixture } from './BaseWorkingGroupFixture'
import { SubmittableExtrinsic } from '@polkadot/api/types'
import { ISubmittableResult } from '@polkadot/types/types/'
import { Utils } from '../../utils'
import { BudgetSpendingEventFieldsFragment, WorkingGroupFieldsFragment } from '../../graphql/generated/queries'

export class SpendBudgetFixture extends BaseWorkingGroupFixture {
  protected recievers: string[]
  protected amounts: BN[]
  protected preExecuteBudget?: BN

  public constructor(api: Api, query: QueryNodeApi, group: WorkingGroupModuleName, recievers: string[], amounts: BN[]) {
    super(api, query, group)
    this.recievers = recievers
    this.amounts = amounts
  }

  protected async getSignerAccountOrAccounts(): Promise<string> {
    return this.api.getLeadRoleKey(this.group)
  }

  protected async getExtrinsics(): Promise<SubmittableExtrinsic<'promise'>[]> {
    return this.recievers.map((reciever, i) =>
      this.api.tx[this.group].spendFromBudget(reciever, this.amounts[i], this.getRationale(reciever))
    )
  }

  protected getEventFromResult(result: ISubmittableResult): Promise<EventDetails> {
    return this.api.retrieveWorkingGroupsEventDetails(result, this.group, 'BudgetSpending')
  }

  protected getRationale(reciever: string): string {
    return `Budget spending to ${reciever} rationale`
  }

  public async execute(): Promise<void> {
    this.preExecuteBudget = await this.api.query[this.group].budget()
    await super.execute()
  }

  protected assertQueryNodeEventIsValid(qEvent: BudgetSpendingEventFieldsFragment, i: number): void {
    assert.equal(qEvent.group.name, this.group)
    assert.equal(qEvent.amount, this.amounts[i].toString())
    assert.equal(qEvent.reciever, this.recievers[i])
    assert.equal(qEvent.rationale, this.getRationale(this.recievers[i]))
  }

  protected assertQueriedGroupIsValid(qGroup: WorkingGroupFieldsFragment | null): void {
    Utils.assert(qGroup, 'Query node: Working group not found!')
    assert.equal(qGroup.budget, this.preExecuteBudget!.sub(this.amounts.reduce((a, b) => a.add(b), new BN(0))))
  }

  async runQueryNodeChecks(): Promise<void> {
    await super.runQueryNodeChecks()

    // Query and check the events
    await this.query.tryQueryWithTimeout(
      () => this.query.getBudgetSpendingEvents(this.events),
      (qEvents) => this.assertQueryNodeEventsAreValid(qEvents)
    )

    // Check the group
    const qGroup = await this.query.getWorkingGroup(this.group)
    this.assertQueriedGroupIsValid(qGroup)
  }
}
