import { getDataObjectIDs } from '../../../services/caching/localDataObjects'
import * as express from 'express'
import _ from 'lodash'
import { getDataObjectIDsByBagId } from '../../sync/storageObligations'
import { sendResponseWithError, AppConfig } from './common'
import fastFolderSize from 'fast-folder-size'
import { promisify } from 'util'
import fs from 'fs'
import NodeCache from 'node-cache'
import {
  DataObjectResponse,
  DataStatsResponse,
  GetLocalDataObjectsByBagIdParams,
  StatusResponse,
  VersionResponse,
} from '../types'
import { QueryNodeApi } from '../../queryNode/api'
import logger from '../../logger'
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
  res: express.Response<DataObjectResponse, AppConfig>,
  next: express.NextFunction
): Promise<void> {
  try {
    const ids = getDataObjectIDs()

    res.status(200).json(ids)
  } catch (err) {
    sendResponseWithError(res, next, err, 'all_data_objects')
  }
}

/**
 * A public endpoint: serves local data uploading directory stats.
 *
 *  @return total size and count of the data objects.
 */
export async function getLocalDataStats(
  req: express.Request,
  res: express.Response<DataStatsResponse, AppConfig>,
  next: express.NextFunction
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
      totalSize: totalSize ?? 0,
      tempDownloads,
      tempDirSize,
    })
  } catch (err) {
    sendResponseWithError(res, next, err, 'local_data_stats')
  }
}

/**
 * A public endpoint: return local data objects for the bag.
 */
export async function getLocalDataObjectsByBagId(
  req: express.Request<GetLocalDataObjectsByBagIdParams>,
  res: express.Response<DataObjectResponse, AppConfig>,
  next: express.NextFunction
): Promise<void> {
  try {
    const { qnApi } = res.locals
    const { bagId } = req.params

    const [ids, requiredIds] = await Promise.all([getDataObjectIDs(), getCachedDataObjectsObligations(qnApi, bagId)])

    const localDataForBag = _.intersection(ids, requiredIds)

    res.status(200).json(localDataForBag)
  } catch (err) {
    sendResponseWithError(res, next, err, 'data_objects_by_bag')
  }
}

/**
 * A public endpoint: return the server version.
 */
export async function getVersion(
  req: express.Request,
  res: express.Response<VersionResponse, AppConfig>
): Promise<void> {
  const config = res.locals.process

  // Copy from an object, because the actual object could contain more data.
  res.status(200).json({
    version: config.version,
    userAgent: config.userAgent,
  })
}

/**
 * A public endpoint: returns the server status.
 */
export async function getStatus(req: express.Request, res: express.Response<StatusResponse, AppConfig>): Promise<void> {
  const { qnApi, process: proc } = res.locals

  // Copy from an object, because the actual object could contain more data.
  res.status(200).json({
    version: proc.version,
    queryNodeStatus: await getQueryNodeStatus(qnApi),
    nodeEnv: process.env.NODE_ENV,
  })
}

/**
 * Returns cached data objects IDs from the local data storage. Data could be
 * obsolete until cache expiration.
 *
 */
async function getCachedDataObjectsObligations(qnApi: QueryNodeApi, bagId: string): Promise<string[]> {
  const entryName = `data_object_obligations_${bagId}`

  if (!dataCache.has(entryName)) {
    const data = await getDataObjectIDsByBagId(qnApi, bagId)

    dataCache.set(entryName, data)
  }

  return dataCache.get(entryName) ?? []
}

async function getQueryNodeStatus(qnApi: QueryNodeApi): Promise<StatusResponse['queryNodeStatus']> {
  const qnState = await qnApi.getQueryNodeState()

  if (qnState === null) {
    logger.error("Couldn't fetch the state from connected query-node")
  }

  return {
    url: qnApi.endpoint,
    chainHead: qnState?.chainHead || 0,
    blocksProcessed: qnState?.lastCompleteBlock || 0,
  }
}
