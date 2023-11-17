import { ApiPromise } from '@polkadot/api'
import { KeyringPair } from '@polkadot/keyring/types'
import * as express from 'express'
import { QueryNodeApi } from '../../../services/queryNode/api'
import { BagIdValidationError } from '../../helpers/bagTypes'
import { ExtrinsicFailedError } from '../../runtime/api'
import { ErrorResponse } from '../types'

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
  const message = isNoFileError(err) ? `File not found.` : err.toString()

  const response: ErrorResponse = { type: errorType, message }

  res.status(getHttpStatusCodeByError(err)).json(response)

  next(err)
}

/**
 * Checks the error for 'no-file' error (ENOENT).
 *
 * @param err - error
 * @returns true when error code contains 'ENOENT'.
 */
function isNoFileError(err: Error): boolean {
  return err.toString().includes('ENOENT')
}

/**
 * Get the status code by error.
 *
 * @param err - error
 * @returns HTTP status code
 */
export function getHttpStatusCodeByError(err: Error): number {
  if (isNoFileError(err)) {
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
   * Query Node Api
   */
  qnApi: QueryNodeApi

  /**
   * KeyringPair instances for each bucket
   * Map<bucketId, KeyringPair>
   */
  bucketKeyPairs: Map<string, KeyringPair>

  /**
   * KeyringPair instances of the role key, used for upload authentication
   */
  operatorRoleKey: KeyringPair | undefined

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
   * Enables uploading auth-schema validation
   */
  enableUploadingAuth: boolean

  /**
   * Max file size for uploading limit.
   */
  maxFileSize: number

  /**
   * List of buckets that node should allow downloads from.
   */
  downloadBuckets: string[]

  /**
   * List of buckets that node should accept uploads into.
   */
  uploadBuckets: string[]

  /**
   * Configuration options for Synchronization service
   */
  sync: {
    /**
     * Flag indicating whether Sync service is enabled or not
     */
    enabled: boolean

    /**
     * Sync interval (in minutes)
     */
    interval: number
  }

  /**
   * Configuration options for Cleanup service
   */
  cleanup: {
    /**
     * Flag indicating whether Cleanup service is enabled or not
     */
    enabled: boolean

    /**
     * Cleanup interval (in minutes)
     */
    interval: number

    /**
     * The maximum allowed threshold by which the QN processor can lag behind
     * the chainHead (current block) for pruning the deleted assets
     */
    maxQnLaggingThresholdInBlocks: number

    /**
     * The minimum replication threshold required to perform pruning of outdated
     * assets i.e. the min number of (peer) storage operators that should hold
     * the assets before the outdated asset could be deleted from this storage node
     */
    minReplicationThresholdForPruning: number
  }
}
