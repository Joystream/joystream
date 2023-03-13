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
import { WorkerFieldsFragment, WorkerRewardAmountUpdatedEventFieldsFragment } from '../../graphql/generated/queries'

export class UpdateWorkerRewardAmountsFixture extends BaseWorkingGroupFixture {
  protected workerIds: WorkerId[]
  protected newRewards: (BN | null)[]
  protected workers: Worker[] = []

  public constructor(
    api: Api,
    query: QueryNodeApi,
    group: WorkingGroupModuleName,
    workerIds: WorkerId[],
    newRewards: (BN | null)[]
  ) {
    super(api, query, group)
    this.workerIds = workerIds
    this.newRewards = newRewards
  }

  protected async getSignerAccountOrAccounts(): Promise<string> {
    return await this.api.getLeadRoleKey(this.group)
  }

  protected async getExtrinsics(): Promise<SubmittableExtrinsic<'promise'>[]> {
    const extrinsics = this.workerIds.map((workerId, i) =>
      this.api.tx[this.group].updateRewardAmount(workerId, this.newRewards[i])
    )
    return extrinsics
  }

  protected getEventFromResult(result: ISubmittableResult): Promise<EventDetails> {
    return this.api.getEventDetails(result, this.group, 'WorkerRewardAmountUpdated')
  }

  protected assertQueryNodeEventIsValid(qEvent: WorkerRewardAmountUpdatedEventFieldsFragment, i: number): void {
    const newReward = this.newRewards[i]
    assert.equal(qEvent.worker.runtimeId, this.workerIds[i].toNumber())
    assert.equal(qEvent.group.name, this.group)
    assert.equal(qEvent.newRewardPerBlock, newReward ? newReward.toString() : '0')
  }

  protected assertQueriedWorkersAreValid(qWorkers: WorkerFieldsFragment[]): void {
    this.workerIds.map((workerId, i) => {
      const newReward = this.newRewards[i]
      const worker = qWorkers.find((w) => w.runtimeId === workerId.toNumber())
      Utils.assert(worker, 'Query node: Worker not found!')
      assert.equal(worker.rewardPerBlock, newReward ? newReward.toString() : '0')
    })
  }

  async runQueryNodeChecks(): Promise<void> {
    await super.runQueryNodeChecks()

    // Query the event and check event + hiredWorkers
    await this.query.tryQueryWithTimeout(
      () => this.query.getWorkerRewardAmountUpdatedEvents(this.events),
      (qEvents) => this.assertQueryNodeEventsAreValid(qEvents)
    )

    // Check workers
    const qWorkers = await this.query.getWorkersByIds(this.workerIds, this.group)
    this.assertQueriedWorkersAreValid(qWorkers)
  }
}
