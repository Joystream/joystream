import AwaitLock from 'await-lock'
import fs from 'fs'
import path from 'path'
import logger from '../logger'
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
 * @param tempDirName - temp directory name
 */
export async function loadDataObjectIdCache(uploadDir: string, tempDirName: string): Promise<void> {
  await lock.acquireAsync()

  const localIds = await getLocalFileNames(uploadDir)
  // Filter temporary directory name.
  const tempDirectoryName = path.parse(tempDirName).name
  const ids = localIds.filter((dataObjectId) => dataObjectId !== tempDirectoryName)

  ids.map((id) => idCache.set(id, 0))

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

  idCache.set(dataObjectId, 0)

  lock.release()
}

/**
 * Pins data object ID in the local cache (increments the data object usage).
 *
 * @param dataObjectId - Storage data object ID
 *
 * @returns empty promise.
 */
export async function pinDataObjectIdToCache(dataObjectId: string): Promise<void> {
  await lock.acquireAsync()
  const currentPinnedCount = idCache.get(dataObjectId) || 0
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
  const currentPinnedCount = idCache.get(dataObjectId)
  idCache.set(dataObjectId, currentPinnedCount ? currentPinnedCount - 1 : 0)
  lock.release()
}

/**
 * Deletes data object ID from the local cache.
 *
 * @param dataObjectId - Storage data object ID
 */
export async function deleteDataObjectIdFromCache(dataObjectId: string): Promise<void> {
  await lock.acquireAsync()

  idCache.delete(dataObjectId)

  lock.release()
}

/**
 * Get data object ID from the local cache.
 *
 * @param dataObjectId - Storage data object ID
 */
export async function getDataObjectIdFromCache(
  dataObjectId: string
): Promise<{ dataObjectId: DataObjectId; pinnedCount: DataObjectPinCount } | undefined> {
  if (idCache.has(dataObjectId)) {
    await lock.acquireAsync()
    const id = { dataObjectId, pinnedCount: idCache.get(dataObjectId) as DataObjectPinCount }
    lock.release()
    return id
  }

  return undefined
}

/**
 * Returns file names from the local directory.
 *
 * @param directory - local directory to get file names from
 */
function getLocalFileNames(directory: string): Promise<string[]> {
  return fsPromises.readdir(directory)
}
