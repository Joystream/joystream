import { Logger } from 'winston'
import { ReadonlyConfig, StorageNodeDownloadResponse } from '../../types'
import { LoggingService } from '../logging'
import fs from 'fs'

// LRU-SP cache parameters
// Since size is in KB, these parameters should be enough for grouping objects of size up to 2^24 KB = 16 GB
// TODO: Intoduce MAX_CACHED_ITEM_SIZE and skip caching for large objects entirely? (ie. 10 GB objects)
export const CACHE_GROUP_LOG_BASE = 2
export const CACHE_GROUPS_COUNT = 24

export interface PendingDownloadData {
  objectSize: number
  promise: Promise<StorageNodeDownloadResponse>
}

export interface StorageNodeEndpointData {
  responseTimes: number[]
}

export interface CacheItemData {
  sizeKB: number
  popularity: number
  lastAccessTime: number
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
    groupNumberByContentHash: new Map<string, number>(),
    lruCacheGroups: Array.from({ length: CACHE_GROUPS_COUNT }).map(() => new Map<string, CacheItemData>()),
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

  private calcCacheGroup({ sizeKB, popularity }: CacheItemData) {
    return Math.min(
      Math.max(Math.ceil(Math.log(sizeKB / popularity) / Math.log(CACHE_GROUP_LOG_BASE)), 0),
      CACHE_GROUPS_COUNT - 1
    )
  }

  public newContent(contentHash: string, sizeInBytes: number): void {
    const cacheItemData: CacheItemData = {
      popularity: 1,
      lastAccessTime: Date.now(),
      sizeKB: Math.ceil(sizeInBytes / 1024),
    }
    const groupNumber = this.calcCacheGroup(cacheItemData)
    this.storedState.groupNumberByContentHash.set(contentHash, groupNumber)
    this.storedState.lruCacheGroups[groupNumber].set(contentHash, cacheItemData)
  }

  public useContent(contentHash: string): void {
    const groupNumber = this.storedState.groupNumberByContentHash.get(contentHash)
    if (groupNumber === undefined) {
      this.logger.warn('groupNumberByContentHash missing when trying to update LRU of content', { contentHash })
      return
    }
    const group = this.storedState.lruCacheGroups[groupNumber]
    const cacheItemData = group.get(contentHash)
    if (!cacheItemData) {
      this.logger.warn('Cache inconsistency: item missing in group retrieved from by groupNumberByContentHash map!', {
        contentHash,
        groupNumber,
      })
      this.storedState.groupNumberByContentHash.delete(contentHash)
      return
    }
    cacheItemData.lastAccessTime = Date.now()
    ++cacheItemData.popularity
    // Move object to the top of the current group / new group
    const targetGroupNumber = this.calcCacheGroup(cacheItemData)
    const targetGroup = this.storedState.lruCacheGroups[targetGroupNumber]
    group.delete(contentHash)
    targetGroup.set(contentHash, cacheItemData)
    if (targetGroupNumber !== groupNumber) {
      this.storedState.groupNumberByContentHash.set(contentHash, targetGroupNumber)
    }
  }

  public getCacheEvictCandidateHash(): string | null {
    let highestCost = 0
    let bestCandidate: string | null = null
    for (const group of this.storedState.lruCacheGroups) {
      const lastItemInGroup = Array.from(group.entries())[0]
      const [contentHash, objectData] = lastItemInGroup
      const elapsedSinceLastAccessed = Math.ceil((Date.now() - objectData.lastAccessTime) / 60_000)
      const itemCost = (elapsedSinceLastAccessed * objectData.sizeKB) / objectData.popularity
      if (itemCost >= highestCost) {
        highestCost = itemCost
        bestCandidate = contentHash
      }
    }
    return bestCandidate
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
    this.memoryState.pendingDownloadsByContentHash.delete(contentHash)
    const cacheGroupNumber = this.storedState.groupNumberByContentHash.get(contentHash)
    if (cacheGroupNumber) {
      this.storedState.groupNumberByContentHash.delete(contentHash)
      this.storedState.lruCacheGroups[cacheGroupNumber].delete(contentHash)
    }
  }

  public setStorageNodeEndpointResponseTime(endpoint: string, time: number): void {
    const data = this.memoryState.storageNodeEndpointDataByEndpoint.get(endpoint) || { responseTimes: [] }
    data.responseTimes.push(time)
  }

  public getStorageNodeEndpointData(endpoint: string): StorageNodeEndpointData | undefined {
    return this.memoryState.storageNodeEndpointDataByEndpoint.get(endpoint)
  }

  private serializeData() {
    const { groupNumberByContentHash, lruCacheGroups, mimeTypeByContentHash } = this.storedState
    return JSON.stringify({
      lruCacheGroups: lruCacheGroups.map((g) => Array.from(g.entries())),
      mimeTypeByContentHash: Array.from(mimeTypeByContentHash.entries()),
      groupNumberByContentHash: Array.from(groupNumberByContentHash.entries()),
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
      this.storedState.lruCacheGroups = (fileContent.lruCacheGroups || []).map(
        (g: any) => new Map<string, CacheItemData>(g)
      )
      this.storedState.groupNumberByContentHash = new Map<string, number>(fileContent.groupNumberByContentHash || [])
      this.storedState.mimeTypeByContentHash = new Map<string, string>(fileContent.mimeTypeByContentHash || [])
    } else {
      this.logger.warn(`Cache file (${this.cacheFilePath}) is empty. Starting from scratch`)
    }
  }

  public clearInterval(): void {
    clearInterval(this.saveInterval)
  }
}
