import { ApiPromise } from '@polkadot/api'
import * as express from 'express'
import fastFolderSize from 'fast-folder-size'
import fs from 'fs'
import _ from 'lodash'
import NodeCache from 'node-cache'
import { promisify } from 'util'
import { getDataObjectIDs } from '../../../services/caching/localDataObjects'
import logger from '../../logger'
import { QueryNodeApi } from '../../queryNode/api'
import { getDataObjectIDsByBagId } from '../../sync/storageObligations'
import {
  DataObjectResponse,
  DataStatsResponse,
  GetLocalDataObjectsByBagIdParams,
  StatusResponse,
  VersionResponse,
} from '../types'
import { AppConfig, sendResponseWithError } from './common'
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
    const ids = await getDataObjectIDs()

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
    const pendingObjectsDir = res.locals.pendingDataObjectsDir
    const fastFolderSizeAsync = promisify(fastFolderSize)

    const statsPromise = fsPromises.readdir(uploadsDir, { withFileTypes: true })
    const sizePromise = fastFolderSizeAsync(uploadsDir)

    const [stats, totalSize] = await Promise.all([statsPromise, sizePromise])

    const objectNumber = stats.filter((entry) => entry.isFile).length
    let tempDownloads = 0
    let tempDirSize = 0
    let pendingObjects = 0
    let pendingDirSize = 0

    const tempDirStatsPromise = fsPromises.readdir(tempFileDir, { withFileTypes: true })
    const tempDirSizePromise = fastFolderSizeAsync(tempFileDir)
    const pendingDirStatsPromise = fsPromises.readdir(pendingObjectsDir, { withFileTypes: true })
    const pendingDirSizePromise = fastFolderSizeAsync(pendingObjectsDir)

    const [tempDirStats, tempSize, pendingDirStats, pendingSize] = await Promise.all([
      tempDirStatsPromise,
      tempDirSizePromise,
      pendingDirStatsPromise,
      pendingDirSizePromise,
    ])

    tempDirSize = tempSize ?? 0
    tempDownloads = tempDirStats.filter((entry) => entry.isFile).length
    pendingDirSize = pendingSize ?? 0
    pendingObjects = pendingDirStats.filter((entry) => entry.isFile).length

    res.status(200).json({
      objectNumber,
      totalSize: totalSize ?? 0,
      tempDownloads,
      tempDirSize,
      pendingObjects,
      pendingDirSize,
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
  const { qnApi, api, process: proc, uploadBuckets, downloadBuckets, sync, cleanup } = res.locals

  // Copy from an object, because the actual object could contain more data.
  const buckets = [...new Set([...uploadBuckets, ...downloadBuckets])]
  const bucketsOperationalStatuses = (await qnApi.getStorageBucketsOperationalStatus(buckets)).map(
    ({ id, operatorMetadata }) => ({
      bucketId: id,
      status: operatorMetadata?.nodeOperationalStatus?.__typename || 'NodeOperationalStatusNormal',
      isForced:
        operatorMetadata?.nodeOperationalStatus?.__typename === 'NodeOperationalStatusNormal'
          ? false
          : operatorMetadata?.nodeOperationalStatus?.forced || false,
    })
  )

  res.status(200).json({
    version: proc.version,
    uploadBuckets,
    downloadBuckets,
    sync,
    cleanup,
    queryNodeStatus: await getQueryNodeStatus(api, qnApi),
    bucketsOperationalStatuses,
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

async function getQueryNodeStatus(api: ApiPromise, qnApi: QueryNodeApi): Promise<StatusResponse['queryNodeStatus']> {
  const memoizedGetPackageVersion = _.memoize(qnApi.getPackageVersion.bind(qnApi))
  const squidVersion = await memoizedGetPackageVersion()
  const squidStatus = await qnApi.getState()

  if (squidStatus === null) {
    logger.error("Couldn't fetch the state from connected storage-squid")
  }

  return {
    url: qnApi.endpoint,
    chainHead: (await api.derive.chain.bestNumber()).toNumber() || 0,
    blocksProcessed: squidStatus?.height || 0,
    packageVersion: squidVersion,
  }
}
