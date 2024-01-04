import fs from 'fs'
import logger from '../logger'
const fsPromises = fs.promises

// Local in-memory cache for IDs.
const idCache = new Set<string>()

/**
 * Return the current ID cache.
 *
 * @returns ID array.
 *
 */
export function getDataObjectIDs(): string[] {
  return Array.from(idCache)
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
  const names = await getLocalFileNames(uploadDir)

  names
    // Just incase the directory is polluted with other files,
    // filter out filenames that do not match with an objectid (number)
    .filter((name) => Number.isInteger(Number(name)))
    .forEach((id) => idCache.add(id))

  logger.debug(`Local ID cache loaded.`)
}

/**
 * Adds data object ID to the local cache.
 *
 * @param dataObjectId - uploading directory
 *
 * @returns empty promise.
 */
export function addDataObjectIdToCache(dataObjectId: string): void {
  idCache.add(dataObjectId)
}

/**
 * Deletes data object ID from the local cache.
 *
 * @param dataObjectId - uploading directory
 */
export function deleteDataObjectIdFromCache(dataObjectId: string): void {
  idCache.delete(dataObjectId)
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
