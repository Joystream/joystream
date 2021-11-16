import { JSONSchema4 } from 'json-schema'
import winston from 'winston'
import { MAX_CONCURRENT_RESPONSE_TIME_CHECKS } from '../services/networking/NetworkingService'
import { objectSchema } from './utils'

export const bytesizeUnits = ['B', 'K', 'M', 'G', 'T']
export const bytesizeRegex = new RegExp(`^[0-9]+(${bytesizeUnits.join('|')})$`)

const logLevelSchema: JSONSchema4 = {
  description: 'Minimum level of logs sent to this output',
  type: 'string',
  enum: [...Object.keys(winston.config.npm.levels)],
}

export const configSchema: JSONSchema4 = objectSchema({
  '$id': 'https://joystream.org/schemas/argus/config',
  title: 'Distributor node configuration',
  description: 'Configuration schema for distirubtor CLI and node',
  required: ['id', 'endpoints', 'directories', 'limits', 'intervals', 'publicApi'],
  properties: {
    id: {
      type: 'string',
      description: 'Node identifier used when sending elasticsearch logs and exposed on /status endpoint',
      minLength: 1,
    },
    endpoints: objectSchema({
      description: 'Specifies external endpoints that the distributor node will connect to',
      properties: {
        queryNode: {
          description: 'Query node graphql server uri (for example: http://localhost:8081/graphql)',
          type: 'string',
        },
        joystreamNodeWs: {
          description: 'Joystream node websocket api uri (for example: ws://localhost:9944)',
          type: 'string',
        },
      },
      required: ['queryNode', 'joystreamNodeWs'],
    }),
    directories: objectSchema({
      description: "Specifies paths where node's data will be stored",
      properties: {
        assets: {
          description: 'Path to a directory where all the cached assets will be stored',
          type: 'string',
        },
        cacheState: {
          description:
            'Path to a directory where information about the current cache state will be stored (LRU-SP cache data, stored assets mime types etc.)',
          type: 'string',
        },
      },
      required: ['assets', 'cacheState'],
    }),
    logs: objectSchema({
      description: 'Specifies the logging configuration',
      properties: {
        file: objectSchema({
          title: 'File logging options',
          properties: {
            level: logLevelSchema,
            path: {
              description: 'Path where the logs will be stored (absolute or relative to config file)',
              type: 'string',
            },
            maxFiles: {
              description: 'Maximum number of log files to store',
              type: 'integer',
              minimum: 1,
            },
            maxSize: {
              description: 'Maximum size of a single log file in bytes',
              type: 'integer',
              minimum: 1024,
            },
            frequency: {
              description: 'The frequency of creating new log files (regardless of maxSize)',
              default: 'daily',
              type: 'string',
              enum: ['yearly', 'monthly', 'daily', 'hourly'],
            },
            archive: {
              description: 'Whether to archive old logs',
              default: false,
              type: 'boolean',
            },
          },
          required: ['level', 'path'],
        }),
        console: objectSchema({
          title: 'Console logging options',
          properties: { level: logLevelSchema },
          required: ['level'],
        }),
        elastic: objectSchema({
          title: 'Elasticsearch logging options',
          properties: {
            level: logLevelSchema,
            endpoint: {
              description: 'Elastichsearch endpoint to push the logs to (for example: http://localhost:9200)',
              type: 'string',
            },
          },
          required: ['level', 'endpoint'],
        }),
      },
      required: [],
    }),
    limits: objectSchema({
      description: 'Specifies node limits w.r.t. storage, outbound connections etc.',
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
          description:
            'Maximum number of total simultaneous outbound connections to storage node(s) (excluding proxy connections)',
          type: 'integer',
          minimum: 1,
        },
        outboundRequestsTimeoutMs: {
          description: 'Timeout for all outbound storage node http requests in miliseconds',
          type: 'integer',
          minimum: 1000,
        },
        pendingDownloadTimeoutSec: {
          description: 'Timeout for pending storage node downloads in seconds',
          type: 'integer',
          minimum: 60,
        },
        maxCachedItemSize: {
          description: 'Maximum size of a data object allowed to be cached by the node',
          type: 'string',
          pattern: bytesizeRegex.source,
        },
        dataObjectSourceByObjectIdTTL: {
          description:
            'TTL (in seconds) for dataObjectSourceByObjectId cache used when proxying objects of size greater than maxCachedItemSize to the right storage node.',
          default: 60,
          type: 'integer',
          minimum: 1,
        },
      },
      required: [
        'storage',
        'maxConcurrentStorageNodeDownloads',
        'maxConcurrentOutboundConnections',
        'outboundRequestsTimeoutMs',
        'pendingDownloadTimeoutSec',
      ],
    }),
    intervals: objectSchema({
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
      required: ['saveCacheState', 'checkStorageNodeResponseTimes', 'cacheCleanup'],
    }),
    publicApi: objectSchema({
      description: 'Public api configuration',
      properties: {
        port: { description: 'Distributor node public api port', type: 'integer', minimum: 0 },
      },
      required: ['port'],
    }),
    operatorApi: objectSchema({
      description: 'Operator api configuration',
      properties: {
        port: { description: 'Distributor node operator api port', type: 'integer', minimum: 0 },
        hmacSecret: { description: 'HMAC (HS256) secret key used for JWT authorization', type: 'string' },
      },
      required: ['port', 'hmacSecret'],
    }),
    keys: {
      description: 'Specifies the keys available within distributor node CLI.',
      type: 'array',
      items: {
        oneOf: [
          objectSchema({
            title: 'Substrate uri',
            description: "Keypair's substrate uri (for example: //Alice)",
            properties: {
              type: { type: 'string', enum: ['ed25519', 'sr25519', 'ecdsa'], default: 'sr25519' },
              suri: { type: 'string' },
            },
            required: ['suri'],
          }),
          objectSchema({
            title: 'Mnemonic phrase',
            description: 'Menomonic phrase',
            properties: {
              type: { type: 'string', enum: ['ed25519', 'sr25519', 'ecdsa'], default: 'sr25519' },
              mnemonic: { type: 'string' },
            },
            required: ['mnemonic'],
          }),
          objectSchema({
            title: 'JSON backup file',
            description: 'Path to JSON backup file from polkadot signer / polakdot/apps (relative to config file path)',
            properties: {
              keyfile: { type: 'string' },
            },
            required: ['keyfile'],
          }),
        ],
      },
      minItems: 1,
    },
    buckets: {
      description:
        'Set of bucket ids distributed by the node. If not specified, all buckets currently assigned to worker specified in `config.workerId` will be distributed.',
      title: 'Bucket ids',
      type: 'array',
      uniqueItems: true,
      items: { type: 'integer', minimum: 0 },
      minItems: 1,
    },
    workerId: {
      description: 'ID of the node operator (distribution working group worker)',
      type: 'integer',
      minimum: 0,
    },
  },
})

export default configSchema
