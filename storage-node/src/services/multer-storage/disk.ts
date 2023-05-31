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
    console.error('_handleFile called')

    // eslint-disable-next-line
    const that = this

    that.getDestination(req, file, function (err, destination) {
      if (err) return cb(err)

      that.getFilename(req, file, function (err, filename) {
        if (err) return cb(err)
        if (!filename) return cb(new Error('Blank filename'))

        const finalPath = path.join(destination, filename)
        const outStream = fs.createWriteStream(finalPath)
        let aborted = false
        file.stream.pipe(outStream)
        outStream.on('error', cb)
        outStream.on('finish', function () {
          console.error('outStream.finish')
          if (aborted) return
          cb(null, {
            destination: destination,
            filename: filename,
            path: finalPath,
            size: outStream.bytesWritten,
          })
        })
        // Make sure to remove incomplete file
        req.on('aborted', function () {
          console.error('request aborted')
          aborted = true
          // will this not cause outstream 'finish' event to file
          // and so multer will allow next request handler to process the file?
          outStream.close()
          // should we instead just call cb(new Error()) and have _removeFile handle cleanup?
          fs.unlink(finalPath, () => cb(new Error('Upload aborted')))
        })
      })
    })
  }

  // eslint-disable-next-line
  _removeFile (
    req: Request,
    file: Express.Multer.File,
    cb: (error: Error | null) => void
  ) {
    console.error('_removeFile called')
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
