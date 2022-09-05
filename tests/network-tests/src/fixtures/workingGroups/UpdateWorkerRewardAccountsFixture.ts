import { assert } from 'chai'
import { Api } from '../../Api'
import { QueryNodeApi } from '../../QueryNodeApi'
import { EventDetails, WorkingGroupModuleName } from '../../types'
import { BaseWorkingGroupFixture } from './BaseWorkingGroupFixture'
import { PalletWorkingGroupGroupWorker as Worker } from '@polkadot/types/lookup'
import { SubmittableExtrinsic } from '@polkadot/api/types'
import { ISubmittableResult } from '@polkadot/types/types/'
import { AccountId } from '@polkadot/types/interfaces'
import { Utils } from '../../utils'
import { WorkerFieldsFragment, WorkerRewardAccountUpdatedEventFieldsFragment } from '../../graphql/generated/queries'
import { WorkerId } from '@joystream/types/primitives'

export class UpdateWorkerRewardAccountsFixture extends BaseWorkingGroupFixture {
  protected workerIds: WorkerId[] = []
  protected rewardAccounts: (string | AccountId)[] = []

  protected workers: Worker[] = []

  public constructor(
    api: Api,
    query: QueryNodeApi,
    group: WorkingGroupModuleName,
    workerIds: WorkerId[],
    rewardAccounts: (string | AccountId)[]
  ) {
    super(api, query, group)
    this.workerIds = workerIds
    this.rewardAccounts = rewardAccounts
  }

  protected async loadWorkersData(): Promise<void> {
    this.workers = (await this.api.query[this.group].workerById.multi(this.workerIds)).map((optionalWorker) =>
      optionalWorker.unwrap()
    )
  }

  protected async getSignerAccountOrAccounts(): Promise<string[]> {
    await this.loadWorkersData()
    return this.workers.map((w) => w.roleAccountId.toString())
  }

  protected async getExtrinsics(): Promise<SubmittableExtrinsic<'promise'>[]> {
    return this.workerIds.map((workerId, i) =>
      this.api.tx[this.group].updateRewardAccount(workerId, this.rewardAccounts[i])
    )
  }

  protected getEventFromResult(result: ISubmittableResult): Promise<EventDetails> {
    return this.api.getEventDetails(result, this.group, 'WorkerRewardAccountUpdated')
  }

  protected assertQueryNodeEventIsValid(qEvent: WorkerRewardAccountUpdatedEventFieldsFragment, i: number): void {
    assert.equal(qEvent.worker.runtimeId, this.workerIds[i].toNumber())
    assert.equal(qEvent.group.name, this.group)
    assert.equal(qEvent.newRewardAccount, this.rewardAccounts[i].toString())
  }

  protected assertQueriedWorkersAreValid(qWorkers: WorkerFieldsFragment[]): void {
    this.workerIds.map((workerId, i) => {
      const worker = qWorkers.find((w) => w.runtimeId === workerId.toNumber())
      Utils.assert(worker, 'Query node: Worker not found!')
      assert.equal(worker.rewardAccount, this.rewardAccounts[i].toString())
    })
  }

  async runQueryNodeChecks(): Promise<void> {
    await super.runQueryNodeChecks()
    // Query and check the events
    await this.query.tryQueryWithTimeout(
      () => this.query.getWorkerRewardAccountUpdatedEvents(this.events),
      (qEvents) => this.assertQueryNodeEventsAreValid(qEvents)
    )

    // Check the worker
    const qWorkers = await this.query.getWorkersByIds(this.workerIds, this.group)
    this.assertQueriedWorkersAreValid(qWorkers)
  }
}
