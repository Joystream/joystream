import { Logger } from 'winston'
import { ReadonlyConfig, StorageNodeDownloadResponse } from '../../types'
import { LoggingService } from '../logging'
import _ from 'lodash'
import fs from 'fs'

// LRU-SP cache parameters
// Since size is in KB, these parameters should be enough for grouping objects of size up to 2^24 KB = 16 GB
// TODO: Intoduce MAX_CACHED_ITEM_SIZE and skip caching for large objects entirely? (ie. 10 GB objects)
export const CACHE_GROUP_LOG_BASE = 2
export const CACHE_GROUPS_COUNT = 24

type PendingDownloadStatus = 'Waiting' | 'LookingForSource' | 'Downloading'

export interface PendingDownloadData {
  objectSize: number
  status: PendingDownloadStatus
  promise: Promise<StorageNodeDownloadResponse>
}

export interface StorageNodeEndpointData {
  last10ResponseTimes: number[]
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
    pendingDownloadsByObjectId: new Map<string, PendingDownloadData>(),
    storageNodeEndpointDataByEndpoint: new Map<string, StorageNodeEndpointData>(),
    groupNumberByObjectId: new Map<string, number>(),
  }

  private storedState = {
    lruCacheGroups: Array.from({ length: CACHE_GROUPS_COUNT }).map(() => new Map<string, CacheItemData>()),
    mimeTypeByObjectId: new Map<string, string>(),
  }

  public constructor(config: ReadonlyConfig, logging: LoggingService, saveIntervalMs = 60 * 1000) {
    this.logger = logging.createLogger('StateCacheService')
    this.cacheFilePath = `${config.directories.cache}/cache.json`
    this.config = config
    this.saveInterval = setInterval(() => this.save(), saveIntervalMs)
  }

  public setContentMimeType(objectId: string, mimeType: string): void {
    this.storedState.mimeTypeByObjectId.set(objectId, mimeType)
  }

  public getContentMimeType(objectId: string): string | undefined {
    return this.storedState.mimeTypeByObjectId.get(objectId)
  }

  private calcCacheGroup({ sizeKB, popularity }: CacheItemData) {
    return Math.min(
      Math.max(Math.ceil(Math.log(sizeKB / popularity) / Math.log(CACHE_GROUP_LOG_BASE)), 0),
      CACHE_GROUPS_COUNT - 1
    )
  }

  public getCachedObjectsIds(): string[] {
    let objectIds: string[] = []
    for (const [, group] of this.storedState.lruCacheGroups.entries()) {
      objectIds = objectIds.concat(Array.from(group.keys()))
    }
    return objectIds
  }

  public getCachedObjectsCount(): number {
    return this.storedState.lruCacheGroups.reduce((a, b) => a + b.size, 0)
  }

  public newContent(objectId: string, sizeInBytes: number): void {
    const { groupNumberByObjectId } = this.memoryState
    const { lruCacheGroups } = this.storedState
    if (groupNumberByObjectId.get(objectId)) {
      this.logger.warn('newContent was called for content that already exists, ignoring the call', { objectId })
      return
    }
    const cacheItemData: CacheItemData = {
      popularity: 1,
      lastAccessTime: Date.now(),
      sizeKB: Math.ceil(sizeInBytes / 1024),
    }
    const groupNumber = this.calcCacheGroup(cacheItemData)
    groupNumberByObjectId.set(objectId, groupNumber)
    lruCacheGroups[groupNumber].set(objectId, cacheItemData)
  }

  public peekContent(objectId: string): CacheItemData | undefined {
    const groupNumber = this.memoryState.groupNumberByObjectId.get(objectId)
    if (groupNumber !== undefined) {
      return this.storedState.lruCacheGroups[groupNumber].get(objectId)
    }
  }

  public useContent(objectId: string): void {
    const { groupNumberByObjectId } = this.memoryState
    const { lruCacheGroups } = this.storedState
    const groupNumber = groupNumberByObjectId.get(objectId)
    if (groupNumber === undefined) {
      this.logger.warn('groupNumberByObjectId missing when trying to update LRU of content', { objectId })
      return
    }
    const group = lruCacheGroups[groupNumber]
    const cacheItemData = group.get(objectId)
    if (!cacheItemData) {
      this.logger.warn('Cache inconsistency: item missing in group retrieved from by groupNumberByObjectId map!', {
        objectId,
        groupNumber,
      })
      groupNumberByObjectId.delete(objectId)
      return
    }
    cacheItemData.lastAccessTime = Date.now()
    ++cacheItemData.popularity
    // Move object to the top of the current group / new group
    const targetGroupNumber = this.calcCacheGroup(cacheItemData)
    const targetGroup = lruCacheGroups[targetGroupNumber]
    group.delete(objectId)
    targetGroup.set(objectId, cacheItemData)
    if (targetGroupNumber !== groupNumber) {
      groupNumberByObjectId.set(objectId, targetGroupNumber)
    }
  }

  public getCacheEvictCandidateObjectId(): string | null {
    let highestCost = 0
    let bestCandidate: string | null = null
    for (const group of this.storedState.lruCacheGroups) {
      const lastItemInGroup = Array.from(group.entries())[0]
      if (lastItemInGroup) {
        const [objectId, objectData] = lastItemInGroup
        const elapsedSinceLastAccessed = Math.ceil((Date.now() - objectData.lastAccessTime) / 60_000)
        const itemCost = (elapsedSinceLastAccessed * objectData.sizeKB) / objectData.popularity
        if (itemCost >= highestCost) {
          highestCost = itemCost
          bestCandidate = objectId
        }
      }
    }
    return bestCandidate
  }

  public newPendingDownload(
    objectId: string,
    objectSize: number,
    promise: Promise<StorageNodeDownloadResponse>
  ): PendingDownloadData {
    const pendingDownload: PendingDownloadData = {
      status: 'Waiting',
      objectSize,
      promise,
    }
    this.memoryState.pendingDownloadsByObjectId.set(objectId, pendingDownload)
    return pendingDownload
  }

  public getPendingDownloadsCount(): number {
    return this.memoryState.pendingDownloadsByObjectId.size
  }

  public getPendingDownload(objectId: string): PendingDownloadData | undefined {
    return this.memoryState.pendingDownloadsByObjectId.get(objectId)
  }

  public dropPendingDownload(objectId: string): void {
    this.memoryState.pendingDownloadsByObjectId.delete(objectId)
  }

  public dropById(objectId: string): void {
    this.logger.debug('Dropping all state by object id', { objectId })
    this.storedState.mimeTypeByObjectId.delete(objectId)
    this.memoryState.pendingDownloadsByObjectId.delete(objectId)
    const cacheGroupNumber = this.memoryState.groupNumberByObjectId.get(objectId)
    this.logger.debug('Cache group by object id established', { objectId, cacheGroupNumber })
    if (cacheGroupNumber) {
      this.memoryState.groupNumberByObjectId.delete(objectId)
      this.storedState.lruCacheGroups[cacheGroupNumber].delete(objectId)
    }
  }

  public setStorageNodeEndpointResponseTime(endpoint: string, time: number): void {
    const data = this.memoryState.storageNodeEndpointDataByEndpoint.get(endpoint) || { last10ResponseTimes: [] }
    if (data.last10ResponseTimes.length === 10) {
      data.last10ResponseTimes.shift()
    }
    data.last10ResponseTimes.push(time)
    if (!this.memoryState.storageNodeEndpointDataByEndpoint.has(endpoint)) {
      this.memoryState.storageNodeEndpointDataByEndpoint.set(endpoint, data)
    }
  }

  public getStorageNodeEndpointMeanResponseTime(endpoint: string, max = 99999): number {
    const data = this.memoryState.storageNodeEndpointDataByEndpoint.get(endpoint)
    return _.mean(data?.last10ResponseTimes || [max])
  }

  public getStorageNodeEndpointsMeanResponseTimes(max = 99999): [string, number][] {
    return Array.from(this.memoryState.storageNodeEndpointDataByEndpoint.keys()).map((endpoint) => [
      endpoint,
      this.getStorageNodeEndpointMeanResponseTime(endpoint, max),
    ])
  }

  private serializeData() {
    const { lruCacheGroups, mimeTypeByObjectId } = this.storedState
    return JSON.stringify(
      {
        lruCacheGroups: lruCacheGroups.map((g) => Array.from(g.entries())),
        mimeTypeByObjectId: Array.from(mimeTypeByObjectId.entries()),
      },
      null,
      2 // TODO: Only for debugging
    )
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
          this.logger.verbose('Cache file updated')
          resolve(true)
        }
      })
    })
  }

  public saveSync(): void {
    const serialized = this.serializeData()
    fs.writeFileSync(this.cacheFilePath, serialized)
  }

  private loadGroupNumberByObjectIdMap() {
    const objectIds = _.uniq(this.getCachedObjectsIds())
    const { lruCacheGroups: groups } = this.storedState
    const { groupNumberByObjectId } = this.memoryState

    objectIds.forEach((objectId) => {
      groups.forEach((group, groupNumber) => {
        if (group.has(objectId)) {
          if (!groupNumberByObjectId.has(objectId)) {
            groupNumberByObjectId.set(objectId, groupNumber)
          } else {
            // Content duplicated in multiple groups - remove!
            this.logger.warn(
              `Object id ${objectId} was found in in multiple lru cache groups. Removing from group ${groupNumber}...`,
              { firstGroup: groupNumberByObjectId.get(objectId), currentGroup: groupNumber }
            )
            group.delete(objectId)
          }
        }
      })
    })
  }

  public load(): void {
    if (fs.existsSync(this.cacheFilePath)) {
      this.logger.info('Loading cache from file', { file: this.cacheFilePath })
      try {
        const fileContent = JSON.parse(fs.readFileSync(this.cacheFilePath).toString())
        ;((fileContent.lruCacheGroups || []) as Array<Array<[string, CacheItemData]>>).forEach((group, groupIndex) => {
          this.storedState.lruCacheGroups[groupIndex] = new Map<string, CacheItemData>(group)
        })
        this.storedState.mimeTypeByObjectId = new Map<string, string>(fileContent.mimeTypeByObjectId || [])
        this.loadGroupNumberByObjectIdMap()
      } catch (err) {
        this.logger.error('Error while trying to load data from cache file! Will start from scratch', {
          file: this.cacheFilePath,
          err,
        })
      }
    } else {
      this.logger.warn(`Cache file (${this.cacheFilePath}) is empty. Starting from scratch`)
    }
  }

  public clearInterval(): void {
    clearInterval(this.saveInterval)
  }
}
