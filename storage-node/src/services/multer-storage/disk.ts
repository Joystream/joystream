import fs from 'fs'
import os from 'os'
import path from 'path'
import crypto from 'crypto'
import mkdirp from 'mkdirp'
import { Request } from 'express'
import { DiskStorageOptions, StorageEngine } from 'multer'

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
  public _handleFile (
    req: Request,
    file: Express.Multer.File,
    cb: (error?: any, info?: Partial<Express.Multer.File>) => void
  ) {
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
          fs.unlink(finalPath, () => cb(new Error('Upload aborted')))
        })
      })
    })
  }

  // removeFile is not called on latest handled file if _handleFile callback is passed
  // and error. It will only apply to the previously uploaded files in the request
  // eslint-disable-next-line
  _removeFile (
    req: Request,
    file: Express.Multer.File,
    cb: (error: Error | null) => void
  ) {
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
