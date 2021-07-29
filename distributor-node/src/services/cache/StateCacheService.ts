import { Logger } from 'winston'
import { ReadonlyConfig, StorageNodeDownloadResponse } from '../../types'
import { LoggingService } from '../logging'
import fs from 'fs'

export interface PendingDownloadData {
  objectSize: number
  promise: Promise<StorageNodeDownloadResponse>
}

export interface StorageNodeEndpointData {
  responseTimes: number[]
}

export class StateCacheService {
  private logger: Logger
  private config: ReadonlyConfig
  private cacheFilePath: string
  private saveInterval: NodeJS.Timeout

  private memoryState = {
    pendingDownloadsByContentHash: new Map<string, PendingDownloadData>(),
    contentHashByObjectId: new Map<string, string>(),
    storageNodeEndpointDataByEndpoint: new Map<string, StorageNodeEndpointData>(),
  }

  private storedState = {
    lruContentHashes: new Set<string>(),
    mimeTypeByContentHash: new Map<string, string>(),
  }

  public constructor(config: ReadonlyConfig, logging: LoggingService, saveIntervalMs = 60 * 1000) {
    this.logger = logging.createLogger('StateCacheService')
    this.cacheFilePath = `${config.directories.cache}/cache.json`
    this.config = config
    this.saveInterval = setInterval(() => this.save(), saveIntervalMs)
  }

  public setContentMimeType(contentHash: string, mimeType: string): void {
    this.storedState.mimeTypeByContentHash.set(contentHash, mimeType)
  }

  public getContentMimeType(contentHash: string): string | undefined {
    return this.storedState.mimeTypeByContentHash.get(contentHash)
  }

  public setObjectContentHash(objectId: string, hash: string): void {
    this.memoryState.contentHashByObjectId.set(objectId, hash)
  }

  public getObjectContentHash(objectId: string): string | undefined {
    return this.memoryState.contentHashByObjectId.get(objectId)
  }

  public useContent(contentHash: string): void {
    if (this.storedState.lruContentHashes.has(contentHash)) {
      this.storedState.lruContentHashes.delete(contentHash)
    }
    this.storedState.lruContentHashes.add(contentHash)
  }

  public newPendingDownload(
    contentHash: string,
    objectSize: number,
    promise: Promise<StorageNodeDownloadResponse>
  ): PendingDownloadData {
    const pendingDownload: PendingDownloadData = {
      objectSize,
      promise,
    }
    this.memoryState.pendingDownloadsByContentHash.set(contentHash, pendingDownload)
    return pendingDownload
  }

  public getPendingDownload(contentHash: string): PendingDownloadData | undefined {
    return this.memoryState.pendingDownloadsByContentHash.get(contentHash)
  }

  public dropPendingDownload(contentHash: string): void {
    this.memoryState.pendingDownloadsByContentHash.delete(contentHash)
  }

  public dropByHash(contentHash: string): void {
    this.storedState.mimeTypeByContentHash.delete(contentHash)
    this.storedState.lruContentHashes.delete(contentHash)
  }

  public setStorageNodeEndpointResponseTime(endpoint: string, time: number): void {
    const data = this.memoryState.storageNodeEndpointDataByEndpoint.get(endpoint) || { responseTimes: [] }
    data.responseTimes.push(time)
  }

  public getStorageNodeEndpointData(endpoint: string): StorageNodeEndpointData | undefined {
    return this.memoryState.storageNodeEndpointDataByEndpoint.get(endpoint)
  }

  private serializeData() {
    const { lruContentHashes, mimeTypeByContentHash } = this.storedState
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
      this.storedState.lruContentHashes = new Set<string>(fileContent.lruContentHashes || [])
      this.storedState.mimeTypeByContentHash = new Map<string, string>(fileContent.mimeTypeByContentHash || [])
    } else {
      this.logger.warn(`Cache file (${this.cacheFilePath}) is empty. Starting from scratch`)
    }
  }

  public clearInterval(): void {
    clearInterval(this.saveInterval)
  }
}
