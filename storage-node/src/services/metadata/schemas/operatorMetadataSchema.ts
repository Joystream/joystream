import { JSONSchema4 } from 'json-schema'

// Storage node operator metadata JSON schema.
export const operatorMetadataSchema: JSONSchema4 = {
  type: 'object',
  additionalProperties: false,
  properties: {
    endpoint: { type: 'string' },
    location: {
      type: 'object',
      additionalProperties: false,
      properties: {
        countryCode: { type: 'string' },
        city: { type: 'string' },
        coordinates: {
          type: 'object',
          additionalProperties: false,
          properties: {
            latitude: { type: 'number', minimum: -180, maximum: 180 },
            longitude: { type: 'number', minimum: -180, maximum: 180 },
          },
        },
      },
    },
    operationalStatus: {
      oneOf: [
        {
          type: 'object',
          properties: {
            normal: {
              type: 'object',
              properties: {
                rationale: {
                  type: 'string',
                },
              },
            },
          },
          required: ['normal'],
          additionalProperties: false,
        },
        {
          type: 'object',
          properties: {
            noService: {
              type: 'object',
              properties: {
                rationale: {
                  type: 'string',
                },
              },
            },
          },
          required: ['noService'],
          additionalProperties: false,
        },
        {
          type: 'object',
          properties: {
            noServiceFrom: {
              type: 'object',
              properties: {
                rationale: {
                  type: 'string',
                },
                from: {
                  type: 'string',
                },
              },
              required: ['from'],
            },
          },
          required: ['noServiceFrom'],
          additionalProperties: false,
        },
        {
          type: 'object',
          properties: {
            noServiceUntil: {
              type: 'object',
              properties: {
                rationale: {
                  type: 'string',
                },
                from: {
                  type: 'string',
                },
                until: {
                  type: 'string',
                },
              },
              required: ['until'],
            },
          },
          required: ['noServiceUntil'],
          additionalProperties: false,
        },
      ],
    },
    extra: { type: 'string' },
  },
}

export default operatorMetadataSchema
