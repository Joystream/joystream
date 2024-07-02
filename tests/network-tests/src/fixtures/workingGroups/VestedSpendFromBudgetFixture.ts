import BN from 'bn.js'
import { assert } from 'chai'
import { Api } from '../../Api'
import { QueryNodeApi } from '../../QueryNodeApi'
import { EventDetails, WorkingGroupModuleName } from '../../types'
import { BaseWorkingGroupFixture } from './BaseWorkingGroupFixture'
import { SubmittableExtrinsic } from '@polkadot/api/types'
import { ISubmittableResult } from '@polkadot/types/types/'
import { Utils } from '../../utils'
import { VestedBudgetSpendingEventFieldsFragment, WorkingGroupFieldsFragment } from '../../graphql/generated/queries'

export type VestingSchedule = {
  locked: BN
  perBlock: BN
  startingBlock: number
}

export class VestedSpendFromBudgetFixture extends BaseWorkingGroupFixture {
  protected receivers: string[]
  protected vestingSchedules: VestingSchedule[]
  protected preExecuteBudget?: BN

  public constructor(
    api: Api,
    query: QueryNodeApi,
    group: WorkingGroupModuleName,
    receivers: string[],
    vestingSchedules: VestingSchedule[]
  ) {
    super(api, query, group)
    this.receivers = receivers
    this.vestingSchedules = vestingSchedules
  }

  protected async getSignerAccountOrAccounts(): Promise<string> {
    return this.api.getLeadRoleKey(this.group)
  }

  protected async getExtrinsics(): Promise<SubmittableExtrinsic<'promise'>[]> {
    return this.receivers.map((reciever, i) =>
      this.api.tx[this.group].vestedSpendFromBudget(reciever, this.vestingSchedules[i], this.getRationale(reciever))
    )
  }

  protected getEventFromResult(result: ISubmittableResult): Promise<EventDetails> {
    return this.api.getEventDetails(result, this.group, 'VestedBudgetSpending')
  }

  protected getRationale(receiver: string): string {
    return `Vested budget spending to ${receiver} rationale`
  }

  public async execute(): Promise<void> {
    this.preExecuteBudget = await this.api.query[this.group].budget()
    await super.execute()
  }

  protected assertQueryNodeEventIsValid(qEvent: VestedBudgetSpendingEventFieldsFragment, i: number): void {
    assert.equal(qEvent.group.name, this.group)
    assert.equal(qEvent.amount, this.vestingSchedules[i].locked.toString())
    assert.equal(qEvent.perBlock, this.vestingSchedules[i].perBlock.toString())
    assert.equal(qEvent.startingBlock, this.vestingSchedules[i].startingBlock)
    assert.equal(qEvent.receiver, this.receivers[i])
    assert.equal(qEvent.rationale, this.getRationale(this.receivers[i]))
  }

  protected assertQueriedGroupIsValid(qGroup: WorkingGroupFieldsFragment | null): void {
    Utils.assert(qGroup, 'Query node: Working group not found!')
    assert.equal(
      qGroup.budget,
      this.preExecuteBudget!.sub(this.vestingSchedules.reduce((a, b) => a.add(b.locked), new BN(0)))
    )
  }

  async runQueryNodeChecks(): Promise<void> {
    await super.runQueryNodeChecks()

    // Query and check the events
    await this.query.tryQueryWithTimeout(
      () => this.query.getVestedBudgetSpendingEvents(this.events),
      (qEvents) => this.assertQueryNodeEventsAreValid(qEvents)
    )

    // Check the group
    const qGroup = await this.query.getWorkingGroup(this.group)
    this.assertQueriedGroupIsValid(qGroup)
  }
}
