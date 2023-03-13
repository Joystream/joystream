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
import { Option } from '@polkadot/types/'
import { Utils } from '../../utils'
import { StakeSlashedEventFieldsFragment, WorkerFieldsFragment } from '../../graphql/generated/queries'

export class SlashWorkerStakesFixture extends BaseWorkingGroupFixture {
  protected workerIds: WorkerId[]
  protected penalties: BN[]
  protected workers: Worker[] = []
  protected workerStakes: BN[] = []

  public constructor(
    api: Api,
    query: QueryNodeApi,
    group: WorkingGroupModuleName,
    workerIds: WorkerId[],
    penalties: BN[]
  ) {
    super(api, query, group)
    this.workerIds = workerIds
    this.penalties = penalties
  }

  protected async loadWorkersData(): Promise<void> {
    this.workers = (await this.api.query[this.group].workerById.multi<Option<Worker>>(this.workerIds)).map(
      (optionalWorker) => optionalWorker.unwrap()
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
      this.api.tx[this.group].slashStake(workerId, this.penalties[i], this.getRationale(workerId))
    )
    return extrinsics
  }

  protected getEventFromResult(result: ISubmittableResult): Promise<EventDetails> {
    return this.api.getEventDetails(result, this.group, 'StakeSlashed')
  }

  public async execute(): Promise<void> {
    await this.loadWorkersData()
    await super.execute()
  }

  protected getRationale(workerId: WorkerId): string {
    return `Worker ${workerId.toString()} slashing rationale`
  }

  protected assertQueryNodeEventIsValid(qEvent: StakeSlashedEventFieldsFragment, i: number): void {
    assert.equal(qEvent.worker.runtimeId, this.workerIds[i].toNumber())
    assert.equal(qEvent.group.name, this.group)
    assert.equal(qEvent.rationale, this.getRationale(this.workerIds[i]))
    assert.equal(qEvent.requestedAmount, this.penalties[i].toString())
    assert.equal(qEvent.slashedAmount, BN.min(this.penalties[i], this.workerStakes[i]))
  }

  protected assertQueriedWorkersAreValid(
    qEvents: StakeSlashedEventFieldsFragment[],
    qWorkers: WorkerFieldsFragment[]
  ): void {
    this.events.map((e, i) => {
      const qEvent = this.findMatchingQueryNodeEvent(e, qEvents)
      const workerId = this.workerIds[i]
      const worker = qWorkers.find((w) => w.runtimeId === workerId.toNumber())
      Utils.assert(worker, 'Query node: Worker not found!')
      assert.equal(worker.stake, BN.max(this.workerStakes[i].sub(this.penalties[i]), new BN(0)).toString())
      assert.include(
        worker.slashes.map((e) => e.id),
        qEvent.id
      )
    })
  }

  async runQueryNodeChecks(): Promise<void> {
    await super.runQueryNodeChecks()

    // Query and check the events
    const qEvents = await this.query.tryQueryWithTimeout(
      () => this.query.getStakeSlashedEvents(this.events),
      (qEvents) => this.assertQueryNodeEventsAreValid(qEvents)
    )

    // Check workers
    const qWorkers = await this.query.getWorkersByIds(this.workerIds, this.group)
    this.assertQueriedWorkersAreValid(qEvents, qWorkers)
  }
}
