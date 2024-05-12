import fs from 'fs'
import logger from '../logger'
import assert from 'assert'

const fsPromises = fs.promises

type DataObjectId = string
type DataObjectPinCount = number

// Local in-memory cache for IDs.
const idCache = new Map<DataObjectId, DataObjectPinCount>()

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
    .forEach((id) => idCache.set(id, 0))

  logger.debug(`Local ID cache loaded.`)
}

/**
 * Adds data object ID to the local cache.
 *
 * @param dataObjectId - Storage data object ID
 *
 * @returns void
 */
export function addDataObjectIdToCache(dataObjectId: string): void {
  assert(typeof dataObjectId === 'string')
  assert(!idCache.has(dataObjectId))
  idCache.set(dataObjectId, 0)
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

  const currentPinnedCount = idCache.get(dataObjectId)
  assert(currentPinnedCount !== undefined)
  idCache.set(dataObjectId, currentPinnedCount + 1)
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

  const currentPinnedCount = idCache.get(dataObjectId)
  assert(currentPinnedCount)
  assert(currentPinnedCount > 0)
  idCache.set(dataObjectId, currentPinnedCount - 1)
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
): { dataObjectId: DataObjectId; pinnedCount: DataObjectPinCount } | undefined {
  assert(typeof dataObjectId === 'string')

  if (idCache.has(dataObjectId)) {
    return { dataObjectId, pinnedCount: idCache.get(dataObjectId) as DataObjectPinCount }
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
