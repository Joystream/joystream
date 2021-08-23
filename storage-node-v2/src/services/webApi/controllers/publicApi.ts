import { acceptPendingDataObjects } from '../../runtime/extrinsics'
import { ExtrinsicFailedError } from '../../runtime/api'
import {
  RequestData,
  UploadTokenRequest,
  UploadTokenBody,
  createUploadToken,
  verifyTokenSignature,
} from '../../helpers/auth'
import { hashFile } from '../../../services/helpers/hashing'
import {
  createNonce,
  getTokenExpirationTime,
} from '../../../services/helpers/tokenNonceKeeper'
import { getLocalDataObjects } from '../../../services/sync/synchronizer'
import { getFileInfo } from '../../../services/helpers/fileInfo'
import { parseBagId } from '../../helpers/bagTypes'
import { BagId } from '@joystream/types/storage'
import logger from '../../../services/logger'
import { KeyringPair } from '@polkadot/keyring/types'
import { ApiPromise } from '@polkadot/api'
import * as express from 'express'
import fs from 'fs'
import path from 'path'
import send from 'send'
import { CLIError } from '@oclif/errors'
import { hexToString } from '@polkadot/util'
import { timeout } from 'promise-timeout'
const fsPromises = fs.promises

/**
 * Dedicated error for the web api requests.
 */
export class WebApiError extends CLIError {
  httpStatusCode: number

  constructor(err: string, httpStatusCode: number) {
    super(err)

    this.httpStatusCode = httpStatusCode
  }
}

/**
 * Dedicated server error for the web api requests.
 */
export class ServerError extends WebApiError {
  constructor(err: string) {
    super(err, 500)
  }
}

/**
 * A public endpoint: serves files by CID.
 */
export async function getFile(req: express.Request, res: express.Response): Promise<void> {
  try {
    const cid = getCid(req)
    const uploadsDir = getUploadsDir(res)
    const fullPath = path.resolve(uploadsDir, cid)

    const fileInfo = await getFileInfo(fullPath)
    const fileStats = await fsPromises.stat(fullPath)

    const stream = send(req, fullPath)

    stream.on('headers', (res) => {
      // serve all files for download
      res.setHeader('Content-Disposition', 'inline')
      res.setHeader('Content-Type', fileInfo.mimeType)
      res.setHeader('Content-Length', fileStats.size)
    })

    stream.on('error', (err) => {
      sendResponseWithError(res, err, 'files')
    })

    stream.pipe(res)
  } catch (err) {
    sendResponseWithError(res, err, 'files')
  }
}

/**
 * A public endpoint: sends file headers by CID.
 */
export async function getFileHeaders(req: express.Request, res: express.Response): Promise<void> {
  try {
    const cid = getCid(req)
    const uploadsDir = getUploadsDir(res)
    const fullPath = path.resolve(uploadsDir, cid)
    const fileInfo = await getFileInfo(fullPath)
    const fileStats = await fsPromises.stat(fullPath)

    res.setHeader('Content-Disposition', 'inline')
    res.setHeader('Content-Type', fileInfo.mimeType)
    res.setHeader('Content-Length', fileStats.size)

    res.status(200).send()
  } catch (err) {
    res.status(getHttpStatusCodeByError(err)).send()
  }
}

/**
 * A public endpoint: receives file.
 */
export async function uploadFile(req: express.Request, res: express.Response): Promise<void> {
  const uploadRequest: RequestData = req.body

  // saved filename to delete on verification or extrinsic errors
  let cleanupFileName = ''
  try {
    const fileObj = getFileObject(req)
    cleanupFileName = fileObj.path

    const api = getApi(res)
    await verifyFileMimeType(fileObj.path)

    const hash = await hashFile(fileObj.path)
    const bagId = parseBagId(api, uploadRequest.bagId)

    const accepted = await verifyDataObjectInfo(api, bagId, uploadRequest.dataObjectId, fileObj.size, hash)

    // Prepare new file name
    const newPath = fileObj.path.replace(fileObj.filename, hash)

    // Overwrites existing file.
    await fsPromises.rename(fileObj.path, newPath)
    cleanupFileName = newPath

    const workerId = getWorkerId(res)
    if (!accepted) {
      await acceptPendingDataObjects(api, bagId, getAccount(res), workerId, uploadRequest.storageBucketId, [
        uploadRequest.dataObjectId,
      ])
    } else {
      logger.warn(
        `Received already accepted data object. DataObjectId = ${uploadRequest.dataObjectId} WorkerId = ${workerId}`
      )
    }
    res.status(201).json({
      id: hash,
    })
  } catch (err) {
    await cleanupFileOnError(cleanupFileName, err.toString())

    sendResponseWithError(res, err, 'upload')
  }
}

/**
 * A public endpoint: creates auth token for file uploads.
 */
export async function authTokenForUploading(req: express.Request, res: express.Response): Promise<void> {
  try {
    const account = getAccount(res)
    const tokenRequest = getTokenRequest(req)
    const api = getApi(res)

    await validateTokenRequest(api, tokenRequest)

    const tokenBody: UploadTokenBody = {
      nonce: createNonce(),
      validUntil: getTokenExpirationTime(),
      ...tokenRequest.data,
    }
    const signedToken = createUploadToken(tokenBody, account)

    res.status(201).json({
      token: signedToken,
    })
  } catch (err) {
    sendResponseWithError(res, err, 'authtoken')
  }
}

/**
 * Returns Multer.File object from the request.
 *
 * @remarks
 * This is a helper function. It parses the request object for a variable and
 * throws an error on failure.
 */
function getFileObject(req: express.Request): Express.Multer.File {
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
 * Returns worker ID from the response.
 *
 * @remarks
 * This is a helper function. It parses the response object for a variable and
 * throws an error on failure.
 */
function getWorkerId(res: express.Response): number {
  if (res.locals.workerId || res.locals.workerId === 0) {
    return res.locals.workerId
  }

  throw new ServerError('No Joystream worker ID loaded.')
}

/**
 * Returns a directory for file uploading from the response.
 *
 * @remarks
 * This is a helper function. It parses the response object for a variable and
 * throws an error on failure.
 */
function getUploadsDir(res: express.Response): string {
  if (res.locals.uploadsDir) {
    return res.locals.uploadsDir
  }

  throw new ServerError('No upload directory path loaded.')
}

/**
 * Returns a KeyPair instance from the response.
 *
 * @remarks
 * This is a helper function. It parses the response object for a variable and
 * throws an error on failure.
 */
function getAccount(res: express.Response): KeyringPair {
  if (res.locals.storageProviderAccount) {
    return res.locals.storageProviderAccount
  }

  throw new ServerError('No Joystream account loaded.')
}

/**
 * Returns API promise from the response.
 *
 * @remarks
 * This is a helper function. It parses the response object for a variable and
 * throws an error on failure.
 */
function getApi(res: express.Response): ApiPromise {
  if (res.locals.api) {
    return res.locals.api
  }

  throw new ServerError('No Joystream API loaded.')
}

/**
 * Returns Content ID from the request.
 *
 * @remarks
 * This is a helper function. It parses the request object for a variable and
 * throws an error on failure.
 */
function getCid(req: express.Request): string {
  const cid = req.params.cid || ''
  if (cid.length > 0) {
    return cid
  }

  throw new WebApiError('No CID provided.', 400)
}

/**
 * Returns UploadTokenRequest object from the request.
 *
 * @remarks
 * This is a helper function. It parses the request object for a variable and
 * throws an error on failure.
 */
function getTokenRequest(req: express.Request): UploadTokenRequest {
  const tokenRequest = req.body as UploadTokenRequest
  if (tokenRequest) {
    return tokenRequest
  }

  throw new WebApiError('No token request provided.', 401)
}

/**
 * Validates token request. It verifies token signature and compares the
 * member ID and account ID from the runtime with token data.
 *
 * @param api - runtime API promise
 * @param tokenRequest - UploadTokenRequest instance
 * @returns void promise.
 */
async function validateTokenRequest(api: ApiPromise, tokenRequest: UploadTokenRequest): Promise<void> {
  const result = verifyTokenSignature(tokenRequest, tokenRequest.data.accountId)

  if (!result) {
    throw new WebApiError('Invalid upload token request signature.', 401)
  }

  const membershipPromise = api.query.members.membershipById(
    tokenRequest.data.memberId
  )

  const membership = (await timeout(membershipPromise, 5000)) as Membership

  if (
    membership.controller_account.toString() !== tokenRequest.data.accountId
  ) {
    throw new Error(`Provided controller account and member id don't match.`)
  }
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
  dataObjectId: number,
  fileSize: number,
  hash: string
): Promise<boolean> {
  const dataObject = await api.query.storage.dataObjectsById(bagId, dataObjectId)

  // Cannot get 'size' as a regular property.
  const dataObjectSize = dataObject.getField('size')

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
 * Verifies the mime type of the file by its content. It throws an exception
 * if the mime type differs from allowed list ('image/', 'video/', 'audio/').
 *
 * @param filePath - file path to detect mime types
 * @param error - external error
 * @returns void promise.
 */
async function verifyFileMimeType(filePath: string): Promise<void> {
  const allowedMimeTypes = ['image/', 'video/', 'audio/']

  const fileInfo = await getFileInfo(filePath)
  const correctMimeType = allowedMimeTypes.some((allowedType) => fileInfo.mimeType.startsWith(allowedType))

  if (!correctMimeType) {
    throw new WebApiError(`Incorrect mime type detected: ${fileInfo.mimeType}`, 400)
  }
}

/**
 * Handles errors and sends a response.
 *
 * @param res - Response instance
 * @param err - error
 * @param errorType - defines request type
 * @returns void promise.
 */
function sendResponseWithError(res: express.Response, err: Error, errorType: string): void {
  const message = isNofileError(err) ? `File not found.` : err.toString()

  res.status(getHttpStatusCodeByError(err)).json({
    type: errorType,
    message,
  })
}

/**
 * Checks the error for 'no-file' error (ENOENT).
 *
 * @param err - error
 * @returns true when error code contains 'ENOENT'.
 */
function isNofileError(err: Error): boolean {
  return err.toString().includes('ENOENT')
}

/**
 * Get the status code by error.
 *
 * @param err - error
 * @returns HTTP status code
 */
function getHttpStatusCodeByError(err: Error): number {
  if (isNofileError(err)) {
    return 404
  }

  if (err instanceof ExtrinsicFailedError) {
    return 400
  }

  if (err instanceof WebApiError) {
    return err.httpStatusCode
  }

  if (err instanceof CLIError) {
    return 400
  }

  return 500
}
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
      type: 'local_data_objects',
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
