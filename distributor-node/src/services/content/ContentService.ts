import fs from 'fs'
import { ReadonlyConfig, DataObjectData } from '../../types'
import { StateCacheService } from '../cache/StateCacheService'
import { LoggingService } from '../logging'
import { Logger } from 'winston'
import { FileContinousReadStream, FileContinousReadStreamOptions } from './FileContinousReadStream'
import FileType from 'file-type'
import _ from 'lodash'
import { Readable } from 'stream'

export const DEFAULT_CONTENT_TYPE = 'application/octet-stream'

export class ContentService {
  private config: ReadonlyConfig
  private dataDir: string
  private logger: Logger
  private stateCache: StateCacheService

  private contentSizeSum = 0 // TODO: Assign on startup

  private get freeSpace(): number {
    return this.config.storageLimit - this.contentSizeSum
  }

  public constructor(config: ReadonlyConfig, logging: LoggingService, stateCache: StateCacheService) {
    this.config = config
    this.logger = logging.createLogger('ContentService')
    this.stateCache = stateCache
    this.dataDir = config.directories.data
  }

  public async startupSync(supportedObjects: DataObjectData[]): Promise<void> {
    const dataObjectsByHash = _.groupBy(supportedObjects, (o) => o.contentHash)
    const dataDirFiles = fs.readdirSync(this.dataDir)
    for (const contentHash of dataDirFiles) {
      this.logger.verbose('Checking content file', { contentHash })
      const objectsByHash = dataObjectsByHash[contentHash] || []
      if (!objectsByHash.length) {
        this.drop(contentHash, 'Not supported')
        return
      }
      const { size } = objectsByHash[0]
      const fileSize = fs.statSync(this.path(contentHash)).size
      if (fileSize !== size) {
        this.drop(contentHash, 'Invalid file size')
        return
      }
      if (!this.stateCache.getContentMimeType(contentHash)) {
        this.stateCache.setContentMimeType(contentHash, await this.guessMimeType(contentHash))
      }
      objectsByHash.forEach(({ contentHash, objectId }) => {
        this.stateCache.setObjectContentHash(objectId, contentHash)
      })
    }
  }

  public drop(contentHash: string, reason?: string): void {
    this.logger.info('Dropping content', { contentHash, reason })
    fs.unlinkSync(this.path(contentHash))
    this.stateCache.dropByHash(contentHash)
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

  private dropCacheItemsUntilFreeSpaceReached(expectedFreeSpace: number): void {
    let evictCandidateHash: string | null
    while ((evictCandidateHash = this.stateCache.getCacheEvictCandidateHash())) {
      this.drop(evictCandidateHash)
      if (this.freeSpace === expectedFreeSpace) {
        return
      }
    }
  }

  public handleNewContent(contentHash: string, expectedSize: number, dataStream: Readable): Promise<boolean> {
    return new Promise((resolve, reject) => {
      if (this.freeSpace < expectedSize) {
        this.dropCacheItemsUntilFreeSpaceReached(expectedSize)
      }

      const fileStream = this.createWriteStream(contentHash)

      let bytesRecieved = 0

      // TODO: Use NodeJS pipeline for easier error handling (https://nodejs.org/es/docs/guides/backpressuring-in-streams/#the-problem-with-data-handling)

      fileStream.on('ready', () => {
        dataStream.pipe(fileStream)
        // Attach handler after pipe, otherwise some data will be lost!
        dataStream.on('data', (chunk) => {
          bytesRecieved += chunk.length
          if (bytesRecieved > expectedSize) {
            dataStream.destroy(new Error('Unexpected content size: Too much data recieved from source!'))
          }
        })
        // Note: The promise is resolved on "ready" event, since that's what's awaited in the current flow
        resolve(true)
      })

      dataStream.on('error', (e) => {
        fileStream.destroy(e)
      })

      fileStream.on('error', (err) => {
        reject(err)
        this.logger.error(`Content data stream error`, {
          err,
          contentHash,
          expectedSize,
          bytesRecieved,
        })
        this.drop(contentHash)
      })

      fileStream.on('close', async () => {
        const { bytesWritten } = fileStream
        if (bytesWritten === bytesRecieved && bytesWritten === expectedSize) {
          this.logger.info('New content accepted', { contentHash, bytesRecieved, written: bytesWritten })
          this.stateCache.dropPendingDownload(contentHash)
          const mimeType = await this.guessMimeType(contentHash)
          this.stateCache.newContent(contentHash, expectedSize)
          this.stateCache.setContentMimeType(contentHash, mimeType)
        } else {
          this.logger.error('Content rejected: Bytes written/recieved/expected mismatch!', {
            contentHash,
            expectedSize,
            bytesWritten,
            bytesRecieved,
          })
          this.drop(contentHash)
        }
      })
    })
  }
}
