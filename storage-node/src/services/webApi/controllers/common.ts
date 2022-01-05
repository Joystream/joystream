import * as express from 'express'
import { ExtrinsicFailedError } from '../../runtime/api'
import { BagIdValidationError } from '../../helpers/bagTypes'
import { ApiPromise } from '@polkadot/api'
import { KeyringPair } from '@polkadot/keyring/types'

/**
 * Dedicated error for the web api requests.
 */
export class WebApiError extends Error {
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
 * Handles errors and sends a response.
 *
 * @param res - Response instance
 * @param err - error
 * @param errorType - defines request type
 * @returns void promise.
 */
export function sendResponseWithError(
  res: express.Response,
  next: express.NextFunction,
  err: Error,
  errorType: string
): void {
  const message = isNofileError(err) ? `File not found.` : err.toString()

  res.status(getHttpStatusCodeByError(err)).json({
    type: errorType,
    message,
  })

  next(err)
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
export function getHttpStatusCodeByError(err: Error): number {
  if (isNofileError(err)) {
    return 404
  }

  if (err instanceof ExtrinsicFailedError) {
    return 500
  }

  if (err instanceof WebApiError) {
    return err.httpStatusCode
  }

  if (err instanceof BagIdValidationError) {
    return 400
  }

  return 500
}

/**
 * Web application parameters.
 */
export type AppConfig = {
  /**
   * Runtime API promise
   */
  api: ApiPromise

  /**
   * KeyringPair instance
   */
  storageProviderAccount: KeyringPair

  /**
   * Storage provider ID (worker ID)
   */
  workerId: number

  /**
   * Directory for the file uploading
   */
  uploadsDir: string
  /**
   * Directory for temporary file uploading
   */
  tempFileUploadingDir: string

  /**
   *  Environment configuration
   */
  process: {
    version: string
    userAgent: string
  }

  /**
   * Query Node endpoint URL
   */
  queryNodeEndpoint: string

  /**
   * Enables uploading auth-schema validation
   */
  enableUploadingAuth: boolean

  /**
   * Max file size for uploading limit.
   */
  maxFileSize: number
}
