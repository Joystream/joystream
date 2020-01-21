import { Option, Text, u32 } from '@polkadot/types';
import {
  AcceptingApplications,
  ActiveOpeningStage,
  ApplicationRationingPolicy,
  StakingPolicy,
  Opening, OpeningStage,
} from "@joystream/types/hiring"

import { 
	OpeningState,
	IBlockQueryer,
	classifyOpeningStage 
} from './classifiers'

class mockBlockQueryer {
  hash: string
  timestamp: Date

  constructor(
    hash: string = "somehash",
      timestamp: Date = new Date(),
  ){
      this.hash = hash
      this.timestamp = timestamp
  }

  async blockHash(height: number): Promise<string> {
	  return this.hash
  }

  async blockTimestamp(height: number): Promise<Date> {
	  return this.timestamp
  }

  async expectedBlockTime(): Promise<number>  {
	  return 6
  }
}

type Test = {
  description: string
  input: {
    queryer: IBlockQueryer, 
    opening: Opening,
  }
  output: any//OpeningStageClassification
}

describe('higing.OpeningStage -> OpeningStageClassification', (): void => {
  const now = new Date()

  const cases: Test[] = [
    {
      description: "Accepting applications",
      input: {
        opening: new Opening({
          created: new u32(100),
          stage: new OpeningStage({
            'Active': {
              stage: new ActiveOpeningStage({
                acceptingApplications: new AcceptingApplications({
                  started_accepting_applicants_at_block: new u32(100),
                })
              })
            }
          }),
          max_review_period_length: new u32(100),
          application_rationing_policy: new Option(ApplicationRationingPolicy),
          application_staking_policy: new Option(StakingPolicy),
          role_staking_policy: new Option(StakingPolicy),
          human_readable_text: new Text(),
        }),
        queryer: new mockBlockQueryer("somehash", now),
      },
      output: {
        state: OpeningState.AcceptingApplications,
        starting_block: 100,
        starting_block_hash: "somehash",
        starting_time: now,
      },
    }
  ]

  cases.forEach((test: Test) => {
    it(test.description, async () => {
      expect(
        await classifyOpeningStage(
          test.input.queryer, 
          test.input.opening,
        )
      ).toEqual(test.output);
    });
  })
})
