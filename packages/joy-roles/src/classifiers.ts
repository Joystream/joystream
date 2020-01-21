import moment from 'moment';

import { 
	AcceptingApplications,
  ReviewPeriod,
  ActiveOpeningStageVariant, ActiveOpeningStageKeys, 
  Opening,
  OpeningStageKeys, 
} from "@joystream/types/hiring"

export enum OpeningState {
  WaitingToBegin = 0,
  AcceptingApplications,
  InReview,
  Complete,
  Cancelled,
}

export interface OpeningStageClassification {
  state: OpeningState
  starting_block: number
  starting_block_hash: string
  starting_time: Date
  review_end_time?: Date
  review_end_block?: number
}

export interface IBlockQueryer {
  blockHash(height: number): Promise<string>
  blockTimestamp(height: number): Promise<Date>
  expectedBlockTime: () => Promise<number>
}

export async function classifyOpeningStage(queryer: IBlockQueryer, opening: Opening): Promise<OpeningStageClassification> {
  switch (opening.stage.type) {
    case OpeningStageKeys.Active:
      return classifyActiveOpeningStage(
        opening,
        queryer,
        opening.stage.value as ActiveOpeningStageVariant,
    )
  }

  throw new Error('Unknown stage type: ' + opening.stage.type)
}

async function classifyActiveOpeningStage(
  opening: Opening,
  queryer: IBlockQueryer, 
  stage: ActiveOpeningStageVariant,
): Promise<OpeningStageClassification> {

  switch (stage.stage.type) {
    case ActiveOpeningStageKeys.AcceptingApplications:
      return classifyActiveOpeningStageAcceptingApplications(
        queryer,
        stage.stage.value as AcceptingApplications,
    )

    case ActiveOpeningStageKeys.ReviewPeriod:
      return classifyActiveOpeningStageReviewPeriod(
        opening,
        queryer,
        stage.stage.value as ReviewPeriod,
      )
  }

  throw new Error('Unknown active opening stage: ' + stage.stage.type)
}

async function classifyActiveOpeningStageAcceptingApplications(
  queryer: IBlockQueryer, 
  stage: AcceptingApplications,
): Promise<OpeningStageClassification> {
  const blockNumber = stage.started_accepting_applicants_at_block.toNumber()
  return {
    state: OpeningState.AcceptingApplications,
    starting_block: blockNumber,
    starting_block_hash: await queryer.blockHash(blockNumber),
    starting_time: await queryer.blockTimestamp(blockNumber),
  }
}

async function classifyActiveOpeningStageReviewPeriod(
  opening: Opening,
  queryer: IBlockQueryer, 
  stage: ReviewPeriod,
): Promise<OpeningStageClassification> {
  const blockNumber = stage.started_review_period_at_block.toNumber()
  const maxReviewLengthInBlocks = opening.max_review_period_length.toNumber()
  const [startDate, blockTime] = await Promise.all([
    queryer.blockTimestamp(blockNumber),
    queryer.expectedBlockTime(),
  ])
  const endDate = moment(startDate).add(maxReviewLengthInBlocks*blockTime, 's')

  return {
    state: OpeningState.InReview,
    starting_block: blockNumber,
    starting_block_hash: await queryer.blockHash(blockNumber),
    starting_time: startDate,
    review_end_time: endDate.toDate(),
    review_end_block: blockNumber + maxReviewLengthInBlocks,
  }
}

