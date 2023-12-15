import { flags } from '@oclif/command'
import { ApiPromise } from '@polkadot/api'
import sleep from 'sleep-promise'
import _ from 'lodash'
import path from 'path'
import fs from 'fs'
import { PalletStorageStorageBucketRecord } from '@polkadot/types/lookup'
import { KeyringPair } from '@polkadot/keyring/types'
import { customFlags } from '../command-base/CustomFlags'
import { loadDataObjectIdCache } from '../services/caching/localDataObjects'
import logger, { DatePatternByFrequency, Frequency, initNewLogger } from '../services/logger'
import { QueryNodeApi } from '../services/queryNode/api'
import {
  MAXIMUM_QN_LAGGING_THRESHOLD,
  MINIMUM_REPLICATION_THRESHOLD,
  performCleanup,
} from '../services/sync/cleanupService'
import { AcceptPendingObjectsService } from '../services/sync/acceptPendingObjects'
import { getStorageBucketIdsByWorkerId } from '../services/sync/storageObligations'
import { PendingDirName, performSync, TempDirName } from '../services/sync/synchronizer'
import { createApp } from '../services/webApi/app'
import ExitCodes from './../command-base/ExitCodes'
import ApiCommandBase from '../command-base/ApiCommandBase'

const fsPromises = fs.promises

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
        'Directory to store tempory files during sync and upload (absolute path).\n,Temporary directory (absolute path). If not specified a subfolder under the uploads directory will be used.',
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
    cleanup: flags.boolean({
      char: 'c',
      description: 'Enable cleanup/pruning of no-longer assigned assets.',
      default: false,
    }),
    cleanupInterval: flags.integer({
      char: 'i',
      description: 'Interval between periodic cleanup actions (in minutes)',
      default: 360,
    }),
    queryNodeEndpoint: flags.string({
      char: 'q',
      required: true,
      default: 'http://localhost:8081/graphql',
      description: 'Query node endpoint (e.g.: http://some.com:8081/graphql)',
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
Log level could be set using the ELASTIC_LOG_LEVEL enviroment variable.
Supported values: warn, error, debug, info. Default:debug`,
    }),
    elasticSearchIndexPrefix: flags.string({
      required: false,
      env: 'ELASTIC_INDEX_PREFIX',
      description: 'Elasticsearch index prefix. Node ID will be appended to the prefix. Default: logs-colossus',
    }),
    elasticSearchUser: flags.string({
      dependsOn: ['elasticSearchEndpoint', 'elasticSearchPassword'],
      env: 'ELASTIC_USER',
      description: 'Elasticsearch user for basic authentication.',
    }),
    elasticSearchPassword: flags.string({
      dependsOn: ['elasticSearchEndpoint', 'elasticSearchUser'],
      env: 'ELASTIC_PASSWORD',
      description: 'Elasticsearch password for basic authentication.',
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
      default: 10,
      required: false,
    }),
    ...ApiCommandBase.flags,
  }

  async run(): Promise<void> {
    const { flags } = this.parse(Server)

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

    logger.info(`Query node endpoint set: ${flags.queryNodeEndpoint}`)

    const api = await this.getApi()

    if (flags.dev) {
      await this.ensureDevelopmentChain()
    }

    const workerId = flags.worker

    if (!(await verifyWorkerId(api, workerId))) {
      logger.error(`workerId ${workerId} does not exist in the storage working group`)
      this.exit(ExitCodes.InvalidWorkerId)
    }

    const qnApi = new QueryNodeApi(flags.queryNodeEndpoint)

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

    // when enabling upload auth ensure the keyring has the operator role key and set it here.
    const enableUploadingAuth = false
    const operatorRoleKey = undefined

    const tempFolder = flags.tempFolder || path.join(flags.uploads, TempDirName)

    // Prevent tempFolder and uploadsFolder being at the same location. This is a simple check
    // and doesn't deal with possibility that different path can point to the same location. eg. symlinks or
    // a volume being mounted on multiple paths
    if (tempFolder === flags.uploads) {
      this.error('Please use unique paths for temp and uploads folder paths.')
    }

    await createDirectory(flags.uploads)
    await loadDataObjectIdCache(flags.uploads)

    await createDirectory(tempFolder)

    const pendingDataObjectsDir = path.join(flags.uploads, PendingDirName)

    const acceptPendingObjectsService = await AcceptPendingObjectsService.create(
      api,
      qnApi,
      workerId,
      flags.uploads,
      pendingDataObjectsDir,
      bucketKeyPairs,
      writableBuckets,
      flags.maxBatchTxSize,
      6000 // Every block
    )

    // Don't run sync job if no buckets selected, to prevent purging
    // any assets.
    if (flags.sync && selectedBuckets.length) {
      logger.info(`Synchronization is Enabled.`)
      setTimeout(
        // eslint-disable-next-line @typescript-eslint/no-misused-promises
        async () =>
          runSyncWithInterval(
            api,
            flags.worker,
            selectedBuckets,
            qnApi,
            flags.uploads,
            tempFolder,
            flags.syncWorkersNumber,
            flags.syncWorkersTimeout,
            flags.syncInterval,
            flags.syncRetryInterval
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
            flags.worker,
            selectedBuckets,
            qnApi,
            flags.uploads,
            flags.syncWorkersNumber,
            flags.cleanupInterval
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
        operatorRoleKey,
        workerId,
        maxFileSize,
        uploadsDir: flags.uploads,
        tempFileUploadingDir: tempFolder,
        pendingDataObjectsDir,
        acceptPendingObjectsService,
        process: this.config,
        enableUploadingAuth,
        downloadBuckets: selectedBuckets,
        uploadBuckets: writableBuckets,
        sync: { enabled: flags.sync, interval: flags.syncInterval },
        cleanup: {
          enabled: flags.cleanup,
          interval: flags.cleanupInterval,
          maxQnLaggingThresholdInBlocks: MAXIMUM_QN_LAGGING_THRESHOLD,
          minReplicationThresholdForPruning: MINIMUM_REPLICATION_THRESHOLD,
        },
      })
      logger.info(`Listening on http://localhost:${port}`)
      app.listen(port)
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
  api: ApiPromise,
  workerId: number,
  buckets: string[],
  qnApi: QueryNodeApi,
  uploadsDirectory: string,
  tempDirectory: string,
  syncWorkersNumber: number,
  syncWorkersTimeout: number,
  syncIntervalMinutes: number,
  syncRetryIntervalMinutes: number
) {
  const sleepInterval = syncIntervalMinutes * 60 * 1000
  const retrySleepInterval = syncRetryIntervalMinutes * 60 * 1000
  while (true) {
    try {
      logger.info(`Resume syncing....`)
      await performSync(
        api,
        workerId,
        buckets,
        syncWorkersNumber,
        syncWorkersTimeout,
        qnApi,
        uploadsDirectory,
        tempDirectory
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
  workerId: number,
  buckets: string[],
  qnApi: QueryNodeApi,
  uploadsDirectory: string,
  syncWorkersNumber: number,
  cleanupIntervalMinutes: number
) {
  const sleepInterval = cleanupIntervalMinutes * 60 * 1000
  while (true) {
    logger.info(`Cleanup paused for ${cleanupIntervalMinutes} minute(s).`)
    await sleep(sleepInterval)
    try {
      logger.info(`Resume cleanup....`)
      await performCleanup(workerId, buckets, syncWorkersNumber, qnApi, uploadsDirectory)
    } catch (err) {
      logger.error(`Critical cleanup error: ${err}`)
    }
  }
}

/**
 * Creates a directory recursivly. Like `mkdir -p`
 *
 * @param tempDirName - full path to temporary directory
 * @returns void promise.
 */
async function createDirectory(dirName: string): Promise<void> {
  logger.info(`Creating directory ${dirName}`)
  await fsPromises.mkdir(dirName, { recursive: true })
}

async function verifyWorkerId(api: ApiPromise, workerId: number): Promise<boolean> {
  const worker = await api.query.storageWorkingGroup.workerById(workerId)
  return worker.isSome
}

async function constructBucketToAddressMapping(
  api: ApiPromise,
  qnApi: QueryNodeApi,
  workerId: number,
  bucketsToServe: number[]
): Promise<[string, string][]> {
  const bucketIds = await getStorageBucketIdsByWorkerId(qnApi, workerId)
  const buckets: [string, PalletStorageStorageBucketRecord][] = (
    await Promise.all(
      bucketIds.map(async (bucketId) => [bucketId, await api.query.storage.storageBucketById(bucketId)] as const)
    )
  )
    .filter(([bucketId]) => bucketsToServe.length === 0 || bucketsToServe.includes(parseInt(bucketId)))
    .filter(([, optBucket]) => optBucket.isSome && optBucket.unwrap().operatorStatus.isStorageWorker)
    .map(([bucketId, optBucket]) => [bucketId, optBucket.unwrap()])

  return buckets.map(([bucketId, bucket]) => [bucketId, bucket.operatorStatus.asStorageWorker[1].toString()])
}
