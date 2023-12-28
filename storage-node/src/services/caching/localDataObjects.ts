import AwaitLock from 'await-lock'
import fs from 'fs'
import logger from '../logger'
import assert from 'assert'

const fsPromises = fs.promises

type DataObjectId = string
type DataObjectPinCount = number

// Local in-memory cache for IDs.
const idCache = new Map<DataObjectId, DataObjectPinCount>()

const lock = new AwaitLock()

/**
 * Return the current ID cache.
 *
 * @returns ID array.
 *
 */
export async function getDataObjectIDs(): Promise<string[]> {
  await lock.acquireAsync()
  const ids = [...idCache.keys()]
  lock.release()

  return ids
}

/**
 * Loads ID cache from the uploading directory.
 *
 * @returns empty promise.
 *
 * @param uploadDir - uploading directory
 */
export async function loadDataObjectIdCache(uploadDir: string): Promise<void> {
  await lock.acquireAsync()

  const names = await getLocalFileNames(uploadDir)

  names
    // Just incase the directory is polluted with other files,
    // filter out filenames that do not match with an objectid (number)
    .filter((name) => Number.isInteger(Number(name)))
    .forEach((id) => idCache.set(id, 0))

  logger.debug(`Local ID cache loaded.`)

  lock.release()
}

/**
 * Adds data object ID to the local cache.
 *
 * @param dataObjectId - Storage data object ID
 *
 * @returns empty promise.
 */
export async function addDataObjectIdToCache(dataObjectId: string): Promise<void> {
  await lock.acquireAsync()
  assert(typeof dataObjectId === 'string')
  assert(!idCache.has(dataObjectId))

  idCache.set(dataObjectId, 0)
  lock.release()
}

/**
 * Pins data object ID in the local cache (increments the data object usage).
 *
 * @param dataObjectId - Storage data object ID
 *
 * @returns promise<boolean> - true if object exists and was pinned
 */
export async function pinDataObjectIdToCache(dataObjectId: string): Promise<void> {
  await lock.acquireAsync()
  assert(typeof dataObjectId === 'string')
  assert(idCache.has(dataObjectId))

  const currentPinnedCount = idCache.get(dataObjectId)
  assert(currentPinnedCount !== undefined)
  idCache.set(dataObjectId, currentPinnedCount + 1)

  lock.release()
}

/**
 * Un-pins data object ID from the local cache (decrements the data object usage).
 *
 * @param dataObjectId - Storage data object ID
 *
 * @returns empty promise.
 */
export async function unpinDataObjectIdFromCache(dataObjectId: string): Promise<void> {
  await lock.acquireAsync()
  assert(typeof dataObjectId === 'string')
  assert(idCache.has(dataObjectId))

  const currentPinnedCount = idCache.get(dataObjectId)
  assert(currentPinnedCount)
  assert(currentPinnedCount > 0)
  idCache.set(dataObjectId, currentPinnedCount - 1)

  lock.release()
}

/**
 * Deletes data object ID from the local cache.
 *
 * @param dataObjectId - Storage data object ID
 */
export async function deleteDataObjectIdFromCache(dataObjectId: string): Promise<void> {
  await lock.acquireAsync()
  assert(typeof dataObjectId === 'string')
  assert(idCache.has(dataObjectId))

  idCache.delete(dataObjectId)

  lock.release()
}

/**
 * Get data object ID from the local cache, if present.
 *
 * @param dataObjectId - Storage data object ID
 */
export async function getDataObjectIdFromCache(
  dataObjectId: string
): Promise<{ dataObjectId: DataObjectId; pinnedCount: DataObjectPinCount } | undefined> {
  await lock.acquireAsync()
  assert(typeof dataObjectId === 'string')

  if (idCache.has(dataObjectId)) {
    const id = { dataObjectId, pinnedCount: idCache.get(dataObjectId) as DataObjectPinCount }
    lock.release()
    return id
  }
  lock.release()
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
