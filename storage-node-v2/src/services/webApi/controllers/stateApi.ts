import { getDataObjectIDs } from '../../../services/caching/localDataObjects'
import * as express from 'express'
import _ from 'lodash'
import { getDataObjectIDsByBagId } from '../../sync/storageObligations'
import { WebApiError, sendResponseWithError, AppConfig } from './common'
import fastFolderSize from 'fast-folder-size'
import { promisify } from 'util'
import fs from 'fs'
import NodeCache from 'node-cache'
const fsPromises = fs.promises

// Expiration period in seconds for the local cache.
const ExpirationPeriod = 30

// Local in-memory cache for data
const dataCache = new NodeCache({
  stdTTL: ExpirationPeriod,
  deleteOnExpire: true,
})

/**
 * A public endpoint: return all local data objects.
 */
export async function getAllLocalDataObjects(
  req: express.Request,
  res: express.Response<unknown, AppConfig>
): Promise<void> {
  try {
    const ids = await getDataObjectIDs()

    res.status(200).json(ids)
  } catch (err) {
    sendResponseWithError(res, err, 'all_data_objects')
  }
}

/**
 * A public endpoint: serves local data uploading directory stats.
 *
 *  @return total size and count of the data objects.
 */
export async function getLocalDataStats(
  req: express.Request,
  res: express.Response<unknown, AppConfig>
): Promise<void> {
  try {
    const uploadsDir = res.locals.uploadsDir
    const tempFileDir = res.locals.tempFileUploadingDir
    const fastFolderSizeAsync = promisify(fastFolderSize)

    const tempFolderExists = fs.existsSync(tempFileDir)
    const statsPromise = fsPromises.readdir(uploadsDir)
    const sizePromise = fastFolderSizeAsync(uploadsDir)

    const [stats, totalSize] = await Promise.all([statsPromise, sizePromise])

    let objectNumber = stats.length
    let tempDownloads = 0
    let tempDirSize = 0
    if (tempFolderExists) {
      if (objectNumber > 0) {
        objectNumber--
      }

      const tempDirStatsPromise = fsPromises.readdir(tempFileDir)
      const tempDirSizePromise = fastFolderSizeAsync(tempFileDir)

      const [tempDirStats, tempSize] = await Promise.all([tempDirStatsPromise, tempDirSizePromise])

      tempDirSize = tempSize ?? 0
      tempDownloads = tempDirStats.length
    }

    res.status(200).json({
      objectNumber,
      totalSize,
      tempDownloads,
      tempDirSize,
    })
  } catch (err) {
    sendResponseWithError(res, err, 'local_data_stats')
  }
}

/**
 * A public endpoint: return local data objects for the bag.
 */
export async function getLocalDataObjectsByBagId(
  req: express.Request,
  res: express.Response<unknown, AppConfig>
): Promise<void> {
  try {
    const queryNodeUrl = res.locals.queryNodeEndpoint
    const bagId = getBagId(req)

    const [ids, requiredIds] = await Promise.all([
      getDataObjectIDs(),
      getCachedDataObjectsObligations(queryNodeUrl, bagId),
    ])

    const localDataForBag = _.intersection(ids, requiredIds)

    res.status(200).json(localDataForBag)
  } catch (err) {
    sendResponseWithError(res, err, 'data_objects_by_bag')
  }
}

/**
 * A public endpoint: return the server version.
 */
export async function getVersion(req: express.Request, res: express.Response<unknown, AppConfig>): Promise<void> {
  try {
    const config = res.locals.process

    // Copy from an object, because the actual object could contain more data.
    res.status(200).json({
      version: config.version,
      userAgent: config.userAgent,
    })
  } catch (err) {
    sendResponseWithError(res, err, 'version')
  }
}

/**
 * Returns Bag ID from the request.
 *
 * @remarks
 * This is a helper function. It parses the request object for a variable and
 * throws an error on failure.
 */
function getBagId(req: express.Request): string {
  const bagId = req.params.bagId || ''
  if (bagId.length > 0) {
    return bagId
  }

  throw new WebApiError('No bagId provided.', 400)
}

/**
 * Returns cached data objects IDs from the local data storage. Data could be
 * obsolete until cache expiration.
 *
 */
async function getCachedDataObjectsObligations(queryNodeUrl: string, bagId: string): Promise<string[]> {
  const entryName = 'data_object_obligations'

  if (!dataCache.has(entryName)) {
    const data = await getDataObjectIDsByBagId(queryNodeUrl, bagId)

    dataCache.set(entryName, data)
  }

  return dataCache.get(entryName) ?? []
}
