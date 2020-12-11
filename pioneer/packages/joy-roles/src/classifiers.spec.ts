import { Opening } from '@joystream/types/hiring';

import { OpeningState,
  IBlockQueryer,
  classifyOpeningStage, OpeningStageClassification } from './classifiers';
import { createType } from '@joystream/types';

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

  expectedBlockTime (): number {
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
        opening: createType('Opening', {
          created: 100,
          stage: createType('OpeningStage', {
            WaitingToBegin: {
              begins_at_block: 100
            }
          }),
          max_review_period_length: 100,
          human_readable_text: ''
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
        opening: createType('Opening', {
          created: 100,
          stage: createType('OpeningStage', {
            Active: {
              stage: createType('ActiveOpeningStage', {
                AcceptingApplications: {
                  started_accepting_applicants_at_block: 100
                }
              })
            }
          }),
          max_review_period_length: 100,
          human_readable_text: ''
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
        opening: createType('Opening', {
          created: 100,
          stage: createType('OpeningStage', {
            Active: {
              stage: createType('ActiveOpeningStage', {
                ReviewPeriod: {
                  started_accepting_applicants_at_block: 100,
                  started_review_period_at_block: 100
                }
              })
            }
          }),
          max_review_period_length: 14400,
          human_readable_text: ''
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
