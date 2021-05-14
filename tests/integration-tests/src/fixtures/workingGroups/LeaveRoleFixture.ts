import { assert } from 'chai'
import { Api } from '../../Api'
import { QueryNodeApi } from '../../QueryNodeApi'
import { EventDetails, WorkingGroupModuleName } from '../../types'
import { BaseWorkingGroupFixture } from './BaseWorkingGroupFixture'
import { WorkerId, Worker } from '@joystream/types/working-group'
import { SubmittableExtrinsic } from '@polkadot/api/types'
import { ISubmittableResult } from '@polkadot/types/types/'
import { Utils } from '../../utils'
import { EventType } from '../../graphql/generated/schema'
import { WorkerFieldsFragment, WorkerStartedLeavingEventFieldsFragment } from '../../graphql/generated/queries'

export class LeaveRoleFixture extends BaseWorkingGroupFixture {
  protected workerIds: WorkerId[] = []

  protected workers: Worker[] = []

  public constructor(api: Api, query: QueryNodeApi, group: WorkingGroupModuleName, workerIds: WorkerId[]) {
    super(api, query, group)
    this.workerIds = workerIds
  }

  protected async loadWorkersData(): Promise<void> {
    this.workers = await this.api.query[this.group].workerById.multi<Worker>(this.workerIds)
  }

  protected async getSignerAccountOrAccounts(): Promise<string[]> {
    await this.loadWorkersData()
    return this.workers.map((w) => w.role_account_id.toString())
  }

  protected async getExtrinsics(): Promise<SubmittableExtrinsic<'promise'>[]> {
    return this.workerIds.map((workerId) => this.api.tx[this.group].leaveRole(workerId, this.getRationale(workerId)))
  }

  protected getEventFromResult(result: ISubmittableResult): Promise<EventDetails> {
    return this.api.retrieveWorkingGroupsEventDetails(result, this.group, 'WorkerStartedLeaving')
  }

  protected getRationale(workerId: WorkerId): string {
    return `Worker ${workerId.toString()} leaving rationale`
  }

  protected assertQueryNodeEventIsValid(qEvent: WorkerStartedLeavingEventFieldsFragment, i: number): void {
    assert.equal(qEvent.event.type, EventType.WorkerStartedLeaving)
    assert.equal(qEvent.worker.runtimeId, this.workerIds[i].toNumber())
    assert.equal(qEvent.group.name, this.group)
    assert.equal(qEvent.rationale, this.getRationale(this.workerIds[i]))
  }

  protected assertQueriedWorkersAreValid(
    qEvents: WorkerStartedLeavingEventFieldsFragment[],
    qWorkers: WorkerFieldsFragment[]
  ): void {
    this.events.map((e, i) => {
      const qEvent = this.findMatchingQueryNodeEvent(e, qEvents)
      const workerId = this.workerIds[i]
      const worker = qWorkers.find((w) => w.runtimeId === workerId.toNumber())
      Utils.assert(worker, 'Query node: Worker not found!')
      Utils.assert(
        worker.status.__typename === 'WorkerStatusLeft',
        `Invalid worker status: ${worker.status.__typename}`
      )
      Utils.assert(worker.status.workerStartedLeavingEvent, 'Query node: Missing workerStartedLeavingEvent relation')
      assert.equal(worker.status.workerStartedLeavingEvent.id, qEvent.id)
    })
  }

  async runQueryNodeChecks(): Promise<void> {
    await super.runQueryNodeChecks()
    // Query and check the events
    const qEvents = await this.query.tryQueryWithTimeout(
      () => this.query.getWorkerStartedLeavingEvents(this.events),
      (qEvents) => this.assertQueryNodeEventsAreValid(qEvents)
    )

    // Check the worker
    const qWorkers = await this.query.getWorkersByIds(this.workerIds, this.group)
    this.assertQueriedWorkersAreValid(qEvents, qWorkers)
  }
}
