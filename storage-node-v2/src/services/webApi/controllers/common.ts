import * as express from 'express'
import { CLIError } from '@oclif/errors'

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
 * Returns a directory for file uploading from the response.
 *
 * @remarks
 * This is a helper function. It parses the response object for a variable and
 * throws an error on failure.
 */
export function getUploadsDir(res: express.Response): string {
  if (res.locals.uploadsDir) {
    return res.locals.uploadsDir
  }

  throw new ServerError('No upload directory path loaded.')
}

/**
 * Returns a directory for temporary file uploading from the response.
 *
 * @remarks
 * This is a helper function. It parses the response object for a variable and
 * throws an error on failure.
 */
export function getTempFileUploadingDir(res: express.Response): string {
  if (res.locals.tempFileUploadingDir) {
    return res.locals.tempFileUploadingDir
  }

  throw new Error('No temporary uploading directory path loaded.')
}

/**
 * Returns worker ID from the response.
 *
 * @remarks
 * This is a helper function. It parses the response object for a variable and
 * throws an error on failure.
 */
export function getWorkerId(res: express.Response): number {
  if (res.locals.workerId || res.locals.workerId === 0) {
    return res.locals.workerId
  }

  throw new ServerError('No Joystream worker ID loaded.')
}

/**
 * Returns the QueryNode URL from the starting parameters.
 *
 * @remarks
 * This is a helper function. It parses the response object for a variable and
 * throws an error on failure.
 */
export function getQueryNodeUrl(res: express.Response): string {
  if (res.locals.queryNodeUrl) {
    return res.locals.queryNodeUrl
  }

  throw new Error('No Query Node URL loaded.')
}
