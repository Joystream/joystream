import BN from 'bn.js'
import { OpeningMetadata } from '@joystream/metadata-protobuf'
import { assert } from 'chai'
import { Api } from '../../Api'
import { MIN_APPLICATION_STAKE, MIN_USTANKING_PERIOD } from '../../consts'
import { OpeningMetadataFieldsFragment } from '../../graphql/generated/queries'
import { QueryNodeApi } from '../../QueryNodeApi'
import { WorkingGroupModuleName } from '../../types'
import { BaseWorkingGroupFixture } from './BaseWorkingGroupFixture'
import { queryNodeQuestionTypeToMetadataQuestionType } from './utils'
import _ from 'lodash'

export type OpeningParams = {
  stake: BN
  unstakingPeriod: number
  reward: BN
  metadata: OpeningMetadata.AsObject
}

export type UpcomingOpeningParams = OpeningParams & {
  expectedStartTs: number
}

export abstract class BaseCreateOpeningFixture extends BaseWorkingGroupFixture {
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
  ): void {
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
