import { Api } from '../Api'
import BN from 'bn.js'
import { assert } from 'chai'
import { StandardizedFixture } from '../Fixture'
import { QueryNodeApi } from '../QueryNodeApi'
import { ApplicationFormQuestionType, EventType, WorkingGroupOpeningType } from '../graphql/generated/schema'
import {
  AddUpcomingOpening,
  ApplicationMetadata,
  OpeningMetadata,
  RemoveUpcomingOpening,
  UpcomingOpeningMetadata,
  WorkingGroupMetadataAction,
  WorkingGroupMetadata,
  SetGroupMetadata,
} from '@joystream/metadata-protobuf'
import {
  WorkingGroupModuleName,
  AppliedOnOpeningEventDetails,
  OpeningAddedEventDetails,
  OpeningFilledEventDetails,
  lockIdByWorkingGroup,
  EventDetails,
} from '../types'
import { Application, ApplicationId, Opening, OpeningId } from '@joystream/types/working-group'
import { Utils } from '../utils'
import _ from 'lodash'
import { SubmittableExtrinsic } from '@polkadot/api/types'
import { JoyBTreeSet, MemberId } from '@joystream/types/common'
import { registry } from '@joystream/types'
import {
  OpeningFieldsFragment,
  OpeningMetadataFieldsFragment,
  OpeningAddedEventFieldsFragment,
  ApplicationFieldsFragment,
  AppliedOnOpeningEventFieldsFragment,
  OpeningFilledEventFieldsFragment,
  WorkerFieldsFragment,
  ApplicationWithdrawnEventFieldsFragment,
  OpeningCanceledEventFieldsFragment,
  StatusTextChangedEventFieldsFragment,
  UpcomingOpeningFieldsFragment,
  WorkingGroupMetadataFieldsFragment,
  WorkingGroupFieldsFragment,
  ApplicationBasicFieldsFragment,
} from '../graphql/generated/queries'
import { ISubmittableResult } from '@polkadot/types/types/'

// TODO: Fetch from runtime when possible!
const MIN_APPLICATION_STAKE = new BN(2000)
const MIN_USTANKING_PERIOD = 43201
export const LEADER_OPENING_STAKE = new BN(2000)

export type OpeningParams = {
  stake: BN
  unstakingPeriod: number
  reward: BN
  metadata: OpeningMetadata.AsObject
}

export type UpcomingOpeningParams = OpeningParams & {
  expectedStartTs: number
}

const queryNodeQuestionTypeToMetadataQuestionType = (type: ApplicationFormQuestionType) => {
  if (type === ApplicationFormQuestionType.Text) {
    return OpeningMetadata.ApplicationFormQuestion.InputType.TEXT
  }

  return OpeningMetadata.ApplicationFormQuestion.InputType.TEXTAREA
}

abstract class BaseWorkingGroupFixture extends StandardizedFixture {
  protected group: WorkingGroupModuleName

  public constructor(api: Api, query: QueryNodeApi, group: WorkingGroupModuleName) {
    super(api, query)
    this.group = group
  }
}

abstract class BaseCreateOpeningFixture extends BaseWorkingGroupFixture {
  protected openingsParams: OpeningParams[]

  public constructor(
    api: Api,
    query: QueryNodeApi,
    group: WorkingGroupModuleName,
    openingsParams?: Partial<OpeningParams>[]
  ) {
    super(api, query, group)
    this.openingsParams = (openingsParams || [{}]).map((params) => _.merge(this.defaultOpeningParams, params))
  }

  protected defaultOpeningParams: OpeningParams = {
    stake: MIN_APPLICATION_STAKE,
    unstakingPeriod: MIN_USTANKING_PERIOD,
    reward: new BN(10),
    metadata: {
      shortDescription: 'Test opening',
      description: '# Test opening',
      expectedEndingTimestamp: Date.now() + 60,
      hiringLimit: 1,
      applicationDetails: '- This is automatically created opening, do not apply!',
      applicationFormQuestionsList: [
        { question: 'Question 1?', type: OpeningMetadata.ApplicationFormQuestion.InputType.TEXT },
        { question: 'Question 2?', type: OpeningMetadata.ApplicationFormQuestion.InputType.TEXTAREA },
      ],
    },
  }

  public getDefaultOpeningParams(): OpeningParams {
    return this.defaultOpeningParams
  }

  protected getMetadata(openingParams: OpeningParams): OpeningMetadata {
    const metadataObj = openingParams.metadata as Required<OpeningMetadata.AsObject>
    const metadata = new OpeningMetadata()
    metadata.setShortDescription(metadataObj.shortDescription)
    metadata.setDescription(metadataObj.description)
    metadata.setExpectedEndingTimestamp(metadataObj.expectedEndingTimestamp)
    metadata.setHiringLimit(metadataObj.hiringLimit)
    metadata.setApplicationDetails(metadataObj.applicationDetails)
    metadataObj.applicationFormQuestionsList.forEach(({ question, type }) => {
      const applicationFormQuestion = new OpeningMetadata.ApplicationFormQuestion()
      applicationFormQuestion.setQuestion(question!)
      applicationFormQuestion.setType(type!)
      metadata.addApplicationFormQuestions(applicationFormQuestion)
    })

    return metadata
  }

  protected assertQueriedOpeningMetadataIsValid(
    openingParams: OpeningParams,
    qOpeningMeta: OpeningMetadataFieldsFragment
  ) {
    assert.equal(qOpeningMeta.shortDescription, openingParams.metadata.shortDescription)
    assert.equal(qOpeningMeta.description, openingParams.metadata.description)
    assert.equal(new Date(qOpeningMeta.expectedEnding).getTime(), openingParams.metadata.expectedEndingTimestamp)
    assert.equal(qOpeningMeta.hiringLimit, openingParams.metadata.hiringLimit)
    assert.equal(qOpeningMeta.applicationDetails, openingParams.metadata.applicationDetails)
    assert.deepEqual(
      qOpeningMeta.applicationFormQuestions
        .sort((a, b) => a.index - b.index)
        .map(({ question, type }) => ({
          question,
          type: queryNodeQuestionTypeToMetadataQuestionType(type),
        })),
      openingParams.metadata.applicationFormQuestionsList
    )
  }
}
export class CreateOpeningsFixture extends BaseCreateOpeningFixture {
  protected asSudo: boolean
  protected events: OpeningAddedEventDetails[] = []

  public constructor(
    api: Api,
    query: QueryNodeApi,
    group: WorkingGroupModuleName,
    openingsParams?: Partial<OpeningParams>[],
    asSudo = false
  ) {
    super(api, query, group, openingsParams)
    this.asSudo = asSudo
  }

  public getCreatedOpeningIds(): OpeningId[] {
    if (!this.events.length) {
      throw new Error('Trying to get created opening ids before they were created!')
    }
    return this.events.map((e) => e.openingId)
  }

  protected async getSignerAccountOrAccounts(): Promise<string> {
    return this.asSudo ? (await this.api.query.sudo.key()).toString() : await this.api.getLeadRoleKey(this.group)
  }

  protected async getExtrinsics(): Promise<SubmittableExtrinsic<'promise'>[]> {
    const extrinsics = this.openingsParams.map((params) =>
      this.api.tx[this.group].addOpening(
        Utils.metadataToBytes(this.getMetadata(params)),
        this.asSudo ? 'Leader' : 'Regular',
        { stake_amount: params.stake, leaving_unstaking_period: params.unstakingPeriod },
        params.reward
      )
    )

    return this.asSudo ? extrinsics.map((tx) => this.api.tx.sudo.sudo(tx)) : extrinsics
  }

  protected async getEventFromResult(result: ISubmittableResult): Promise<OpeningAddedEventDetails> {
    return this.api.retrieveOpeningAddedEventDetails(result, this.group)
  }

  protected assertQueriedOpeningsAreValid(qOpenings: OpeningFieldsFragment[]): void {
    this.events.map((e, i) => {
      const qOpening = qOpenings.find((o) => o.runtimeId === e.openingId.toNumber())
      const openingParams = this.openingsParams[i]
      Utils.assert(qOpening, 'Query node: Opening not found')
      assert.equal(qOpening.runtimeId, e.openingId.toNumber())
      assert.equal(qOpening.createdAtBlock.number, e.blockNumber)
      assert.equal(qOpening.group.name, this.group)
      assert.equal(qOpening.rewardPerBlock, openingParams.reward.toString())
      assert.equal(qOpening.type, this.asSudo ? WorkingGroupOpeningType.Leader : WorkingGroupOpeningType.Regular)
      assert.equal(qOpening.status.__typename, 'OpeningStatusOpen')
      assert.equal(qOpening.stakeAmount, openingParams.stake.toString())
      assert.equal(qOpening.unstakingPeriod, openingParams.unstakingPeriod)
      // Metadata
      this.assertQueriedOpeningMetadataIsValid(openingParams, qOpening.metadata)
    })
  }

  protected assertQueryNodeEventIsValid(qEvent: OpeningAddedEventFieldsFragment, i: number): void {
    assert.equal(qEvent.event.type, EventType.OpeningAdded)
    assert.equal(qEvent.group.name, this.group)
    assert.equal(qEvent.opening.runtimeId, this.events[i].openingId.toNumber())
  }

  async runQueryNodeChecks(): Promise<void> {
    await super.runQueryNodeChecks()
    // Query the events
    await this.query.tryQueryWithTimeout(
      () => this.query.getOpeningAddedEvents(this.events),
      (qEvents) => this.assertQueryNodeEventsAreValid(qEvents)
    )

    // Query the openings
    const qOpenings = await this.query.getOpeningsByIds(
      this.events.map((e) => e.openingId),
      this.group
    )
    this.assertQueriedOpeningsAreValid(qOpenings)
  }
}

export type ApplicantDetails = {
  memberId: MemberId
  roleAccount: string
  rewardAccount: string
  stakingAccount: string
}

export type OpeningApplications = {
  openingId: OpeningId
  openingMetadata: OpeningMetadata.AsObject
  applicants: ApplicantDetails[]
}

export type OpeningApplicationsFlattened = {
  openingId: OpeningId
  openingMetadata: OpeningMetadata.AsObject
  applicant: ApplicantDetails
}[]

export class ApplyOnOpeningsHappyCaseFixture extends BaseWorkingGroupFixture {
  protected applications: OpeningApplicationsFlattened
  protected events: AppliedOnOpeningEventDetails[] = []
  protected createdApplicationsByOpeningId: Map<number, ApplicationId[]> = new Map<number, ApplicationId[]>()

  public constructor(
    api: Api,
    query: QueryNodeApi,
    group: WorkingGroupModuleName,
    openingsApplications: OpeningApplications[]
  ) {
    super(api, query, group)
    this.applications = this.flattenOpeningApplicationsData(openingsApplications)
  }

  protected flattenOpeningApplicationsData(openingsApplications: OpeningApplications[]): OpeningApplicationsFlattened {
    return openingsApplications.reduce(
      (curr, details) =>
        curr.concat(
          details.applicants.map((a) => ({
            openingId: details.openingId,
            openingMetadata: details.openingMetadata,
            applicant: a,
          }))
        ),
      [] as OpeningApplicationsFlattened
    )
  }

  protected async getSignerAccountOrAccounts(): Promise<string[]> {
    return this.applications.map((a) => a.applicant.roleAccount)
  }

  protected async getExtrinsics(): Promise<SubmittableExtrinsic<'promise'>[]> {
    const openingIds = _.uniq(this.applications.map((a) => a.openingId.toString()))
    const openings = await this.api.query[this.group].openingById.multi<Opening>(openingIds)
    return this.applications.map((a, i) => {
      const openingIndex = openingIds.findIndex((id) => id === a.openingId.toString())
      const opening = openings[openingIndex]
      return this.api.tx[this.group].applyOnOpening({
        member_id: a.applicant.memberId,
        description: Utils.metadataToBytes(this.getApplicationMetadata(a.openingMetadata, i)),
        opening_id: a.openingId,
        reward_account_id: a.applicant.rewardAccount,
        role_account_id: a.applicant.roleAccount,
        stake_parameters: {
          stake: opening.stake_policy.stake_amount,
          staking_account_id: a.applicant.stakingAccount,
        },
      })
    })
  }

  protected async getEventFromResult(result: ISubmittableResult): Promise<AppliedOnOpeningEventDetails> {
    return this.api.retrieveAppliedOnOpeningEventDetails(result, this.group)
  }

  public async execute(): Promise<void> {
    await super.execute()
    this.applications.map(({ openingId }, i) => {
      this.createdApplicationsByOpeningId.set(openingId.toNumber(), [
        ...(this.createdApplicationsByOpeningId.get(openingId.toNumber()) || []),
        this.events[i].applicationId,
      ])
    })
  }

  public getCreatedApplicationsByOpeningId(openingId: OpeningId): ApplicationId[] {
    const applicationIds = this.createdApplicationsByOpeningId.get(openingId.toNumber())
    if (!applicationIds) {
      throw new Error(`No created application ids by opening id ${openingId.toString()} found!`)
    }
    return applicationIds
  }

  protected getApplicationMetadata(openingMetadata: OpeningMetadata.AsObject, i: number): ApplicationMetadata {
    const metadata = new ApplicationMetadata()
    openingMetadata.applicationFormQuestionsList.forEach((question, j) => {
      metadata.addAnswers(`Answer to question ${j} by applicant number ${i}`)
    })
    return metadata
  }

  protected assertQueriedApplicationsAreValid(qApplications: ApplicationFieldsFragment[]): void {
    this.events.map((e, i) => {
      const applicationDetails = this.applications[i]
      const qApplication = qApplications.find((a) => a.runtimeId === e.applicationId.toNumber())
      Utils.assert(qApplication, 'Query node: Application not found!')
      assert.equal(qApplication.runtimeId, e.applicationId.toNumber())
      assert.equal(qApplication.createdAtBlock.number, e.blockNumber)
      assert.equal(qApplication.opening.runtimeId, applicationDetails.openingId.toNumber())
      assert.equal(qApplication.applicant.id, applicationDetails.applicant.memberId.toString())
      assert.equal(qApplication.roleAccount, applicationDetails.applicant.roleAccount)
      assert.equal(qApplication.rewardAccount, applicationDetails.applicant.rewardAccount)
      assert.equal(qApplication.stakingAccount, applicationDetails.applicant.stakingAccount)
      assert.equal(qApplication.status.__typename, 'ApplicationStatusPending')
      assert.equal(qApplication.stake, e.params.stake_parameters.stake)

      const applicationMetadata = this.getApplicationMetadata(applicationDetails.openingMetadata, i)
      assert.deepEqual(
        qApplication.answers.map(({ question: { question }, answer }) => ({ question, answer })),
        applicationDetails.openingMetadata.applicationFormQuestionsList.map(({ question }, index) => ({
          question,
          answer: applicationMetadata.getAnswersList()[index],
        }))
      )
    })
  }

  protected assertQueryNodeEventIsValid(qEvent: AppliedOnOpeningEventFieldsFragment, i: number): void {
    const applicationDetails = this.applications[i]
    assert.equal(qEvent.event.type, EventType.AppliedOnOpening)
    assert.equal(qEvent.group.name, this.group)
    assert.equal(qEvent.opening.runtimeId, applicationDetails.openingId.toNumber())
    assert.equal(qEvent.application.runtimeId, this.events[i].applicationId.toNumber())
  }

  async runQueryNodeChecks(): Promise<void> {
    await super.runQueryNodeChecks()
    // Query the events
    await this.query.tryQueryWithTimeout(
      () => this.query.getAppliedOnOpeningEvents(this.events),
      (qEvents) => this.assertQueryNodeEventsAreValid(qEvents)
    )
    // Query the applications
    const qApplications = await this.query.getApplicationsByIds(
      this.events.map((e) => e.applicationId),
      this.group
    )
    this.assertQueriedApplicationsAreValid(qApplications)
  }
}

export class FillOpeningsFixture extends BaseWorkingGroupFixture {
  protected events: OpeningFilledEventDetails[] = []
  protected asSudo: boolean

  protected openingIds: OpeningId[]
  protected acceptedApplicationsIdsArrays: ApplicationId[][]

  protected acceptedApplicationsArrays: Application[][] = []
  protected applicationStakesArrays: BN[][] = []

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

  async execute(): Promise<void> {
    await this.loadApplicationsData()
    await super.execute()
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
        qWorker
      )
    })
  }

  protected assertHiredWorkerIsValid(
    eventDetails: OpeningFilledEventDetails,
    applicationId: ApplicationId,
    application: Application,
    applicationStake: BN,
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
      const qGroup = await this.query.getWorkingGroup(this.group)
      Utils.assert(qGroup, 'Query node: Working group not found!')
      Utils.assert(qGroup.leader, 'Query node: Working group leader not set!')
      assert.equal(qGroup.leader.runtimeId, qEvents[0].workersHired[0].runtimeId)
    }
  }
}

export class WithdrawApplicationsFixture extends BaseWorkingGroupFixture {
  protected applicationIds: ApplicationId[]
  protected accounts: string[]

  public constructor(
    api: Api,
    query: QueryNodeApi,
    group: WorkingGroupModuleName,
    accounts: string[],
    applicationIds: ApplicationId[]
  ) {
    super(api, query, group)
    this.accounts = accounts
    this.applicationIds = applicationIds
  }

  protected async getSignerAccountOrAccounts(): Promise<string[]> {
    return this.accounts
  }

  protected async getExtrinsics(): Promise<SubmittableExtrinsic<'promise'>[]> {
    return this.applicationIds.map((id) => this.api.tx[this.group].withdrawApplication(id))
  }

  protected async getEventFromResult(result: ISubmittableResult): Promise<EventDetails> {
    return this.api.retrieveWorkingGroupsEventDetails(result, this.group, 'ApplicationWithdrawn')
  }

  protected assertQueryNodeEventIsValid(qEvent: ApplicationWithdrawnEventFieldsFragment, i: number): void {
    assert.equal(qEvent.event.type, EventType.ApplicationWithdrawn)
    assert.equal(qEvent.application.runtimeId, this.applicationIds[i].toNumber())
    assert.equal(qEvent.group.name, this.group)
  }

  protected assertApplicationStatusesAreValid(
    qEvents: ApplicationWithdrawnEventFieldsFragment[],
    qApplications: ApplicationFieldsFragment[]
  ): void {
    this.events.map((e, i) => {
      const qEvent = this.findMatchingQueryNodeEvent(e, qEvents)
      const qApplication = qApplications.find((a) => a.runtimeId === this.applicationIds[i].toNumber())
      Utils.assert(qApplication, 'Query node: Application not found!')
      Utils.assert(
        qApplication.status.__typename === 'ApplicationStatusWithdrawn',
        'Query node: Invalid application status!'
      )
      assert.equal(qApplication.status.applicationWithdrawnEventId, qEvent.id)
    })
  }

  async runQueryNodeChecks(): Promise<void> {
    await super.runQueryNodeChecks()

    // Query the evens
    const qEvents = await this.query.tryQueryWithTimeout(
      () => this.query.getApplicationWithdrawnEvents(this.events),
      (qEvents) => this.assertQueryNodeEventsAreValid(qEvents)
    )

    // Check application statuses
    const qApplciations = await this.query.getApplicationsByIds(this.applicationIds, this.group)
    this.assertApplicationStatusesAreValid(qEvents, qApplciations)
  }
}

export class CancelOpeningsFixture extends BaseWorkingGroupFixture {
  protected openingIds: OpeningId[]

  public constructor(api: Api, query: QueryNodeApi, group: WorkingGroupModuleName, openingIds: OpeningId[]) {
    super(api, query, group)
    this.openingIds = openingIds
  }

  protected async getSignerAccountOrAccounts(): Promise<string> {
    return this.api.getLeadRoleKey(this.group)
  }

  protected async getExtrinsics(): Promise<SubmittableExtrinsic<'promise'>[]> {
    return this.openingIds.map((id) => this.api.tx[this.group].cancelOpening(id))
  }

  protected async getEventFromResult(result: ISubmittableResult): Promise<EventDetails> {
    return this.api.retrieveWorkingGroupsEventDetails(result, this.group, 'OpeningCanceled')
  }

  protected assertQueriedOpeningsAreValid(
    qEvents: OpeningCanceledEventFieldsFragment[],
    qOpenings: OpeningFieldsFragment[]
  ): void {
    this.events.map((e, i) => {
      const openingId = this.openingIds[i]
      const qEvent = this.findMatchingQueryNodeEvent(e, qEvents)
      const qOpening = qOpenings.find((o) => o.runtimeId === openingId.toNumber())
      Utils.assert(qOpening)
      Utils.assert(qOpening.status.__typename === 'OpeningStatusCancelled', 'Query node: Invalid opening status')
      assert.equal(qOpening.status.openingCancelledEventId, qEvent.id)
      qOpening.applications.forEach((a) => this.assertApplicationStatusIsValid(qEvent, a))
    })
  }

  protected assertApplicationStatusIsValid(
    qEvent: OpeningCanceledEventFieldsFragment,
    qApplication: ApplicationBasicFieldsFragment
  ): void {
    // It's possible that some of the applications have been withdrawn
    assert.oneOf(qApplication.status.__typename, ['ApplicationStatusWithdrawn', 'ApplicationStatusCancelled'])
    if (qApplication.status.__typename === 'ApplicationStatusCancelled') {
      assert.equal(qApplication.status.openingCancelledEventId, qEvent.id)
    }
  }

  protected assertQueryNodeEventIsValid(qEvent: OpeningCanceledEventFieldsFragment, i: number): void {
    assert.equal(qEvent.event.type, EventType.OpeningCanceled)
    assert.equal(qEvent.group.name, this.group)
    assert.equal(qEvent.opening.runtimeId, this.openingIds[i].toNumber())
  }

  async runQueryNodeChecks(): Promise<void> {
    await super.runQueryNodeChecks()
    const qEvents = await this.query.tryQueryWithTimeout(
      () => this.query.getOpeningCancelledEvents(this.events),
      (qEvents) => this.assertQueryNodeEventsAreValid(qEvents)
    )
    const qOpenings = await this.query.getOpeningsByIds(this.openingIds, this.group)
    this.assertQueriedOpeningsAreValid(qEvents, qOpenings)
  }
}
export class CreateUpcomingOpeningsFixture extends BaseCreateOpeningFixture {
  protected openingsParams: UpcomingOpeningParams[]
  protected createdUpcomingOpeningIds: string[] = []

  public getDefaultOpeningParams(): UpcomingOpeningParams {
    return {
      ...super.getDefaultOpeningParams(),
      expectedStartTs: Date.now() + 3600,
    }
  }

  public constructor(
    api: Api,
    query: QueryNodeApi,
    group: WorkingGroupModuleName,
    openingsParams?: Partial<UpcomingOpeningParams>[]
  ) {
    super(api, query, group, openingsParams)
    this.openingsParams = (openingsParams || [{}]).map((params) => _.merge(this.getDefaultOpeningParams(), params))
  }

  protected async getSignerAccountOrAccounts(): Promise<string> {
    return this.api.getLeadRoleKey(this.group)
  }

  protected async getExtrinsics(): Promise<SubmittableExtrinsic<'promise'>[]> {
    return this.openingsParams.map((params) => {
      const metaBytes = Utils.metadataToBytes(this.getActionMetadata(params))
      return this.api.tx[this.group].setStatusText(metaBytes)
    })
  }

  protected async getEventFromResult(result: ISubmittableResult): Promise<EventDetails> {
    return this.api.retrieveWorkingGroupsEventDetails(result, this.group, 'StatusTextChanged')
  }

  public getCreatedUpcomingOpeningIds(): string[] {
    if (!this.createdUpcomingOpeningIds.length) {
      throw new Error('Trying to get created UpcomingOpening ids before they are known')
    }
    return this.createdUpcomingOpeningIds
  }

  protected getActionMetadata(openingParams: UpcomingOpeningParams): WorkingGroupMetadataAction {
    const actionMeta = new WorkingGroupMetadataAction()
    const addUpcomingOpeningMeta = new AddUpcomingOpening()

    const upcomingOpeningMeta = new UpcomingOpeningMetadata()
    const openingMeta = this.getMetadata(openingParams)
    upcomingOpeningMeta.setMetadata(openingMeta)
    upcomingOpeningMeta.setExpectedStart(openingParams.expectedStartTs)
    upcomingOpeningMeta.setMinApplicationStake(openingParams.stake.toNumber())
    upcomingOpeningMeta.setRewardPerBlock(openingParams.reward.toNumber())

    addUpcomingOpeningMeta.setMetadata(upcomingOpeningMeta)
    actionMeta.setAddUpcomingOpening(addUpcomingOpeningMeta)

    return actionMeta
  }

  protected assertQueriedUpcomingOpeningsAreValid(
    qUpcomingOpenings: UpcomingOpeningFieldsFragment[],
    qEvents: StatusTextChangedEventFieldsFragment[]
  ): void {
    this.events.forEach((e, i) => {
      const openingParams = this.openingsParams[i]
      const qEvent = this.findMatchingQueryNodeEvent(e, qEvents)
      const qUpcomingOpening = qUpcomingOpenings.find((o) => o.createdInEvent.id === qEvent.id)
      Utils.assert(qUpcomingOpening)
      assert.equal(new Date(qUpcomingOpening.expectedStart).getTime(), openingParams.expectedStartTs)
      assert.equal(qUpcomingOpening.group.name, this.group)
      assert.equal(qUpcomingOpening.rewardPerBlock, openingParams.reward.toString())
      assert.equal(qUpcomingOpening.stakeAmount, openingParams.stake.toString())
      assert.equal(qUpcomingOpening.createdAtBlock.number, e.blockNumber)
      this.assertQueriedOpeningMetadataIsValid(openingParams, qUpcomingOpening.metadata)
      Utils.assert(qEvent.result.__typename === 'UpcomingOpeningAdded')
      assert.equal(qEvent.result.upcomingOpeningId, qUpcomingOpening.id)
    })
  }

  protected assertQueryNodeEventIsValid(qEvent: StatusTextChangedEventFieldsFragment, i: number): void {
    assert.equal(qEvent.event.type, EventType.StatusTextChanged)
    assert.equal(qEvent.group.name, this.group)
    assert.equal(qEvent.metadata, Utils.metadataToBytes(this.getActionMetadata(this.openingsParams[i])).toString())
    assert.equal(qEvent.result.__typename, 'UpcomingOpeningAdded')
  }

  async runQueryNodeChecks(): Promise<void> {
    await super.runQueryNodeChecks()
    // Query the event
    const qEvents = await this.query.tryQueryWithTimeout(
      () => this.query.getStatusTextChangedEvents(this.events),
      (qEvents) => this.assertQueryNodeEventsAreValid(qEvents)
    )
    // Query the opening
    const qUpcomingOpenings = await this.query.getUpcomingOpeningsByCreatedInEventIds(qEvents.map((e) => e.id))
    this.assertQueriedUpcomingOpeningsAreValid(qUpcomingOpenings, qEvents)

    this.createdUpcomingOpeningIds = qUpcomingOpenings.map((o) => o.id)
  }
}

export class RemoveUpcomingOpeningsFixture extends BaseWorkingGroupFixture {
  protected upcomingOpeningIds: string[]

  public constructor(api: Api, query: QueryNodeApi, group: WorkingGroupModuleName, upcomingOpeningIds: string[]) {
    super(api, query, group)
    this.upcomingOpeningIds = upcomingOpeningIds
  }

  protected async getSignerAccountOrAccounts(): Promise<string> {
    return this.api.getLeadRoleKey(this.group)
  }

  protected async getExtrinsics(): Promise<SubmittableExtrinsic<'promise'>[]> {
    return this.upcomingOpeningIds.map((id) => {
      const metaBytes = Utils.metadataToBytes(this.getActionMetadata(id))
      return this.api.tx[this.group].setStatusText(metaBytes)
    })
  }

  protected async getEventFromResult(result: ISubmittableResult): Promise<EventDetails> {
    return this.api.retrieveWorkingGroupsEventDetails(result, this.group, 'StatusTextChanged')
  }

  protected getActionMetadata(upcomingOpeningId: string): WorkingGroupMetadataAction {
    const actionMeta = new WorkingGroupMetadataAction()
    const removeUpcomingOpeningMeta = new RemoveUpcomingOpening()
    removeUpcomingOpeningMeta.setId(upcomingOpeningId)
    actionMeta.setRemoveUpcomingOpening(removeUpcomingOpeningMeta)

    return actionMeta
  }

  protected assertQueryNodeEventIsValid(qEvent: StatusTextChangedEventFieldsFragment, i: number): void {
    assert.equal(qEvent.event.type, EventType.StatusTextChanged)
    assert.equal(qEvent.group.name, this.group)
    assert.equal(qEvent.metadata, Utils.metadataToBytes(this.getActionMetadata(this.upcomingOpeningIds[i])).toString())
    Utils.assert(qEvent.result.__typename === 'UpcomingOpeningRemoved', 'Unexpected StatuxTextChangedEvent result type')
    assert.equal(qEvent.result.upcomingOpeningId, this.upcomingOpeningIds[i])
  }

  async runQueryNodeChecks(): Promise<void> {
    await super.runQueryNodeChecks()
    // Query & check the event
    await this.query.tryQueryWithTimeout(
      () => this.query.getStatusTextChangedEvents(this.events),
      (qEvents) => this.assertQueryNodeEventsAreValid(qEvents)
    )
    // Query the openings and make sure they no longer exist
    await Promise.all(
      this.upcomingOpeningIds.map(async (id) => {
        const qUpcomingOpening = await this.query.getUpcomingOpeningById(id)
        assert.isNull(qUpcomingOpening)
      })
    )
  }
}

export class UpdateGroupStatusFixture extends BaseWorkingGroupFixture {
  protected updates: WorkingGroupMetadata.AsObject[]
  protected areExtrinsicsOrderSensitive = true

  public constructor(
    api: Api,
    query: QueryNodeApi,
    group: WorkingGroupModuleName,
    updates: WorkingGroupMetadata.AsObject[]
  ) {
    super(api, query, group)
    this.updates = updates
  }

  protected async getSignerAccountOrAccounts(): Promise<string> {
    return this.api.getLeadRoleKey(this.group)
  }

  protected async getExtrinsics(): Promise<SubmittableExtrinsic<'promise'>[]> {
    return this.updates.map((update) => {
      const metaBytes = Utils.metadataToBytes(this.getActionMetadata(update))
      return this.api.tx[this.group].setStatusText(metaBytes)
    })
  }

  protected async getEventFromResult(r: ISubmittableResult): Promise<EventDetails> {
    return this.api.retrieveWorkingGroupsEventDetails(r, this.group, 'StatusTextChanged')
  }

  protected getActionMetadata(update: WorkingGroupMetadata.AsObject): WorkingGroupMetadataAction {
    const actionMeta = new WorkingGroupMetadataAction()
    const setGroupMeta = new SetGroupMetadata()
    const newGroupMeta = new WorkingGroupMetadata()

    newGroupMeta.setAbout(update.about!)
    newGroupMeta.setDescription(update.description!)
    newGroupMeta.setStatus(update.status!)
    newGroupMeta.setStatusMessage(update.statusMessage!)

    setGroupMeta.setNewMetadata(newGroupMeta)
    actionMeta.setSetGroupMetadata(setGroupMeta)

    return actionMeta
  }

  protected assertQueryNodeEventIsValid(qEvent: StatusTextChangedEventFieldsFragment, i: number): void {
    assert.equal(qEvent.event.type, EventType.StatusTextChanged)
    assert.equal(qEvent.group.name, this.group)
    assert.equal(qEvent.metadata, Utils.metadataToBytes(this.getActionMetadata(this.updates[i])).toString())
    assert.equal(qEvent.result.__typename, 'WorkingGroupMetadataSet')
  }

  protected assertQueriedGroupIsValid(
    qGroup: WorkingGroupFieldsFragment,
    qMeta: WorkingGroupMetadataFieldsFragment
  ): void {
    if (!qGroup.metadata) {
      throw new Error(`Query node: Group metadata is empty!`)
    }
    assert.equal(qGroup.metadata.id, qMeta.id)
  }

  protected assertQueriedMetadataSnapshotsAreValid(
    eventDetails: EventDetails,
    preUpdateSnapshot: WorkingGroupMetadataFieldsFragment | null,
    postUpdateSnapshot: WorkingGroupMetadataFieldsFragment | null,
    update: WorkingGroupMetadata.AsObject
  ): asserts postUpdateSnapshot is WorkingGroupMetadataFieldsFragment {
    if (!postUpdateSnapshot) {
      throw new Error('Query node: WorkingGroupMetadata snapshot not found!')
    }
    const expectedMeta = _.merge(preUpdateSnapshot, update)
    assert.equal(postUpdateSnapshot.status, expectedMeta.status)
    assert.equal(postUpdateSnapshot.statusMessage, expectedMeta.statusMessage)
    assert.equal(postUpdateSnapshot.description, expectedMeta.description)
    assert.equal(postUpdateSnapshot.about, expectedMeta.about)
    assert.equal(postUpdateSnapshot.setAtBlock.number, eventDetails.blockNumber)
  }

  async runQueryNodeChecks(): Promise<void> {
    await super.runQueryNodeChecks()
    // Query & check the event
    const qEvents = await this.query.tryQueryWithTimeout(
      () => this.query.getStatusTextChangedEvents(this.events),
      (qEvents) => this.assertQueryNodeEventsAreValid(qEvents)
    )

    // Query the group
    const qGroup = await this.query.getWorkingGroup(this.group)
    if (!qGroup) {
      throw new Error('Query node: Working group not found!')
    }

    // Query & check the metadata snapshots
    const snapshots = await this.query.getGroupMetaSnapshotsByTimeAsc(qGroup.id)
    let lastSnapshot: WorkingGroupMetadataFieldsFragment | null = null
    this.events.forEach((postUpdateEvent, i) => {
      const postUpdateSnapshotIndex = snapshots.findIndex(
        (s) =>
          s.setInEvent.event.id ===
          this.query.getQueryNodeEventId(postUpdateEvent.blockNumber, postUpdateEvent.indexInBlock)
      )
      const postUpdateSnapshot = postUpdateSnapshotIndex > -1 ? snapshots[postUpdateSnapshotIndex] : null
      const preUpdateSnapshot = postUpdateSnapshotIndex > 0 ? snapshots[postUpdateSnapshotIndex - 1] : null
      this.assertQueriedMetadataSnapshotsAreValid(
        postUpdateEvent,
        preUpdateSnapshot,
        postUpdateSnapshot,
        this.updates[i]
      )
      const qEvent = qEvents[i]
      Utils.assert(
        qEvent.result.__typename === 'WorkingGroupMetadataSet',
        'Invalid StatusTextChanged event result type'
      )
      assert(qEvent.result.metadataId, postUpdateSnapshot.id)
      lastSnapshot = postUpdateSnapshot
    })

    // Check the group
    if (lastSnapshot) {
      this.assertQueriedGroupIsValid(qGroup, lastSnapshot)
    }
  }
}
