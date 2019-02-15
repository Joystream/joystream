'use strict';

const path = require('path');
const fs = require('fs');
const mime = require('mime');

const debug = require('debug')('joystream:storage');

/*
 * Storage class; modify for hyperdrive based storage.
 **/
class Storage
{

  /*
   * Construct with base path for storage.
   */
  constructor(storage_path)
  {
    this.storage_path = path.resolve(storage_path);
    debug('Initialized storage at:', this.storage_path);
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
    const fname = path.resolve(this.storage_path, name);
    debug('Stat:', fname);
    fs.stat(fname, fs.constants.R_OK, (err, stats) => {
      if (err) {
        cb(null, null, {
          code: 404,
          message: `Does not exist or inaccessible: ${name}`,
        });
        return;
      }

      var type = null;
      if (detect_mime) {
        type = mime.getType(fname);
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
    const fname = path.resolve(this.storage_path, name);
    debug('Opening:', fname);
    try {
      // TODO support write mode
      var stream = fs.createReadStream(fname, { encoding: 'binary' });
      return cb(mime.getType(fname), stream);
    } catch (err) {
      return cb(null, null, err);
    }
  }
}


module.exports = {
  Storage: Storage,
};
