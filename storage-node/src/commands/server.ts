import { flags } from '@oclif/command'
import { createApp } from '../services/webApi/app'
import ApiCommandBase from '../command-base/ApiCommandBase'
import logger, { initNewLogger, DatePatternByFrequency, Frequency } from '../services/logger'
import { loadDataObjectIdCache } from '../services/caching/localDataObjects'
import { ApiPromise } from '@polkadot/api'
import { performSync, TempDirName } from '../services/sync/synchronizer'
import sleep from 'sleep-promise'
import rimraf from 'rimraf'
import _ from 'lodash'
import path from 'path'
import { promisify } from 'util'
import ExitCodes from './../command-base/ExitCodes'
import fs from 'fs'
import { getStorageBucketIdsByWorkerId } from '../services/sync/storageObligations'
import { PalletStorageStorageBucketRecord } from '@polkadot/types/lookup'
import { Option } from '@polkadot/types-codec'
import { QueryNodeApi } from '../services/queryNode/api'
import { KeyringPair } from '@polkadot/keyring/types'
import { customFlags } from '../command-base/CustomFlags'
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
      default: 1,
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
    elasticSearchIndex: flags.string({
      required: false,
      env: 'ELASTIC_INDEX',
      description: 'Elasticsearch index name.',
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
    ...ApiCommandBase.flags,
  }

  async run(): Promise<void> {
    const { flags } = this.parse(Server)

    const logSource = `StorageProvider_${flags.worker}`

    if (!_.isEmpty(flags.elasticSearchEndpoint) || !_.isEmpty(flags.logFilePath)) {
      initNewLogger({
        elasticSearchlogSource: logSource,
        elasticSearchEndpoint: flags.elasticSearchEndpoint,
        elasticSearchIndex: flags.elasticSearchIndex,
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

    const workerId = flags.worker

    if (!(await verifyWorkerId(api, workerId))) {
      logger.error(`workerId ${workerId} does not exist in the storage working group`)
      this.exit(ExitCodes.InvalidWorkerId)
    }

    const qnApi = new QueryNodeApi(flags.queryNodeEndpoint)

    const selectedBucketsAndAccounts = await constructBucketToAddressMapping(api, qnApi, workerId, flags.buckets)

    if (!selectedBucketsAndAccounts.length) {
      this.error('No buckets to serve! Cannot proceed')
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

    await recreateTempDirectory(flags.uploads, TempDirName)

    if (fs.existsSync(flags.uploads)) {
      await loadDataObjectIdCache(flags.uploads, TempDirName)
    }

    if (flags.dev) {
      await this.ensureDevelopmentChain()
    }

    if (flags.sync) {
      logger.info(`Synchronization enabled.`)
      setTimeout(
        // eslint-disable-next-line @typescript-eslint/no-misused-promises
        async () =>
          runSyncWithInterval(
            api,
            flags.worker,
            selectedBuckets,
            flags.queryNodeEndpoint,
            flags.uploads,
            TempDirName,
            flags.syncWorkersNumber,
            flags.syncWorkersTimeout,
            flags.syncInterval
          ),
        0
      )
    }

    try {
      const port = flags.port
      const maxFileSize = await api.consts.storage.maxDataObjectSize.toNumber()
      const tempFileUploadingDir = path.join(flags.uploads, TempDirName)
      logger.debug(`Max file size runtime parameter: ${maxFileSize}`)

      const app = await createApp({
        api,
        qnApi,
        bucketKeyPairs,
        operatorRoleKey,
        workerId,
        maxFileSize,
        uploadsDir: flags.uploads,
        tempFileUploadingDir,
        process: this.config,
        enableUploadingAuth,
        downloadBuckets: selectedBuckets,
        uploadBuckets: writableBuckets,
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
 * Run the data syncronization process.
 *
 * @param workerId - worker ID
 * @param queryNodeUrl - Query Node for data fetching
 * @param uploadsDir - data uploading directory
 * @param tempDirectory - temporary data uploading directory
 * @param syncWorkersNumber - defines a number of the async processes for sync
 * @param syncWorkersTimeout - downloading asset timeout
 * @param syncIntervalMinutes - defines an interval between sync runs
 *
 * @returns void promise.
 */
async function runSyncWithInterval(
  api: ApiPromise,
  workerId: number,
  buckets: string[],
  queryNodeUrl: string,
  uploadsDirectory: string,
  tempDirectory: string,
  syncWorkersNumber: number,
  syncWorkersTimeout: number,
  syncIntervalMinutes: number
) {
  const sleepInteval = syncIntervalMinutes * 60 * 1000
  while (true) {
    logger.info(`Sync paused for ${syncIntervalMinutes} minute(s).`)
    await sleep(sleepInteval)
    try {
      logger.info(`Resume syncing....`)
      await performSync(
        api,
        workerId,
        buckets,
        syncWorkersNumber,
        syncWorkersTimeout,
        queryNodeUrl,
        uploadsDirectory,
        tempDirectory
      )
    } catch (err) {
      logger.error(`Critical sync error: ${err}`)
    }
  }
}

/**
 * Removes and recreates the temporary directory from the uploading directory.
 * All files in the temp directory are deleted.
 *
 * @param uploadsDirectory - data uploading directory
 * @param tempDirName - temporary directory name within the uploading directory
 * @returns void promise.
 */
async function recreateTempDirectory(uploadsDirectory: string, tempDirName: string): Promise<void> {
  try {
    const tempFileUploadingDir = path.join(uploadsDirectory, tempDirName)

    logger.info(`Removing temp directory ...`)
    const rimrafAsync = promisify(rimraf)
    await rimrafAsync(tempFileUploadingDir)

    logger.info(`Creating temp directory ...`)
    await fsPromises.mkdir(tempFileUploadingDir)
  } catch (err) {
    logger.error(`Temp directory IO error: ${err}`)
  }
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
      bucketIds.map(
        async (bucketId) =>
          [bucketId, await api.query.storage.storageBucketById(bucketId)] as [
            string,
            Option<PalletStorageStorageBucketRecord>
          ]
      )
    )
  )
    .filter(([bucketId]) => bucketsToServe.length === 0 || bucketsToServe.includes(parseInt(bucketId)))
    .filter(([, optBucket]) => optBucket.isSome && optBucket.unwrap().operatorStatus.isStorageWorker)
    .map(([bucketId, optBucket]) => [bucketId, optBucket.unwrap()])

  return buckets.map(([bucketId, bucket]) => [bucketId, bucket.operatorStatus.asStorageWorker[1].toString()])
}
