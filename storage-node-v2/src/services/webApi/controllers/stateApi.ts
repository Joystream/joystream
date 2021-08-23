import { getLocalDataObjects } from '../../../services/sync/synchronizer'
import * as express from 'express'
import _ from 'lodash'
import { getStorageObligationsFromRuntime } from '../../sync/storageObligations'
import { getUploadsDir, getWorkerId } from './common'

/**
 * A public endpoint: serves files by CID.

/**
 * A public endpoint: return all local data objects.
 */
export async function getAllLocalDataObjects(
  req: express.Request,
  res: express.Response
): Promise<void> {
  try {
    const uploadsDir = getUploadsDir(res)

    const cids = await getLocalDataObjects(uploadsDir)

    res.status(200).json(cids)
  } catch (err) {
    res.status(500).json({
      type: 'all_data_objects',
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

    const workerId = getWorkerId(res)
    const queryNodeUrl = getQueryNodeUrl(res)
    const bagId = getBagId(req)

    // TODO: Introduce dedicated QueryNode method.
    const [cids, obligations] = await Promise.all([
      getLocalDataObjects(uploadsDir),
      getStorageObligationsFromRuntime(queryNodeUrl, workerId),
    ])

    const requiredCids = obligations.dataObjects
      .filter((obj) => obj.bagId === bagId)
      .map((obj) => obj.cid)

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
