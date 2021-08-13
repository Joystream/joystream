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
import { createNonce, getTokenExpirationTime } from '../../../services/helpers/tokenNonceKeeper'
import { getFileInfo } from '../../../services/helpers/fileInfo'
import { parseBagId } from '../../helpers/bagTypes'
import logger from '../../../services/logger'
import { KeyringPair } from '@polkadot/keyring/types'
import { ApiPromise } from '@polkadot/api'
import * as express from 'express'
import fs from 'fs'
import path from 'path'
import send from 'send'
import { CLIError } from '@oclif/errors'
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

    verifyFileSize(fileObj.size)
    await verifyFileMimeType(fileObj.path)

    const hash = await hashFile(fileObj.path)

    // Prepare new file name
    const newPath = fileObj.path.replace(fileObj.filename, hash)

    // Overwrites existing file.
    await fsPromises.rename(fileObj.path, newPath)
    cleanupFileName = newPath

    const api = getApi(res)
    const bagId = parseBagId(api, uploadRequest.bagId)
    await acceptPendingDataObjects(api, bagId, getAccount(res), getWorkerId(res), uploadRequest.storageBucketId, [
      uploadRequest.dataObjectId,
    ])
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
 * throws an error on failier.
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
 * throws an error on failier.
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
 * throws an error on failier.
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
 * throws an error on failier.
 */
function getApi(res: express.Response): ApiPromise {
  if (res.locals.api) {
    return res.locals.api
  }

  throw new WebApiError('No Joystream API loaded.', 500)
}

/**
 * Returns Content ID from the request.
 *
 * @remarks
 * This is a helper function. It parses the request object for a variable and
 * throws an error on failier.
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
 * throws an error on failier.
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

  const membership = await api.query.members.membershipById(tokenRequest.data.memberId)
  if (membership.controller_account.toString() !== tokenRequest.data.accountId) {
    throw new WebApiError(`Provided controller account and member id don't match.`, 401)
  }
}

/**
 * Validates file size. It throws an error when file size exceeds the limit
 *
 * @param fileSize - runtime API promise
 * @returns void promise.
 */
function verifyFileSize(fileSize: number) {
  const MAX_FILE_SIZE = 1000000 // TODO: Get this const from the runtime

  if (fileSize > MAX_FILE_SIZE) {
    throw new WebApiError('Max file size exceeded.', 400)
  }
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
