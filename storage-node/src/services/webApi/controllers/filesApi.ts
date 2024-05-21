import { ApiPromise } from '@polkadot/api'
import { PalletStorageBagIdType as BagId } from '@polkadot/types/lookup'
import { hexToString } from '@polkadot/util'
import BN from 'bn.js'
import * as express from 'express'
import fs from 'fs'
import _ from 'lodash'
import path from 'path'
import send from 'send'
import { QueryNodeApi } from '../../../services/queryNode/api'
import { parseBagId } from '../../helpers/bagTypes'
import { getFileInfo, FileInfo } from '../../helpers/fileInfo'
import { hashFile } from '../../helpers/hashing'
import { moveFile } from '../../helpers/moveFile'
import logger from '../../logger'
import { getStorageBucketIdsByWorkerId } from '../../sync/storageObligations'
import { GetFileHeadersRequestParams, GetFileRequestParams, UploadFileQueryParams } from '../types'
import { AppConfig, WebApiError, getHttpStatusCodeByError, sendResponseWithError } from './common'
import {
  pinDataObjectIdToCache,
  unpinDataObjectIdFromCache,
  getDataObjectIdFromCache,
} from '../../caching/localDataObjects'
import { getStorageProviderConnection, isStorageProviderConnectionEnabled } from '../../../commands/server'
const fsPromises = fs.promises

const FileInfoCache = new Map<string, FileInfo>()

async function getCachedFileInfo(baseDir: string, objectId: string): Promise<FileInfo> {
  if (FileInfoCache.has(objectId)) {
    return FileInfoCache.get(objectId)!
  }
  const info = await getFileInfo(path.resolve(baseDir, objectId))
  FileInfoCache.set(objectId, info)
  return info
}

/**
 * A public endpoint: serves files by data object ID.
 */
export async function getFile(
  req: express.Request<GetFileRequestParams>,
  res: express.Response<unknown, AppConfig>,
  next: express.NextFunction
): Promise<void> {
  const { id: dataObjectId } = req.params
  try {
    pinDataObjectIdToCache(dataObjectId)
  } catch (err) {
    res.status(404).send()
    return
  }

  const unpin = _.once(async () => {
    unpinDataObjectIdFromCache(dataObjectId)
  })

  const uploadsDir = res.locals.uploadsDir
  const fullPath = path.resolve(uploadsDir, dataObjectId)
  const dataObjectEntry = getDataObjectIdFromCache(dataObjectId)

  try {
    const fileInfo = await getCachedFileInfo(uploadsDir, dataObjectId)
    if (dataObjectEntry === undefined) {
      throw new WebApiError(`File ${dataObjectId} not found`, 404)
    }

    const { entry } = dataObjectEntry
    if (entry.onLocalVolume) {
      const stream = send(req, fullPath)

      stream.on('headers', (res) => {
        // serve all files for download
        res.setHeader('Content-Disposition', 'inline')
        res.setHeader('Content-Type', fileInfo.mimeType)
        res.setHeader('Content-Length', fileInfo.size)
      })

      stream.on('error', (err) => {
        sendResponseWithError(res, next, err, 'files')
        unpin()
      })

      stream.on('end', () => {
        unpin()
      })

      stream.pipe(res)
    } else {
      if (!isStorageProviderConnectionEnabled()) {
        throw new WebApiError('Storage provider connection not available for storage node', 500)
      }
      const connection = getStorageProviderConnection()!

      const url = await connection.getRedirectUrlForObject(dataObjectId)

      // Redirect to the remote file
      res.redirect(url)
    }
  } catch (err) {
    sendResponseWithError(res, next, err, 'files')
    unpin()
  }
}

/**
 * A public endpoint: sends file headers by data object ID.
 */
export async function getFileHeaders(
  req: express.Request<GetFileHeadersRequestParams>,
  res: express.Response<unknown, AppConfig>
): Promise<void> {
  const { id: dataObjectId } = req.params
  try {
    pinDataObjectIdToCache(dataObjectId)
  } catch (err) {
    res.status(404).send()
    return
  }

  try {
    const uploadsDir = res.locals.uploadsDir
    const fileInfo = await getCachedFileInfo(uploadsDir, dataObjectId)

    res.setHeader('Content-Disposition', 'inline')
    res.setHeader('Content-Type', fileInfo.mimeType)
    res.setHeader('Content-Length', fileInfo.size)

    res.status(200).send()
  } catch (err) {
    res.status(getHttpStatusCodeByError(err)).send()
  }

  unpinDataObjectIdFromCache(dataObjectId)
}

/**
 * A public endpoint: receives file.
 */
export async function uploadFile(
  req: express.Request<unknown, unknown, unknown, UploadFileQueryParams>,
  res: express.Response<unknown, AppConfig>,
  next: express.NextFunction
): Promise<void> {
  const uploadRequest = req.query

  // saved filename to delete on verification or extrinsic errors
  let cleanupFileName = ''
  try {
    // we assume bucket id has already been validated, and known to be be operated by the node
    const bucketKeyPair = res.locals.bucketKeyPairs.get(uploadRequest.storageBucketId)
    if (!bucketKeyPair) {
      throw new WebApiError('Node failure. Bucket keyring not available.', 500)
    }

    const fileObj = getFileObject(req)
    cleanupFileName = fileObj.path

    const api = res.locals.api
    const bagId = parseBagId(uploadRequest.bagId)

    const hash = await hashFile(fileObj.path)

    await verifyDataObjectInfo(api, bagId, new BN(uploadRequest.dataObjectId), fileObj.size, hash)

    // Prepare new file name
    const dataObjectId = uploadRequest.dataObjectId
    const { pendingDataObjectsDir } = res.locals
    const newPathPending = path.join(pendingDataObjectsDir, dataObjectId)

    await moveFile(fileObj.path, newPathPending)

    res.status(201).json({
      id: hash,
    })
  } catch (err) {
    await cleanupFileOnError(cleanupFileName, err.toString())

    sendResponseWithError(res, next, err, 'upload')
  }
}
/**
 * Returns Multer.File object from the request.
 *
 * @remarks
 * This is a helper function. It parses the request object for a variable and
 * throws an error on failure.
 */
function getFileObject(req: express.Request<unknown, unknown, unknown, UploadFileQueryParams>): Express.Multer.File {
  if (req.file) {
    return req.file
  }

  const files = req.files as Express.Multer.File[]
  if (files && files.length > 0) {
    return files[0]
  }

  throw new WebApiError('No file uploaded', 400)
}

/**
 * Validates the runtime info for the data object. It verifies contentID,
 * file size, and 'accepted' status.
 *
 * @param api - runtime API promise
 * @param bagId - bag ID
 * @param dataObjectId - data object ID to validate in runtime
 * @param fileSize - file size to validate
 * @param hash - file multihash
 * @returns promise with the 'data object accepted' flag.
 */
async function verifyDataObjectInfo(
  api: ApiPromise,
  bagId: BagId,
  dataObjectId: BN,
  fileSize: number,
  hash: string
): Promise<boolean> {
  const dataObject = await api.query.storage.dataObjectsById(bagId, dataObjectId)

  if (dataObject.isEmpty) {
    throw new WebApiError(`Data object ${dataObjectId} doesn't exist in storage bag ${bagId}`, 400)
  }

  // Cannot get 'size' as a regular property.
  const dataObjectSize = dataObject.size_

  if (dataObjectSize?.toNumber() !== fileSize) {
    throw new WebApiError(`File size doesn't match the data object's size for data object ID = ${dataObjectId}`, 400)
  }

  const runtimeHash = hexToString(dataObject.ipfsContentId.toString())
  if (runtimeHash !== hash) {
    throw new WebApiError(
      `File multihash doesn't match the data object's ipfsContentId for data object ID = ${dataObjectId}`,
      400
    )
  }

  return dataObject.accepted.valueOf()
}

/**
 * Tries to remove file on error. It silences possible IO error and logs it.
 *
 * @param cleanupFileName - file path to delete
 * @param error - external error
 * @returns void promise.
 */
async function cleanupFileOnError(cleanupFileName: string, error: string): Promise<void> {
  if (cleanupFileName) {
    try {
      await fsPromises.unlink(cleanupFileName)
    } catch (err) {
      logger.error(`Cannot delete the file (${cleanupFileName}) on error: ${error}. IO error: ${err}`)
    }
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
    res.status(500).json({
      type: 'version',
      message: err.toString(),
    })
  }
}

/**
 * Validates the storage bucket ID obligations for the worker (storage provider).
 * It throws an error when storage bucket doesn't belong to the worker.
 *
 * @param qnApi - Query Node Api
 * @param workerId - worker(storage provider) ID
 * @param bucketId - storage bucket ID
 * @returns void promise.
 */
export async function verifyBucketId(qnApi: QueryNodeApi, workerId: number, bucketId: BN): Promise<void> {
  const bucketIds = await getStorageBucketIdsByWorkerId(qnApi, workerId)

  if (!bucketIds.includes(bucketId.toString())) {
    throw new WebApiError('Incorrect storage bucket ID.', 400)
  }
}

/**
 * Verifies the storage bag assignment to the storage bucket.
 * It throws an error if storage bag is not stored by the bucket.
 *
 * @param api - runtime API promise
 * @param bagId - bag ID
 * @param bucketId - storage bucket ID
 * @returns void promise.
 */
export async function verifyBagAssignment(api: ApiPromise, bagId: BagId, bucketId: BN): Promise<void> {
  const bag = await api.query.storage.bags(bagId)

  if (![...bag.storedBy].map((s) => s.toString()).includes(bucketId.toString())) {
    throw new WebApiError(`Storage bag ${bagId} is not assigned to storage bucket ${bucketId}.`, 400)
  }
}
