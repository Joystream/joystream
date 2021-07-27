import { JSONSchema4 } from 'json-schema'
import { strictObject } from './utils'

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
        coordinates: strictObject({
          latitude: { type: 'number' },
          longitude: { type: 'number' },
        }),
      },
    },
    extra: { type: 'string' },
  },
}

export default operatorMetadataSchema
