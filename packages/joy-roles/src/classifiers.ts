import { OpeningStage } from "@joystream/types/hiring"

export type OpeningStageClassification = {
	description: string
	class: string
	starting_block: number
}

export function classifyOpeningStage(stage: OpeningStage): OpeningStageClassification {
	// TODO! Implement this properly, based on enum values
	return {
		description: "Accepting applications",
		class: "active",
		starting_block: 100,
	}
}


