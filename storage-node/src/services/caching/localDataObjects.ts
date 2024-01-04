import AwaitLock from 'await-lock'
import fs from 'fs'
import logger from '../logger'
const fsPromises = fs.promises

// Local in-memory cache for IDs.
const idCache = new Set<string>()

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
export async function loadDataObjectIdCache(uploadDir: string): Promise<void> {
  await lock.acquireAsync()

  const names = await getLocalFileNames(uploadDir)

  names
    // Just incase the directory is polluted with other files,
    // filter out filenames that do not match with an objectid (number)
    .filter((name) => Number.isInteger(Number(name)))
    .forEach((id) => idCache.add(id))

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
 * Returns file names from the local directory, ignoring subfolders.
 *
 * @param directory - local directory to get file names from
 */
async function getLocalFileNames(directory: string): Promise<string[]> {
  const result = await fsPromises.readdir(directory, { withFileTypes: true })
  return result.filter((entry) => entry.isFile()).map((entry) => entry.name)
}
