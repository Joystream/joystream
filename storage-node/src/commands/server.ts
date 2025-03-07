import { flags } from '@oclif/command'
import { ApiPromise } from '@polkadot/api'
import { KeyringPair } from '@polkadot/keyring/types'
import _ from 'lodash'
import path from 'path'
import sleep from 'sleep-promise'
import { v4 as uuidv4 } from 'uuid'
import ApiCommandBase from '../command-base/ApiCommandBase'
import { customFlags } from '../command-base/CustomFlags'
import { addDataObjectIdToCache, loadDataObjectIdCache } from '../services/caching/localDataObjects'
import logger, { DatePatternByFrequency, Frequency, initNewLogger } from '../services/logger'
import { QueryNodeApi } from '../services/queryNode/api'
import { AcceptPendingObjectsService } from '../services/sync/acceptPendingObjects'
import {
  MAXIMUM_QN_LAGGING_THRESHOLD,
  MINIMUM_REPLICATION_THRESHOLD,
  performCleanup,
} from '../services/sync/cleanupService'
import { constructBucketToAddressMapping } from '../services/sync/storageObligations'
import { PendingDirName, TempDirName, performSync } from '../services/sync/synchronizer'
import { downloadEvents } from '../services/sync/tasks'
import { createApp } from '../services/webApi/app'
import ExitCodes from './../command-base/ExitCodes'
import { createDirectory } from '../services/helpers/filesystem'
import { verifyWorkerId } from '../services/runtime/queries'

/**
 * CLI command:
 * Starts the storage node server.
 *
 * @remarks
 * Shell command: "server"
 */
export default class Server extends ApiCommandBase {
  static description = 'Starts the storage node server.'

  static flags = {
    worker: flags.integer({
      char: 'w',
      required: true,
      description: 'Storage provider worker ID',
    }),
    buckets: customFlags.integerArr({
      char: 'b',
      description:
        'Comma separated list of bucket IDs to service. Buckets that are not assigned to worker are ignored. If not specified all buckets will be serviced.',
      default: [],
    }),
    uploads: flags.string({
      char: 'd',
      required: true,
      description: 'Data uploading directory (absolute path).',
    }),
    tempFolder: flags.string({
      description:
        'Directory to store tempory files during sync (absolute path).\nIf not specified a subfolder under the uploads directory will be used.',
    }),
    pendingFolder: flags.string({
      description:
        'Directory to store pending files which are being uploaded (absolute path).\nIf not specified a subfolder under the uploads directory will be used.',
    }),
    port: flags.integer({
      char: 'o',
      required: true,
      description: 'Server port.',
    }),
    sync: flags.boolean({
      char: 's',
      description: 'Enable data synchronization.',
      default: false,
    }),
    syncInterval: flags.integer({
      char: 'i',
      description: 'Interval between synchronizations (in minutes)',
      default: 20,
    }),
    syncRetryInterval: flags.integer({
      description: 'Interval before retrying failed synchronization run (in minutes)',
      default: 3,
    }),
    syncBatchSize: flags.integer({
      description: 'Maximum number of objects to process in a single batch during synchronization.',
      default: 10_000,
    }),
    cleanup: flags.boolean({
      char: 'c',
      description: 'Enable cleanup/pruning of no-longer assigned assets.',
      // Setting `env` key doesn't work for boolean flags: https://github.com/oclif/core/issues/487
      default: process.env.CLEANUP === 'true',
    }),
    cleanupBatchSize: flags.integer({
      description: 'Maximum number of objects to process in a single batch during cleanup.',
      default: 10_000,
    }),
    cleanupInterval: flags.integer({
      char: 'i',
      description: 'Interval between periodic cleanup actions (in minutes)',
      default: 360,
      env: 'CLEANUP_INTERVAL',
    }),
    cleanupWorkersNumber: flags.integer({
      required: false,
      description: 'Cleanup workers number (max async operations in progress).',
      default: 100,
    }),
    storageSquidEndpoint: flags.string({
      char: 'q',
      required: true,
      default: 'http://localhost:4352/graphql',
      description: 'Storage Squid graphql server endpoint (e.g.: http://some.com:4352/graphql)',
    }),
    syncWorkersNumber: flags.integer({
      char: 'r',
      required: false,
      description: 'Sync workers number (max async operations in progress).',
      default: 20,
    }),
    syncWorkersTimeout: flags.integer({
      char: 't',
      required: false,
      description: 'Asset downloading timeout for the syncronization (in minutes).',
      default: 30,
    }),
    elasticSearchEndpoint: flags.string({
      char: 'e',
      required: false,
      env: 'ELASTIC_ENDPOINT',
      description: `Elasticsearch endpoint (e.g.: http://some.com:8081).
Log level could be set using the ELASTIC_LOG_LEVEL environment variable.
Supported values: warn, error, debug, info. Default:debug`,
    }),
    elasticSearchIndexPrefix: flags.string({
      required: false,
      env: 'ELASTIC_INDEX_PREFIX',
      description:
        'Elasticsearch index prefix. Node ID will be appended to the prefix. Default: logs-colossus. Can be passed through ELASTIC_INDEX_PREFIX environment variable.',
    }),
    elasticSearchUser: flags.string({
      dependsOn: ['elasticSearchEndpoint', 'elasticSearchPassword'],
      env: 'ELASTIC_USER',
      description:
        'Elasticsearch user for basic authentication. Can be passed through ELASTIC_USER environment variable.',
    }),
    elasticSearchPassword: flags.string({
      dependsOn: ['elasticSearchEndpoint', 'elasticSearchUser'],
      env: 'ELASTIC_PASSWORD',
      description:
        'Elasticsearch password for basic authentication. Can be passed through ELASTIC_PASSWORD environment variable.',
    }),
    logFilePath: flags.string({
      char: 'l',
      required: false,
      description: `Absolute path to the rolling log files.`,
    }),
    logMaxFileNumber: flags.integer({
      char: 'n',
      required: false,
      default: 7,
      description: `Maximum rolling log files number.`,
    }),
    logMaxFileSize: flags.integer({
      char: 'x',
      required: false,
      default: 50000000,
      description: `Maximum rolling log files size in bytes.`,
    }),
    logFileChangeFrequency: flags.enum({
      char: 'z',
      description: `Log files update frequency.`,
      options: Object.keys(DatePatternByFrequency),
      default: 'daily',
      required: false,
    }),
    maxBatchTxSize: flags.integer({
      description: 'Maximum number of `accept_pending_data_objects` in a batch transactions.',
      default: 20,
      required: false,
    }),
    ...ApiCommandBase.flags,
  }

  async run(): Promise<void> {
    const { flags } = this.parse(Server)

    const api = await this.getApi()

    if (flags.dev) {
      await this.ensureDevelopmentChain()
    }

    if (flags.logFilePath && path.relative(flags.logFilePath, flags.uploads) === '') {
      this.error('Paths for logs and uploads must be unique.')
    }

    if (!_.isEmpty(flags.elasticSearchEndpoint) || !_.isEmpty(flags.logFilePath)) {
      initNewLogger({
        elasticSearchlogSource: `StorageProvider_${flags.worker}`,
        elasticSearchEndpoint: flags.elasticSearchEndpoint,
        elasticSearchIndexPrefix: flags.elasticSearchIndexPrefix,
        elasticSearchUser: flags.elasticSearchUser,
        elasticSearchPassword: flags.elasticSearchPassword,
        filePath: flags.logFilePath,
        maxFileNumber: flags.logMaxFileNumber,
        maxFileSize: flags.logMaxFileSize,
        fileFrequency: flags.logFileChangeFrequency as Frequency, // type checked in the flags.enum
      })
    }

    logger.info(`Storage Squid endpoint set: ${flags.storageSquidEndpoint}`)

    const workerId = flags.worker

    if (!(await verifyWorkerId(api, workerId))) {
      logger.error(`workerId ${workerId} does not exist in the storage working group`)
      this.exit(ExitCodes.InvalidWorkerId)
    }

    const qnApi = new QueryNodeApi(flags.storageSquidEndpoint)

    const selectedBucketsAndAccounts = await constructBucketToAddressMapping(api, qnApi, workerId, flags.buckets)

    if (!selectedBucketsAndAccounts.length) {
      logger.warn('No buckets to serve. Server will be idle!')
    }

    const keystoreAddresses = this.getUnlockedAccounts()
    const bucketsWithKeysInKeyring = selectedBucketsAndAccounts.filter(([bucketId, address]) => {
      if (!keystoreAddresses.includes(address)) {
        this.warn(`Missing transactor key for bucket ${bucketId}`)
        return false
      }
      return true
    })

    const bucketKeyPairs = new Map<string, KeyringPair>(
      bucketsWithKeysInKeyring.map(([bucketId, address]) => [bucketId, this.getKeyringPair(address)])
    )

    const writableBuckets = bucketsWithKeysInKeyring.map(([bucketId]) => bucketId)
    const selectedBuckets = selectedBucketsAndAccounts.map(([bucketId]) => bucketId)

    if (writableBuckets.length !== selectedBuckets.length) {
      logger.warn(`Only subset of buckets will process uploads!`)
    }

    logger.info(`Buckets synced and served: ${selectedBuckets}`)
    logger.info(`Buckets accepting uploads: ${writableBuckets}`)

    if (!flags.tempFolder) {
      logger.warn(
        'You did not specify a path to the temporary directory. ' +
          'A temp folder under the uploads folder will be used. ' +
          'In a future release passing an absolute path to a temporary directory with the ' +
          '"tempFolder" argument will be required.'
      )
    }

    if (!flags.pendingFolder) {
      logger.warn(
        'You did not specify a path to the pending directory. ' +
          'A pending folder under the uploads folder will be used. ' +
          'In a future release passing an absolute path to a pending directory with the ' +
          '"pendingFolder" argument will be required.'
      )
    }

    const tempFolder = flags.tempFolder || path.join(flags.uploads, TempDirName)
    const pendingFolder = flags.pendingFolder || path.join(flags.uploads, PendingDirName)

    if (path.relative(tempFolder, flags.uploads) === '') {
      this.error('Paths for temporary and uploads folders must be unique.')
    }

    if (path.relative(pendingFolder, flags.uploads) === '') {
      this.error('Paths for pending and uploads folders must be unique.')
    }

    await createDirectory(flags.uploads)
    await loadDataObjectIdCache(flags.uploads)

    await createDirectory(tempFolder)
    await createDirectory(pendingFolder)

    const X_HOST_ID = uuidv4()

    const acceptPendingObjectsService = await AcceptPendingObjectsService.create(
      api,
      qnApi,
      workerId,
      flags.uploads,
      pendingFolder,
      bucketKeyPairs,
      writableBuckets,
      flags.maxBatchTxSize,
      6000 // Every block
    )

    // Don't run sync job if no buckets selected, to prevent purging
    // any assets.
    if (flags.sync && selectedBuckets.length) {
      logger.info(`Synchronization is Enabled.`)
      downloadEvents.on('success', (id) => {
        addDataObjectIdToCache(id)
      })
      setTimeout(
        // eslint-disable-next-line @typescript-eslint/no-misused-promises
        async () =>
          runSyncWithInterval(
            selectedBuckets,
            qnApi,
            flags.uploads,
            tempFolder,
            flags.syncWorkersNumber,
            flags.syncWorkersTimeout,
            flags.syncInterval,
            flags.syncRetryInterval,
            flags.syncBatchSize,
            X_HOST_ID
          ),
        0
      )
    } else {
      logger.warn(`Synchronization is Disabled.`)
    }

    // Don't run cleanup job if no buckets selected, to prevent purging
    // any assets.
    if (flags.cleanup && selectedBuckets.length) {
      logger.info(`Cleanup service is Enabled.`)
      setTimeout(
        // eslint-disable-next-line @typescript-eslint/no-misused-promises
        async () =>
          runCleanupWithInterval(
            selectedBuckets,
            api,
            qnApi,
            flags.uploads,
            flags.cleanupWorkersNumber,
            flags.cleanupInterval,
            flags.cleanupBatchSize,
            X_HOST_ID
          ),
        0
      )
    } else {
      logger.warn(`Cleanup service is Disabled.`)
    }

    try {
      const port = flags.port
      const maxFileSize = await api.consts.storage.maxDataObjectSize.toNumber()
      logger.debug(`Max file size runtime parameter: ${maxFileSize}`)

      const app = await createApp({
        api,
        qnApi,
        bucketKeyPairs,
        workerId,
        maxFileSize,
        uploadsDir: flags.uploads,
        tempFileUploadingDir: tempFolder,
        pendingDataObjectsDir: pendingFolder,
        acceptPendingObjectsService,
        process: this.config,
        downloadBuckets: selectedBuckets,
        uploadBuckets: writableBuckets,
        sync: { enabled: flags.sync, interval: flags.syncInterval },
        cleanup: {
          enabled: flags.cleanup,
          interval: flags.cleanupInterval,
          maxQnLaggingThresholdInBlocks: MAXIMUM_QN_LAGGING_THRESHOLD,
          minReplicationThresholdForPruning: MINIMUM_REPLICATION_THRESHOLD,
        },
        x_host_id: X_HOST_ID,
      })
      const server = app.listen(port, () => logger.info(`Listening on http://localhost:${port}`))

      // INFO: https://nodejs.org/dist/latest-v18.x/docs/api/http.html#serverrequesttimeout
      // Set the server request timeout to 0 to disable it. This was default behaviour pre Node.js 18.x
      server.requestTimeout = 0
    } catch (err) {
      logger.error(`Server error: ${err}`)
      this.exit(ExitCodes.ServerError)
    }
  }

  // Override exiting.
  /* eslint-disable @typescript-eslint/no-empty-function */
  async finally(): Promise<void> {}
}

/**
 * Run the data synchronization process.
 *
 * @param api - runtime Api promise
 * @param workerId - worker ID
 * @param buckets - Selected storage buckets
 * @param qnApi - Query Node API
 * @param uploadsDir - data uploading directory
 * @param tempDirectory - temporary data uploading directory
 * @param syncWorkersNumber - defines a number of the async processes for sync
 * @param syncWorkersTimeout - downloading asset timeout
 * @param syncIntervalMinutes - defines an interval between sync runs
 * @param syncRetryIntervalMinutes - defines an interval before retrying sync run after critical error
 *
 * @returns void promise.
 */
async function runSyncWithInterval(
  buckets: string[],
  qnApi: QueryNodeApi,
  uploadsDirectory: string,
  tempDirectory: string,
  syncWorkersNumber: number,
  syncWorkersTimeout: number,
  syncIntervalMinutes: number,
  syncRetryIntervalMinutes: number,
  syncBatchSize: number,
  hostId: string
) {
  const sleepInterval = syncIntervalMinutes * 60 * 1000
  const retrySleepInterval = syncRetryIntervalMinutes * 60 * 1000
  while (true) {
    try {
      logger.info(`Resume syncing....`)
      await performSync(
        buckets,
        syncWorkersNumber,
        syncWorkersTimeout,
        qnApi,
        uploadsDirectory,
        tempDirectory,
        syncBatchSize,
        hostId
      )
      logger.info(`Sync run complete. Next run in ${syncIntervalMinutes} minute(s).`)
      await sleep(sleepInterval)
    } catch (err) {
      logger.error(`Critical sync error: ${err}`)
      logger.info(`Will retry in ${syncRetryIntervalMinutes} minute(s)`)
      await sleep(retrySleepInterval)
    }
  }
}

/**
 * Run the data cleanup process.
 *
 * @param workerId - worker ID
 * @param buckets - Selected storage buckets
 * @param qnApi - Query Node API
 * @param uploadsDir - data uploading directory
 * @param syncWorkersNumber - defines a number of the async processes for cleanup/pruning
 * @param cleanupIntervalMinutes - defines an interval between cleanup/pruning runs
 *
 * @returns void promise.
 */
async function runCleanupWithInterval(
  buckets: string[],
  api: ApiPromise,
  qnApi: QueryNodeApi,
  uploadsDirectory: string,
  syncWorkersNumber: number,
  cleanupIntervalMinutes: number,
  cleanupBatchSize: number,
  hostId: string
) {
  const sleepInterval = cleanupIntervalMinutes * 60 * 1000
  while (true) {
    logger.info(`Cleanup paused for ${cleanupIntervalMinutes} minute(s).`)
    await sleep(sleepInterval)
    try {
      logger.info(`Resume cleanup....`)
      await performCleanup(buckets, syncWorkersNumber, api, qnApi, uploadsDirectory, cleanupBatchSize, hostId)
    } catch (err) {
      logger.error(`Critical cleanup error: ${err}`)
    }
  }
}
