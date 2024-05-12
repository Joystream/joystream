import fs from 'fs'
import logger from '../logger'
import assert from 'assert'
import { ServerConfig, isCloudEnabled } from 'src/commands/server'

const fsPromises = fs.promises

type DataObjectId = string
type DataObjectPinCount = number

export type DataObjectEntry = {
  accepted: boolean
  isOnLocalVolume: boolean
  pinCount: DataObjectPinCount
}

/**
 * Represents a cache for storing data object IDs and their corresponding entries.
 * The most trivial and current implementation is a in memory map, if necessary however we can adapt this to a external cache db
 */
export interface IDataObjectIdCache {
  /**
   * Returns an iterator of all the data object IDs in the cache.
   * @returns An iterator of data object IDs.
   */
  keys(): Promise<IterableIterator<DataObjectId>>

  /**
   * Checks if the cache contains the specified data object ID.
   * @param id - The data object ID to check.
   * @returns `true` if the cache contains the ID, `false` otherwise.
   */
  has(id: DataObjectId): boolean

  /**
   * Retrieves the entry associated with the specified data object ID from the cache.
   * @param id - The data object ID to retrieve the entry for.
   * @returns The entry associated with the ID, or `undefined` if the ID is not found in the cache.
   */
  get(id: DataObjectId): Promise<DataObjectEntry | undefined>

  /**
   * Sets the entry for the specified data object ID in the cache.
   * @param id - The data object ID to set the entry for.
   * @param entry - The entry to set.
   */
  set(id: DataObjectId, entry: DataObjectEntry): Promise<void>

  /**
   * Deletes the entry associated with the specified data object ID from the cache.
   * @param id - The data object ID to delete the entry for.
   * @returns `true` if the entry was successfully deleted, `false` otherwise.
   */
  delete(id: DataObjectId): Promise<boolean>

  /**
   * Initializes the cache, allowing for custom logic to set up the database connection eventually.
   * @returns A promise that resolves when the cache is initialized.
   */
  init(): Promise<void>

  /**
   * Checks if the cache is ready, i.e., connected to a database.
   * @returns `true` if the cache is ready, `false` otherwise.
   */
  get isReady(): boolean
}

export class DataObjectIdCacheMap implements IDataObjectIdCache {
  private cache: Map<DataObjectId, DataObjectEntry> = new Map<DataObjectId, DataObjectEntry>()

  public keys(): Promise<IterableIterator<DataObjectId>> {
    return Promise.resolve(this.cache.keys())
  }

  public has(id: DataObjectId): boolean {
    return this.cache.has(id)
  }

  public get(id: DataObjectId): Promise<DataObjectEntry | undefined> {
    return Promise.resolve(this.cache.get(id))
  }

  public set(id: DataObjectId, entry: DataObjectEntry): Promise<void> {
    this.cache.set(id, entry)
    return Promise.resolve()
  }

  public delete(id: DataObjectId): Promise<boolean> {
    return Promise.resolve(this.cache.delete(id))
  }

  public init(): Promise<void> {
    return Promise.resolve() // no need for initialization/connection
  }

  get isReady(): boolean {
    return true
  }
}

// @todo : turn this into a singleton
/**
 * Represents a class that manages local data objects and their caching.
 */
export class LocalDataObjects {
  private idCache: IDataObjectIdCache

  constructor(idCache: IDataObjectIdCache) {
    this.idCache = idCache
  }

  /**
   * Return the current ID cache.
   *
   * @returns ID array.
   *
   */
  public async getDataObjectIDs(): Promise<string[]> {
    const ids = await this.idCache.keys()
    return [...ids]
  }

  /**
   * Loads ID cache from the uploading directory.
   *
   * @returns empty promise.
   *
   * @param uploadDir - uploading directory
   */
  public async loadDataObjectIdCache(serverConfig: ServerConfig): Promise<void> {
    const names = await this.getLocalFileNames(serverConfig.assetsFolder)

    names
      // Just incase the directory is polluted with other files,
      // filter out filenames that do not match with an objectid (number)
      .filter((name) => Number.isInteger(Number(name)))
      .forEach((id) =>
        this.idCache.set(id, {
          accepted: true,
          isOnLocalVolume: true,
          pinCount: 0,
        })
      )

    if (isCloudEnabled(serverConfig)) {
      const cloudNames = await serverConfig.connection!.listFilesOnRemoteBucketAsync()
      cloudNames
        .filter((name) => Number.isInteger(Number(name)))
        .forEach((id) =>
          this.idCache.set(id, {
            accepted: true,
            isOnLocalVolume: false,
            pinCount: 0,
          })
        )
    }

    logger.debug(`Local ID cache loaded.`)
  }

  /**
   * Adds data object ID to the local cache.
   *
   * @param dataObjectId - Storage data object ID
   *
   * @returns void
   */
  public async addDataObjectIdToCache(dataObjectId: string, isOnLocalVolume = true): Promise<void> {
    assert(typeof dataObjectId === 'string')
    assert(!this.idCache.has(dataObjectId))
    await this.idCache.set(dataObjectId, {
      accepted: false,
      isOnLocalVolume,
      pinCount: 0,
    })
  }

  /**
   * Pins data object ID in the local cache (increments the data object usage).
   *
   * @param dataObjectId - Storage data object ID
   *
   * @returns void
   */
  public async pinDataObjectIdToCache(dataObjectId: string): Promise<void> {
    assert(typeof dataObjectId === 'string')
    assert(this.idCache.has(dataObjectId))

    const currentEntry = await this.idCache.get(dataObjectId)
    assert(currentEntry !== undefined)
    await this.idCache.set(dataObjectId, {
      accepted: currentEntry.accepted,
      isOnLocalVolume: currentEntry.isOnLocalVolume,
      pinCount: currentEntry.pinCount + 1,
    })
  }

  /**
   * Un-pins data object ID from the local cache (decrements the data object usage).
   *
   * @param dataObjectId - Storage data object ID
   *
   * @returns void
   */
  public async unpinDataObjectIdFromCache(dataObjectId: string): Promise<void> {
    assert(typeof dataObjectId === 'string')
    assert(this.idCache.has(dataObjectId))

    const entry = await this.idCache.get(dataObjectId)
    assert(entry)
    assert(entry.pinCount > 0)
    await this.idCache.set(dataObjectId, {
      accepted: entry.accepted,
      isOnLocalVolume: entry.isOnLocalVolume,
      pinCount: entry.pinCount - 1,
    })
  }

  /**
   * Deletes data object ID from the local cache.
   *
   * @param dataObjectId - Storage data object ID
   *
   * @returns void
   */
  public deleteDataObjectIdFromCache(dataObjectId: string): void {
    assert(typeof dataObjectId === 'string')
    assert(this.idCache.has(dataObjectId))
    this.idCache.delete(dataObjectId)
  }

  /**
   * Get data object ID from the local cache, if present.
   *
   * @param dataObjectId - Storage data object ID
   * @returns Object containing the data object ID and its entry, or undefined if not found.
   */
  public async getDataObjectIdFromCache(
    dataObjectId: string
  ): Promise<{ dataObjectId: DataObjectId; dataObjectEntry: DataObjectEntry } | undefined> {
    assert(typeof dataObjectId === 'string')

    const entry = await this.idCache.get(dataObjectId)
    if (entry !== undefined) {
      return { dataObjectId, dataObjectEntry: entry }
    }
  }

  /**
   * Checks if data object ID is accepted.
   *
   * @param dataObjectId - Storage data object ID
   * @returns true if the data object ID is accepted, false otherwise.
   */
  public async isDataObjectIdAccepted(dataObjectId: string): Promise<boolean> {
    const entry = await this.idCache.get(dataObjectId)
    assert(entry !== undefined)
    return entry.accepted
  }

  /**
   * Sets the data object ID as accepted in the cache.
   *
   * @param dataObjectId - Storage data object ID
   * @returns void
   */
  public async setDataObjectIdAccepted(dataObjectId: string): Promise<void> {
    assert(this.idCache.has(dataObjectId))
    const entry = await this.idCache.get(dataObjectId)
    assert(entry !== undefined)
    this.idCache.set(dataObjectId, {
      accepted: true,
      isOnLocalVolume: entry.isOnLocalVolume,
      pinCount: entry.pinCount,
    })
  }

  /**
   * Checks if data object ID is present in the cache.
   *
   * @param dataObjectId - Storage data object ID
   * @returns true if the data object ID is present, false otherwise.
   */
  public async isDataObjectIdInCache(dataObjectId: string): Promise<boolean> {
    return await this.idCache.has(dataObjectId)
  }

  /**
   * Returns file names from the local directory, ignoring subfolders.
   *
   * @param directory - Local directory to get file names from.
   * @returns A promise that resolves to an array of file names.
   */
  private async getLocalFileNames(directory: string): Promise<string[]> {
    const result = await fsPromises.readdir(directory, { withFileTypes: true })
    return result.filter((entry) => entry.isFile()).map((entry) => entry.name)
  }
}
