import { JSONSchema4 } from 'json-schema'

export function strictObject(properties: Exclude<JSONSchema4['properties'], undefined>): JSONSchema4 {
  return {
    type: 'object',
    additionalProperties: false,
    required: Object.keys(properties),
    properties,
  }
}
