import { u32 } from '@polkadot/types';
import {
  AcceptingApplications,
  ActiveOpeningStage,
  OpeningStage,
} from "@joystream/types/hiring"
import { classifyOpeningStage } from './classifiers'

type Test = {
  description: string
  input: OpeningStage
  output: any//OpeningStageClassification
}

describe('publicToAddr', (): void => {

  const cases: Test[] = [
    {
      description: "Accepting applications",
      input: new OpeningStage({
        'Active': {
          stage: new ActiveOpeningStage({
            acceptingApplications: new AcceptingApplications({
              started_accepting_applicants_at_block: new u32(100),
            })
          })
        }
      }),
      output: {
        class: "active",
        starting_block: 100,
      },
    }
  ]

  cases.forEach((test: Test) => {
    it(test.description, (): void => {
      expect(classifyOpeningStage(test.input)).toEqual(test.output);
    });
  })
})
