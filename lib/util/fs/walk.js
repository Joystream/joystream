'use strict';

const fs = require('fs');
const path = require('path');

const debug = require('debug')('joystream:util:fs:walk');

class Walker
{
  constructor(base, cb)
  {
    this.base = base;
    this.cb = cb;
    this.pending = 0;
  }

  /*
   * Helper function for walk; split out because it's used in two places.
   */
  report_and_recurse(relname, fname, lstat, linktarget)
  {
    // First report the value
    this.cb(null, relname, lstat, linktarget);

    // Recurse
    if (lstat.isDirectory()) {
      this.walk(fname);
    }

    // Decrease pending count again.
    this.pending -= 1;
    debug('Finishing', relname, 'decreases pending to', this.pending);
    if (!this.pending) {
      debug('No more pending.');
      this.cb(null);
    }
  }


  walk(dir)
  {
    fs.readdir(dir, (err, files) => {
      if (err) {
        this.cb(err);
        return;
      }

      // More pending data.
      this.pending += files.length;
      debug('Reading', dir, 'bumps pending to', this.pending);

      files.forEach((name) => {
        const fname = path.resolve(dir, name);
        fs.lstat(fname, (err2, lstat) => {
          if (err2) {
            this.cb(err2);
            return;
          }

          // The base is always prefixed, so a simple string slice should do.
          const relname = fname.slice(this.base.length + 1);

          // We have a symbolic link? Resolve it.
          if (lstat.isSymbolicLink()) {
            fs.readlink(fname, (err3, linktarget) => {
              if (err3) {
                this.cb(err3);
                return;
              }

              this.report_and_recurse(relname, fname, lstat, linktarget);
            });
          }
          else {
            this.report_and_recurse(relname, fname, lstat);
          }
        });
      });
    });
  }
}


/*
 * Recursively walk a file system hierarchy (in undefined order), returning all
 * entries via the callback(err, relname, lstat, [linktarget]). The name relative
 * to the base is returned.
 *
 * The callback is invoked one last time without data to signal the end of data.
 */
module.exports = function(base, cb)
{
  const resolved = path.resolve(base);
  const w = new Walker(resolved, cb);
  w.walk(resolved);
};
