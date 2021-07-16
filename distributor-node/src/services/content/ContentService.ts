import fs from 'fs'
import { ReadonlyConfig } from '../../types'
import { StateCacheService } from '../cache/StateCacheService'
import { LoggingService } from '../logging'
import { Logger } from 'winston'
import { FileContinousReadStream, FileContinousReadStreamOptions } from './FileContinousReadStream'
import { DataObjectData } from '../../types/dataObject'
import readChunk from 'read-chunk'
import FileType from 'file-type'
import _ from 'lodash'

export const DEFAULT_CONTENT_TYPE = 'application/octet-stream'

export class ContentService {
  private config: ReadonlyConfig
  private dataDir: string
  private logger: Logger
  private stateCache: StateCacheService

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
    return fs.createWriteStream(this.path(contentHash))
  }

  public createContinousReadStream(
    contentHash: string,
    options: FileContinousReadStreamOptions
  ): FileContinousReadStream {
    return new FileContinousReadStream(this.path(contentHash), options)
  }

  public async guessMimeType(contentHash: string): Promise<string> {
    const chunk = await readChunk(this.path(contentHash), 0, 4100)
    const guessResult = await FileType.fromBuffer(chunk)
    return guessResult?.mime || DEFAULT_CONTENT_TYPE
  }
}
