import { JSONSchema4 } from 'json-schema'

export const familyMetadataSchema: JSONSchema4 = {
  type: 'object',
  additionalProperties: false,
  properties: {
    region: { type: 'string' },
    description: { type: 'string' },
    areas: {
      type: 'array',
      items: {
        type: 'object',
        oneOf: [
          // Continent:
          {
            additionalProperties: false,
            required: ['continentCode'],
            properties: { continentCode: { type: 'string', enum: ['AF', 'AN', 'AS', 'EU', 'NA', 'OC', 'SA'] } },
          },
          // Country:
          {
            additionalProperties: false,
            required: ['countryCode'],
            properties: { countryCode: { type: 'string', minLength: 2, maxLength: 2 } },
          },
          // Subdivision:
          {
            additionalProperties: false,
            required: ['subdivisionCode'],
            properties: { subdivisionCode: { type: 'string' } },
          },
          // Empty object (for clearing purposes):
          { additionalProperties: false },
        ],
      },
    },
    latencyTestTargets: {
      type: 'array',
      items: {
        type: 'string',
      },
    },
  },
}

export default familyMetadataSchema
