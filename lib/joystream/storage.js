'use strict';

const path = require('path');
const fs = require('fs');
const mime = require('mime');
const hyperdrive = require('hyperdrive');

const debug = require('debug')('joystream:storage');

/*
 * Storage class; modify for hyperdrive based storage.
 **/
class Storage
{

  /*
   * Construct with base path for storage.
   */
  constructor(storage_path, use_fs)
  {
    this.storage_path = path.resolve(storage_path);
    if (use_fs) {
      this.archive = fs;
      this.base_path = this.storage_path;
    }
    else {
      this.archive = hyperdrive(this.storage_path);
      this.base_path = '/';
    }
    debug('Initialized', (use_fs ? 'filesystem' : 'hyperdrive'), 'storage at:', this.storage_path);
  }

  /*
   * Calls the callback with cb(size, err) - either with a file size of the
   * named asset in bytes, or an error with code and message fields.
   */
  size(name, cb)
  {
    this.stat(name, false, (stats, _mime, err) => {
      if (err) {
        cb(-1, err);
        return;
      }
      cb(stats.size);
    });
  }

  /*
   * Stat a file. Calls cb(stats) if detect_mime is falsy, or
   * cb(stats, type) if it is truthy. On errors, cb(null, null, err)
   * is called.
   */
  stat(name, detect_mime, cb)
  {
    var fname = path.resolve(this.base_path, name);
    debug('Stat:', fname);
    this.archive.stat(fname, fs.constants.R_OK, (err, stats) => {
      if (err) {
        cb(null, null, {
          code: 404,
          message: `Does not exist or inaccessible: ${name}`,
        });
        return;
      }

      var type = null;
      if (detect_mime) {
        type = mime.getType(name);
      }

      // Return
      cb(stats, type);
    });
  }

  /*
   * Opens the named asset in read or write mode, and invokes the callback
   * with cb(type, stream, err) - either with the mime type and opened stream,
   * or an error with code and message fields.
   */
  open(name, mode, cb)
  {
    if (mode != 'r' && mode != 'w' && mode != 'a') {
      throw Error('The only supported modes are "r", "w" and "a".');
    }

    var fname = path.resolve(this.base_path, name);
    debug('Opening', fname, 'with mode', mode);
    try {
      var stream;
      if (mode == 'r') {
        stream = this.archive.createReadStream(fname, { flags: `${mode}+`,
          encoding: 'binary' });
      }
      else {
        stream = this.archive.createWriteStream(fname, { flags: `${mode}+`,
          encoding: 'binary' });
      }
      return cb(mime.getType(name), stream);
    } catch (err) {
      return cb(null, null, err);
    }
  }
}


module.exports = {
  Storage: Storage,
};
