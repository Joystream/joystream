import { Api } from '../Api'
import BN from 'bn.js'
import { assert } from 'chai'
import { BaseFixture } from '../Fixture'
import Debugger from 'debug'
import { QueryNodeApi } from '../QueryNodeApi'
import {
  ApplicationFormQuestionType,
  AppliedOnOpeningEvent,
  EventType,
  OpeningAddedEvent,
  OpeningFilledEvent,
  WorkingGroupApplication,
  WorkingGroupOpening,
  WorkingGroupOpeningType,
  Worker,
} from '../QueryNodeApiSchema.generated'
import { ApplicationMetadata, OpeningMetadata } from '@joystream/metadata-protobuf'
import {
  WorkingGroupModuleName,
  MemberContext,
  AppliedOnOpeningEventDetails,
  OpeningAddedEventDetails,
  OpeningFilledEventDetails,
  lockIdByWorkingGroup,
} from '../types'
import { Application, ApplicationId, Opening, OpeningId } from '@joystream/types/working-group'
import { Utils } from '../utils'
import _ from 'lodash'
import { SubmittableExtrinsic } from '@polkadot/api/types'
import { JoyBTreeSet } from '@joystream/types/common'
import { registry } from '@joystream/types'

// TODO: Fetch from runtime when possible!
const MIN_APPLICATION_STAKE = new BN(2000)
const MIN_USTANKING_PERIOD = 43201

export type OpeningParams = {
  stake: BN
  unstakingPeriod: number
  reward: BN
  metadata: OpeningMetadata.AsObject
}

const queryNodeQuestionTypeToMetadataQuestionType = (type: ApplicationFormQuestionType) => {
  if (type === ApplicationFormQuestionType.Text) {
    return OpeningMetadata.ApplicationFormQuestion.InputType.TEXT
  }

  return OpeningMetadata.ApplicationFormQuestion.InputType.TEXTAREA
}

export class SudoCreateLeadOpeningFixture extends BaseFixture {
  private query: QueryNodeApi
  private group: WorkingGroupModuleName
  private debug: Debugger.Debugger
  private openingParams: OpeningParams

  private event?: OpeningAddedEventDetails
  private tx?: SubmittableExtrinsic<'promise'>

  private defaultOpeningParams: OpeningParams = {
    stake: MIN_APPLICATION_STAKE,
    unstakingPeriod: MIN_USTANKING_PERIOD,
    reward: new BN(10),
    metadata: {
      shortDescription: 'Test sudo lead opening',
      description: '# Test sudo lead opening',
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

  private getMetadata(): OpeningMetadata {
    const metadataObj = this.openingParams.metadata as Required<OpeningMetadata.AsObject>
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

  public getCreatedOpeningId(): OpeningId {
    if (!this.event) {
      throw new Error('Trying to get created opening id before it was created!')
    }
    return this.event.openingId
  }

  public constructor(
    api: Api,
    query: QueryNodeApi,
    group: WorkingGroupModuleName,
    openingParams?: Partial<OpeningParams>
  ) {
    super(api)
    this.query = query
    this.debug = Debugger('fixture:SudoCreateLeadOpeningFixture')
    this.group = group
    this.openingParams = _.merge(this.defaultOpeningParams, openingParams)
  }

  private assertOpeningMatchQueriedResult(
    eventDetails: OpeningAddedEventDetails,
    qOpening?: WorkingGroupOpening | null
  ) {
    if (!qOpening) {
      throw new Error('Query node: Opening not found')
    }
    assert.equal(qOpening.id, eventDetails.openingId.toString())
    assert.equal(qOpening.createdAtBlock, eventDetails.blockNumber)
    assert.equal(qOpening.group.name, this.group)
    assert.equal(qOpening.rewardPerBlock, this.openingParams.reward.toString())
    assert.equal(qOpening.type, WorkingGroupOpeningType.Leader)
    assert.equal(qOpening.status.__typename, 'OpeningStatusOpen')
    assert.equal(qOpening.stakeAmount, this.openingParams.stake.toString())
    assert.equal(qOpening.unstakingPeriod, this.openingParams.unstakingPeriod)
    // Metadata
    assert.equal(qOpening.metadata.shortDescription, this.openingParams.metadata.shortDescription)
    assert.equal(qOpening.metadata.description, this.openingParams.metadata.description)
    assert.equal(
      new Date(qOpening.metadata.expectedEnding).getTime(),
      this.openingParams.metadata.expectedEndingTimestamp
    )
    assert.equal(qOpening.metadata.hiringLimit, this.openingParams.metadata.hiringLimit)
    assert.equal(qOpening.metadata.applicationDetails, this.openingParams.metadata.applicationDetails)
    assert.deepEqual(
      qOpening.metadata.applicationFormQuestions
        .sort((a, b) => a.index - b.index)
        .map(({ question, type }) => ({
          question,
          type: queryNodeQuestionTypeToMetadataQuestionType(type),
        })),
      this.openingParams.metadata.applicationFormQuestionsList
    )
  }

  private assertQueriedOpeningAddedEventIsValid(
    eventDetails: OpeningAddedEventDetails,
    txHash: string,
    qEvent?: OpeningAddedEvent
  ) {
    if (!qEvent) {
      throw new Error('Query node: OpeningAdded event not found')
    }
    assert.equal(qEvent.event.inExtrinsic, txHash)
    assert.equal(qEvent.event.type, EventType.OpeningAdded)
    assert.equal(qEvent.group.name, this.group)
    assert.equal(qEvent.opening.id, eventDetails.openingId.toString())
  }

  async execute(): Promise<void> {
    this.tx = this.api.tx.sudo.sudo(
      this.api.tx[this.group].addOpening(
        Utils.metadataToBytes(this.getMetadata()),
        'Leader',
        { stake_amount: this.openingParams.stake, leaving_unstaking_period: this.openingParams.unstakingPeriod },
        this.openingParams.reward
      )
    )
    const sudoKey = await this.api.query.sudo.key()
    const result = await this.api.signAndSend(this.tx, sudoKey)
    this.event = await this.api.retrieveOpeningAddedEventDetails(result, this.group)

    this.debug(`Lead opening created (id: ${this.event.openingId.toString()})`)
  }

  async runQueryNodeChecks(): Promise<void> {
    await super.runQueryNodeChecks()
    const eventDetails = this.event!
    const tx = this.tx!
    // Query the opening
    await this.query.tryQueryWithTimeout(
      () => this.query.getOpeningById(eventDetails.openingId),
      (r) => this.assertOpeningMatchQueriedResult(eventDetails, r.data.workingGroupOpeningByUniqueInput)
    )
    // Query the event
    const qOpeningAddedEvent = await this.query.getOpeningAddedEvent(
      eventDetails.blockNumber,
      eventDetails.indexInBlock
    )
    this.assertQueriedOpeningAddedEventIsValid(eventDetails, tx.hash.toString(), qOpeningAddedEvent)
  }
}

export class ApplyOnOpeningHappyCaseFixture extends BaseFixture {
  private query: QueryNodeApi
  private group: WorkingGroupModuleName
  private debug: Debugger.Debugger
  private applicant: MemberContext
  private stakingAccount: string
  private openingId: OpeningId
  private openingMetadata: OpeningMetadata.AsObject

  private opening?: Opening
  private event?: AppliedOnOpeningEventDetails
  private tx?: SubmittableExtrinsic<'promise'>

  public constructor(
    api: Api,
    query: QueryNodeApi,
    group: WorkingGroupModuleName,
    applicant: MemberContext,
    stakingAccount: string,
    openingId: OpeningId,
    openingMetadata: OpeningMetadata.AsObject
  ) {
    super(api)
    this.query = query
    this.debug = Debugger('fixture:ApplyOnOpeningHappyCaseFixture')
    this.group = group
    this.applicant = applicant
    this.stakingAccount = stakingAccount
    this.openingId = openingId
    this.openingMetadata = openingMetadata
  }

  public getCreatedApplicationId(): ApplicationId {
    if (!this.event) {
      throw new Error('Trying to get created application id before the application was created!')
    }
    return this.event.applicationId
  }

  private getMetadata(): ApplicationMetadata {
    const metadata = new ApplicationMetadata()
    this.openingMetadata.applicationFormQuestionsList.forEach((question, i) => {
      metadata.addAnswers(`Answer ${i}`)
    })
    return metadata
  }

  private assertApplicationMatchQueriedResult(
    eventDetails: AppliedOnOpeningEventDetails,
    qApplication?: WorkingGroupApplication | null
  ) {
    if (!qApplication) {
      throw new Error('Application not found')
    }
    assert.equal(qApplication.id, eventDetails.applicationId.toString())
    assert.equal(qApplication.createdAtBlock, eventDetails.blockNumber)
    assert.equal(qApplication.opening.id, this.openingId.toString())
    assert.equal(qApplication.applicant.id, this.applicant.memberId.toString())
    assert.equal(qApplication.roleAccount, this.applicant.account)
    assert.equal(qApplication.rewardAccount, this.applicant.account)
    assert.equal(qApplication.stakingAccount, this.stakingAccount)
    assert.equal(qApplication.status.__typename, 'ApplicationStatusPending')
    assert.equal(qApplication.stake, eventDetails.params.stake_parameters.stake)

    const applicationMetadata = this.getMetadata()
    assert.deepEqual(
      qApplication.answers.map(({ question: { question }, answer }) => ({ question, answer })),
      this.openingMetadata.applicationFormQuestionsList.map(({ question }, index) => ({
        question,
        answer: applicationMetadata.getAnswersList()[index],
      }))
    )
  }

  private assertQueriedOpeningAddedEventIsValid(
    eventDetails: AppliedOnOpeningEventDetails,
    txHash: string,
    qEvent?: AppliedOnOpeningEvent
  ) {
    if (!qEvent) {
      throw new Error('Query node: AppliedOnOpening event not found')
    }
    assert.equal(qEvent.event.inExtrinsic, txHash)
    assert.equal(qEvent.event.type, EventType.AppliedOnOpening)
    assert.equal(qEvent.group.name, this.group)
    assert.equal(qEvent.opening.id, this.openingId.toString())
    assert.equal(qEvent.application.id, eventDetails.applicationId.toString())
  }

  async execute(): Promise<void> {
    this.opening = await this.api.getOpening(this.group, this.openingId)
    const stake = this.opening.stake_policy.stake_amount
    const stakingAccountBalance = await this.api.getBalance(this.stakingAccount)
    assert.isAbove(stakingAccountBalance.toNumber(), stake.toNumber())

    this.tx = this.api.tx[this.group].applyOnOpening({
      member_id: this.applicant.memberId,
      description: Utils.metadataToBytes(this.getMetadata()),
      opening_id: this.openingId,
      reward_account_id: this.applicant.account,
      role_account_id: this.applicant.account,
      stake_parameters: {
        stake,
        staking_account_id: this.stakingAccount,
      },
    })
    const txFee = await this.api.estimateTxFee(this.tx, this.applicant.account)
    await this.api.treasuryTransferBalance(this.applicant.account, txFee)
    const result = await this.api.signAndSend(this.tx, this.applicant.account)
    this.event = await this.api.retrieveAppliedOnOpeningEventDetails(result, this.group)

    this.debug(`Application submitted (id: ${this.event.applicationId.toString()})`)
  }

  async runQueryNodeChecks(): Promise<void> {
    await super.runQueryNodeChecks()
    const eventDetails = this.event!
    const tx = this.tx!
    // Query the application
    await this.query.tryQueryWithTimeout(
      () => this.query.getApplicationById(eventDetails.applicationId),
      (r) => this.assertApplicationMatchQueriedResult(eventDetails, r.data.workingGroupApplicationByUniqueInput)
    )
    // Query the event
    const qAppliedOnOpeningEvent = await this.query.getAppliedOnOpeningEvent(
      eventDetails.blockNumber,
      eventDetails.indexInBlock
    )
    this.assertQueriedOpeningAddedEventIsValid(eventDetails, tx.hash.toString(), qAppliedOnOpeningEvent)
  }
}

export class SudoFillLeadOpening extends BaseFixture {
  private query: QueryNodeApi
  private group: WorkingGroupModuleName
  private debug: Debugger.Debugger
  private openingId: OpeningId
  private acceptedApplicationIds: ApplicationId[]

  private acceptedApplications?: Application[]
  private applicationStakes?: BN[]
  private tx?: SubmittableExtrinsic<'promise'>
  private event?: OpeningFilledEventDetails

  public constructor(
    api: Api,
    query: QueryNodeApi,
    group: WorkingGroupModuleName,
    openingId: OpeningId,
    acceptedApplicationIds: ApplicationId[]
  ) {
    super(api)
    this.query = query
    this.debug = Debugger('fixture:SudoFillLeadOpening')
    this.group = group
    this.openingId = openingId
    this.acceptedApplicationIds = acceptedApplicationIds
  }

  async execute() {
    // Query the applications data
    this.acceptedApplications = await this.api.query[this.group].applicationById.multi(this.acceptedApplicationIds)
    this.applicationStakes = await Promise.all(
      this.acceptedApplications.map((a) =>
        this.api.getStakedBalance(a.staking_account_id, lockIdByWorkingGroup[this.group])
      )
    )
    // Fill the opening
    this.tx = this.api.tx.sudo.sudo(
      this.api.tx[this.group].fillOpening(
        this.openingId,
        new (JoyBTreeSet(ApplicationId))(registry, this.acceptedApplicationIds)
      )
    )
    const sudoKey = await this.api.query.sudo.key()
    const result = await this.api.signAndSend(this.tx, sudoKey)
    this.event = await this.api.retrieveOpeningFilledEventDetails(result, this.group)
  }

  private assertQueriedOpeningFilledEventIsValid(
    eventDetails: OpeningFilledEventDetails,
    txHash: string,
    qEvent?: OpeningFilledEvent
  ) {
    if (!qEvent) {
      throw new Error('Query node: OpeningFilledEvent not found')
    }
    assert.equal(qEvent.event.inExtrinsic, txHash)
    assert.equal(qEvent.event.type, EventType.OpeningFilled)
    assert.equal(qEvent.opening.id, this.openingId.toString())
    assert.equal(qEvent.group.name, this.group)
    this.acceptedApplicationIds.forEach((acceptedApplId, i) => {
      // Cannot use "applicationIdToWorkerIdMap.get" here,
      // it only works if the passed instance is identical to BTreeMap key instance (=== instead of .eq)
      const [, workerId] =
        Array.from(eventDetails.applicationIdToWorkerIdMap.entries()).find(([applicationId]) =>
          applicationId.eq(acceptedApplId)
        ) || []
      if (!workerId) {
        throw new Error(`WorkerId for application id ${acceptedApplId.toString()} not found in OpeningFilled event!`)
      }
      const qWorker = qEvent.workersHired.find((w) => w.id === workerId.toString())
      if (!qWorker) {
        throw new Error(`Query node: Worker not found in OpeningFilled.hiredWorkers (id: ${workerId.toString()})`)
      }
      this.assertHiredWorkerIsValid(
        eventDetails,
        this.acceptedApplicationIds[i],
        this.acceptedApplications![i],
        this.applicationStakes![i],
        qWorker
      )
    })
  }

  private assertHiredWorkerIsValid(
    eventDetails: OpeningFilledEventDetails,
    applicationId: ApplicationId,
    application: Application,
    applicationStake: BN,
    qWorker: Worker
  ) {
    assert.equal(qWorker.group.name, this.group)
    assert.equal(qWorker.membership.id, application.member_id.toString())
    assert.equal(qWorker.roleAccount, application.role_account_id.toString())
    assert.equal(qWorker.rewardAccount, application.reward_account_id.toString())
    assert.equal(qWorker.stakeAccount, application.staking_account_id.toString())
    assert.equal(qWorker.status.__typename, 'WorkerStatusActive')
    assert.equal(qWorker.isLead, true)
    assert.equal(qWorker.stake, applicationStake.toString())
    assert.equal(qWorker.hiredAtBlock, eventDetails.blockNumber)
    assert.equal(qWorker.application.id, applicationId.toString())
  }

  async runQueryNodeChecks(): Promise<void> {
    await super.runQueryNodeChecks()
    const eventDetails = this.event!
    const tx = this.tx!
    // Query the event and check event + hiredWorkers
    await this.query.tryQueryWithTimeout(
      () => this.query.getOpeningFilledEvent(eventDetails.blockNumber, eventDetails.indexInBlock),
      (event) => this.assertQueriedOpeningFilledEventIsValid(eventDetails, tx.hash.toString(), event)
    )

    // Check opening status
    const {
      data: { workingGroupOpeningByUniqueInput: qOpening },
    } = await this.query.getOpeningById(this.openingId)
    if (!qOpening) {
      throw new Error(`Query node: Opening ${this.openingId.toString()} not found!`)
    }
    assert.equal(qOpening.status.__typename, 'OpeningStatusFilled')

    // Check application statuses
    const acceptedApplications = this.acceptedApplicationIds.map((id) => {
      const application = qOpening.applications.find((a) => a.id === id.toString())
      if (!application) {
        throw new Error(`Application not found by id ${id.toString()} in opening ${qOpening.id}`)
      }
      assert.equal(application.status.__typename, 'ApplicationStatusAccepted')
      return application
    })

    qOpening.applications
      .filter((a) => !acceptedApplications.some((acceptedA) => acceptedA.id === a.id))
      .forEach((a) => assert.equal(a.status.__typename, 'ApplicationStatusRejected'))

    // TODO: LeadSet event
    // TODO: check WorkingGroup.lead
  }
}
