import { flags } from '@oclif/command'
import { createApp } from '../services/webApi/app'
import ApiCommandBase from '../command-base/ApiCommandBase'
import logger, { initElasticLogger } from '../services/logger'
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
      description: `Elasticsearch endpoint (e.g.: http://some.com:8081).
Log level could be set using the ELASTIC_LOG_LEVEL enviroment variable.
Supported values: warn, error, debug, info. Default:debug`,
    }),
    ...ApiCommandBase.flags,
  }

  async run(): Promise<void> {
    const { flags } = this.parse(Server)

    await recreateTempDirectory(flags.uploads, TempDirName)

    const logSource = `StorageProvider_${flags.worker}`

    if (fs.existsSync(flags.uploads)) {
      await loadDataObjectIdCache(flags.uploads, TempDirName)
    }

    if (!_.isEmpty(flags.elasticSearchEndpoint)) {
      initElasticLogger(logSource, flags.elasticSearchEndpoint ?? '')
    }

    logger.info(`Query node endpoint set: ${flags.queryNodeEndpoint}`)

    if (flags.dev) {
      await this.ensureDevelopmentChain()
    }

    const api = await this.getApi()

    if (flags.sync) {
      logger.info(`Synchronization enabled.`)
      setTimeout(
        async () =>
          runSyncWithInterval(
            api,
            flags.worker,
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

    const storageProviderAccount = this.getAccount(flags)

    try {
      const port = flags.port
      const workerId = flags.worker
      const maxFileSize = await api.consts.storage.maxDataObjectSize.toNumber()
      const tempFileUploadingDir = path.join(flags.uploads, TempDirName)
      logger.debug(`Max file size runtime parameter: ${maxFileSize}`)

      const app = await createApp({
        api,
        storageProviderAccount,
        workerId,
        maxFileSize,
        uploadsDir: flags.uploads,
        tempFileUploadingDir,
        process: this.config,
        queryNodeEndpoint: flags.queryNodeEndpoint,
        enableUploadingAuth: false,
        elasticSearchEndpoint: flags.elasticSearchEndpoint,
        logSource,
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
