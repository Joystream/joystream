'use strict';

const path = require('path');
const fs = require('fs');
const mime = require('mime');
const hyperdrive = require('hyperdrive');
const events = require('events');

const debug = require('debug')('joystream:repository');


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
   * Construct with base path for storage.
   */
  constructor(storage_path, use_fs)
  {
    super();

    const ready = () => {
      debug('Initialized', (use_fs ? 'filesystem' : 'hyperdrive'), 'storage at:', this.storage_path);
    };

    this.storage_path = path.resolve(storage_path);
    if (use_fs) {
      this.archive = fs;
      this.base_path = this.storage_path;
      ready();
      this.emit('ready');
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
    var fname = this._resolve_name(name);
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

    var fname = this._resolve_name(name);
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
   * except without options - we always only return (String) names.
   */
  list(name, cb)
  {
    var fname = this._resolve_name(name);
    debug('Listing', fname);
    this.archive.readdir(fname, {}, cb);
  }


  /*
   * Create the named directory (recursively).
   */
  mkdir(name, cb)
  {
    var fname = this._resolve_name(name);
    debug('Create dir', fname);
    this.archive.mkdir(fname, { recursive: true }, cb);
  }


  /*
   * Resolve file name relative to the archive base.
   */
  _resolve_name(name)
  {
    debug('Resolving', name);

    // First resolve the name to avoid escaping via '/../' constructs
    const cwd = path.resolve(process.cwd());
    var res = path.join(cwd, name);
    debug('Joined', res);
    res = path.normalize(res);
    debug('Normalized', res);

    // Then strip the current working directory (it's used in resolve);
    // this way we have a relative path that no longer contains '..'
    // segments. It may not point to where the caller wants, but it
    // points to somewhere safe.
    res = path.relative(cwd, res);
    debug('Relative path is', res);

    // Since we started with the CWD, the relative path may not be, on pain
    // of pain, start with a relative path indicator ('.' on POSIX and Win32)
    if (res[0] == '.') {
      throw new Error(`Name "${name}" cannot be resolved to a repo relative path, aborting!`);
    }

    // If we've got a root, return the base path.
    if (!res) {
      debug('Return base', this.base_path);
      return this.base_path;
    }

    // Otherwise resolve relative to the base path
    res = path.resolve(this.base_path, res);
    debug('Return resolved', res);
    return res;
  }
}


module.exports = {
  Repository: Repository,
};
