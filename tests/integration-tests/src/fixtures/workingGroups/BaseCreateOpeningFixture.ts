import BN from 'bn.js'
import { IOpeningMetadata, OpeningMetadata } from '@joystream/metadata-protobuf'
import { assert } from 'chai'
import { Api } from '../../Api'
import { MIN_APPLICATION_STAKE, MIN_USTANKING_PERIOD } from '../../consts'
import { OpeningMetadataFieldsFragment } from '../../graphql/generated/queries'
import { QueryNodeApi } from '../../QueryNodeApi'
import { WorkingGroupModuleName } from '../../types'
import { BaseWorkingGroupFixture } from './BaseWorkingGroupFixture'
import { queryNodeQuestionTypeToMetadataQuestionType } from './utils'
import { Bytes } from '@polkadot/types'
import _ from 'lodash'
import { Utils } from '../../utils'
import moment from 'moment'
import { createType } from '@joystream/types'

export type OpeningParams = {
  stake: BN
  unstakingPeriod: number
  reward: BN
  metadata: IOpeningMetadata | string
  expectMetadataFailue?: boolean
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
    this.openingsParams = (openingsParams || [{}]).map((params) => ({ ...this.defaultOpeningParams, ...params }))
  }

  protected defaultOpeningParams: Omit<OpeningParams, 'metadata'> & { metadata: IOpeningMetadata } = {
    stake: MIN_APPLICATION_STAKE,
    unstakingPeriod: MIN_USTANKING_PERIOD,
    reward: new BN(10),
    metadata: {
      shortDescription: 'Test opening',
      description: '# Test opening',
      expectedEndingTimestamp: moment().unix() + 60,
      hiringLimit: 1,
      applicationDetails: '- This is automatically created opening, do not apply!',
      applicationFormQuestions: [
        { question: 'Question 1?', type: OpeningMetadata.ApplicationFormQuestion.InputType.TEXT },
        { question: 'Question 2?', type: OpeningMetadata.ApplicationFormQuestion.InputType.TEXTAREA },
      ],
    },
  }

  public getDefaultOpeningParams(): Omit<OpeningParams, 'metadata'> & { metadata: IOpeningMetadata } {
    return this.defaultOpeningParams
  }

  protected getMetadata(openingParams: OpeningParams): IOpeningMetadata | null {
    const metadataObjOrHex = openingParams.metadata
    if (typeof metadataObjOrHex === 'string') {
      try {
        return Utils.metadataFromBytes(OpeningMetadata, createType('Bytes', metadataObjOrHex))
      } catch (e) {
        if (!openingParams.expectMetadataFailue) {
          throw e
        }
        return null
      }
    }

    return metadataObjOrHex
  }

  protected getMetadataBytes(openingParams: OpeningParams): Bytes {
    const { metadata } = openingParams
    return typeof metadata === 'string'
      ? createType('Bytes', metadata)
      : Utils.metadataToBytes(OpeningMetadata, metadata)
  }

  protected getDefaultQueryNodeMetadata(isLeadOpening: boolean): IOpeningMetadata {
    return {
      shortDescription: `${_.startCase(this.group)} ${!isLeadOpening ? 'worker' : 'leader'} opening`,
      description: `Apply to this opening in order to be considered for ${_.startCase(this.group)} ${
        !isLeadOpening ? 'worker' : 'leader'
      } role!`,
      applicationDetails: `- Fill the application form`,
      applicationFormQuestions: [
        {
          question: 'What makes you a good candidate?',
          type: OpeningMetadata.ApplicationFormQuestion.InputType.TEXTAREA,
        },
      ],
    }
  }

  protected assertQueriedOpeningMetadataIsValid(
    qOpeningMeta: OpeningMetadataFieldsFragment,
    expectedMetadata: IOpeningMetadata | null
  ): void {
    Utils.assert(expectedMetadata, 'Expected metadata cannot be invalid!')
    assert.equal(qOpeningMeta.shortDescription, expectedMetadata.shortDescription)
    assert.equal(qOpeningMeta.description, expectedMetadata.description)
    assert.equal(new Date(qOpeningMeta.expectedEnding).getTime(), expectedMetadata.expectedEndingTimestamp)
    assert.equal(qOpeningMeta.hiringLimit, expectedMetadata.hiringLimit)
    assert.equal(qOpeningMeta.applicationDetails, expectedMetadata.applicationDetails)
    assert.deepEqual(
      qOpeningMeta.applicationFormQuestions
        .sort((a, b) => a.index - b.index)
        .map(({ question, type }) => ({
          question,
          type: queryNodeQuestionTypeToMetadataQuestionType(type),
        })),
      expectedMetadata.applicationFormQuestions
    )
  }
}
