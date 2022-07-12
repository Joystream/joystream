import { assert } from 'chai'
import { Api } from '../../Api'
import { QueryNodeApi } from '../../QueryNodeApi'
import { EventDetails, WorkingGroupModuleName } from '../../types'
import { BaseWorkingGroupFixture } from './BaseWorkingGroupFixture'
import { SubmittableExtrinsic } from '@polkadot/api/types'
import { ISubmittableResult } from '@polkadot/types/types/'
import { Utils } from '../../utils'
import { WorkerFieldsFragment, WorkerRoleAccountUpdatedEventFieldsFragment } from '../../graphql/generated/queries'
import { WorkerId } from '@joystream/types/primitives'
import { AccountId } from '@polkadot/types/interfaces'

import {
  PalletMembershipMembershipObject as Membership,
  PalletWorkingGroupGroupWorker as Worker,
} from '@polkadot/types/lookup'

export class UpdateWorkerRoleAccountsFixture extends BaseWorkingGroupFixture {
  protected workerIds: WorkerId[] = []
  protected roleAccounts: (string | AccountId)[] = []

  protected workerMembers: Membership[] = []

  public constructor(
    api: Api,
    query: QueryNodeApi,
    group: WorkingGroupModuleName,
    workerIds: WorkerId[],
    roleAccounts: (string | AccountId)[]
  ) {
    super(api, query, group)
    this.workerIds = workerIds
    this.roleAccounts = roleAccounts
  }

  protected async loadWorkersData(): Promise<void> {
    const workers = await this.api.query[this.group].workerById.multi(this.workerIds)
    this.workerMembers = (
      await this.api.query.members.membershipById.multi(workers.map((w) => w.unwrap().memberId))
    ).map((optionalMember) => optionalMember.unwrap())
  }

  protected async getSignerAccountOrAccounts(): Promise<string[]> {
    await this.loadWorkersData()
    return this.workerMembers.map((m) => m.controllerAccount.toString())
  }

  protected async getExtrinsics(): Promise<SubmittableExtrinsic<'promise'>[]> {
    return this.workerIds.map((workerId, i) =>
      this.api.tx[this.group].updateRoleAccount(workerId, this.roleAccounts[i])
    )
  }

  protected getEventFromResult(result: ISubmittableResult): Promise<EventDetails> {
    return this.api.getEventDetails(result, this.group, 'WorkerRoleAccountUpdated')
  }

  protected assertQueryNodeEventIsValid(qEvent: WorkerRoleAccountUpdatedEventFieldsFragment, i: number): void {
    assert.equal(qEvent.worker.runtimeId, this.workerIds[i].toNumber())
    assert.equal(qEvent.group.name, this.group)
    assert.equal(qEvent.newRoleAccount, this.roleAccounts[i].toString())
  }

  protected assertQueriedWorkersAreValid(qWorkers: WorkerFieldsFragment[]): void {
    this.workerIds.map((workerId, i) => {
      const worker = qWorkers.find((w) => w.runtimeId === workerId.toNumber())
      Utils.assert(worker, 'Query node: Worker not found!')
      assert.equal(worker.roleAccount, this.roleAccounts[i].toString())
    })
  }

  async runQueryNodeChecks(): Promise<void> {
    await super.runQueryNodeChecks()
    // Query and check the events
    await this.query.tryQueryWithTimeout(
      () => this.query.getWorkerRoleAccountUpdatedEvents(this.events),
      (qEvents) => this.assertQueryNodeEventsAreValid(qEvents)
    )

    // Check the worker
    const qWorkers = await this.query.getWorkersByIds(this.workerIds, this.group)
    this.assertQueriedWorkersAreValid(qWorkers)
  }
}
