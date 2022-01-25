import { BountyInputParameters, JsonSchema } from '../Types'

export const BountyInputSchema: JsonSchema<BountyInputParameters> = {
  type: 'object',
  additionalProperties: false,
  properties: {
    title: { type: 'string' },
    description: { type: 'string' },
    discussionThread: { type: 'number' },
    bannerImageUri: { type: 'string' },
    oracle: { type: 'number' },
    contractTypeInput: { type: 'array' },
    cherry: { type: 'number' },
    entrantStake: { type: 'number' },
    fundingType: {
      type: 'object',
      additionalProperties: false,
      properties: {
        minFundingAmount: { type: 'number' },
        maxFundingAmount: { type: 'number' },
        fundingPeriod: { type: 'number' },
        target: { type: 'number' },
      },
    },
    workPeriod: { type: 'number' },
    judgementPeriod: { type: 'number' },
  },
}
