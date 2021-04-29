import BN from 'bn.js'
import { assert } from 'chai'
import { Api } from '../../Api'
import { QueryNodeApi } from '../../QueryNodeApi'
import { EventDetails, OpeningFilledEventDetails, WorkingGroupModuleName } from '../../types'
import { BaseWorkingGroupFixture } from './BaseWorkingGroupFixture'
import { Application, ApplicationId, Opening, OpeningId, WorkerId } from '@joystream/types/working-group'
import { SubmittableExtrinsic } from '@polkadot/api/types'
import { ISubmittableResult } from '@polkadot/types/types/'
import { Utils } from '../../utils'
import { EventType } from '../../graphql/generated/schema'
import { JoyBTreeSet } from '@joystream/types/common'
import { registry } from '@joystream/types'
import { lockIdByWorkingGroup } from '../../consts'
import {
  LeaderSetEventFieldsFragment,
  OpeningFieldsFragment,
  OpeningFilledEventFieldsFragment,
  WorkerFieldsFragment,
} from '../../graphql/generated/queries'

export class FillOpeningsFixture extends BaseWorkingGroupFixture {
  protected events: OpeningFilledEventDetails[] = []
  protected asSudo: boolean

  protected openings: Opening[] = []
  protected openingIds: OpeningId[]
  protected acceptedApplicationsIdsArrays: ApplicationId[][]
  protected acceptedApplicationsArrays: Application[][] = []
  protected applicationStakesArrays: BN[][] = []
  protected createdWorkerIdsByOpeningId: Map<number, WorkerId[]> = new Map<number, WorkerId[]>()

  public constructor(
    api: Api,
    query: QueryNodeApi,
    group: WorkingGroupModuleName,
    openingIds: OpeningId[],
    acceptedApplicationsIdsArrays: ApplicationId[][],
    asSudo = false
  ) {
    super(api, query, group)
    this.openingIds = openingIds
    this.acceptedApplicationsIdsArrays = acceptedApplicationsIdsArrays
    this.asSudo = asSudo
  }

  public getCreatedWorkerIdsByOpeningId(openingId: OpeningId): WorkerId[] {
    const workerIds = this.createdWorkerIdsByOpeningId.get(openingId.toNumber())
    Utils.assert(workerIds, `No created worker ids for opening id ${openingId.toString()} were found!`)
    return workerIds
  }

  protected async getSignerAccountOrAccounts(): Promise<string> {
    return this.asSudo ? (await this.api.query.sudo.key()).toString() : await this.api.getLeadRoleKey(this.group)
  }

  protected async getExtrinsics(): Promise<SubmittableExtrinsic<'promise'>[]> {
    const extrinsics = this.openingIds.map((openingId, i) =>
      this.api.tx[this.group].fillOpening(
        openingId,
        new (JoyBTreeSet(ApplicationId))(registry, this.acceptedApplicationsIdsArrays[i])
      )
    )
    return this.asSudo ? extrinsics.map((tx) => this.api.tx.sudo.sudo(tx)) : extrinsics
  }

  protected getEventFromResult(result: ISubmittableResult): Promise<OpeningFilledEventDetails> {
    return this.api.retrieveOpeningFilledEventDetails(result, this.group)
  }

  protected async loadApplicationsData(): Promise<void> {
    this.acceptedApplicationsArrays = await Promise.all(
      this.acceptedApplicationsIdsArrays.map((acceptedApplicationIds) =>
        this.api.query[this.group].applicationById.multi<Application>(acceptedApplicationIds)
      )
    )
    this.applicationStakesArrays = await Promise.all(
      this.acceptedApplicationsArrays.map((acceptedApplications) =>
        Promise.all(
          acceptedApplications.map((a) =>
            this.api.getStakedBalance(a.staking_account_id, lockIdByWorkingGroup[this.group])
          )
        )
      )
    )
  }

  protected async loadOpeningsData(): Promise<void> {
    this.openings = await this.api.query[this.group].openingById.multi(this.openingIds)
  }

  async execute(): Promise<void> {
    await this.loadApplicationsData()
    await this.loadOpeningsData()
    await super.execute()
    this.events.forEach((e, i) => {
      this.createdWorkerIdsByOpeningId.set(
        this.openingIds[i].toNumber(),
        Array.from(e.applicationIdToWorkerIdMap.values())
      )
    })
  }

  protected assertQueryNodeEventIsValid(qEvent: OpeningFilledEventFieldsFragment, i: number): void {
    assert.equal(qEvent.event.type, EventType.OpeningFilled)
    assert.equal(qEvent.opening.runtimeId, this.openingIds[i].toNumber())
    assert.equal(qEvent.group.name, this.group)
    this.acceptedApplicationsIdsArrays[i].forEach((acceptedApplId, j) => {
      // Cannot use "applicationIdToWorkerIdMap.get" here,
      // it only works if the passed instance is identical to BTreeMap key instance (=== instead of .eq)
      const [, workerId] =
        Array.from(this.events[i].applicationIdToWorkerIdMap.entries()).find(([applicationId]) =>
          applicationId.eq(acceptedApplId)
        ) || []
      Utils.assert(
        workerId,
        `WorkerId for application id ${acceptedApplId.toString()} not found in OpeningFilled event!`
      )
      const qWorker = qEvent.workersHired.find((w) => w.runtimeId === workerId.toNumber())
      Utils.assert(qWorker, `Query node: Worker not found in OpeningFilled.hiredWorkers (id: ${workerId.toString()})`)
      this.assertHiredWorkerIsValid(
        this.events[i],
        this.acceptedApplicationsIdsArrays[i][j],
        this.acceptedApplicationsArrays[i][j],
        this.applicationStakesArrays[i][j],
        this.openings[i],
        qWorker
      )
    })
  }

  protected assertHiredWorkerIsValid(
    eventDetails: OpeningFilledEventDetails,
    applicationId: ApplicationId,
    application: Application,
    applicationStake: BN,
    opening: Opening,
    qWorker: WorkerFieldsFragment
  ): void {
    assert.equal(qWorker.group.name, this.group)
    assert.equal(qWorker.membership.id, application.member_id.toString())
    assert.equal(qWorker.roleAccount, application.role_account_id.toString())
    assert.equal(qWorker.rewardAccount, application.reward_account_id.toString())
    assert.equal(qWorker.stakeAccount, application.staking_account_id.toString())
    assert.equal(qWorker.status.__typename, 'WorkerStatusActive')
    assert.equal(qWorker.isLead, true)
    assert.equal(qWorker.stake, applicationStake.toString())
    assert.equal(qWorker.hiredAtBlock.number, eventDetails.blockNumber)
    assert.equal(qWorker.application.runtimeId, applicationId.toNumber())
    assert.equal(qWorker.rewardPerBlock, opening.reward_per_block.toString())
  }

  protected assertOpeningsStatusesAreValid(
    qEvents: OpeningFilledEventFieldsFragment[],
    qOpenings: OpeningFieldsFragment[]
  ): void {
    this.events.map((e, i) => {
      const openingId = this.openingIds[i]
      const qEvent = this.findMatchingQueryNodeEvent(e, qEvents)
      const qOpening = qOpenings.find((o) => o.runtimeId === openingId.toNumber())
      Utils.assert(qOpening, 'Query node: Opening not found')
      Utils.assert(qOpening.status.__typename === 'OpeningStatusFilled', 'Query node: Invalid opening status')
      assert.equal(qOpening.status.openingFilledEventId, qEvent.id)
    })
  }

  protected assertApplicationStatusesAreValid(
    qEvents: OpeningFilledEventFieldsFragment[],
    qOpenings: OpeningFieldsFragment[]
  ): void {
    this.events.map((e, i) => {
      const openingId = this.openingIds[i]
      const acceptedApplicationsIds = this.acceptedApplicationsIdsArrays[i]
      const qEvent = this.findMatchingQueryNodeEvent(e, qEvents)
      const qOpening = qOpenings.find((o) => o.runtimeId === openingId.toNumber())
      Utils.assert(qOpening, 'Query node: Opening not found')
      qOpening.applications.forEach((qApplication) => {
        const isAccepted = acceptedApplicationsIds.some((id) => id.toNumber() === qApplication.runtimeId)
        if (isAccepted) {
          Utils.assert(qApplication.status.__typename === 'ApplicationStatusAccepted', 'Invalid application status')
          assert.equal(qApplication.status.openingFilledEventId, qEvent.id)
        } else {
          assert.oneOf(qApplication.status.__typename, ['ApplicationStatusRejected', 'ApplicationStatusWithdrawn'])
          if (qApplication.status.__typename === 'ApplicationStatusRejected') {
            assert.equal(qApplication.status.openingFilledEventId, qEvent.id)
          }
        }
      })
    })
  }

  protected assertQueryNodeLeaderSetEventIsValid(
    eventDetails: EventDetails,
    qEvent: LeaderSetEventFieldsFragment | null,
    workerRuntimeId: number
  ): void {
    Utils.assert(qEvent, 'Query node: LeaderSet not found!')
    assert.equal(qEvent.event.inBlock.timestamp, eventDetails.blockTimestamp)
    assert.equal(qEvent.event.inExtrinsic, this.extrinsics[0].hash.toString())
    assert.equal(qEvent.event.type, EventType.LeaderSet)
    assert.equal(qEvent.group.name, this.group)
    Utils.assert(qEvent.worker, 'LeaderSet: Worker is empty')
    assert.equal(qEvent.worker.runtimeId, workerRuntimeId)
  }

  async runQueryNodeChecks(): Promise<void> {
    await super.runQueryNodeChecks()
    // Query the event and check event + hiredWorkers
    const qEvents = await this.query.tryQueryWithTimeout(
      () => this.query.getOpeningFilledEvents(this.events),
      (qEvents) => this.assertQueryNodeEventsAreValid(qEvents)
    )

    // Check openings statuses
    const qOpenings = await this.query.getOpeningsByIds(this.openingIds, this.group)
    this.assertOpeningsStatusesAreValid(qEvents, qOpenings)

    // Check application statuses
    this.assertApplicationStatusesAreValid(qEvents, qOpenings)

    if (this.asSudo) {
      const leaderId = qEvents[0].workersHired[0].runtimeId
      assert.isNumber(leaderId)

      const qGroup = await this.query.getWorkingGroup(this.group)
      Utils.assert(qGroup, 'Query node: Working group not found!')
      Utils.assert(qGroup.leader, 'Query node: Working group leader not set!')
      assert.equal(qGroup.leader.runtimeId, leaderId)

      const leaderSetEvent = await this.api.retrieveWorkingGroupsEventDetails(this.results[0], this.group, 'LeaderSet')
      const qEvent = await this.query.getLeaderSetEvent(leaderSetEvent)
      this.assertQueryNodeLeaderSetEventIsValid(leaderSetEvent, qEvent, leaderId)
    }
  }
}
