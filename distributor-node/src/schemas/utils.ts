import { JSONSchema4 } from 'json-schema'

export function objectSchema<P extends NonNullable<JSONSchema4['properties']>>(props: {
  $id?: string
  title?: string
  description?: string
  properties: P
  required: Array<keyof P & string>
}): JSONSchema4 {
  return {
    type: 'object',
    additionalProperties: false,
    ...props,
  }
}
