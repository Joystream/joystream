'use strict';

const fs = require('fs');
const path = require('path');

/*
 * Helper function for walk; split out because it's used in two places.
 */
function report_and_recurse(base, relname, fname, lstat, linktarget, cb)
{
  // First report the value
  cb(null, relname, lstat, linktarget);

  // Recurse
  if (lstat.isDirectory()) {
    walk(base, fname, cb);
  }
}


/*
 * Recursively walk a file system hierarchy (in undefined order), returning all
 * entries via the callback(err, relname, lstat, [linktarget]). The name relative
 * to the base is returned.
 */
function walk(base, dir, cb)
{
  fs.readdir(dir, (err, files) => {
    if (err) {
      return cb(err);
    }

    files.forEach((name) => {
      const fname = path.resolve(dir, name);
      fs.lstat(fname, (err, lstat) => {
        if (err) {
          return cb(err);
        }

        // The base is always prefixed, so a simple string slice should do.
        const relname = fname.slice(base.length);

        // We have a symbolic link? Resolve it.
        if (lstat.isSymbolicLink()) {
          fs.readlink(fname, (err, linktarget) => {
            if (err) {
              return cb(err);
            }

            report_and_recurse(base, relname, fname, lstat, linktarget, cb);
          });
        }
        else {
          report_and_recurse(base, relname, fname, lstat, undefined, cb);
        }
      });
    });
  });
};


module.exports = function(base, cb)
{
  base = path.resolve(base);
  return walk(base, base, cb);
};
