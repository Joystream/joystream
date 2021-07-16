import { acceptPendingDataObjects } from '../../runtime/extrinsics'
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
import { getFileInfo } from '../../../services/helpers/fileInfo'
import { parseBagId } from '../../helpers/bagTypes'
import logger from '../../../services/logger'
import { KeyringPair } from '@polkadot/keyring/types'
import { ApiPromise } from '@polkadot/api'
import { Membership } from '@joystream/types/members'
import * as express from 'express'
import fs from 'fs'
import path from 'path'
import send from 'send'
const fsPromises = fs.promises

/**
 * A public endpoint: serves files by CID.
 */
export async function files(
  req: express.Request,
  res: express.Response
): Promise<void> {
  try {
    const cid = getCid(req)
    const uploadsDir = getUploadsDir(res)
    const fullPath = path.resolve(uploadsDir, cid)

    const fileInfo = await getFileInfo(fullPath)

    const stream = send(req, fullPath)

    stream.on('headers', (res) => {
      // serve all files for download
      res.setHeader('Content-Disposition', 'inline')
      res.setHeader('Content-Type', fileInfo.mimeType)
    })

    stream.on('error', (err) => {
      // General error
      let statusCode = 410
      const errorString = err.toString()

      const errorObj = {
        type: 'files',
        message: errorString,
      }

      // Special case - file not found.
      if (errorString.includes('ENOENT')) {
        statusCode = 404
        errorObj.message = 'File not found'
      }

      res.status(statusCode).json(errorObj)
    })

    stream.pipe(res)
  } catch (err) {
    res.status(410).json({
      type: 'files',
      message: err.toString(),
    })
  }
}

/**
 * A public endpoint: receives file.
 */
export async function upload(
  req: express.Request,
  res: express.Response
): Promise<void> {
  const uploadRequest: RequestData = req.body

  // saved filename to delete on verification or extrinsic errors
  let cleanupFileName = '' 
  try {
    const fileObj = getFileObject(req)
    cleanupFileName = fileObj.path

    verifyFileSize(fileObj.size)

    const hash = await hashFile(fileObj.path)

    // Prepare new file name
    const newPath = fileObj.path.replace(fileObj.filename, hash)

    // Overwrites existing file.
    await fsPromises.rename(fileObj.path, newPath)
    cleanupFileName = newPath

    const api = getApi(res)
    const bagId = parseBagId(api, uploadRequest.bagId)
    await acceptPendingDataObjects(
      api,
      bagId,
      getAccount(res),
      getWorkerId(res),
      uploadRequest.storageBucketId,
      [uploadRequest.dataObjectId]
    )
    res.status(201).json({
      status: 'received',
    })
  } catch (err) {
    await cleanupFileOnError(cleanupFileName, err.toString())

    res.status(410).json({
      type: 'upload',
      message: err.toString(),
    })
  }
}

/**
 * A public endpoint: creates auth token for file uploads.
 */
export async function authToken(
  req: express.Request,
  res: express.Response
): Promise<void> {
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
    res.status(410).json({
      type: 'authtoken',
      message: err.toString(),
    })
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

  throw new Error('No file uploaded')
}

/**
 * Returns worker ID from the response.
 *
 * @remarks
 * This is a helper function. It parses the response object for a variable and
 * throws an error on failier.
 */
function getWorkerId(res: express.Response): number {
  if (res.locals.workerId || res.locals.workerId === 0) {
    return res.locals.workerId
  }

  throw new Error('No Joystream worker ID loaded.')
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

  throw new Error('No upload directory path loaded.')
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

  throw new Error('No Joystream account loaded.')
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

  throw new Error('No Joystream API loaded.')
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

  throw new Error('No CID provided.')
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

  throw new Error('No token request provided.')
}

/**
 * Validates token request. It verifies token signature and compares the
 * member ID and account ID from the runtime with token data.
 *
 * @param api - runtime API promise
 * @param tokenRequest - UploadTokenRequest instance
 * @returns void promise.
 */
async function validateTokenRequest(
  api: ApiPromise,
  tokenRequest: UploadTokenRequest
): Promise<void> {
  const result = verifyTokenSignature(tokenRequest, tokenRequest.data.accountId)

  if (!result) {
    throw new Error('Invalid upload token request signature.')
  }

  const membership = (await api.query.members.membershipById(
    tokenRequest.data.memberId
  )) as Membership

  if (
    membership.controller_account.toString() !== tokenRequest.data.accountId
  ) {
    throw new Error(`Provided controller account and member id don't match.`)
  }
}

/**
 * Validates file size. It throws an error when file size exceeds the limit
 *
 * @param fileSize - runtime API promise
 * @returns void promise.
 */
function verifyFileSize(fileSize: number) {
  const MAX_FILE_SIZE = 100000 // TODO: Get this const from the runtime

  if (fileSize > MAX_FILE_SIZE) {
    throw new Error('Max file size exceeded.')
  }
}

/**
 * Tries to remove file on error. It silences possible IO error and logs it.
 *
 * @param cleanupFileName - file path to delete
 * @param error - external error
 * @returns void promise.
 */
async function cleanupFileOnError(
  cleanupFileName: string,
  error: string
): Promise<void> {
  if (cleanupFileName) {
    try {
      await fsPromises.unlink(cleanupFileName)
    } catch (err) {
      logger.error(
        `Cannot delete the file (${cleanupFileName}) on error: ${error}. IO error: ${err}`
      )
    }
  }
}
