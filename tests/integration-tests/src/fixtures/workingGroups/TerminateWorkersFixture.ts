import BN from 'bn.js'
import { assert } from 'chai'
import { Api } from '../../Api'
import { QueryNodeApi } from '../../QueryNodeApi'
import { EventDetails, WorkingGroupModuleName } from '../../types'
import { BaseWorkingGroupFixture } from './BaseWorkingGroupFixture'
import { Worker, WorkerId } from '@joystream/types/working-group'
import { SubmittableExtrinsic } from '@polkadot/api/types'
import { ISubmittableResult } from '@polkadot/types/types/'
import { Utils } from '../../utils'
import {
  LeaderUnsetEventFieldsFragment,
  TerminatedLeaderEventFieldsFragment,
  TerminatedWorkerEventFieldsFragment,
  WorkerFieldsFragment,
} from '../../graphql/generated/queries'

export class TerminateWorkersFixture extends BaseWorkingGroupFixture {
  protected asSudo: boolean

  protected workerIds: WorkerId[]
  protected penalties: BN[]
  protected workers: Worker[] = []
  protected workerStakes: BN[] = []

  public constructor(
    api: Api,
    query: QueryNodeApi,
    group: WorkingGroupModuleName,
    workerIds: WorkerId[],
    penalties: BN[],
    asSudo = false
  ) {
    super(api, query, group)
    this.workerIds = workerIds
    this.penalties = penalties
    this.asSudo = asSudo
  }

  protected async loadWorkersData(): Promise<void> {
    this.workers = await this.api.query[this.group].workerById.multi<Worker>(this.workerIds)
    this.workerStakes = await Promise.all(
      this.workers.map((w) => this.api.getStakedBalance(w.staking_account_id, this.api.lockIdByGroup(this.group)))
    )
  }

  protected async getSignerAccountOrAccounts(): Promise<string> {
    return this.asSudo ? (await this.api.query.sudo.key()).toString() : await this.api.getLeadRoleKey(this.group)
  }

  protected async getExtrinsics(): Promise<SubmittableExtrinsic<'promise'>[]> {
    const extrinsics = this.workerIds.map((workerId, i) =>
      this.api.tx[this.group].terminateRole(workerId, this.penalties[i], this.getRationale(workerId))
    )
    return this.asSudo ? extrinsics.map((tx) => this.api.tx.sudo.sudo(tx)) : extrinsics
  }

  protected getEventFromResult(result: ISubmittableResult): Promise<EventDetails> {
    return this.api.retrieveWorkingGroupsEventDetails(
      result,
      this.group,
      this.asSudo ? 'TerminatedLeader' : 'TerminatedWorker'
    )
  }

  public async execute(): Promise<void> {
    await this.loadWorkersData()
    await super.execute()
  }

  protected getRationale(workerId: WorkerId): string {
    return `Worker ${workerId.toString()} termination rationale`
  }

  protected assertQueryNodeEventIsValid(
    qEvent: TerminatedWorkerEventFieldsFragment | TerminatedLeaderEventFieldsFragment,
    i: number
  ): void {
    assert.equal(qEvent.worker.runtimeId, this.workerIds[i].toNumber())
    assert.equal(qEvent.group.name, this.group)
    assert.equal(qEvent.rationale, this.getRationale(this.workerIds[i]))
    assert.equal(qEvent.penalty, this.penalties[i].toString())
  }

  protected assertQueriedWorkersAreValid(
    qEvents: (TerminatedWorkerEventFieldsFragment | TerminatedLeaderEventFieldsFragment)[],
    qWorkers: WorkerFieldsFragment[]
  ): void {
    this.events.map((e, i) => {
      const qEvent = this.findMatchingQueryNodeEvent(e, qEvents)
      const workerId = this.workerIds[i]
      const worker = qWorkers.find((w) => w.runtimeId === workerId.toNumber())
      Utils.assert(worker, 'Query node: Worker not found!')
      assert.equal(worker.stake, '0')
      assert.equal(worker.rewardPerBlock, '0')
      Utils.assert(
        worker.status.__typename === 'WorkerStatusTerminated',
        `Invalid worker status: ${worker.status.__typename}`
      )
      Utils.assert(worker.status.terminatedWorkerEvent, 'Query node: Missing terminatedWorkerEvent relation')
      assert.equal(worker.status.terminatedWorkerEvent.id, qEvent.id)
    })
  }

  protected assertQueriedLeaderUnsetEventIsValid(
    eventDetails: EventDetails,
    qEvent: LeaderUnsetEventFieldsFragment | null
  ): void {
    Utils.assert(qEvent, 'Query node: LeaderUnsetEvent not found!')
    assert.equal(qEvent.inExtrinsic, this.extrinsics[0].hash.toString())
    assert.equal(qEvent.inBlock, eventDetails.blockNumber)
    assert.equal(new Date(qEvent.createdAt).getTime(), eventDetails.blockTimestamp)
    assert.equal(qEvent.group.name, this.group)
    assert.equal(qEvent.leader.runtimeId, this.workerIds[0].toNumber())
  }

  async runQueryNodeChecks(): Promise<void> {
    await super.runQueryNodeChecks()

    // Query the event and check event + hiredWorkers
    const qEvents = await this.query.tryQueryWithTimeout(
      () =>
        this.asSudo
          ? this.query.getTerminatedLeaderEvents(this.events)
          : this.query.getTerminatedWorkerEvents(this.events),
      (qEvents) => this.assertQueryNodeEventsAreValid(qEvents)
    )

    // Check workers
    const qWorkers = await this.query.getWorkersByIds(this.workerIds, this.group)
    this.assertQueriedWorkersAreValid(qEvents, qWorkers)

    // If lead - check LeaderUnset event
    if (this.asSudo) {
      const leaderUnsetEvent = await this.api.retrieveWorkingGroupsEventDetails(
        this.results[0],
        this.group,
        'LeaderUnset'
      )
      const qEvent = await this.query.getLeaderUnsetEvent(leaderUnsetEvent)
      this.assertQueriedLeaderUnsetEventIsValid(leaderUnsetEvent, qEvent)
    }
  }
}
