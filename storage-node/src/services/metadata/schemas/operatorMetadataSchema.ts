import { JSONSchema4 } from 'json-schema'
import { NODE_OPERATIONAL_STATUS_OPTIONS } from './types'

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
      type: 'object',
      properties: {
        status: { type: 'string', enum: [...NODE_OPERATIONAL_STATUS_OPTIONS] },
        noServiceFrom: { type: 'string', format: 'date-time' },
        noServiceTo: { type: 'string', format: 'date-time' },
        rationale: { type: 'string' },
      },
    },
    extra: { type: 'string' },
  },
}

export default operatorMetadataSchema
