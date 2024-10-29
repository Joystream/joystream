import { promises as fsp } from 'fs'
import path from 'path'
import logger from '../logger'
import { CompressAndUploadTask, UploadArchiveFileTask } from './tasks'
import { WorkingStack, TaskProcessorSpawner } from '../processing/workingProcess'
import { downloadEvents, DownloadFileTask } from '../sync/tasks'
import _ from 'lodash'
import { IConnectionHandler } from '../s3/IConnectionHandler'
import {
  ObjectTrackingService,
  ArchivesTrackingService,
  ARCHIVES_TRACKING_FILENAME,
  OBJECTS_TRACKING_FILENAME,
} from './tracking'
import { QueryNodeApi } from '../queryNode/api'
import { getStorageObligationsFromRuntime } from '../sync/storageObligations'
import { getDownloadTasks } from '../sync/synchronizer'
import sleep from 'sleep-promise'
import { Logger } from 'winston'
import { StorageClass } from '@aws-sdk/client-s3'
import { CompressionService } from './compression'

type DataObjectData = {
  id: string
  size: number
  birthtime: Date
}

/**
 * Manages downloaded data objects before the upload threshold is reached.
 */
class DataObjectsQueue {
  private logger: Logger
  private dataObjects: Map<string, DataObjectData> = new Map()
  private dataDir: string

  constructor(dataDir: string) {
    this.dataDir = dataDir
    this.logger = logger.child('DataObjectsQueue')
  }

  public get totalSize() {
    return Array.from(this.dataObjects.values()).reduce((a, b) => a + b.size, 0)
  }

  public get objectsCount(): number {
    return this.dataObjects.size
  }

  public get oldestObjectBirthtime(): Date | undefined {
    return _.minBy(Array.from(this.dataObjects.values()), (o) => o.birthtime)?.birthtime
  }

  public async add(dataObjectId: string): Promise<void> {
    const { size, birthtime } = await fsp.stat(path.join(this.dataDir, dataObjectId))
    this.dataObjects.set(dataObjectId, { id: dataObjectId, size, birthtime })
  }

  public has(dataObjectId: string): boolean {
    return this.dataObjects.has(dataObjectId)
  }

  public remove(dataObjectId: string): void {
    this.dataObjects.delete(dataObjectId)
  }

  // Pop data objects sorted by id until size limit is reached
  public popUntilSizeLimit(objectsSizeLimit: number): DataObjectData[] {
    const dataObjects = Array.from(this.dataObjects.values())
    // Objects are sorted from highest to lowest id,
    // so that the objects with lowest id are removed first
    dataObjects.sort((a, b) => parseInt(b.id) - parseInt(a.id))
    const removedItems = []
    let combinedSize = 0
    while (combinedSize < objectsSizeLimit) {
      const removedItem = dataObjects.pop()
      if (!removedItem) {
        break
      }
      this.remove(removedItem.id)
      removedItems.push(removedItem)
      combinedSize += removedItem.size
    }

    return removedItems
  }

  public empty(objectsSizeLimit: number): DataObjectData[][] {
    const { objectsCount, totalSize } = this
    this.logger.debug(`Emptying local data objects queue. objects_count=${objectsCount}, total_size=${totalSize}`)
    const batches: DataObjectData[][] = []
    let dataObjectsBatch: DataObjectData[] = this.popUntilSizeLimit(objectsSizeLimit)
    while (dataObjectsBatch.length) {
      batches.push(dataObjectsBatch)
      this.logger.debug(`Prepared batch: ${dataObjectsBatch.map((o) => o.id).join(', ')}`)
      dataObjectsBatch = this.popUntilSizeLimit(objectsSizeLimit)
    }
    this.logger.debug(`Local data objects queue emptied. Prepared ${batches.length} batches.`)
    return batches
  }

  public get oldestObjectAgeMinutes() {
    if (this.oldestObjectBirthtime) {
      const diffMs = new Date().getTime() - this.oldestObjectBirthtime.getTime()
      return diffMs / 1000 / 60
    }
    return 0
  }
}

type ArchiveServiceParams = {
  // Supported buckets
  buckets: string[]
  // Upload trigger Thresholds
  localCountTriggerThreshold: number | undefined
  localSizeTriggerThreshold: number
  localAgeTriggerThresholdMinutes: number
  // Size limits
  archiveSizeLimit: number
  uploadDirSizeLimit: number
  // Directory paths
  uploadQueueDir: string
  tmpDownloadDir: string
  // API's
  s3ConnectionHandler: IConnectionHandler<StorageClass>
  queryNodeApi: QueryNodeApi
  // Compression service
  compressionService: CompressionService
  // Upload tasks config
  uploadWorkersNum: number
  // Sync tasks config
  hostId: string
  syncWorkersNum: number
  syncWorkersTimeout: number
  syncInterval: number
  // Archive tracking backup
  archiveTrackfileBackupFreqMinutes: number
}

export class ArchiveService {
  private logger: Logger
  // Buckets
  private buckets: string[]
  // Thresholds
  private localCountTriggerThreshold: number | undefined
  private localSizeTriggerThreshold: number
  private localAgeTriggerThresholdMinutes: number
  // Size limits
  private archiveSizeLimit: number
  private uploadDirSizeLimit: number
  // Directory paths
  private uploadQueueDir: string
  private tmpDownloadDir: string
  // API's and services
  private queryNodeApi: QueryNodeApi
  private s3ConnectionHandler: IConnectionHandler<StorageClass>
  // Compression service
  private compressionService: CompressionService
  // Tracking services
  private objectTrackingService: ObjectTrackingService
  private archivesTrackingService: ArchivesTrackingService
  // Archive tracking backup
  private archiveTrackfileBackupFreqMinutes: number
  private archiveTrackfileLastMtime: Date | undefined
  // Upload tasks
  private preparingForUpload = false
  private uploadWorkersNum: number
  private uploadWorkingStack: WorkingStack
  private uploadProcessorSpawner: TaskProcessorSpawner | undefined
  private syncProcessorSpawner: TaskProcessorSpawner | undefined
  private dataObjectsQueue: DataObjectsQueue
  // Sync tasks
  private hostId: string
  private syncWorkersNum: number
  private syncWorkingStack: WorkingStack
  private syncQueueObjectsSize = 0
  private syncWorkersTimeout: number
  private syncInterval: number

  constructor(params: ArchiveServiceParams) {
    // From params:
    this.buckets = params.buckets
    this.localCountTriggerThreshold = params.localCountTriggerThreshold
    this.localSizeTriggerThreshold = params.localSizeTriggerThreshold
    this.localAgeTriggerThresholdMinutes = params.localAgeTriggerThresholdMinutes
    this.archiveSizeLimit = params.archiveSizeLimit
    this.uploadDirSizeLimit = params.uploadDirSizeLimit
    this.uploadQueueDir = params.uploadQueueDir
    this.tmpDownloadDir = params.tmpDownloadDir
    this.s3ConnectionHandler = params.s3ConnectionHandler
    this.compressionService = params.compressionService
    this.queryNodeApi = params.queryNodeApi
    this.uploadWorkersNum = params.uploadWorkersNum
    this.hostId = params.hostId
    this.syncWorkersNum = params.syncWorkersNum
    this.syncWorkersTimeout = params.syncWorkersTimeout
    this.syncInterval = params.syncInterval
    this.archiveTrackfileBackupFreqMinutes = params.archiveTrackfileBackupFreqMinutes
    // Other:
    this.objectTrackingService = new ObjectTrackingService(this.uploadQueueDir)
    this.archivesTrackingService = new ArchivesTrackingService(this.uploadQueueDir)
    this.dataObjectsQueue = new DataObjectsQueue(this.uploadQueueDir)
    this.uploadWorkingStack = new WorkingStack()
    this.syncWorkingStack = new WorkingStack()
    this.logger = logger.child({ label: 'ArchiveService' })
  }

  /**
   * Starts infinite task processing loop and returns the TaskProcessorSpawner instance
   */
  private startProcessorSpawner(name: string, stack: WorkingStack, workersNum: number) {
    const spawner = new TaskProcessorSpawner(stack, workersNum, false)
    spawner
      .process()
      .then(() => {
        this.logger.error(`${name} task processing loop returned unexpectedly!`)
        process.exit(1)
      })
      .catch((e) => {
        this.logger.error(`${name} task processing loop broken: ${e.toString()}`)
        process.exit(1)
      })

    return spawner
  }

  /**
   * Initializes downloadEvent handlers and archive trackfile backup interval.
   */
  private installTriggers(): void {
    downloadEvents.on('success', (dataObjectId, size) => {
      this.logger.debug(`Download success event received for object: ${dataObjectId}`)
      this.handleSuccessfulDownload(dataObjectId).catch((e) => {
        this.logger.error(`Critical error on handleSuccessfulDownload: ${e.toString()}`)
        process.exit(1)
      })
      this.syncQueueObjectsSize -= size
    })
    downloadEvents.on('fail', (dataObjectId, size) => {
      this.syncQueueObjectsSize -= size
    })
    setInterval(() => {
      this.backupArchiveTrackfile().catch((e) => {
        this.logger.error(`Failed to upload archive trackfile backup to S3: ${e.toString()}`)
      })
    }, this.archiveTrackfileBackupFreqMinutes * 60_000)
  }

  /**
   * Uploads a backup of the archive trackfile to S3.
   */
  protected async backupArchiveTrackfile(): Promise<void> {
    const trackfilePath = this.archivesTrackingService.getTrackfilePath()
    const lastModified = (await fsp.stat(trackfilePath)).mtime
    if (!this.archiveTrackfileLastMtime || lastModified.getTime() > this.archiveTrackfileLastMtime.getTime()) {
      this.logger.info('Backing up the archive trackfile...')
      // For the trackfile we're using STANDARD class, because:
      // 1. It's a lightweight file,
      // 2. It may be useful to be able to access it quickly,
      // 3. It's often overriden, which would incur additional costs for archival storage classes.
      await this.s3ConnectionHandler.uploadFileToRemoteBucket(path.basename(trackfilePath), trackfilePath, 'STANDARD')
      this.archiveTrackfileLastMtime = lastModified
    }
  }

  /**
   * Waits until there are no compression / upload / download tasks in progress.
   */
  public async noPendingTasks(): Promise<void> {
    while (!this.uploadProcessorSpawner?.isIdle || !this.syncProcessorSpawner?.isIdle || this.preparingForUpload) {
      await sleep(1000)
    }
  }

  /**
   * Starts the core processing loop divided into 4 stages:
   * 1. Data integrity check: Checks the uploadQueueDir, cleaning up
   *    any corrupted data and re-scheduling failed uploads.
   * 2. Sync stage: Downloads new objects and uploads to S3 once upload
   *    thresholds are reached.
   * 3. Remaining uploads stage: Checks for upload triggers
   *    (for example, whether the data object age threshold is reached)
   *    and uploads any remaining data objects if needed.
   * 4. Idle stage: Waits out the syncInterval.
   */
  public async run(): Promise<void> {
    // Start processing loops and install triggers
    this.uploadProcessorSpawner = this.startProcessorSpawner('Sync', this.syncWorkingStack, this.syncWorkersNum)
    this.syncProcessorSpawner = this.startProcessorSpawner('Upload', this.uploadWorkingStack, this.uploadWorkersNum)
    this.installTriggers()

    while (true) {
      this.logger.info('Runnning data integrity check...')
      try {
        // Run data integrity check (WARNING: It assumes no there are not tasks in progress!)
        await this.dataIntegrityCheck()
      } catch (e) {
        this.logger.error(`Data integrity check failed: ${e.toString()}`)
      }
      this.logger.info('Data integrity check done.')

      this.logger.info('Started syncing...')
      try {
        await this.performSync()
      } catch (e) {
        this.logger.error(`Sync failed: ${e.toString()}`)
      }
      // Wait until the full sync and all triggered uploads are done
      // (this may take a very long time during first sync)
      await this.noPendingTasks()
      this.logger.info('Sync done.')

      this.logger.info('Checking for uploads to prepare...')
      try {
        await this.uploadIfReady()
      } catch (e) {
        this.logger.error(`uploadIfReady failed: ${e.toString()}`)
      }
      // Wait until remaining uploads are done
      await this.noPendingTasks()
      this.logger.info('Uploads check done.')

      this.logger.info(`All done, pausing for ${this.syncInterval} minute(s)...`)
      // Wait out the syncInterval
      await sleep(this.syncInterval * 60_000)
    }
  }

  /**
   * Adds new download task to the working stack
   */
  private async addDownloadTask(task: DownloadFileTask, size: number) {
    this.syncQueueObjectsSize += size
    await this.syncWorkingStack.add([task])
  }

  /**
   * Calculates upload queue directory size
   *
   * @throws Error If there's some problem with file access
   */
  private async getUploadDirSize(): Promise<number> {
    const uploadDirObjects = await fsp.readdir(this.uploadQueueDir, { withFileTypes: true })
    const uploadFileStats = await Promise.all(
      uploadDirObjects.filter((o) => o.isFile()).map((f) => fsp.stat(path.join(this.uploadQueueDir, f.name)))
    )
    return uploadFileStats.reduce((a, b) => a + b.size, 0)
  }

  /**
   * Runs the data synchronization workflow.
   * Adds tasks to the sync working stack while trying to prevent
   * exceeding the upload queue directory size limit.
   * DOES NOT WAIT UNTIL ALL OF THE TASKS ARE DONE!
   *
   * @throws Error If there's an issue w/ file access or the query node
   */
  public async performSync(): Promise<void> {
    const model = await getStorageObligationsFromRuntime(this.queryNodeApi, this.buckets)

    const assignedObjects = model.dataObjects
    const added = assignedObjects.filter((obj) => !this.objectTrackingService.isTracked(obj.id))
    added.sort((a, b) => parseInt(b.id) - parseInt(a.id))

    this.logger.info(`Sync - new objects: ${added.length}`)

    // Add new download tasks while the upload dir size limit allows
    while (added.length) {
      const uploadDirectorySize = await this.getUploadDirSize()
      while (true) {
        const object = added.pop()
        if (!object) {
          break
        }
        if (object.size + uploadDirectorySize + this.syncQueueObjectsSize > this.uploadDirSizeLimit) {
          this.logger.debug(
            `Waiting for some disk space to free ` +
              `(upload_dir: ${uploadDirectorySize} / ${this.uploadDirSizeLimit}, ` +
              `sync_q=${this.syncQueueObjectsSize}, obj_size=${object.size})... `
          )
          added.push(object)
          await sleep(60_000)
          break
        }
        const [downloadTask] = await getDownloadTasks(
          model,
          this.buckets,
          [object],
          this.uploadQueueDir,
          this.tmpDownloadDir,
          this.syncWorkersTimeout,
          this.hostId
        )
        await this.addDownloadTask(downloadTask, object.size)
      }
    }
  }

  /**
   * Runs the uploadQueueDir data integrity check, removing corrupted data
   * and re-scheduling failed uploads.
   *
   * @throws Error In case of an upload directory access issue.
   */
  private async dataIntegrityCheck(): Promise<void> {
    const uploadDirContents = await fsp.readdir(this.uploadQueueDir, { withFileTypes: true })
    for (const item of uploadDirContents) {
      if (item.isFile()) {
        const splitParts = item.name.split('.')
        const name = splitParts[0]
        const isTmp = splitParts[1] === 'tmp'
        const ext = splitParts.slice(isTmp ? 2 : 1).join('.')
        // 1. If file name is an int and has no ext: We assume it's a fully downloaded data object
        if (parseInt(name).toString() === name && !isTmp && !ext) {
          const dataObjectId = name
          // 1.1. If the object is not in dataObjectsQueue: remove
          if (!this.dataObjectsQueue.has(dataObjectId)) {
            this.logger.error(
              `Data object ${dataObjectId} found in the directory, but not in internal upload queue. Removing...`
            )
            await this.tryRemovingLocalDataObject(dataObjectId)
          }
          // 1.2. If the object is not tracked by objectTrackingService: remove
          else if (!this.objectTrackingService.isTracked(dataObjectId)) {
            this.logger.error(
              `Data object ${dataObjectId} found in the directory, but not in tracking service. Removing...`
            )
            await this.tryRemovingLocalDataObject(dataObjectId)
          }
        }
        // 2. If file is an archive and has no `.tmp` ext: We assume it's a valid archive with data objects
        else if (!isTmp && ext === this.compressionService.getExt()) {
          if (!this.archivesTrackingService.isTracked(item.name)) {
            // 2.1. If not tracked by archiveTrackingService - try to re-upload:
            this.logger.warn(`Found unuploaded archive: ${item.name}. Scheduling for re-upload...`)
            await this.uploadWorkingStack.add([
              new UploadArchiveFileTask(
                path.join(this.uploadQueueDir, item.name),
                item.name,
                this.uploadQueueDir,
                this.archivesTrackingService,
                this.s3ConnectionHandler,
                this.compressionService
              ),
            ])
            // 2.2. If it's already tracked by archiveTrackingService (already uploaded): remove
          } else {
            this.logger.warn(`Found already uploaded archive: ${item.name}. Removing...`)
            await this.tryRemovingLocalFile(path.join(this.uploadQueueDir, item.name))
          }
          // 3. If file is temporary: remove
        } else if (isTmp) {
          this.logger.warn(`Found temporary file: ${item.name}. Removing...`)
          await this.tryRemovingLocalFile(path.join(this.uploadQueueDir, item.name))
        } else if (item.name !== ARCHIVES_TRACKING_FILENAME && item.name !== OBJECTS_TRACKING_FILENAME) {
          this.logger.warn(`Found unrecognized file: ${item.name}`)
        }
      } else {
        this.logger.warn(`Found unrecognized subdirectory: ${item.name}`)
      }
    }
  }

  /**
   * Discover data objects present in the uploadQueueDir and
   * initialize the DataObjectsQueue with all the objects found.
   * (only executed during startup)
   */
  private async initDataObjectsQueue(): Promise<void> {
    this.logger.debug('Initializing data objects queue...')
    const uploadDirContents = await fsp.readdir(this.uploadQueueDir, { withFileTypes: true })
    for (const item of uploadDirContents) {
      if (item.isFile()) {
        const [name, ext] = item.name.split('.')
        // If file name is an int and has no ext: Process as new data object
        if (parseInt(name).toString() === name && !ext) {
          await this.processNewDataObject(item.name)
        }
      }
    }
    this.logger.debug('Done initializing data objects queue.')
  }

  /**
   * Initialize the ArchiveService and its child services.
   *
   * @throws Error In case one of the services fails to initialize.
   */
  public async init(): Promise<void> {
    try {
      this.logger.info('Initializing...')
      await this.objectTrackingService.init()
      await this.archivesTrackingService.init()
      await this.initDataObjectsQueue()
      this.logger.info('Done initializing.')
    } catch (e) {
      this.logger.error(`ArchiveService failed to initialize: ${e.toString()}`)
      process.exit(1)
    }
  }

  /**
   * Try removing a local file and log error if it fails.
   */
  private async tryRemovingLocalFile(filePath: string, force = true) {
    try {
      await fsp.rm(filePath, { force })
    } catch (e) {
      this.logger.error(`Failed to remove local file (${filePath}): ${e.toString()}`)
    }
  }

  /**
   * Try removing a data object and all associated state.
   * Log error if it fails.
   */
  private async tryRemovingLocalDataObject(dataObjectId: string): Promise<void> {
    this.logger.info(`Removing object ${dataObjectId}...`)
    this.dataObjectsQueue.remove(dataObjectId)
    try {
      await this.objectTrackingService.untrack(dataObjectId)
    } catch (e) {
      this.logger.error(`Failed to untrack local object ${dataObjectId}`)
    }
    const localObjectPath = path.join(this.uploadQueueDir, dataObjectId)
    await this.tryRemovingLocalFile(localObjectPath)
  }

  /**
   * Process a new data object by adding it to tracking service and data objects queue.
   * Log error and try to remove the object if it fails
   * (it should be re-downloaded in this case)
   */
  public async processNewDataObject(dataObjectId: string): Promise<void> {
    this.logger.debug(`Processing new data object: ${dataObjectId}`)
    try {
      await this.objectTrackingService.track(dataObjectId)
      await this.dataObjectsQueue.add(dataObjectId)
    } catch (e) {
      this.logger.error(`ArchiveService couldn't proccess data object (${dataObjectId}): ${e.toString()}`)
      this.logger.warn('Object will be removed...')
      await this.tryRemovingLocalDataObject(dataObjectId)
    }
  }

  /**
   * Check if any of the upload thresholds have been reached.
   */
  public checkThresholds(): boolean {
    const {
      objectsCount: localObjectsCount,
      totalSize: localObjectsTotalSize,
      oldestObjectAgeMinutes: localObjectsMaxAge,
    } = this.dataObjectsQueue

    if (localObjectsTotalSize >= this.localSizeTriggerThreshold) {
      this.logger.info(
        `Total objects size threshold reached (${localObjectsTotalSize} B / ${this.localSizeTriggerThreshold} B)`
      )
      return true
    } else if (this.localCountTriggerThreshold && localObjectsCount >= this.localCountTriggerThreshold) {
      this.logger.info(
        `Total objects count threshold reached (${localObjectsCount} / ${this.localCountTriggerThreshold})`
      )
      return true
    } else if (localObjectsMaxAge >= this.localAgeTriggerThresholdMinutes) {
      this.logger.info(
        `Oldest object age threshold reached (${localObjectsMaxAge}m / ${this.localAgeTriggerThresholdMinutes}m)`
      )
      return true
    }
    return false
  }

  /**
   * Trigger compression & upload workflow if any of the upload thresholds
   * have been reached.
   */
  public async uploadIfReady(): Promise<void> {
    if (this.checkThresholds()) {
      const dataObjectBatches = this.dataObjectsQueue.empty(this.archiveSizeLimit)
      await this.prepareAndUploadBatches(dataObjectBatches)
    }
  }

  /**
   * Process data object after successful download and check if any trigger
   * compression & upload workflow if any of the thresholds have been reached.
   */
  private async handleSuccessfulDownload(dataObjectId: string): Promise<void> {
    await this.processNewDataObject(dataObjectId)
    await this.uploadIfReady()
  }

  /**
   * Compresses batches of data objects into archives and schedules the uploads to S3.
   */
  public async prepareAndUploadBatches(dataObjectBatches: DataObjectData[][]): Promise<void> {
    if (!dataObjectBatches.length) {
      this.logger.warn('prepareAndUploadBatches: No batches received.')
      return
    }

    this.preparingForUpload = true

    this.logger.info(`Preparing ${dataObjectBatches.length} object batches for upload...`)
    const uploadTasks: CompressAndUploadTask[] = []
    for (const batch of dataObjectBatches) {
      const uploadTask = new CompressAndUploadTask(
        this.uploadQueueDir,
        batch.map((o) => o.id),
        this.archivesTrackingService,
        this.s3ConnectionHandler,
        this.compressionService
      )
      uploadTasks.push(uploadTask)
    }

    await this.uploadWorkingStack.add(uploadTasks)

    this.preparingForUpload = false
  }
}
