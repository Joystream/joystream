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
  WorkingGroupApplication,
  WorkingGroupOpening,
  WorkingGroupOpeningType,
} from '../QueryNodeApiSchema.generated'
import { ApplicationMetadata, OpeningMetadata } from '@joystream/metadata-protobuf'
import { WorkingGroupModuleName, MemberContext, AppliedOnOpeningEventDetails, OpeningAddedEventDetails } from '../types'
import { OpeningId } from '@joystream/types/working-group'
import { Utils } from '../utils'
import _ from 'lodash'

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
  private createdOpeningId?: OpeningId

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
    if (!this.createdOpeningId) {
      throw new Error('Trying to get created opening id before it was created!')
    }
    return this.createdOpeningId
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
    const tx = this.api.tx.sudo.sudo(
      this.api.tx[this.group].addOpening(
        Utils.metadataToBytes(this.getMetadata()),
        'Leader',
        { stake_amount: this.openingParams.stake, leaving_unstaking_period: this.openingParams.unstakingPeriod },
        this.openingParams.reward
      )
    )
    const sudoKey = await this.api.query.sudo.key()
    const result = await this.api.signAndSend(tx, sudoKey)
    const eventDetails = await this.api.retrieveOpeningAddedEventDetails(result, this.group)

    this.createdOpeningId = eventDetails.openingId

    this.debug(`Lead opening created (id: ${eventDetails.openingId.toString()})`)

    // Query-node part:
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
    const opening = await this.api.getOpening(this.group, this.openingId)
    const stake = opening.stake_policy.stake_amount
    const stakingAccountBalance = await this.api.getBalance(this.stakingAccount)
    assert.isAbove(stakingAccountBalance.toNumber(), stake.toNumber())

    const tx = this.api.tx[this.group].applyOnOpening({
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
    const txFee = await this.api.estimateTxFee(tx, this.applicant.account)
    await this.api.treasuryTransferBalance(this.applicant.account, txFee)
    const result = await this.api.signAndSend(tx, this.applicant.account)
    const eventDetails = await this.api.retrieveAppliedOnOpeningEventDetails(result, this.group)

    this.debug(`Application submitted (id: ${eventDetails.applicationId.toString()})`)

    // Query-node part:
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
