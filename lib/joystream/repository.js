'use strict';

const path = require('path');
const fs = require('fs');
const mime = require('mime');
const hyperdrive = require('hyperdrive');

const debug = require('debug')('joystream:repository');

/*
 * Repository class; abstracts out file system and hyperdrive based backends.
 * Backends follow a subset node.js' filesystem module, and future backends
 * should do the same.
 *
 * Each instance represents one filesystem-like repository of data, with local
 * storage managed at its storage_path.
 **/
class Repository
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
    var fname = path.resolve(this.base_path, name);
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
      if (detect_mime) {
        type = mime.getType(name);
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
      return cb(null, mime.getType(name), stream);
    } catch (err) {
      return cb(err);
    }
  }

  /*
   * List content directories. This is largely analogous to fs.readdir(),
   * except without options. Callback valu
   */
  list(name, cb)
  {
    var fname = path.resolve(this.base_path, name);
    debug('Listing', fname);
    this.archive.readdir(fname, { withFileTypes: true }, cb);
  }
}


module.exports = {
  Repository: Repository,
};
