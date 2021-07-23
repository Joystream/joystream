import { JSONSchema4 } from 'json-schema'
import { strictObject } from './utils'
import winston from 'winston'

export const configSchema: JSONSchema4 = {
  type: 'object',
  required: ['endpoints', 'directories', 'buckets', 'keys', 'port'],
  additionalProperties: false,
  properties: {
    endpoints: strictObject({
      queryNode: { type: 'string' },
      substrateNode: { type: 'string' },
    }),
    directories: strictObject({
      data: { type: 'string' },
      cache: { type: 'string' },
      logs: { type: 'string' },
    }),
    log: {
      type: 'object',
      additionalProperties: false,
      properties: {
        file: { type: 'string', enum: Object.keys(winston.config.npm.levels) },
        console: { type: 'string', enum: Object.keys(winston.config.npm.levels) },
      },
    },
    port: { type: 'number' },
    keys: { type: 'array', items: { type: 'string' }, minItems: 1 },
    buckets: { type: 'array', items: { type: 'number' }, minItems: 1 },
  },
}

export default configSchema
