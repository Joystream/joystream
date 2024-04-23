import fs from 'fs'
import os from 'os'
import path from 'path'
import crypto from 'crypto'
import mkdirp from 'mkdirp'
import { Request } from 'express'
import { DiskStorageOptions, StorageEngine } from 'multer'
import { AbstractConnectionHandler } from '../cloud'

export type StorageEngineOptions = DiskStorageOptions

function getFilename(
  req: Request,
  file: Express.Multer.File,
  cb: (err: Error | null, filename: string | undefined) => void
) {
  crypto.randomBytes(16, function (err, raw) {
    cb(err, err ? undefined : raw.toString('hex'))
  })
}

function getDestination(req: Request, file: Express.Multer.File, cb: (err: Error | null, bytes: string) => void) {
  cb(null, os.tmpdir())
}

class DiskStorage implements StorageEngine {
  protected getFilename
  protected getDestination: (
    req: Request,
    file: Express.Multer.File,
    cb: (err: Error | null, bytes: string) => void
  ) => void

  // create a promise async function from getDestination
  protected getDestinationAsync(req: Request, file: Express.Multer.File): Promise<string> {
    return new Promise((resolve, reject) => {
      this.getDestination(req, file, (err, bytes) => {
        if (err) {
          reject(err)
        } else {
          resolve(bytes)
        }
      })
    })
  }
  constructor(opts: DiskStorageOptions) {
    this.getFilename = opts.filename || getFilename

    if (typeof opts.destination === 'string') {
      const { destination } = opts
      mkdirp.sync(destination)
      this.getDestination = function ($0, $1, cb) {
        cb(null, destination)
      }
    } else {
      this.getDestination = opts.destination || getDestination
    }
  }

  // eslint-disable-next-line
  public _handleFile(
    req: Request,
    file: Express.Multer.File,
    cb: (error: Error | null, info?: Partial<Express.Multer.File>) => void
  ) {
    // handle edge case where the request has been aborted before
    // _handleFile is invoked and we cannot catch it anymore.
    if (req.aborted) {
      return cb(new Error('Upload aborted early'))
    }

    // eslint-disable-next-line
    const that = this

    that.getDestination(req, file, function (err, destination) {
      if (err) return cb(err)

      that.getFilename(req, file, function (err, filename) {
        if (err) return cb(err)
        if (!filename) return cb(new Error('Blank filename'))

        const finalPath = path.join(destination, filename)
        const outStream = fs.createWriteStream(finalPath)
        file.stream.pipe(outStream)
        outStream.on('error', (err) => {
          // remove temp file on failure to write
          fs.unlink(finalPath, () => cb(err))
        })
        let aborted = false
        outStream.on('finish', function () {
          // avoid invoking callback multiple times, also the middleware
          if (aborted) return
          cb(null, {
            destination: destination,
            filename: filename,
            path: finalPath,
            size: outStream.bytesWritten,
          })
        })
        // Remove temp file on request aborted - due to timeout or reverse-proxy
        // terminating request because of its own policy such as max size of request
        req.on('aborted', function () {
          aborted = true
          outStream.close() // will trigger 'finish' event on outStream
          const returnValue = cb(new Error('Request aborted'))
          fs.unlink(finalPath, () => returnValue)
        })
      })
    })
  }

  // removeFile is not called on latest handled file if _handleFile callback is passed
  // and error. It will only apply to the previously uploaded files in the request
  // eslint-disable-next-line
  _removeFile(req: Request, file: Express.Multer.File, cb: (error: Error | null) => void) {
    const path = file.path

    file.destination = ''
    file.filename = ''
    file.path = ''

    fs.unlink(path, cb)
  }
}

class CloudStorage implements StorageEngine {
  connectionHandler: AbstractConnectionHandler
  protected getFilename
  protected getDestination: (
    req: Request,
    file: Express.Multer.File,
    cb: (err: Error | null, bytes: string) => void
  ) => void

  // create a promise async function from getDestination
  protected getDestinationAsync(req: Request, file: Express.Multer.File): Promise<string> {
    return new Promise((resolve, reject) => {
      this.getDestination(req, file, (err, bytes) => {
        if (err) {
          reject(err)
        } else {
          resolve(bytes)
        }
      })
    })
  }
  constructor(opts: StorageEngineOptions, connectionHandler: AbstractConnectionHandler) {
    this.connectionHandler = connectionHandler
    this.getFilename = opts.filename || getFilename

    if (typeof opts.destination === 'string') {
      const { destination } = opts
      mkdirp.sync(destination)
      this.getDestination = function ($0, $1, cb) {
        cb(null, destination)
      }
    } else {
      this.getDestination = opts.destination || getDestination
    }
  }

  // eslint-disable-next-line
  public _handleFile(
    req: Request,
    file: Express.Multer.File,
    cb: (error: Error | null, info?: Partial<Express.Multer.File>) => void
  ) {
    // handle edge case where the request has been aborted before
    // _handleFile is invoked and we cannot catch it anymore.
    if (req.aborted) {
      return cb(new Error('Upload aborted early'))
    }

    // eslint-disable-next-line
    const that = this

    that.getDestination(req, file, function (err, destination) {
      if (err) return cb(err)

      that.getFilename(req, file, function (err, filename) {
        if (err) return cb(err)
        if (!filename) return cb(new Error('Blank filename'))

        let aborted = false

        // @todo: implement uploadFileToRemoteBucket method
        that.connectionHandler.uploadFileToRemoteBucket('', function (err: Error | null, data: { Location: any }) {
          if (err) {
            return cb(err)
          }

          cb(null, {
            destination: destination,
            filename: filename,
            path: data.Location,
            size: file.size,
          })

          // Remove temp file on request aborted - due to timeout or reverse-proxy
          // terminating request because of its own policy such as max size of request
          req.on('aborted', function () {
            aborted = true
            return cb(new Error('Request aborted'))
          })
        })
      })
    })
  }

  // removeFile is not called on latest handled file if _handleFile callback is passed
  // and error. It will only apply to the previously uploaded files in the request
  // eslint-disable-next-line
  _removeFile(req: Request, file: Express.Multer.File, cb: (error: Error | null) => void) {
    const path = file.path

    file.destination = ''
    file.filename = ''
    file.path = ''

    fs.unlink(path, cb)
  }
}

export function diskStorage(opts: DiskStorageOptions): StorageEngine {
  return new DiskStorage(opts)
}

/**
 * Creates a cloud storage engine instance.
 * @param opts - The options for the storage engine.
 * @param connection - The connection handler for the storage engine, e.g. AWS. connection.isReady must be true
 * @returns A promise that resolves to a cloud storage engine instance.
 */
export function cloudStorage(opts: DiskStorageOptions, connection: AbstractConnectionHandler): StorageEngine {
  return new CloudStorage(opts, connection)
}
