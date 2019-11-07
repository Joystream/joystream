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
}

export function classifyOpeningStage(stage: OpeningStage): OpeningStageClassification {
	// TODO! Implement this properly, based on enum values
	return {
		state: OpeningState.AcceptingApplications,
		starting_block: 100,
	}
}


