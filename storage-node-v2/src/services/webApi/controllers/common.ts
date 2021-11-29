import * as express from 'express'
import { CLIError } from '@oclif/errors'
import { ExtrinsicFailedError } from '../../runtime/api'
import { BagIdValidationError } from '../../helpers/bagTypes'
import logger from '../../logger'
import { ApiPromise } from '@polkadot/api'
import { KeyringPair } from '@polkadot/keyring/types'

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
export function getUploadsDir(res: express.Response<unknown, AppConfig>): string {
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
export function getTempFileUploadingDir(res: express.Response<unknown, AppConfig>): string {
  if (res.locals.tempFileUploadingDir) {
    return res.locals.tempFileUploadingDir
  }

  throw new ServerError('No temporary uploading directory path loaded.')
}

/**
 * Returns worker ID from the response.
 *
 * @remarks
 * This is a helper function. It parses the response object for a variable and
 * throws an error on failure.
 */
export function getWorkerId(res: express.Response<unknown, AppConfig>): number {
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
export function getQueryNodeUrl(res: express.Response<unknown, AppConfig>): string {
  if (res.locals.queryNodeEndpoint) {
    return res.locals.queryNodeEndpoint
  }

  throw new ServerError('No Query Node URL loaded.')
}

/**
 * Returns a command config.
 *
 * @remarks
 * This is a helper function. It parses the response object for a variable and
 * throws an error on failure.
 */
export function getCommandConfig(res: express.Response<unknown, AppConfig>): {
  version: string
  userAgent: string
} {
  if (res.locals.process) {
    return res.locals.process
  }

  throw new ServerError('Cannot load command config.')
}

/**
 * Handles errors and sends a response.
 *
 * @param res - Response instance
 * @param err - error
 * @param errorType - defines request type
 * @returns void promise.
 */
export function sendResponseWithError(res: express.Response, err: Error, errorType: string): void {
  const message = isNofileError(err) ? `File not found.` : err.toString()
  logger.error(message, { err })

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
export function getHttpStatusCodeByError(err: Error): number {
  if (isNofileError(err)) {
    return 404
  }

  if (err instanceof ExtrinsicFailedError) {
    return 400
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
   * ElasticSearch logging endpoint URL
   */
  elasticSearchEndpoint?: string

  /**
   * Max file size for uploading limit.
   */
  maxFileSize: number
}
