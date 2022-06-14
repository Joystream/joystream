import AwaitLock from 'await-lock'
import path from 'path'
import fs from 'fs'
import logger from '../logger'
const fsPromises = fs.promises

// Local in-memory cache for IDs.
let idCache = new Set<string>()

const lock = new AwaitLock()

/**
 * Return the current ID cache.
 *
 * @returns ID array.
 *
 */
export async function getDataObjectIDs(): Promise<string[]> {
  await lock.acquireAsync()
  const ids = Array.from(idCache)
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

  idCache = new Set(ids)

  logger.debug(`Local ID cache loaded.`)

  lock.release()
}

/**
 * Adds data object ID to the local cache.
 *
 * @param dataObjectId - uploading directory
 *
 * @returns empty promise.
 */
export async function addDataObjectIdToCache(dataObjectId: string): Promise<void> {
  await lock.acquireAsync()

  idCache.add(dataObjectId)

  lock.release()
}

/**
 * Deletes data object ID from the local cache.
 *
 * @param dataObjectId - uploading directory
 */
export async function deleteDataObjectIdFromCache(dataObjectId: string): Promise<void> {
  await lock.acquireAsync()

  idCache.delete(dataObjectId)

  lock.release()
}

/**
 * Returns file names from the local directory.
 *
 * @param directory - local directory to get file names from
 */
function getLocalFileNames(directory: string): Promise<string[]> {
  return fsPromises.readdir(directory)
}
