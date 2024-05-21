import fs from 'fs'
import logger from '../logger'
import assert from 'assert'
import { getStorageProviderConnection, isStorageProviderConnectionEnabled } from '../../commands/server'

const fsPromises = fs.promises

type DataObjectId = string
type DataObjectEntry = {
  pinCount: number
  onLocalVolume: boolean
}

// Local in-memory cache for IDs.
const idCache = new Map<DataObjectId, DataObjectEntry>()

/**
 * Return the current ID cache.
 *
 * @returns ID array.
 *
 */
export function getDataObjectIDs(): string[] {
  return [...idCache.keys()]
}

/**
 * Loads ID cache from the uploading directory.
 *
 * @returns empty promise.
 *
 * @param uploadDir - uploading directory
 */
export async function loadDataObjectIdCache(uploadDir: string): Promise<void> {
  const names = await getLocalFileNames(uploadDir)

  names
    // Just incase the directory is polluted with other files,
    // filter out filenames that do not match with an objectid (number)
    .filter((name) => Number.isInteger(Number(name)))
    .forEach((id) =>
      idCache.set(id, {
        pinCount: 0,
        onLocalVolume: true,
      })
    )

  if (isStorageProviderConnectionEnabled()) {
    return
  }
  const connection = getStorageProviderConnection()!
  const namesOnCloud = await connection.listFilesOnRemoteBucket()
  namesOnCloud
    .filter((name) => Number.isInteger(Number(name)))
    .forEach((id) =>
      idCache.set(id, {
        pinCount: 0,
        onLocalVolume: false,
      })
    )

  logger.debug(`Local ID cache loaded.`)
}

/**
 * Adds data object ID to the local cache.
 *
 * @param dataObjectId - Storage data object ID
 * @param onLocalVolume - flag to indicate if the data object is on the local volume (default true)
 *
 * @returns void
 */
export function addDataObjectIdToCache(dataObjectId: string, onLocalVolume: boolean = true): void {
  assert(typeof dataObjectId === 'string')
  assert(!idCache.has(dataObjectId))
  idCache.set(dataObjectId, {
    pinCount: 0,
    onLocalVolume,
  })
}

/**
 * Pins data object ID in the local cache (increments the data object usage).
 *
 * @param dataObjectId - Storage data object ID
 *
 * @returns void
 */
export function pinDataObjectIdToCache(dataObjectId: string): void {
  assert(typeof dataObjectId === 'string')
  assert(idCache.has(dataObjectId))

  const currentEntry = idCache.get(dataObjectId)
  assert(currentEntry !== undefined)
  idCache.set(dataObjectId, {
    pinCount: currentEntry.pinCount + 1,
    onLocalVolume: currentEntry.onLocalVolume,
  })
}

/**
 * Un-pins data object ID from the local cache (decrements the data object usage).
 *
 * @param dataObjectId - Storage data object ID
 *
 * @returns void
 */
export function unpinDataObjectIdFromCache(dataObjectId: string): void {
  assert(typeof dataObjectId === 'string')
  assert(idCache.has(dataObjectId))

  const currentEntry = idCache.get(dataObjectId)
  assert(currentEntry)
  assert(currentEntry.pinCount > 0)
  idCache.set(dataObjectId, {
    onLocalVolume: currentEntry.onLocalVolume,
    pinCount: currentEntry.pinCount - 1,
  })
}

/**
 * Deletes data object ID from the local cache.
 *
 * @param dataObjectId - Storage data object ID
 *
 * @returns void
 */
export function deleteDataObjectIdFromCache(dataObjectId: string): void {
  assert(typeof dataObjectId === 'string')
  assert(idCache.has(dataObjectId))
  idCache.delete(dataObjectId)
}

/**
 * Get data object ID from the local cache, if present.
 *
 * @param dataObjectId - Storage data object ID
 */
export function getDataObjectIdFromCache(
  dataObjectId: string
): { dataObjectId: DataObjectId; entry: DataObjectEntry } | undefined {
  assert(typeof dataObjectId === 'string')

  if (idCache.has(dataObjectId)) {
    return { dataObjectId, entry: idCache.get(dataObjectId) as DataObjectEntry }
  }
}

/**
 * Checks if data object is present.
 * @param dataObjectId
 * @returns boolean
 */
export function isDataObjectIdInCache(dataObjectId: string): boolean {
  return idCache.has(dataObjectId)
}

/**
 * Returns file names from the local directory, ignoring subfolders.
 *
 * @param directory - local directory to get file names from
 */
async function getLocalFileNames(directory: string): Promise<string[]> {
  const result = await fsPromises.readdir(directory, { withFileTypes: true })
  return result.filter((entry) => entry.isFile()).map((entry) => entry.name)
}
