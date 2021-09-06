import * as express from 'express'

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

  throw new Error('No upload directory path loaded.')
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

  throw new Error('No Joystream worker ID loaded.')
}
