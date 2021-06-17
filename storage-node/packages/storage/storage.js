/*
 * This file is part of the storage node for the Joystream project.
 * Copyright (C) 2019 Joystream Contributors
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

'use strict'

const { Transform } = require('stream')
const fs = require('fs')

const debug = require('debug')('joystream:storage:storage')

const Promise = require('bluebird')

const Hash = require('ipfs-only-hash')

Promise.config({
  cancellation: true,
})

const fileType = require('file-type')
const ipfsClient = require('ipfs-http-client')
const temp = require('temp').track()
const _ = require('lodash')

// Default request timeout; imposed on top of the IPFS client, because the
// client doesn't seem to care.
const DEFAULT_TIMEOUT = 30 * 1000

// Default/dummy resolution implementation.
const DEFAULT_RESOLVE_CONTENT_ID = async (original) => {
  debug('Warning: Default resolution returns original CID', original)
  return original
}

// Default file info if nothing could be detected.
const DEFAULT_FILE_INFO = {
  mimeType: 'application/octet-stream',
  ext: 'bin',
}

/*
 * fileType is a weird name, because we're really looking at MIME types.
 * Also, the type field includes extension info, so we're going to call
 * it fileInfo { mimeType, ext } instead.
 * Nitpicking, but it also means we can add our default type if things
 * go wrong.
 */
function fixFileInfo(info) {
  if (!info) {
    info = DEFAULT_FILE_INFO
  } else {
    info.mimeType = info.mime
    delete info.mime
  }
  return info
}

function fixFileInfoOnStream(stream) {
  const info = fixFileInfo(stream.fileType)
  delete stream.fileType
  stream.fileInfo = info
  return stream
}

/*
 * Internal Transform stream for helping write to a temporary location, adding
 * MIME type detection, and a commit() function.
 */
class StorageWriteStream extends Transform {
  constructor(storage, options) {
    options = _.clone(options || {})

    super(options)

    this.storage = storage

    // Create temp target.
    this.temp = temp.createWriteStream()
    this.buf = Buffer.alloc(0)
  }

  _transform(chunk, encoding, callback) {
    // Deal with buffers only
    if (typeof chunk === 'string') {
      chunk = Buffer.from(chunk)
    }

    // Try to detect file type during streaming.
    if (!this.fileInfo && this.buf.byteLength <= fileType.minimumBytes) {
      this.buf = Buffer.concat([this.buf, chunk])

      if (this.buf.byteLength >= fileType.minimumBytes) {
        const info = fileType(this.buf)
        // No info? We will try again at the end of the stream.
        if (info) {
          this.fileInfo = fixFileInfo(info)
          this.emit('fileInfo', this.fileInfo)
        }
      }
    }

    // Always waiting for write flush can be slow..
    // this.temp.write(chunk, (err) => {
    //   callback(err)
    // })

    // Respect backpressure
    if (!this.temp.write(chunk)) {
      this.temp.once('drain', callback)
    } else {
      process.nextTick(callback)
    }
  }

  _flush(callback) {
    debug('Flushing temporary stream:', this.temp.path)
    this.temp.end(() => {
      callback(null)
    })
  }

  /*
   * Get file info
   */

  async info() {
    if (!this.temp) {
      throw new Error('Cannot get info on temporary stream that does not exist. Did you call cleanup()?')
    }

    if (!this.fileInfo) {
      const read = fs.createReadStream(this.temp.path)

      const stream = await fileType.stream(read)

      this.fileInfo = fixFileInfoOnStream(stream).fileInfo
    }

    if (!this.hash) {
      const read = fs.createReadStream(this.temp.path)
      this.hash = await Hash.of(read)
    }

    this.emit('info', this.fileInfo, this.hash)

    return {
      info: this.fileInfo,
      hash: this.hash,
    }
  }

  /*
   * Commit this stream to the IPFS backend.
   */
  commit() {
    if (!this.temp) {
      throw new Error('Cannot commit a temporary stream that does not exist. Did you call cleanup()?')
    }

    debug('Committing temporary stream: ', this.temp.path)
    this.storage.ipfs
      .addFromFs(this.temp.path)
      .then(async (result) => {
        const hash = result[0].hash
        debug('Stream committed as', hash)
        this.emit('committed', hash)
        await this.storage.ipfs.pin.add(hash)
        this.cleanup()
      })
      .catch((err) => {
        debug('Error committing stream', err)
        this.emit('error', err)
        this.cleanup()
      })
  }

  /*
   * Clean up temporary data.
   */
  cleanup() {
    // Make it safe to call cleanup more than once
    if (!this.temp) return
    debug('Cleaning up temporary file: ', this.temp.path)
    fs.unlink(this.temp.path, () => {
      /* Ignore errors. */
    })
    delete this.temp
  }
}

/*
 * Manages the storage backend interaction. This provides a Promise-based API.
 *
 * Usage:
 *
 *   const store = await Storage.create({ ... });
 *   store.open(...);
 */
class Storage {
  /*
   * Create a Storage instance. Options include:
   *
   * - an `ipfs` property, which is itself a hash containing
   *   - `connect_options` to be passed to the IPFS client library for
   *     connecting to an IPFS node.
   * - a `resolve_content_id` function, which translates Joystream
   *   content IDs to IPFS content IDs or vice versa. The default is to
   *   not perform any translation, which is not practical for a production
   *   system, but serves its function during development and testing. The
   *   function must be asynchronous.
   * - a `timeout` parameter, defaulting to DEFAULT_TIMEOUT. After this time,
   *   requests to the IPFS backend time out.
   *
   * Functions in this class accept an optional timeout parameter. If the
   * timeout is given, it is used - otherwise, the `option.timeout` value
   * above is used.
   */
  static create(options) {
    const storage = new Storage()
    storage._init(options)
    return storage
  }

  _init(options) {
    this.options = _.clone(options || {})
    this.options.ipfs = this.options.ipfs || {}

    this._timeout = this.options.timeout || DEFAULT_TIMEOUT
    this._resolve_content_id = this.options.resolve_content_id || DEFAULT_RESOLVE_CONTENT_ID

    this.ipfs = ipfsClient(this.options.ipfsHost || 'localhost', '5001', { protocol: 'http' })

    this.pinned = {}
    this.pinning = {}

    this.ipfs.id((err, identity) => {
      if (err) {
        debug(`Warning IPFS daemon not running: ${err.message}`)
      } else {
        debug(`IPFS node is up with identity: ${identity.id}`)
        // TODO: wait for IPFS daemon to be online for this to be effective..?
        // set the IPFS HTTP Gateway config we desire.. operator might need
        // to restart their daemon if the config was changed.
        this.ipfs.config.set('Gateway.PublicGateways', { 'localhost': null })
      }
    })
  }

  /*
   * Uses bluebird's timeout mechanism to return a Promise that times out after
   * the given timeout interval, and tries to execute the given operation within
   * that time.
   */
  async withSpecifiedTimeout(timeout, operation) {
    // TODO: rewrite this method to async-await style
    // eslint-disable-next-line  no-async-promise-executor
    return new Promise(async (resolve, reject) => {
      try {
        resolve(await new Promise(operation))
      } catch (err) {
        reject(err)
      }
    }).timeout(timeout || this._timeout)
  }

  /*
   * Resolve content ID with timeout.
   */
  async resolveContentIdWithTimeout(timeout, contentId) {
    return await this.withSpecifiedTimeout(timeout, async (resolve, reject) => {
      try {
        resolve(await this._resolve_content_id(contentId))
      } catch (err) {
        reject(err)
      }
    })
  }

  /*
   * Stat a content ID.
   */
  async stat(contentId, timeout) {
    const resolved = await this.resolveContentIdWithTimeout(timeout, contentId)

    return await this.withSpecifiedTimeout(timeout, (resolve, reject) => {
      this.ipfs.files.stat(`/ipfs/${resolved}`, { withLocal: true }, (err, res) => {
        if (err) {
          reject(err)
          return
        }
        resolve(res)
      })
    })
  }

  /*
   * Return the size of a content ID.
   */
  async size(contentId, timeout) {
    const stat = await this.stat(contentId, timeout)
    return stat.size
  }

  /*
   * Opens the specified content in read or write mode, and returns a Promise
   * with the stream.
   *
   * Read streams will contain a fileInfo property, with:
   *  - a `mimeType` field providing the file's MIME type, or a default.
   *  - an `ext` property, providing a file extension suggestion, or a default.
   *
   * Write streams have a slightly different flow, in order to allow for MIME
   * type detection and potential filtering. First off, they are written to a
   * temporary location, and only committed to the backend once their
   * `commit()` function is called.
   *
   * When the commit has finished, a `committed` event is emitted, which
   * contains the IPFS backend's content ID.
   *
   * Write streams also emit a `fileInfo` event during writing. It is passed
   * the `fileInfo` field as described above. Event listeners may now opt to
   * abort the write or continue and eventually `commit()` the file. There is
   * an explicit `cleanup()` function that removes temporary files as well,
   * in case comitting is not desired.
   */
  async open(contentId, mode, timeout) {
    if (mode !== 'r' && mode !== 'w') {
      throw Error('The only supported modes are "r", "w" and "a".')
    }

    // Write stream
    if (mode === 'w') {
      return this.createWriteStream(contentId, timeout)
    }

    // Read stream - with file type detection
    return await this.createReadStream(contentId, timeout)
  }

  createWriteStream() {
    return new StorageWriteStream(this)
  }

  async createReadStream(contentId, timeout) {
    const resolved = await this.resolveContentIdWithTimeout(timeout, contentId)

    let found = false
    return await this.withSpecifiedTimeout(timeout, (resolve, reject) => {
      const ls = this.ipfs.getReadableStream(resolved)
      ls.on('data', async (result) => {
        if (result.path === resolved) {
          found = true

          const ftStream = await fileType.stream(result.content)
          resolve(fixFileInfoOnStream(ftStream))
        }
      })
      ls.on('error', (err) => {
        ls.end()
        debug(err)
        reject(err)
      })
      ls.on('end', () => {
        if (!found) {
          const err = new Error('No matching content found for', contentId)
          debug(err)
          reject(err)
        }
      })
      ls.resume()
    })
  }

  /*
   * Synchronize the given content ID
   */
  async synchronize(contentId, callback) {
    const resolved = await this.resolveContentIdWithTimeout(this._timeout, contentId)

    // TODO: validate resolved id is proper ipfs_cid, not null or empty string

    if (!this.pinning[resolved] && !this.pinned[resolved]) {
      debug(`Pinning hash: ${resolved} content-id: ${contentId}`)
      this.pinning[resolved] = true

      // Callback passed to add() will be called on error or when the entire file
      // is retrieved. So on success we consider the content synced.
      this.ipfs.pin.add(resolved, { quiet: true, pin: true }, (err) => {
        delete this.pinning[resolved]
        if (err) {
          debug(`Error Pinning: ${resolved}`)
          callback && callback(err)
        } else {
          debug(`Pinned ${resolved}`)
          this.pinned[resolved] = true
          callback && callback(null, this.syncStatus(resolved))
        }
      })
    } else {
      callback && callback(null, this.syncStatus(resolved))
    }
  }

  syncStatus(ipfsHash) {
    return {
      syncing: this.pinning[ipfsHash] === true,
      synced: this.pinned[ipfsHash] === true,
    }
  }
}

module.exports = {
  Storage,
}
