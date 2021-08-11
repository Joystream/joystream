import { JSONSchema4 } from 'json-schema'
import { strictObject } from './utils'
import winston from 'winston'

export const bytesizeUnits = ['B', 'K', 'M', 'G', 'T']
export const bytesizeRegex = new RegExp(`^[0-9]+(${bytesizeUnits.join('|')})$`)

export const configSchema: JSONSchema4 = {
  type: 'object',
  required: ['id', 'endpoints', 'directories', 'buckets', 'keys', 'port', 'storageLimit'],
  additionalProperties: false,
  properties: {
    id: { type: 'string' },
    endpoints: strictObject({
      queryNode: { type: 'string' },
      substrateNode: { type: 'string' },
      elasticSearch: { type: 'string' },
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
        elastic: { type: 'string', enum: Object.keys(winston.config.npm.levels) },
      },
    },
    storageLimit: { type: 'string', pattern: bytesizeRegex.source },
    port: { type: 'number' },
    keys: { type: 'array', items: { type: 'string' }, minItems: 1 },
    buckets: { type: 'array', items: { type: 'number' }, minItems: 1 },
  },
}

export default configSchema
