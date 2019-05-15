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

const path = require('path');
const fs = require('fs');
const file_type = require('file-type');
const hyperdrive = require('hyperdrive');
const events = require('events');

const { ReadableStreamBuffer } = require('stream-buffers');

const debug = require('debug')('joystream:storage:repository');

const fsresolve = require('@joystream/util/fs/resolve');
const fswalk = require('@joystream/util/fs/walk');

const CHUNK_SIZE = 64 * 1024;

const DEFAULT_FILE_TYPE = 'application/octet-stream';


/*
 * Repository class; abstracts out file system and hyperdrive based backends.
 * Backends follow a subset node.js' filesystem module, and future backends
 * should do the same.
 *
 * Each instance represents one filesystem-like repository of data, with local
 * storage managed at its storage_path.
 *
 * Emits a 'ready' event when it's ready for use.
 **/
class Repository extends events.EventEmitter
{

  /*
   * Construct with base path for storage. If a template is given, it will
   * be passed to populate().
   */
  constructor(storage_path, use_fs, template)
  {
    super();

    // When the archive is ready, optionally template it.
    const ready = () => {
      if (template) {
        this.populate(template, (err) => {
          if (err) {
            throw err;
          }
          debug('Initialized', (use_fs ? 'filesystem' : 'hyperdrive'), 'storage and populated from template at:', this.storage_path);
        });
      }
      else {
        debug('Initialized', (use_fs ? 'filesystem' : 'hyperdrive'), 'storage at:', this.storage_path);
      }
    };

    this.storage_path = path.resolve(storage_path);
    if (use_fs) {
      this.archive = fs;
      this.base_path = this.storage_path;
      setTimeout(() => {
        ready();
        this.emit('ready');
      }, 1); // Minimum timeout so it happens in the next scheduler loop
    }
    else {
      this.archive = hyperdrive(this.storage_path);
      this.base_path = '/';
      this.archive.on('ready', () => {
        ready();
        this.emit('ready');
      });
    }

  }

  /*
   * Calls the callback with cb(size, err) - either with a file size of the
   * named asset in bytes, or an error with code and message fields.
   */
  size(name, cb)
  {
    this.stat(name, false, (err, stats) => {
      if (err) {
        cb(err);
        return;
      }
      cb(null, stats.size);
    });
  }

  /*
   * Stat a file. Calls cb(stats) if detect_mime is falsy, or
   * cb(stats, type) if it is truthy. On errors, cb(null, null, err)
   * is called.
   */
  stat(name, detect_mime, cb)
  {
    var fname = fsresolve(this.base_path, name);
    debug('Stat:', fname);
    this.archive.stat(fname, fs.constants.R_OK, (err, stats) => {
      if (err) {
        cb({
          code: 404,
          message: `Does not exist or inaccessible: ${name}`,
        });
        return;
      }

      var type = null;
      if (detect_mime && !stats.isDirectory()) {
        this.open(fname, 'r', (err, mime, stream) => {
          if (stream) {
            stream.destroy();
          }

          if (err) {
            cb(err);
            return;
          }

          cb(null, stats, mime);
        });
        return;
      }

      // Return
      cb(null, stats, type);
    });
  }

  /*
   * Opens the named asset in read or write mode, and invokes the callback
   * with cb(err, type, stream) - either with the mime type and opened stream,
   * or an error with code and message fields.
   */
  open(name, mode, cb)
  {
    if (mode != 'r' && mode != 'w' && mode != 'a') {
      throw Error('The only supported modes are "r", "w" and "a".');
    }

    var fname = fsresolve(this.base_path, name);

    if (mode == 'w') {
      var dirname = path.dirname(name);
      debug('Ensuring that parent directory exists:', dirname);
      this.mkdir(dirname, (err) => {
        if (err) {
          debug('Could not create directory', dirname);
          cb(err);
          return;
        }
        this._open(fname, mode, cb);
      });
    }
    else {
      this._open(fname, mode, cb);
    }
  }

  _open(fname, mode, cb)
  {
    debug('Opening', fname, 'with mode', mode);
    try {
      if (mode == 'r') {
        const stream = this.archive.createReadStream(fname, { flags: `${mode}+`,
          encoding: 'binary' });

        // Have a reader function that detects the file type.
        var buf = Buffer.alloc(0);
        const invoke_callback = (mime_type) => {
          // Now put the detection buffer into a readable memory stream,
          // pass that on, and 'pipe' to it.
          const bufstream = new ReadableStreamBuffer({
            chunkSize: CHUNK_SIZE,
          });
          bufstream.put(buf);

          cb(null, mime_type, bufstream);

          stream.on('data', (data) => {
            bufstream.put(data);
          });
          stream.on('end', (data) => {
            bufstream.put(data);
            bufstream.stop();
          });
        };

        const ft_detector = (chunk) => {
          // Ensure chunk is a Buffer
          if (typeof chunk === 'string') {
            chunk = Buffer.from(chunk);
          }
          debug('Got', chunk.length, chunk);

          // Add chunk to our detection buffer.
          buf = Buffer.concat([buf, chunk]);

          // If we have sufficient data buffered, detect file type.
          if (buf.length >= file_type.minimumBytes) {
            stream.off('data', ft_detector);
            stream.off('end', ft_detector_end);

            debug('Read enough for file type detection.');
            var ft = { mime: DEFAULT_FILE_TYPE };
            const res = file_type(buf);
            if (res != null) {
              ft = res;
            }
            debug('File type detected as', ft.mime);

            invoke_callback(ft.mime);
            return true;
          }
          return false;
        };

        const ft_detector_end = (chunk) => {
          // This is called if the stream reaches an end without having
          // detected a file type.
          // Give one last attempt to detect the file type. If that worked,
          // the callback will have been invoked.
          if (chunk) {
            if (ft_detector(chunk)) {
              return;
            }
          }

          // If we didn't return above, we need to invoke the callback
          // still, but won't know the mime type.
          stream.off('data', ft_detector);
          stream.off('end', ft_detector_end);
          invoke_callback(null);
        };

        stream.on('data', ft_detector);
        stream.on('end', ft_detector_end);
        return;
      }
      else {
        const stream = this.archive.createWriteStream(fname, { flags: `${mode}+`,
          encoding: 'binary' });
        return cb(null, DEFAULT_FILE_TYPE, stream);
      }
    } catch (err) {
      return cb(err);
    }
  }

  /*
   * List content directories. This is largely analogous to fs.readdir(),
   * except without options - we always only return (String) names.
   */
  list(name, cb)
  {
    var fname = fsresolve(this.base_path, name);
    debug('Listing', fname);
    this.archive.readdir(fname, {}, cb);
  }


  /*
   * Create the named directory (recursively).
   */
  mkdir(name, cb)
  {
    var fname = fsresolve(this.base_path, name);
    debug('Create dir', fname);
    // FIXME hyperdrive throws an error for already existing paths
    this.archive.mkdir(fname, { recursive: true }, cb);
  }


  /*
   * Populate the repository from a template, which may either be a directory
   * or a function. If a directory is given, its contents are copied into the
   * repository. Otherwise, the template is assumed to be a function invoked
   * as template(repo, commit);
   *
   * The commit() callback will be invoked once population has finished. This
   * implies that a template function must invoke commit() when finished.
   */
  populate(template, commit)
  {
    if (typeof template == 'string') {
      this._populate_from_dir(template, commit);
    }
    else {
      // Assume callable
      template(this, commit);
    }
  }

  /*
   * Populate a repo from a file system hierarchy.
   */
  _populate_from_dir(base, commit)
  {
    // We're building a map of FS entries, and then draining it afterwards.
    // This consumes a little bit of memory and is a tad slower than doing
    // thigs on-the-fly, but it's more readable.
    var io_map = new Map();
    var processed = 0;

    // Called whenever an entry in the map is finished. If that decreases the
    // map size to zero, we're done and call commit.
    const finish = (relname) => {
      debug(`Finished with "${relname}".`);
      processed += 1;
      // We're done when the map is empty
      if (io_map.size == processed) {
        debug('I/O map is drained, committing.');
        commit();
      }
    };

    // Called when the map is fully built.
    const process_map = () => {
      io_map.forEach((stat, relname) => {

        // We support only some file types (for obvious reasons), but that should
        // be sufficient for us.
        if (stat.isDirectory()) {
          this.mkdir(relname, (err) => {
            if (err) {
              commit(err);
              return;
            }
            finish(relname);
          });
        }
        else if (stat.isFile()) {
          this.open(relname, 'w', (err, mime, stream) => {
            if (err) {
              commit(err);
              return;
            }

            const absname = path.resolve(base, relname);
            const read = fs.createReadStream(absname);
            stream.on('finish', () => {
              finish(relname);
            });
            read.pipe(stream);
          });
        }
        else {
          debug(`Skipping entry "${relname}", because it's file type is unsupported.`);
          // Might not do anything, but we have to finish up.
          finish(relname);
        }
      });
    };

    // Walk the base directory, build the map, and process it when it's finished.
    fswalk(base, (err, relname, stat, linktarget) => {
      if (err) {
        commit(err);
        return;
      }

      // Done reading files, but not done processing them.
      if (!relname) {
        process_map();
        return;
      }

      // Need to work on this entry.
      io_map.set(relname, stat);
    });
  }
}


module.exports = {
  Repository: Repository,
};
