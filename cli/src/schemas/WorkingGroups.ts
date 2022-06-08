import { WorkingGroupOpeningInputParameters, WorkingGroupUpdateStatusInputParameters, JsonSchema } from '../Types'

export const WorkingGroupOpeningInputSchema: JsonSchema<WorkingGroupOpeningInputParameters> = {
  type: 'object',
  additionalProperties: false,
  required: ['stakingPolicy'],
  properties: {
    applicationDetails: {
      type: 'string',
    },
    expectedEndingTimestamp: {
      type: 'integer',
      minimum: Math.floor(Date.now() / 1000),
    },
    hiringLimit: {
      type: 'integer',
      minimum: 1,
    },
    title: {
      type: 'string',
    },
    shortDescription: {
      type: 'string',
    },
    description: {
      type: 'string',
    },
    applicationFormQuestions: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['question'],
        properties: {
          question: {
            type: 'string',
            minLength: 1,
          },
          type: {
            type: 'string',
            enum: ['TEXTAREA', 'TEXT'],
          },
        },
      },
    },
    stakingPolicy: {
      type: 'object',
      additionalProperties: false,
      required: ['amount', 'unstakingPeriod'],
      properties: {
        amount: { type: 'integer', minimum: 2000 },
        unstakingPeriod: { type: 'integer', minimum: 43200 },
      },
    },
    rewardPerBlock: {
      type: 'integer',
      minimum: 1,
    },
  },
}

export const WorkingGroupUpdateStatusInputSchema: JsonSchema<WorkingGroupUpdateStatusInputParameters> = {
  type: 'object',
  additionalProperties: false,
  properties: {
    about: { type: 'string' },
    description: { type: 'string' },
    status: { type: 'string' },
    statusMessage: { type: 'string' },
  },
}
