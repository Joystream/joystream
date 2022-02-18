import fs from 'fs'
import { ObjectStatus, ObjectStatusType, ReadonlyConfig } from '../../types'
import { StateCacheService } from '../cache/StateCacheService'
import { LoggingService } from '../logging'
import { Logger } from 'winston'
import { FileContinousReadStream, FileContinousReadStreamOptions } from './FileContinousReadStream'
import FileType from 'file-type'
import { Readable, pipeline } from 'stream'
import { NetworkingService } from '../networking'
import { ContentHash } from '../crypto/ContentHash'
import readChunk from 'read-chunk'
import { PendingDownloadStatusType } from '../networking/PendingDownload'

export const DEFAULT_CONTENT_TYPE = 'application/octet-stream'
export const MIME_TYPE_DETECTION_CHUNK_SIZE = 4100

export class ContentService {
  private config: ReadonlyConfig
  private dataDir: string
  private logger: Logger
  private stateCache: StateCacheService
  private networking: NetworkingService

  private contentSizeSum = 0

  public get usedSpace(): number {
    return this.contentSizeSum
  }

  public get freeSpace(): number {
    return this.config.limits.storage - this.contentSizeSum
  }

  public constructor(
    config: ReadonlyConfig,
    logging: LoggingService,
    networking: NetworkingService,
    stateCache: StateCacheService
  ) {
    this.config = config
    this.logger = logging.createLogger('ContentService')
    this.stateCache = stateCache
    this.networking = networking
    this.dataDir = config.directories.assets
  }

  public async cacheCleanup(): Promise<void> {
    const supportedObjects = await this.networking.fetchSupportedDataObjects()
    const cachedObjectsIds = this.stateCache.getCachedObjectsIds()
    let droppedObjects = 0

    this.logger.verbose('Performing cache cleanup...', {
      supportedObjects: supportedObjects.size,
      objectsInCache: cachedObjectsIds.length,
    })

    for (const objectId of cachedObjectsIds) {
      if (!supportedObjects.has(objectId)) {
        this.drop(objectId, 'No longer supported')
        ++droppedObjects
      }
    }

    this.logger.verbose('Cache cleanup finished', {
      droppedObjects,
    })
  }

  public async startupInit(): Promise<void> {
    const supportedObjects = await this.networking.fetchSupportedDataObjects()
    const dataDirFiles = fs.readdirSync(this.dataDir)
    const filesCountOnStartup = dataDirFiles.length
    const cachedObjectsIds = this.stateCache.getCachedObjectsIds()
    const cacheItemsCountOnStartup = cachedObjectsIds.length

    this.logger.info('ContentService initializing...', {
      supportedObjects: supportedObjects.size,
      filesCountOnStartup,
      cacheItemsCountOnStartup,
    })
    let filesDropped = 0
    for (const objectId of dataDirFiles) {
      this.logger.debug('Checking content file', { objectId })
      // Add fileSize to contentSizeSum for each file. If the file ends up dropped - contentSizeSum will be reduced by this.drop().
      const fileSize = this.fileSize(objectId)
      this.contentSizeSum += fileSize

      // Drop files that are not part of current chain assignment
      const dataObject = supportedObjects.get(objectId)
      if (!dataObject) {
        this.drop(objectId, 'Not supported')
        continue
      }

      // Drop files that are missing in the cache
      if (!this.stateCache.peekContent(objectId)) {
        this.drop(objectId, 'Missing cache data')
        continue
      }

      // Compare file size to expected one
      const { size: dataObjectSize } = dataObject
      if (fileSize !== dataObjectSize) {
        // Existing file size does not match the expected one
        const msg = `Unexpected file size. Expected: ${dataObjectSize}, actual: ${fileSize}`
        this.logger.warn(msg, { fileSize, dataObjectSize })
        this.drop(objectId, msg)
        ++filesDropped
      } else {
        // Existing file size is OK - detect mimeType if missing
        if (!this.stateCache.getContentMimeType(objectId)) {
          this.stateCache.setContentMimeType(objectId, await this.detectMimeType(objectId))
        }
      }
    }

    let cacheItemsDropped = 0
    for (const objectId of cachedObjectsIds) {
      if (!this.exists(objectId)) {
        // Content is part of cache data, but does not exist in filesystem - drop from cache
        this.stateCache.dropById(objectId)
        ++cacheItemsDropped
      }
    }

    this.logger.info('ContentService initialized', {
      filesDropped,
      cacheItemsDropped,
      contentSizeSum: this.contentSizeSum,
    })
  }

  public drop(objectId: string, reason?: string, unreserveSpace = true): void {
    if (this.exists(objectId)) {
      const size = this.fileSize(objectId)
      fs.unlinkSync(this.path(objectId))
      if (unreserveSpace) {
        this.contentSizeSum -= size
      }
      this.logger.debug('Dropping content', { objectId, reason, size, contentSizeSum: this.contentSizeSum })
    } else {
      this.logger.warn('Trying to drop content that no loger exists', { objectId, reason })
    }
    this.stateCache.dropById(objectId)
  }

  public fileSize(objectId: string): number {
    return fs.statSync(this.path(objectId)).size
  }

  public path(objectId: string): string {
    return `${this.dataDir}/${objectId}`
  }

  public exists(objectId: string): boolean {
    return fs.existsSync(this.path(objectId))
  }

  public createReadStream(objectId: string): fs.ReadStream {
    return fs.createReadStream(this.path(objectId))
  }

  public createWriteStream(objectId: string): fs.WriteStream {
    return fs.createWriteStream(this.path(objectId), { autoClose: true, emitClose: true })
  }

  public createContinousReadStream(objectId: string, options: FileContinousReadStreamOptions): FileContinousReadStream {
    return new FileContinousReadStream(this.path(objectId), options)
  }

  public async detectMimeType(objectId: string): Promise<string> {
    const objectPath = this.path(objectId)
    try {
      const buffer = await readChunk(objectPath, 0, MIME_TYPE_DETECTION_CHUNK_SIZE)
      const result = await FileType.fromBuffer(buffer)
      return result?.mime || DEFAULT_CONTENT_TYPE
    } catch (err) {
      this.logger.error(`Error while trying to detect object mimeType: ${err instanceof Error ? err.message : err}`, {
        err,
        objectId,
        objectPath,
      })
      return DEFAULT_CONTENT_TYPE
    }
  }

  private async evictCacheUntilFreeSpaceReached(targetFreeSpace: number): Promise<void> {
    this.logger.verbose('Cache eviction triggered.', { targetFreeSpace, currentFreeSpace: this.freeSpace })
    let itemsDropped = 0
    while (this.freeSpace < targetFreeSpace) {
      const evictCandidateId = this.stateCache.getCacheEvictCandidateObjectId()
      if (evictCandidateId) {
        this.drop(evictCandidateId, 'Cache eviction')
        ++itemsDropped
      } else {
        this.logger.verbose('Nothing to drop from cache, waiting...', { freeSpace: this.freeSpace, targetFreeSpace })
        await new Promise((resolve) => setTimeout(resolve, 1000))
      }
    }
    this.logger.verbose('Cache eviction finalized.', { currentfreeSpace: this.freeSpace, itemsDropped })
  }

  public async handleNewContent(
    objectId: string,
    expectedSize: number,
    expectedHash: string,
    dataStream: Readable
  ): Promise<void> {
    this.logger.verbose('Handling new content', {
      objectId,
      expectedSize,
    })

    // Trigger cache eviction if required
    if (this.freeSpace < expectedSize) {
      await this.evictCacheUntilFreeSpaceReached(expectedSize)
    }

    // Reserve space for the new object
    this.contentSizeSum += expectedSize
    this.logger.verbose('Reserved space for new data object', {
      objectId,
      expectedSize,
      newContentSizeSum: this.contentSizeSum,
    })

    const rejectContent = (reason: string, metadata: Record<string, unknown>) => {
      const msg = `Content rejected: ${reason}`
      // Drop (without unreserving space, will do that manually)
      this.drop(objectId, msg, false)
      // Unreserve reserved space
      this.contentSizeSum -= expectedSize
      // Log the error
      this.logger.error(msg, { ...metadata })
    }

    // Return a promise that resolves when the new file is created
    return new Promise<void>((resolve, reject) => {
      const fileStream = this.createWriteStream(objectId)

      let bytesReceived = 0
      const hash = new ContentHash()

      const onData = (chunk: Buffer) => {
        bytesReceived += chunk.length
        hash.update(chunk)

        if (bytesReceived > expectedSize) {
          fileStream.destroy(new Error('Unexpected content size: Too much data received from source!'))
        }
      }

      pipeline(dataStream, fileStream, async (err) => {
        dataStream.off('data', onData)
        const { bytesWritten } = fileStream
        const finalHash = hash.digest()
        const logMetadata = {
          objectId,
          expectedSize,
          bytesReceived,
          bytesWritten,
          expectedHash,
          finalHash,
        }
        if (err) {
          rejectContent(`Error while processing content data stream`, {
            err,
            ...logMetadata,
          })
          reject(err)
          return
        }

        if (bytesWritten !== bytesReceived || bytesWritten !== expectedSize) {
          rejectContent('Bytes written/received/expected mismatch!', { ...logMetadata })
          return
        }

        if (finalHash !== expectedHash) {
          rejectContent('Hash mismatch!', { ...logMetadata })
          return
        }

        const mimeType = await this.detectMimeType(objectId)
        this.logger.info('New content accepted', { ...logMetadata })
        this.stateCache.dropPendingDownload(objectId, PendingDownloadStatusType.Completed)
        this.stateCache.newContent(objectId, expectedSize)
        this.stateCache.setContentMimeType(objectId, mimeType)
      })

      fileStream.on('open', () => {
        // Note: The promise is resolved on "ready" event, since that's what's awaited in the current flow
        resolve()
      })
      dataStream.on('data', onData)
    })
  }

  public async objectStatus(objectId: string): Promise<ObjectStatus> {
    const pendingDownload = this.stateCache.getPendingDownload(objectId)

    if (!pendingDownload && this.exists(objectId)) {
      return { type: ObjectStatusType.Available, path: this.path(objectId) }
    }

    if (pendingDownload) {
      return { type: ObjectStatusType.PendingDownload, pendingDownload }
    }

    const objectInfo = await this.networking.dataObjectInfo(objectId)
    if (!objectInfo.exists) {
      return { type: ObjectStatusType.NotFound }
    }

    if (!objectInfo.isSupported) {
      return { type: ObjectStatusType.NotSupported }
    }

    const { data: objectData } = objectInfo
    if (!objectData) {
      throw new Error('Missing data object data')
    }

    return { type: ObjectStatusType.Missing, objectData }
  }
}
