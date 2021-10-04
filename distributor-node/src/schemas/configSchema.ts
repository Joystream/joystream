import { JSONSchema4 } from 'json-schema'
import winston from 'winston'
import { MAX_CONCURRENT_RESPONSE_TIME_CHECKS } from '../services/networking/NetworkingService'

export const bytesizeUnits = ['B', 'K', 'M', 'G', 'T']
export const bytesizeRegex = new RegExp(`^[0-9]+(${bytesizeUnits.join('|')})$`)

export const configSchema: JSONSchema4 = {
  title: 'Distributor node configuration',
  description: 'Configuration schema for distirubtor CLI and node',
  type: 'object',
  required: ['endpoints', 'directories', 'buckets', 'keys', 'port', 'workerId', 'limits', 'intervals'],
  additionalProperties: false,
  properties: {
    endpoints: {
      type: 'object',
      description: 'Specifies external endpoints that the distributor node will connect to',
      additionalProperties: false,
      required: ['queryNode', 'substrateNode'],
      properties: {
        queryNode: {
          description: 'Query node graphql server uri (for example: http://localhost:8081/graphql)',
          type: 'string',
        },
        joystreamNodeWs: {
          description: 'Joystream node websocket api uri (for example: ws://localhost:9944)',
          type: 'string',
        },
        elasticSearch: {
          description: 'Elasticsearch uri used for submitting the distributor node logs (if enabled via `log.elastic`)',
          type: 'string',
        },
      },
    },
    directories: {
      type: 'object',
      required: ['assets', 'state'],
      additionalProperties: false,
      description: "Specifies paths where node's data will be stored",
      assets: {
        description: 'Path to a directory where all the cached assets will be stored',
        type: 'string',
      },
      cacheState: {
        description:
          'Path to a directory where information about the current cache state will be stored (LRU-SP cache data, stored assets mime types etc.)',
        type: 'string',
      },
      logs: {
        description: 'Path to a directory where logs will be stored if logging to a file was enabled (via `log.file`).',
        type: 'string',
      },
    },
    log: {
      type: 'object',
      additionalProperties: false,
      description: 'Specifies minimum log levels by supported log outputs',
      properties: {
        file: {
          description: 'Minimum level of logs written to a file specified in `directories.logs`',
          type: 'string',
          enum: [...Object.keys(winston.config.npm.levels), 'off'],
        },
        console: {
          description: 'Minimum level of logs outputted to a console',
          type: 'string',
          enum: [...Object.keys(winston.config.npm.levels), 'off'],
        },
        elastic: {
          description: 'Minimum level of logs sent to elasticsearch endpoint specified in `endpoints.elasticSearch`',
          type: 'string',
          enum: [...Object.keys(winston.config.npm.levels), 'off'],
        },
      },
    },
    limits: {
      type: 'object',
      required: [
        'storage',
        'maxConcurrentStorageNodeDownloads',
        'maxConcurrentOutboundConnections',
        'outboundRequestsTimeout',
      ],
      description: 'Specifies node limits w.r.t. storage, outbound connections etc.',
      additionalProperties: false,
      properties: {
        storage: {
          description: 'Maximum total size of all (cached) assets stored in `directories.assets`',
          type: 'string',
          pattern: bytesizeRegex.source,
        },
        maxConcurrentStorageNodeDownloads: {
          description: 'Maximum number of concurrent downloads from the storage node(s)',
          type: 'integer',
          minimum: 1,
        },
        maxConcurrentOutboundConnections: {
          description: 'Maximum number of total simultaneous outbound connections to storage node(s)',
          type: 'integer',
          minimum: 1,
        },
        outboundRequestsTimeout: {
          description: 'Timeout for all outbound storage node http requests in miliseconds',
          type: 'integer',
          minimum: 1,
        },
      },
    },
    intervals: {
      type: 'object',
      required: ['saveCacheState', 'checkStorageNodeResponseTimes', 'cacheCleanup'],
      additionalProperties: false,
      description: 'Specifies how often periodic tasks (for example cache cleanup) are executed by the node.',
      properties: {
        saveCacheState: {
          description:
            'How often, in seconds, will the cache state be saved in `directories.state`. ' +
            'Independently of the specified interval, the node will always try to save cache state before exiting.',
          type: 'integer',
          minimum: 1,
        },
        checkStorageNodeResponseTimes: {
          description:
            'How often, in seconds, will the distributor node attempt to send requests to all current storage node endpoints ' +
            'in order to check how quickly they respond. ' +
            `The node will never make more than ${MAX_CONCURRENT_RESPONSE_TIME_CHECKS} such requests concurrently.`,
          type: 'integer',
          minimum: 1,
        },
        cacheCleanup: {
          description:
            'How often, in seconds, will the distributor node fetch data about all its distribution obligations from the query node ' +
            'and remove all the no-longer assigned data objects from local storage and cache state',
          type: 'integer',
          minimum: 1,
        },
      },
    },
    port: { description: 'Distributor node http server port', type: 'integer', minimum: 0 },
    keys: {
      description:
        'Specifies the keys to use within distributor node CLI. Must be provided in form of substrate uris (ie.: //Alice)',
      type: 'array',
      items: { type: 'string' },
      minItems: 1,
    },
    buckets: {
      description: 'Specifies the buckets distributed by the node',
      oneOf: [
        {
          description: 'List of distribution bucket ids',
          type: 'array',
          items: { type: 'integer', minimum: 0 },
          minItems: 1,
        },
        {
          description: 'Distribute all buckets assigned to worker specified in `workerId`',
          type: 'string',
          enum: ['all'],
        },
      ],
    },
    workerId: {
      description: 'ID of the node operator (distribution working group worker)',
      type: 'integer',
      minimum: 0,
    },
  },
}

export default configSchema
