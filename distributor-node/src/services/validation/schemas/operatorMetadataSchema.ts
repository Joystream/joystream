import { JSONSchema4 } from 'json-schema'

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
    extra: { type: 'string' },
  },
}

export default operatorMetadataSchema
