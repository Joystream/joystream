import BN from 'bn.js'
import { assert } from 'chai'
import { Api } from '../../Api'
import { QueryNodeApi } from '../../QueryNodeApi'
import { EventDetails, WorkingGroupModuleName } from '../../types'
import { BaseWorkingGroupFixture } from './BaseWorkingGroupFixture'
import { WorkerId, Worker } from '@joystream/types/working-group'
import { SubmittableExtrinsic } from '@polkadot/api/types'
import { ISubmittableResult } from '@polkadot/types/types/'
import { Utils } from '../../utils'
import { StakeIncreasedEventFieldsFragment, WorkerFieldsFragment } from '../../graphql/generated/queries'

export class IncreaseWorkerStakesFixture extends BaseWorkingGroupFixture {
  protected workerIds: WorkerId[]
  protected stakeIncreases: BN[]

  protected workers: Worker[] = []
  protected workerStakes: BN[] = []

  public constructor(
    api: Api,
    query: QueryNodeApi,
    group: WorkingGroupModuleName,
    workerIds: WorkerId[],
    stakeIncreases: BN[]
  ) {
    super(api, query, group)
    this.workerIds = workerIds
    this.stakeIncreases = stakeIncreases
  }

  protected async loadWorkersData(): Promise<void> {
    this.workers = await this.api.query[this.group].workerById.multi<Worker>(this.workerIds)
    this.workerStakes = await Promise.all(
      this.workers.map((w) => this.api.getStakedBalance(w.staking_account_id, this.api.lockIdByGroup(this.group)))
    )
  }

  protected async getSignerAccountOrAccounts(): Promise<string[]> {
    await this.loadWorkersData()
    return this.workers.map((w) => w.role_account_id.toString())
  }

  protected async getExtrinsics(): Promise<SubmittableExtrinsic<'promise'>[]> {
    return this.workerIds.map((workerId, i) => this.api.tx[this.group].increaseStake(workerId, this.stakeIncreases[i]))
  }

  protected getEventFromResult(result: ISubmittableResult): Promise<EventDetails> {
    return this.api.getEventDetails(result, this.group, 'StakeIncreased')
  }

  protected assertQueryNodeEventIsValid(qEvent: StakeIncreasedEventFieldsFragment, i: number): void {
    assert.equal(qEvent.worker.runtimeId, this.workerIds[i].toNumber())
    assert.equal(qEvent.group.name, this.group)
    assert.equal(qEvent.amount, this.stakeIncreases[i].toString())
  }

  protected assertQueriedWorkersAreValid(qWorkers: WorkerFieldsFragment[]): void {
    this.workerIds.map((workerId, i) => {
      const worker = qWorkers.find((w) => w.runtimeId === workerId.toNumber())
      Utils.assert(worker, 'Query node: Worker not found!')
      assert.equal(worker.stake, this.workerStakes[i].add(this.stakeIncreases[i]).toString())
    })
  }

  async runQueryNodeChecks(): Promise<void> {
    await super.runQueryNodeChecks()
    // Query and check the events
    await this.query.tryQueryWithTimeout(
      () => this.query.getStakeIncreasedEvents(this.events),
      (qEvents) => this.assertQueryNodeEventsAreValid(qEvents)
    )

    // Check the workers
    const qWorkers = await this.query.getWorkersByIds(this.workerIds, this.group)
    this.assertQueriedWorkersAreValid(qWorkers)
  }
}
