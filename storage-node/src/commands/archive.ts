import { flags } from '@oclif/command'
import { ApiPromise } from '@polkadot/api'
import _ from 'lodash'
import path from 'path'
import { v4 as uuidv4 } from 'uuid'
import ApiCommandBase from '../command-base/ApiCommandBase'
import { customFlags } from '../command-base/CustomFlags'
import logger, { DatePatternByFrequency, Frequency, initNewLogger } from '../services/logger'
import { QueryNodeApi } from '../services/queryNode/api'
import { constructBucketToAddressMapping } from '../services/sync/storageObligations'
import { verifyWorkerId } from '../services/runtime/queries'
import { ArchiveService } from '../services/archive/ArchiveService'
import ExitCodes from './../command-base/ExitCodes'
import { IConnectionHandler } from '../services/s3/IConnectionHandler'
import { AwsConnectionHandler } from '../services/s3/AwsConnectionHandler'
import { createDirectory } from '../services/helpers/filesystem'
import { promises as fsp } from 'fs'
import { CompressionAlgorithm, CompressionLevel, getCompressionService } from '../services/archive/compression'
import { StorageClass } from '@aws-sdk/client-s3'

/**
 * CLI command:
 * Starts running in a write-only archive mode (no external API exposed).
 * Downloads, compresses and uploads all assigned data objects to a specified S3 bucket.
 *
 * @remarks
 * Shell command: "archive"
 */
export default class Archive extends ApiCommandBase {
  static description =
    'Starts running in a write-only, archive mode (no external API exposed). ' +
    'Downloads, compresses and uploads all assigned data objects to a specified S3 bucket.'

  static flags = {
    worker: flags.integer({
      char: 'w',
      required: true,
      description: 'Storage provider worker ID',
      env: 'WORKER_ID',
    }),
    buckets: customFlags.integerArr({
      char: 'b',
      description:
        'Comma separated list of bucket IDs to sync. Buckets that are not assigned to worker are ignored.\n' +
        'If not specified all buckets belonging to the worker will be synced.',
      default: process.env.BUCKETS ? _.uniq(process.env.BUCKETS.split(',').map((b) => parseInt(b))) : [],
    }),
    uploadQueueDir: flags.string({
      description:
        'Directory to store fully downloaded data objects before compressing them and uploading to S3 (absolute path).',
      required: true,
      env: 'UPLOAD_QUEUE_DIR',
    }),
    uploadQueueDirSizeLimitMB: flags.integer({
      description:
        'Limits the total size of files stored in upload queue directory (in MB). ' +
        'Download of the new objects may be slowed down in order to try to prevent exceeding this limit. ' +
        'WARNING: To leave a safe margin of error (for compression etc.), it should be set to ~50% of available disk space.',
      required: true,
      env: 'UPLOAD_QUEUE_DIR_SIZE_LIMIT',
      default: 20_000,
    }),
    tmpDownloadDir: flags.string({
      description: 'Directory to store temporary data (downloads in progress) during sync (absolute path).',
      required: true,
      env: 'TMP_DOWNLOAD_DIR',
    }),
    localCountTriggerThreshold: flags.integer({
      required: false,
      description: 'Compress and upload all local data objects to S3 if the number of them reaches this threshold.',
      env: 'LOCAL_COUNT_TRIGGER_THRESHOLD',
    }),
    localSizeTriggerThresholdMB: flags.integer({
      description:
        'Compress and upload all local data objects to S3 if the combined size of them reaches this threshold (in MB)',
      env: 'LOCAL_SIZE_TRIGGER_THRESHOLD_MB',
      default: 10_000,
    }),
    localAgeTriggerThresholdMinutes: flags.integer({
      description:
        'Compress and upload all local data objects to S3 if the oldest of them was downloaded more than X minutes ago',
      env: 'LOCAL_AGE_TRIGGER_THRESHOLD_MINUTES',
      default: 24 * 60,
    }),
    archiveFileSizeLimitMB: flags.integer({
      description: 'Try to avoid creating archive files larger than this size limit (in MB) unless unaviodable.',
      default: 1_000,
    }),
    archiveTrackfileBackupFreqMinutes: flags.integer({
      description:
        'Specifies how frequently the archive tracking file (containing information about archive files content)' +
        " should be uploaded to S3 (in case it's changed).",
      env: 'ARCHIVE_TRACKFILE_BACKUP_FREQ_MINUTES',
      default: 60,
    }),
    compressionAlgorithm: flags.enum<CompressionAlgorithm>({
      required: true,
      description: 'Compression algorithm to use for archive files',
      options: ['7zip', 'zstd', 'none'],
      default: 'zstd',
      env: 'COMPRESSION_ALGORITHM',
    }),
    compressionLevel: flags.enum<CompressionLevel>({
      required: true,
      description: 'Compression level to use for archive files (lower is faster, but provides lower storage savings)',
      env: 'COMPRESSION_LEVEL',
      default: 'medium',
      options: ['low', 'medium', 'high'],
    }),
    compressionThreads: flags.integer({
      required: true,
      description:
        'Number of threads to use for compression. ' +
        'Note that {uploadWorkersNumber} upload tasks may be running at once ' +
        'and each of them can spawn a separate compression task which uses {compressionThreads} threads!',
      env: 'COMPRESSION_THREADS',
      default: 1,
    }),
    uploadWorkersNumber: flags.integer({
      required: false,
      description: 'Upload workers number (max async operations in progress).',
      env: 'UPLOAD_WORKERS_NUMBER',
      default: 4,
    }),
    syncInterval: flags.integer({
      char: 'i',
      description: 'Interval between synchronizations (in minutes)',
      env: 'SYNC_INTERVAL_MINUTES',
      default: 20,
    }),
    storageSquidEndpoint: flags.string({
      char: 'q',
      required: true,
      env: 'STORAGE_SQUID_ENDPOINT',
      default: 'http://localhost:4352/graphql',
      description: 'Storage Squid graphql server endpoint (e.g.: http://some.com:4352/graphql)',
    }),
    syncWorkersNumber: flags.integer({
      char: 'r',
      required: false,
      description: 'Sync workers number (max async operations in progress).',
      env: 'SYNC_WORKERS_NUMBER',
      default: 8,
    }),
    syncWorkersTimeout: flags.integer({
      char: 't',
      required: false,
      description: 'Asset downloading timeout for the syncronization (in minutes).',
      env: 'SYNC_WORKERS_TIMEOUT_MINUTES',
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
      default: 'logs-colossus',
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
      env: 'LOG_FILE_PATH',
    }),
    logMaxFileNumber: flags.integer({
      char: 'n',
      required: false,
      description: `Maximum rolling log files number.`,
      env: 'LOG_MAX_FILE_NUMBER',
      default: 7,
    }),
    logMaxFileSize: flags.integer({
      char: 'x',
      required: false,
      description: `Maximum rolling log files size in bytes.`,
      env: 'LOG_MAX_FILE_SIZE',
      default: 50_000_000,
    }),
    logFileChangeFrequency: flags.enum({
      char: 'z',
      description: `Log files update frequency.`,
      options: Object.keys(DatePatternByFrequency),
      required: false,
      env: 'LOG_FILE_CHANGE_FREQUENCY',
      default: 'daily',
    }),
    awsS3BucketRegion: flags.string({
      description: 'AWS region of the AWS S3 bucket where the files will be stored.',
      env: 'AWS_REGION',
      required: true,
    }),
    awsS3BucketName: flags.string({
      description: 'Name of the AWS S3 bucket where the files will be stored.',
      env: 'AWS_BUCKET_NAME',
      required: true,
    }),
    awsStorageClass: flags.enum<StorageClass>({
      description: 'AWS S3 storage class to use when uploading the archives to S3.',
      env: 'AWS_STORAGE_CLASS',
      required: true,
      default: 'DEEP_ARCHIVE',
      options: Object.keys(StorageClass) as StorageClass[],
    }),
    statsLoggingInterval: flags.integer({
      description: 'How often the upload/download/compression statistics summary will be logged (in minutes).',
      env: 'STATS_LOGGING_INTERVAL',
      default: 60,
      required: true,
    }),
    ...ApiCommandBase.flags,
  }

  async getSyncableBuckets(api: ApiPromise, qnApi: QueryNodeApi): Promise<string[]> {
    const { flags } = this.parse(Archive)
    const workerId = flags.worker

    if (!(await verifyWorkerId(api, workerId))) {
      logger.error(`workerId ${workerId} does not exist in the storage working group`)
      this.exit(ExitCodes.InvalidWorkerId)
    }

    if (!flags.buckets.length) {
      logger.info(`No buckets provided. Will use all bucket belonging to worker ${workerId}.`)
    }

    const selectedBucketsAndAccounts = await constructBucketToAddressMapping(api, qnApi, workerId, flags.buckets)
    const selectedBuckets = selectedBucketsAndAccounts.map(([bucketId]) => bucketId)
    const selectedVsProvidedDiff = _.difference(
      flags.buckets.map((id) => id.toString()),
      selectedBuckets
    )

    if (selectedVsProvidedDiff.length) {
      logger.warn(
        `Buckets: ${JSON.stringify(
          selectedVsProvidedDiff
        )} do not belong to worker with ID=${workerId} and will NOT be synced!`
      )
    }

    let syncableBuckets = selectedBuckets
    if (process.env.DISABLE_BUCKET_AUTH === 'true') {
      logger.warn('Bucket authentication is disabled! This is not recommended for production use!')
    } else {
      const keystoreAddresses = this.getUnlockedAccounts()
      const bucketsWithKeysInKeyring = selectedBucketsAndAccounts.filter(([bucketId, address]) => {
        if (!keystoreAddresses.includes(address)) {
          this.warn(`Missing transactor key for bucket ${bucketId}. It will NOT be synced!`)
          return false
        }
        return true
      })

      syncableBuckets = bucketsWithKeysInKeyring.map(([bucketId]) => bucketId)
    }

    if (!syncableBuckets.length) {
      this.error('No buckets to serve. Exiting...')
    }

    if (flags.buckets.length && syncableBuckets.length !== flags.buckets.length) {
      logger.warn(`Only ${syncableBuckets.length} out of ${flags.buckets.length} provided buckets will be synced!`)
    }

    return syncableBuckets
  }

  initLogger(): void {
    const { flags } = this.parse(Archive)
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
  }

  async checkAndNormalizeDirs<T extends Record<string, string>>(dirs: T): Promise<T> {
    const dirsSet = new Set<string>()
    const resolvedPaths: Record<string, string> = {}
    for (const [dirName, dirPath] of Object.entries(dirs)) {
      const resolved = path.resolve(dirPath)
      if (dirsSet.has(resolved)) {
        this.error(`All specified directories should be unique. ${dirPath} is not.`)
      }
      dirsSet.add(resolved)
      await createDirectory(resolved)
      try {
        await fsp.access(resolved, fsp.constants.W_OK | fsp.constants.R_OK)
      } catch (e) {
        this.error(`Cannot access directory ${resolved} for read or write operations: ${e.toString()}`)
      }
      resolvedPaths[dirName] = resolved
    }

    return resolvedPaths as T
  }

  async run(): Promise<void> {
    const { flags } = this.parse(Archive)

    // Init logger
    this.initLogger()

    // Init APIs
    logger.info(`Storage Squid endpoint set: ${flags.storageSquidEndpoint}`)
    const api = await this.getApi()
    const qnApi = new QueryNodeApi(flags.storageSquidEndpoint)

    if (flags.dev) {
      await this.ensureDevelopmentChain()
    }

    // Try to construct S3 connection handler
    const s3ConnectionHandler: IConnectionHandler<StorageClass> = new AwsConnectionHandler({
      bucketName: flags.awsS3BucketName,
      region: flags.awsS3BucketRegion,
      defaultStorageClass: flags.awsStorageClass,
    })

    // Get buckets to sync
    const syncableBuckets = await this.getSyncableBuckets(api, qnApi)
    logger.info(`Buckets to sync: [${syncableBuckets}]`)

    // Check and normalize input directories
    const { tmpDownloadDir, uploadQueueDir } = await this.checkAndNormalizeDirs({
      tmpDownloadDir: flags.tmpDownloadDir,
      uploadQueueDir: flags.uploadQueueDir,
    })

    const compressionService = getCompressionService(
      flags.compressionAlgorithm,
      flags.compressionThreads,
      flags.compressionLevel
    )

    // Build and run archive service
    const X_HOST_ID = uuidv4()
    const archiveService = new ArchiveService({
      buckets: syncableBuckets.map((id) => id.toString()),
      archiveTrackfileBackupFreqMinutes: flags.archiveTrackfileBackupFreqMinutes,
      localCountTriggerThreshold: flags.localCountTriggerThreshold,
      localSizeTriggerThreshold: flags.localSizeTriggerThresholdMB * 1_000_000,
      localAgeTriggerThresholdMinutes: flags.localAgeTriggerThresholdMinutes,
      archiveSizeLimit: flags.archiveFileSizeLimitMB * 1_000_000,
      uploadDirSizeLimit: flags.uploadQueueDirSizeLimitMB * 1_000_000,
      uploadQueueDir,
      tmpDownloadDir,
      s3ConnectionHandler,
      queryNodeApi: qnApi,
      compressionService,
      uploadWorkersNum: flags.uploadWorkersNumber,
      hostId: X_HOST_ID,
      syncWorkersNum: flags.syncWorkersNumber,
      syncWorkersTimeout: flags.syncWorkersTimeout,
      syncInterval: flags.syncInterval,
      statsLoggingInterval: flags.statsLoggingInterval,
    })

    await archiveService.init()
    await archiveService.run()
  }

  // Override exiting.
  /* eslint-disable @typescript-eslint/no-empty-function */
  async finally(): Promise<void> {}
}
