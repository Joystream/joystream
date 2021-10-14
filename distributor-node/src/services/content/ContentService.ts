import fs from 'fs'
import { ReadonlyConfig, DataObjectData } from '../../types'
import { StateCacheService } from '../cache/StateCacheService'
import { LoggingService } from '../logging'
import { Logger } from 'winston'
import { FileContinousReadStream, FileContinousReadStreamOptions } from './FileContinousReadStream'
import FileType from 'file-type'
import _ from 'lodash'
import { Readable, pipeline } from 'stream'

export const DEFAULT_CONTENT_TYPE = 'application/octet-stream'

export class ContentService {
  private config: ReadonlyConfig
  private dataDir: string
  private logger: Logger
  private stateCache: StateCacheService

  private contentSizeSum = 0

  public get usedSpace(): number {
    return this.contentSizeSum
  }

  public get freeSpace(): number {
    return this.config.limits.storage - this.contentSizeSum
  }

  public constructor(config: ReadonlyConfig, logging: LoggingService, stateCache: StateCacheService) {
    this.config = config
    this.logger = logging.createLogger('ContentService')
    this.stateCache = stateCache
    this.dataDir = config.directories.data
  }

  public async startupInit(supportedObjects: DataObjectData[]): Promise<void> {
    const dataObjectsByHash = _.groupBy(supportedObjects, (o) => o.contentHash)
    const dataDirFiles = fs.readdirSync(this.dataDir)
    const filesCountOnStartup = dataDirFiles.length
    const cachedContentHashes = this.stateCache.getCachedContentHashes()
    const cacheItemsOnStartup = cachedContentHashes.length

    this.logger.info('ContentService initializing...', {
      supportedObjects: supportedObjects.length,
      filesCountOnStartup,
      cacheItemsOnStartup,
    })
    let filesDropped = 0
    for (const contentHash of dataDirFiles) {
      this.logger.debug('Checking content file', { contentHash })
      // Add fileSize to contentSizeSum for each file. If the file ends up dropped - contentSizeSum will be reduced by this.drop().
      const fileSize = this.fileSize(contentHash)
      this.contentSizeSum += fileSize

      // Drop files that are not part of current chain assignment
      const objectsByHash = dataObjectsByHash[contentHash] || []
      if (!objectsByHash.length) {
        this.drop(contentHash, 'Not supported')
        continue
      }

      // Compare file size to expected one
      const { size: dataObjectSize } = objectsByHash[0]
      if (fileSize !== dataObjectSize) {
        // Existing file size does not match the expected one
        const msg = `Unexpected file size. Expected: ${dataObjectSize}, actual: ${fileSize}`
        this.logger.warn(msg, { fileSize, dataObjectSize })
        this.drop(contentHash, msg)
        ++filesDropped
      } else {
        // Existing file size is OK - detect mimeType if missing
        if (!this.stateCache.getContentMimeType(contentHash)) {
          this.stateCache.setContentMimeType(contentHash, await this.guessMimeType(contentHash))
        }
      }

      // Recreate contentHashByObjectId map for all supported data objects
      objectsByHash.forEach(({ contentHash, objectId }) => {
        this.stateCache.setObjectContentHash(objectId, contentHash)
      })
    }

    let cacheItemsDropped = 0
    for (const contentHash of cachedContentHashes) {
      if (!this.exists(contentHash)) {
        // Content is part of cache data, but does not exist in filesystem - drop from cache
        this.stateCache.dropByHash(contentHash)
        ++cacheItemsDropped
      }
    }

    this.logger.info('ContentService initialized', {
      filesDropped,
      cacheItemsDropped,
      contentSizeSum: this.contentSizeSum,
    })
  }

  public drop(contentHash: string, reason?: string): void {
    if (this.exists(contentHash)) {
      const size = this.fileSize(contentHash)
      fs.unlinkSync(this.path(contentHash))
      this.contentSizeSum -= size
      this.logger.debug('Dropping content', { contentHash, reason, size, contentSizeSum: this.contentSizeSum })
    } else {
      this.logger.warn('Trying to drop content that no loger exists', { contentHash, reason })
    }
    this.stateCache.dropByHash(contentHash)
  }

  public fileSize(contentHash: string): number {
    return fs.statSync(this.path(contentHash)).size
  }

  public path(contentHash: string): string {
    return `${this.dataDir}/${contentHash}`
  }

  public exists(contentHash: string): boolean {
    return fs.existsSync(this.path(contentHash))
  }

  public createReadStream(contentHash: string): fs.ReadStream {
    return fs.createReadStream(this.path(contentHash))
  }

  public createWriteStream(contentHash: string): fs.WriteStream {
    return fs.createWriteStream(this.path(contentHash), { autoClose: true, emitClose: true })
  }

  public createContinousReadStream(
    contentHash: string,
    options: FileContinousReadStreamOptions
  ): FileContinousReadStream {
    return new FileContinousReadStream(this.path(contentHash), options)
  }

  public async guessMimeType(contentHash: string): Promise<string> {
    const guessResult = await FileType.fromFile(this.path(contentHash))
    return guessResult?.mime || DEFAULT_CONTENT_TYPE
  }

  private async evictCacheUntilFreeSpaceReached(targetFreeSpace: number): Promise<void> {
    this.logger.verbose('Cache eviction triggered.', { targetFreeSpace, currentFreeSpace: this.freeSpace })
    let itemsDropped = 0
    while (this.freeSpace < targetFreeSpace) {
      const evictCandidateHash = this.stateCache.getCacheEvictCandidateHash()
      if (evictCandidateHash) {
        this.drop(evictCandidateHash, 'Cache eviction')
        ++itemsDropped
      } else {
        this.logger.verbose('Nothing to drop from cache, waiting...', { freeSpace: this.freeSpace, targetFreeSpace })
        await new Promise((resolve) => setTimeout(resolve, 1000))
      }
    }
    this.logger.verbose('Cache eviction finalized.', { currentfreeSpace: this.freeSpace, itemsDropped })
  }

  public async handleNewContent(contentHash: string, expectedSize: number, dataStream: Readable): Promise<void> {
    this.logger.verbose('Handling new content', {
      contentHash,
      expectedSize,
    })

    // Trigger cache eviction if required
    if (this.freeSpace < expectedSize) {
      await this.evictCacheUntilFreeSpaceReached(expectedSize)
    }

    // Reserve space for the new object
    this.contentSizeSum += expectedSize
    this.logger.verbose('Reserved space for new data object', {
      contentHash,
      expectedSize,
      newContentSizeSum: this.contentSizeSum,
    })

    // Return a promise that resolves when the new file is created
    return new Promise<void>((resolve, reject) => {
      const fileStream = this.createWriteStream(contentHash)

      let bytesRecieved = 0

      pipeline(dataStream, fileStream, async (err) => {
        const { bytesWritten } = fileStream
        const logMetadata = {
          contentHash,
          expectedSize,
          bytesRecieved,
          bytesWritten,
        }
        if (err) {
          this.logger.error(`Error while processing content data stream`, {
            err,
            ...logMetadata,
          })
          this.drop(contentHash)
          reject(err)
        } else {
          if (bytesWritten === bytesRecieved && bytesWritten === expectedSize) {
            const mimeType = await this.guessMimeType(contentHash)
            this.logger.info('New content accepted', { ...logMetadata })
            this.stateCache.dropPendingDownload(contentHash)
            this.stateCache.newContent(contentHash, expectedSize)
            this.stateCache.setContentMimeType(contentHash, mimeType)
          } else {
            this.logger.error('Content rejected: Bytes written/recieved/expected mismatch!', {
              ...logMetadata,
            })
            this.drop(contentHash)
          }
        }
      })

      fileStream.on('open', () => {
        // Note: The promise is resolved on "ready" event, since that's what's awaited in the current flow
        resolve()
      })

      dataStream.on('data', (chunk) => {
        bytesRecieved += chunk.length
        if (bytesRecieved > expectedSize) {
          dataStream.destroy(new Error('Unexpected content size: Too much data recieved from source!'))
        }
      })
    })
  }
}
