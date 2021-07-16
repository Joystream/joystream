import { Logger } from 'winston'
import { ReadonlyConfig } from '../../types'
import { LoggingService } from '../logging'
import fs from 'fs'

export interface PendingDownloadData {
  objectSize: number
  availableEndpoints: string[]
  pendingAvailabilityEndpointsCount: number
  downloadAttempts: number
  isAttemptPending: boolean
}

export class StateCacheService {
  private logger: Logger
  private config: ReadonlyConfig
  private cacheFilePath: string
  private saveInterval: NodeJS.Timeout
  private cacheData = {
    lruContentHashes: new Set<string>(),
    pendingDownloadsByContentHash: new Map<string, PendingDownloadData>(),
    mimeTypeByContentHash: new Map<string, string>(),
    contentHashByObjectId: new Map<string, string>(),
  }

  public constructor(config: ReadonlyConfig, logging: LoggingService, saveIntervalMs = 60 * 1000) {
    this.logger = logging.createLogger('StateCacheService')
    this.cacheFilePath = `${config.directories.cache}/cache.json`
    this.config = config
    this.saveInterval = setInterval(() => this.save(), saveIntervalMs)
  }

  public setContentMimeType(contentHash: string, mimeType: string): void {
    this.cacheData.mimeTypeByContentHash.set(contentHash, mimeType)
  }

  public getContentMimeType(contentHash: string): string | undefined {
    return this.cacheData.mimeTypeByContentHash.get(contentHash)
  }

  public setObjectContentHash(objectId: string, hash: string): void {
    this.cacheData.contentHashByObjectId.set(objectId, hash)
  }

  public getObjectContentHash(objectId: string): string | undefined {
    return this.cacheData.contentHashByObjectId.get(objectId)
  }

  public useContent(contentHash: string): void {
    if (this.cacheData.lruContentHashes.has(contentHash)) {
      this.cacheData.lruContentHashes.delete(contentHash)
    }
    this.cacheData.lruContentHashes.add(contentHash)
  }

  public newPendingDownload(contentHash: string, objectSize: number): PendingDownloadData {
    const pendingDownload: PendingDownloadData = {
      objectSize,
      availableEndpoints: [],
      pendingAvailabilityEndpointsCount: 0,
      downloadAttempts: 0,
      isAttemptPending: false,
    }
    this.cacheData.pendingDownloadsByContentHash.set(contentHash, pendingDownload)
    return pendingDownload
  }

  public getPendingDownload(contentHash: string): PendingDownloadData | undefined {
    return this.cacheData.pendingDownloadsByContentHash.get(contentHash)
  }

  public dropPendingDownload(contentHash: string): void {
    this.cacheData.pendingDownloadsByContentHash.delete(contentHash)
  }

  public dropByHash(contentHash: string): void {
    this.cacheData.mimeTypeByContentHash.delete(contentHash)
    this.cacheData.lruContentHashes.delete(contentHash)
  }

  private serializeData() {
    // Only serializes data we can't easily reproduce during startup
    const { lruContentHashes, mimeTypeByContentHash } = this.cacheData
    return JSON.stringify({
      lruContentHashes: Array.from(lruContentHashes),
      mimeTypeByContentHash: Array.from(mimeTypeByContentHash.entries()),
    })
  }

  public async save(): Promise<boolean> {
    return new Promise((resolve) => {
      const serialized = this.serializeData()
      const fd = fs.openSync(this.cacheFilePath, 'w')
      fs.write(fd, serialized, (err) => {
        fs.closeSync(fd)
        if (err) {
          this.logger.error('Cache file save error', { err })
          resolve(false)
        } else {
          this.logger.info('Cache file updated')
          resolve(true)
        }
      })
    })
  }

  public saveSync(): void {
    const serialized = this.serializeData()
    fs.writeFileSync(this.cacheFilePath, serialized)
  }

  public load(): void {
    if (fs.existsSync(this.cacheFilePath)) {
      this.logger.info('Loading cache from file', { file: this.cacheFilePath })
      const fileContent = JSON.parse(fs.readFileSync(this.cacheFilePath).toString())
      this.cacheData.lruContentHashes = new Set<string>(fileContent.lruContentHashes || [])
      this.cacheData.mimeTypeByContentHash = new Map<string, string>(fileContent.mimeTypeByContentHash || [])
    } else {
      this.logger.warn(`Cache file (${this.cacheFilePath}) is empty. Starting from scratch`)
    }
  }

  public clearInterval(): void {
    clearInterval(this.saveInterval)
  }
}
