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

const debug = require('debug')('joystream:storage:storage');

const Promise = require('bluebird');
Promise.config({
  cancellation: true,
});

const file_type = require('file-type');

const ipfs_client = require('ipfs-http-client');
const _ = require('lodash');

// Default request timeout; imposed on top of the IPFS client, because the
// client doesn't seem to care.
const DEFAULT_TIMEOUT = 30 * 1000;

// Default/dummy resolution implementation.
const DEFAULT_RESOLVE_CONTENT_ID = async (original) => {
  debug('Default resolution returns original CID', original);
  return original;
}

// Default file info if nothing could be detected.
const DEFAULT_FILE_INFO = {
  mime_type: 'application/octet-stream',
  ext: 'bin',
};


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
  static async create(options)
  {
    const storage = new Storage();
    await storage._init(options);
    return storage;
  }

  async _init(options)
  {
    this.options = _.clone(options || {});
    this.options.ipfs = this.options.ipfs || {};

    this._timeout = this.options.timeout || DEFAULT_TIMEOUT;
    this._resolve_content_id = this.options.resolve_content_id || DEFAULT_RESOLVE_CONTENT_ID;

    this.ipfs = ipfs_client(this.options.ipfs.connect_options);
    return this._with_specified_timeout(this._timeout, (resolve, reject) => {
      this.ipfs.id((err, identity) => {
        if (err) {
          debug('Error connecting', err);
          reject(err);
          return;
        }

        this.id = identity;
        debug('Connected; managing IPFS node', identity.id);
        resolve();
      });
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
      this.ipfs.object.stat(resolved, {}, (err, res) => {
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
    // DataSize is not the same as file size - it may be a bit more. Still, it's
    // the best we're getting out of IPFS short of reading the entire stream.
    return stat.DataSize;
  }

  /*
   * Opens the specified content in read or write mode, and returns a Promise
   * with the stream.
   *
   * When a stream is opened for writing, it emits a final event after all
   * writing finished, 'committed', which is passed the stream's internal
   * content ID (i.e. from IPFS in this implementation).
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

  _fix_file_info(stream)
  {
    // fileType is a weird name, because we're really looking at MIME types.
    // Also, the type field includes extension info, so we're going to call
    // it file_info { mime_type, ext } instead.
    // Nitpicking, but it also means we can add our default type if things
    // go wrong.
    var info = stream.fileType;
    delete(stream.fileType);
    if (!info) {
      info = DEFAULT_FILE_INFO;
    }
    else {
      info.mime_type = info.mime;
      delete(info.mime);
    }
    stream.file_info = info;
    return stream;
  }

  async _create_write_stream(content_id)
  {
    // IPFS wants us to just dump a stream into its storage, then returns a
    // content ID (of its own).
    // We need to instead return a stream immediately, that we eventually
    // decorate with the content ID when that's available.
    return new Promise((resolve, reject) => {
      const { PassThrough } = require('stream');
      const stream = new PassThrough();

      // Not sure what will happen by resolving this Promise here, and later
      // potentially rejecting it. We'll see.
      resolve(stream);

      this.ipfs.addFromStream(stream)
        .then((result) => {
          const hash = result[0].hash;
          stream.hash = hash;
          stream.emit('committed', hash);
        })
        .catch((err) => {
          reject(err);
        });
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
          resolve(this._fix_file_info(ft_stream));
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
}

module.exports = {
  Storage: Storage,
};
