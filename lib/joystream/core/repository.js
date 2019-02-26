'use strict';

const path = require('path');
const fs = require('fs');
const mime = require('mime');
const hyperdrive = require('hyperdrive');
const events = require('events');

const debug = require('debug')('joystream:repository');

const fsresolve = require('joystream/util/fs/resolve');
const fswalk = require('joystream/util/fs/walk');


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

    var fname = fsresolve(this.base_path, name);
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

    // Called whenever an entry in the map is finished. If that decreases the
    // map size to zero, we're done and call commit.
    const finish = (relname) => {
      io_map.delete(relname);
      // We're done when the map is empty
      if (!io_map.size) {
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
