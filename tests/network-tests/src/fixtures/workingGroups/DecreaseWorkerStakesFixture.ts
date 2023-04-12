import BN from 'bn.js'
import { assert } from 'chai'
import { Api } from '../../Api'
import { QueryNodeApi } from '../../QueryNodeApi'
import { EventDetails, WorkingGroupModuleName } from '../../types'
import { BaseWorkingGroupFixture } from './BaseWorkingGroupFixture'
import { WorkerId } from '@joystream/types/primitives'
import { PalletWorkingGroupGroupWorker as Worker } from '@polkadot/types/lookup'
import { SubmittableExtrinsic } from '@polkadot/api/types'
import { ISubmittableResult } from '@polkadot/types/types/'
import { Utils } from '../../utils'
import { StakeDecreasedEventFieldsFragment, WorkerFieldsFragment } from '../../graphql/generated/queries'

export class DecreaseWorkerStakesFixture extends BaseWorkingGroupFixture {
  protected workerIds: WorkerId[]
  protected amounts: BN[]
  protected workers: Worker[] = []
  protected workerStakes: BN[] = []

  public constructor(
    api: Api,
    query: QueryNodeApi,
    group: WorkingGroupModuleName,
    workerIds: WorkerId[],
    amounts: BN[]
  ) {
    super(api, query, group)
    this.workerIds = workerIds
    this.amounts = amounts
  }

  protected async loadWorkersData(): Promise<void> {
    this.workers = (await this.api.query[this.group].workerById.multi(this.workerIds)).map((optionalWorker) =>
      optionalWorker.unwrap()
    )
    this.workerStakes = await Promise.all(
      this.workers.map((w) => this.api.getStakedBalance(w.stakingAccountId, this.api.lockIdByGroup(this.group)))
    )
  }

  protected async getSignerAccountOrAccounts(): Promise<string> {
    return await this.api.getLeadRoleKey(this.group)
  }

  protected async getExtrinsics(): Promise<SubmittableExtrinsic<'promise'>[]> {
    const extrinsics = this.workerIds.map((workerId, i) =>
      this.api.tx[this.group].decreaseStake(workerId, this.amounts[i])
    )
    return extrinsics
  }

  protected getEventFromResult(result: ISubmittableResult): Promise<EventDetails> {
    return this.api.getEventDetails(result, this.group, 'StakeDecreased')
  }

  public async execute(): Promise<void> {
    await this.loadWorkersData()
    await super.execute()
  }

  protected assertQueryNodeEventIsValid(qEvent: StakeDecreasedEventFieldsFragment, i: number): void {
    assert.equal(qEvent.worker.runtimeId, this.workerIds[i].toNumber())
    assert.equal(qEvent.group.name, this.group)
    assert.equal(qEvent.amount, this.amounts[i].toString())
  }

  protected assertQueriedWorkersAreValid(qWorkers: WorkerFieldsFragment[]): void {
    this.workerIds.map((workerId, i) => {
      const worker = qWorkers.find((w) => w.runtimeId === workerId.toNumber())
      Utils.assert(worker, 'Query node: Worker not found!')
      assert.equal(worker.stake, this.workerStakes[i].sub(this.amounts[i]).toString())
    })
  }

  async runQueryNodeChecks(): Promise<void> {
    await super.runQueryNodeChecks()

    // Query and check events
    await this.query.tryQueryWithTimeout(
      () => this.query.getStakeDecreasedEvents(this.events),
      (qEvents) => this.assertQueryNodeEventsAreValid(qEvents)
    )

    // Check workers
    const qWorkers = await this.query.getWorkersByIds(this.workerIds, this.group)
    this.assertQueriedWorkersAreValid(qWorkers)
  }
}
