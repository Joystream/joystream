import { OpeningStage } from "@joystream/types/hiring"

export enum OpeningState {
  WaitingToBegin = 0,
  AcceptingApplications,
  InReview,
  Complete,
  Cancelled,
}

export interface OpeningStageClassification {
  uri: string
  state: OpeningState
  starting_block: number
  starting_block_hash: string
  created_time: Date
  review_end_time?: Date
  review_end_block?: number
}

export function classifyOpeningStage(stage: OpeningStage): OpeningStageClassification {
  // TODO! Implement this properly, based on enum values
  return {
    uri: "",
    state: OpeningState.AcceptingApplications,
    starting_block: 100,
    starting_block_hash: "",
    created_time: new Date(),
  }
}


