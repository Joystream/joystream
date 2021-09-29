import { JSONSchema4 } from 'json-schema'
import { strictObject } from './utils'
import winston from 'winston'

export const bytesizeUnits = ['B', 'K', 'M', 'G', 'T']
export const bytesizeRegex = new RegExp(`^[0-9]+(${bytesizeUnits.join('|')})$`)

export const configSchema: JSONSchema4 = {
  type: 'object',
  required: ['id', 'endpoints', 'directories', 'buckets', 'keys', 'port', 'workerId', 'limits', 'intervals'],
  additionalProperties: false,
  properties: {
    id: { type: 'string' },
    endpoints: {
      type: 'object',
      additionalProperties: false,
      required: ['queryNode', 'substrateNode'],
      properties: {
        queryNode: { type: 'string' },
        substrateNode: { type: 'string' },
        elasticSearch: { type: 'string' },
      },
    },
    directories: strictObject({
      data: { type: 'string' },
      cache: { type: 'string' },
      logs: { type: 'string' },
    }),
    log: {
      type: 'object',
      additionalProperties: false,
      properties: {
        file: { type: 'string', enum: [...Object.keys(winston.config.npm.levels), 'off'] },
        console: { type: 'string', enum: [...Object.keys(winston.config.npm.levels), 'off'] },
        elastic: { type: 'string', enum: [...Object.keys(winston.config.npm.levels), 'off'] },
      },
    },
    limits: strictObject({
      storage: { type: 'string', pattern: bytesizeRegex.source },
      maxConcurrentStorageNodeDownloads: { type: 'integer', minimum: 1 },
      maxConcurrentOutboundConnections: { type: 'integer', minimum: 1 },
      outboundRequestsTimeout: { type: 'integer', minimum: 1 },
    }),
    intervals: strictObject({
      saveCacheState: { type: 'integer', minimum: 1 },
      checkStorageNodeResponseTimes: { type: 'integer', minimum: 1 },
      cacheCleanup: { type: 'integer', minimum: 1 },
    }),
    port: { type: 'integer', minimum: 0 },
    keys: { type: 'array', items: { type: 'string' }, minItems: 1 },
    buckets: {
      oneOf: [
        { type: 'array', items: { type: 'integer', minimum: 0 }, minItems: 1 },
        { type: 'string', enum: ['all'] },
      ],
    },
    workerId: { type: 'integer', minimum: 0 },
  },
}

export default configSchema
