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

'use strict';

const { Transform } = require('stream');
const fs = require('fs');

const debug = require('debug')('joystream:storage:storage');

const Promise = require('bluebird');
Promise.config({
  cancellation: true,
});

const file_type = require('file-type');
const ipfs_client = require('ipfs-http-client');
const temp = require('temp').track();
const _ = require('lodash');

// Default request timeout; imposed on top of the IPFS client, because the
// client doesn't seem to care.
const DEFAULT_TIMEOUT = 30 * 1000;

// Default/dummy resolution implementation.
const DEFAULT_RESOLVE_CONTENT_ID = async (original) => {
  debug('Warning: Default resolution returns original CID', original);
  return original;
}

// Default file info if nothing could be detected.
const DEFAULT_FILE_INFO = {
  mime_type: 'application/octet-stream',
  ext: 'bin',
};


/*
 * fileType is a weird name, because we're really looking at MIME types.
 * Also, the type field includes extension info, so we're going to call
 * it file_info { mime_type, ext } instead.
 * Nitpicking, but it also means we can add our default type if things
 * go wrong.
 */
function fix_file_info(info)
{
  if (!info) {
    info = DEFAULT_FILE_INFO;
  }
  else {
    info.mime_type = info.mime;
    delete(info.mime);
  }
  return info;
}

function fix_file_info_on_stream(stream)
{
  var info = fix_file_info(stream.fileType);
  delete(stream.fileType);
  stream.file_info = info;
  return stream;
}


/*
 * Internal Transform stream for helping write to a temporary location, adding
 * MIME type detection, and a commit() function.
 */
class StorageWriteStream extends Transform
{
  constructor(storage, options)
  {
    options = _.clone(options || {});

    super(options);

    this.storage = storage;

    // Create temp target.
    this.temp = temp.createWriteStream();
    this.buf = Buffer.alloc(0);
  }

  _transform(chunk, encoding, callback)
  {
    // Deal with buffers only
    if (typeof chunk === 'string') {
      chunk = Buffer.from(chunk);
    }

    // Logging this all the time is too verbose
    // debug('Writing temporary chunk', chunk.length, chunk);
    this.temp.write(chunk);

    // Try to detect file type during streaming.
    if (!this.file_info && this.buf < file_type.minimumBytes) {
      this.buf = Buffer.concat([this.buf, chunk]);

      if (this.buf >= file_type.minimumBytes) {
        const info = file_type(this.buf);
        // No info? We can try again at the end of the stream.
        if (info) {
          this.file_info = fix_file_info(info);
          this.emit('file_info', this.file_info);
        }
      }
    }

    callback(null);
  }

  _flush(callback)
  {
    debug('Flushing temporary stream:', this.temp.path);
    this.temp.end();

    // Since we're finished, we can try to detect the file type again.
    if (!this.file_info) {
      const read = fs.createReadStream(this.temp.path);
      file_type.stream(read)
        .then((stream) => {
          this.file_info = fix_file_info_on_stream(stream).file_info;
          this.emit('file_info', this.file_info);
        })
        .catch((err) => {
          debug('Error trying to detect file type at end-of-stream:', err);
        });
    }

    callback(null);
  }

  /*
   * Commit this stream to the IPFS backend.
   */
  commit()
  {
    // Create a read stream from the temp file.
    if (!this.temp) {
      throw new Error('Cannot commit a temporary stream that does not exist. Did you call cleanup()?');
    }

    debug('Committing temporary stream: ', this.temp.path);
    this.storage.ipfs.addFromFs(this.temp.path)
      .then(async (result) => {
        const hash = result[0].hash;
        debug('Stream committed as', hash);
        this.emit('committed', hash);
        await this.storage.ipfs.pin.add(hash);
      })
      .catch((err) => {
        debug('Error committing stream', err);
        this.emit('error', err);
      })
  }

  /*
   * Clean up temporary data.
   */
  cleanup()
  {
    debug('Cleaning up temporary file: ', this.temp.path);
    fs.unlink(this.temp.path, () => {}); // Ignore errors
    delete(this.temp);
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
class Storage
{
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
  static create(options)
  {
    const storage = new Storage();
    storage._init(options);
    return storage;
  }

  _init(options)
  {
    this.options = _.clone(options || {});
    this.options.ipfs = this.options.ipfs || {};

    this._timeout = this.options.timeout || DEFAULT_TIMEOUT;
    this._resolve_content_id = this.options.resolve_content_id || DEFAULT_RESOLVE_CONTENT_ID;

    this.ipfs = ipfs_client(this.options.ipfs.connect_options);

    this.pins = {};

    this.ipfs.id((err, identity) => {
      if (err) {
        debug(`Warning IPFS daemon not running: ${err.message}`);
      } else {
        debug(`IPFS node is up with identity: ${identity.id}`);
      }
    });
  }

  /*
   * Uses bluebird's timeout mechanism to return a Promise that times out after
   * the given timeout interval, and tries to execute the given operation within
   * that time.
   */
  async _with_specified_timeout(timeout, operation)
  {
    return new Promise(async (resolve, reject) => {
      try {
        resolve(await new Promise(operation));
      } catch (err) {
        reject(err);
      }
    }).timeout(timeout || this._timeout);
  }

  /*
   * Resolve content ID with timeout.
   */
  async _resolve_content_id_with_timeout(timeout, content_id)
  {
    return await this._with_specified_timeout(timeout, async (resolve, reject) => {
      try {
        resolve(await this._resolve_content_id(content_id));
      } catch (err) {
        reject(err);
      }
    });
  }

  /*
   * Stat a content ID.
   */
  async stat(content_id, timeout)
  {
    const resolved = await this._resolve_content_id_with_timeout(timeout, content_id);

    return await this._with_specified_timeout(timeout, (resolve, reject) => {
      this.ipfs.files.stat(`/ipfs/${resolved}`, { withLocal: true }, (err, res) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(res);
      });
    });
  }

  /*
   * Return the size of a content ID.
   */
  async size(content_id, timeout)
  {
    const stat = await this.stat(content_id, timeout);
    return stat.size;
  }

  /*
   * Opens the specified content in read or write mode, and returns a Promise
   * with the stream.
   *
   * Read streams will contain a file_info property, with:
   *  - a `mime_type` field providing the file's MIME type, or a default.
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
   * Write streams also emit a `file_info` event during writing. It is passed
   * the `file_info` field as described above. Event listeners may now opt to
   * abort the write or continue and eventually `commit()` the file. There is
   * an explicit `cleanup()` function that removes temporary files as well,
   * in case comitting is not desired.
   */
  async open(content_id, mode, timeout)
  {
    if (mode != 'r' && mode != 'w') {
      throw Error('The only supported modes are "r", "w" and "a".');
    }

    // Write stream
    if (mode === 'w') {
      return await this._create_write_stream(content_id, timeout);
    }

    // Read stream - with file type detection
    return await this._create_read_stream(content_id, timeout);
  }

  async _create_write_stream(content_id)
  {
    // IPFS wants us to just dump a stream into its storage, then returns a
    // content ID (of its own).
    // We need to instead return a stream immediately, that we eventually
    // decorate with the content ID when that's available.
    return new Promise((resolve, reject) => {
      const stream = new StorageWriteStream(this);
      resolve(stream);
    });
  }

  async _create_read_stream(content_id, timeout)
  {
    const resolved = await this._resolve_content_id_with_timeout(timeout, content_id);

    var found = false;
    return await this._with_specified_timeout(timeout, (resolve, reject) => {
      const ls = this.ipfs.getReadableStream(resolved);
      ls.on('data', async (result) => {
        if (result.path === resolved) {
          found = true;

          const ft_stream = await file_type.stream(result.content);
          resolve(fix_file_info_on_stream(ft_stream));
        }
      });
      ls.on('error', (err) => {
        ls.end();
        debug(err);
        reject(err);
      });
      ls.on('end', () => {
        if (!found) {
          const err = new Error('No matching content found for', content_id);
          debug(err);
          reject(err);
        }
      });
      ls.resume();
    });
  }

  /*
   * Synchronize the given content ID
   */
  async synchronize(content_id)
  {
    const resolved = await this._resolve_content_id_with_timeout(this._timeout, content_id);

    if (this.pins[resolved]) {
      return;
    }

    debug(`Pinning ${resolved}`);

    // This call blocks until file is retreived..
    this.ipfs.pin.add(resolved, {quiet: true, pin: true}, (err, res) => {
      if (err) {
        debug(`Error Pinning: ${resolved}`)
        delete this.pins[resolved];
      } else {
        debug(`Pinned ${resolved}`);
      }
    });
  }
}

module.exports = {
  Storage: Storage,
};
