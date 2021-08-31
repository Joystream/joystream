import { JSONSchema4 } from 'json-schema'
import { strictObject } from './utils'

export const familyMetadataSchema: JSONSchema4 = {
  type: 'object',
  additionalProperties: false,
  properties: {
    region: { type: 'string' },
    description: { type: 'string' },
    boundary: {
      type: 'array',
      items: strictObject({
        latitude: { type: 'number', minimum: -180, maximum: 180 },
        longitude: { type: 'number', minimum: -180, maximum: 180 },
      }),
    },
  },
}

export default familyMetadataSchema
