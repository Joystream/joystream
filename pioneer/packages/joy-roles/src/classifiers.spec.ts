import { Option, Text, u32 } from '@polkadot/types';
import {
  AcceptingApplications,
  ActiveOpeningStage,
  ApplicationRationingPolicy,
  StakingPolicy,
  Opening, OpeningStage,
  ReviewPeriod
} from '@joystream/types/hiring';

import {
  OpeningState,
  IBlockQueryer,
  classifyOpeningStage, OpeningStageClassification
} from './classifiers';

class MockBlockQueryer {
  hash: string
  timestamp: Date

  constructor (
    hash = 'somehash',
    timestamp: Date = new Date()
  ) {
    this.hash = hash;
    this.timestamp = timestamp;
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  async blockHash (height: number): Promise<string> {
    return this.hash;
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  async blockTimestamp (height: number): Promise<Date> {
    return this.timestamp;
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  async expectedBlockTime (): Promise<number> {
    return 6;
  }
}

type Test = {
  description: string;
  input: {
    queryer: IBlockQueryer;
    opening: Opening;
  };
  output: OpeningStageClassification;
}

describe('hiring.Opening-> OpeningStageClassification', (): void => {
  const now = new Date('2020-01-23T11:47:04.433Z');

  const cases: Test[] = [
    {
      description: 'WaitingToBegin',
      input: {
        opening: new Opening({
          created: new u32(100),
          stage: new OpeningStage({
            WaitingToBegin: {
              begins_at_block: new u32(100)
            }
          }),
          max_review_period_length: new u32(100),
          application_rationing_policy: new Option(ApplicationRationingPolicy),
          application_staking_policy: new Option(StakingPolicy),
          role_staking_policy: new Option(StakingPolicy),
          human_readable_text: new Text()
        }),
        queryer: new MockBlockQueryer('somehash', now)
      },
      output: {
        state: OpeningState.WaitingToBegin,
        starting_block: 100,
        starting_block_hash: 'somehash',
        starting_time: now
      }
    },
    {
      description: 'Accepting applications',
      input: {
        opening: new Opening({
          created: new u32(100),
          stage: new OpeningStage({
            Active: {
              stage: new ActiveOpeningStage({
                acceptingApplications: new AcceptingApplications({
                  started_accepting_applicants_at_block: new u32(100)
                })
              })
            }
          }),
          max_review_period_length: new u32(100),
          application_rationing_policy: new Option(ApplicationRationingPolicy),
          application_staking_policy: new Option(StakingPolicy),
          role_staking_policy: new Option(StakingPolicy),
          human_readable_text: new Text()
        }),
        queryer: new MockBlockQueryer('somehash', now)
      },
      output: {
        state: OpeningState.AcceptingApplications,
        starting_block: 100,
        starting_block_hash: 'somehash',
        starting_time: now
      }
    },
    {
      description: 'In review period',
      input: {
        opening: new Opening({
          created: new u32(100),
          stage: new OpeningStage({
            Active: {
              stage: new ActiveOpeningStage({
                reviewPeriod: new ReviewPeriod({
                  started_accepting_applicants_at_block: new u32(100),
                  started_review_period_at_block: new u32(100)
                })
              })
            }
          }),
          max_review_period_length: new u32(14400),
          application_rationing_policy: new Option(ApplicationRationingPolicy),
          application_staking_policy: new Option(StakingPolicy),
          role_staking_policy: new Option(StakingPolicy),
          human_readable_text: new Text()
        }),
        queryer: new MockBlockQueryer('somehash', now)
      },
      output: {
        state: OpeningState.InReview,
        starting_block: 100,
        starting_block_hash: 'somehash',
        starting_time: now,
        review_end_block: 14500,
        review_end_time: new Date('2020-01-24T11:47:04.433Z')
      }
    }
    /*
     * jest is having trouble with the enum type
    {
      description: "Deactivated: cancelled",
      input: {
        opening: new Opening({
          created: new u32(100),
          stage: new OpeningStage({
            'Active': {
              stage: new ActiveOpeningStage({
                reviewPeriod: new Deactivated({
                  cause: new OpeningDeactivationCause(
        OpeningDeactivationCauseKeys.CancelledBeforeActivation,
                  ),
                  deactivated_at_block: new u32(123),
                  started_accepting_applicants_at_block: new u32(100),
                  started_review_period_at_block: new Option(u32, 100),
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
        queryer: new MockBlockQueryer("somehash", now),
      },
      output: {
        state: OpeningState.Cancelled,
        starting_block: 123,
        starting_block_hash: "somehash",
        starting_time: now,
      },
    },
    */
  ];

  cases.forEach((test: Test) => {
    it(test.description, async () => {
      expect(
        await classifyOpeningStage(
          test.input.queryer,
          test.input.opening
        )
      ).toEqual(
        test.output
      );
    });
  });
});
