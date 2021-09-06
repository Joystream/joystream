import { getLocalDataObjects } from '../../../services/sync/synchronizer'
import * as express from 'express'
import _ from 'lodash'
import { getDataObjectIDsByBagId } from '../../sync/storageObligations'
import { getUploadsDir, getTempFileUploadingDir } from './common'
import fastFolderSize from 'fast-folder-size'
import { promisify } from 'util'
import fs from 'fs'

import NodeCache from 'node-cache'
const fsPromises = fs.promises

// Expiration period in seconds for the local cache.
const ExpirationPeriod = 30 // minutes

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
  res: express.Response
): Promise<void> {
  try {
    const uploadsDir = getUploadsDir(res)

    const cids = await getCachedLocalDataObjects(uploadsDir)

    res.status(200).json(cids)
  } catch (err) {
    res.status(500).json({
      type: 'all_data_objects',
      message: err.toString(),
    })
  }
}

/**
 * A public endpoint: serves local data uploading directory stats.
 *
 *  @return total size and count of the data objects.
 */
export async function getLocalDataStats(
  req: express.Request,
  res: express.Response
): Promise<void> {
  try {
    const uploadsDir = getUploadsDir(res)
    const tempFileDir = getTempFileUploadingDir(res)
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

      const [tempDirStats, tempSize] = await Promise.all([
        tempDirStatsPromise,
        tempDirSizePromise,
      ])

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
    res.status(500).json({
      type: 'local_data_stats',
      message: err.toString(),
    })
  }
}

/**
 * A public endpoint: return local data objects for the bag.
 */
export async function getLocalDataObjectsByBagId(
  req: express.Request,
  res: express.Response
): Promise<void> {
  try {
    const uploadsDir = getUploadsDir(res)

    const queryNodeUrl = getQueryNodeUrl(res)
    const bagId = getBagId(req)

    // TODO: Introduce dedicated QueryNode method.
    const [cids, requiredCids] = await Promise.all([
      getCachedLocalDataObjects(uploadsDir),
      getCachedDataObjectsObligations(queryNodeUrl, bagId),
    ])

    const localDataForBag = _.intersection(cids, requiredCids)

    res.status(200).json(localDataForBag)
  } catch (err) {
    res.status(500).json({
      type: 'data_objects_by_bag',
      message: err.toString(),
    })
  }
}

/**
 * A public endpoint: return the server version.
 */
export async function getVersion(
  req: express.Request,
  res: express.Response
): Promise<void> {
  try {
    const config = getCommandConfig(res)

    // Copy from an object, because the actual object could contain more data.
    res.status(200).json({
      version: config.version,
      userAgent: config.userAgent,
    })
  } catch (err) {
    res.status(500).json({
      type: 'version',
      message: err.toString(),
    })
  }
}

/**
 * Returns a command config.
 *
 * @remarks
 * This is a helper function. It parses the response object for a variable and
 * throws an error on failure.
 */
function getCommandConfig(res: express.Response): {
  version: string
  userAgent: string
} {
  if (res.locals.config) {
    return res.locals.config
  }

  throw new Error('No upload directory path loaded.')
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

  throw new Error('No bagId provided.')
}

/**
 * Returns the QueryNode URL from the starting parameters.
 *
 * @remarks
 * This is a helper function. It parses the response object for a variable and
 * throws an error on failure.
 */
function getQueryNodeUrl(res: express.Response): string {
  if (res.locals.queryNodeUrl) {
    return res.locals.queryNodeUrl
  }

  throw new Error('No Query Node URL loaded.')
}

/**
 * Returns cached data objects IDs from the local data storage. Data could be
 * obsolete until cache expiration.
 *
 */
async function getCachedLocalDataObjects(
  uploadsDir: string
): Promise<string[]> {
  const entryName = 'local_data_object'

  if (!dataCache.has(entryName)) {
    const data = await getLocalDataObjects(uploadsDir)

    dataCache.set(entryName, data)
  }
  return dataCache.get(entryName) ?? []
}

/**
 * Returns cached data objects IDs from the local data storage. Data could be
 * obsolete until cache expiration.
 *
 */
async function getCachedDataObjectsObligations(
  queryNodeUrl: string,
  bagId: string
): Promise<string[]> {
  const entryName = 'data_object_obligations'

  if (!dataCache.has(entryName)) {
    const data = await getDataObjectIDsByBagId(queryNodeUrl, bagId)

    dataCache.set(entryName, data)
  }

  return dataCache.get(entryName) ?? []
}
