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

'use strict'

const fs = require('fs')
const path = require('path')

const debug = require('debug')('joystream:util:fs:walk')

class Walker {
  constructor(archive, base, cb) {
    this.archive = archive
    this.base = base
    this.slice_offset = this.base.length
    if (this.base[this.slice_offset - 1] !== '/') {
      this.slice_offset += 1
    }
    this.cb = cb
    this.pending = 0
  }

  /*
   * Check pending
   */
  checkPending(name) {
    // Decrease pending count again.
    this.pending -= 1
    debug('Finishing', name, 'decreases pending to', this.pending)
    if (!this.pending) {
      debug('No more pending.')
      this.cb(null)
    }
  }

  /*
   * Helper function for walk; split out because it's used in two places.
   */
  reportAndRecurse(relname, fname, lstat, linktarget) {
    // First report the value
    this.cb(null, relname, lstat, linktarget)

    // Recurse
    if (lstat.isDirectory()) {
      this.walk(fname)
    }

    this.checkPending(fname)
  }

  walk(dir) {
    // This is a little hacky - since readdir() may take a while, and we don't
    // want the pending count to drop to zero before it's finished, we bump
    // it up and down while readdir() does it's job.
    // What this achieves is that when processing a parent directory finishes
    // before walk() on a subdirectory could finish its readdir() call, the
    // pending count still has a value.
    // Note that in order not to hang on empty directories, we need to
    // explicitly check the pending count in cases when there are no files.
    this.pending += 1
    this.archive.readdir(dir, (err, files) => {
      if (err) {
        this.cb(err)
        return
      }

      // More pending data.
      this.pending += files.length
      debug('Reading', dir, 'bumps pending to', this.pending)

      files.forEach((name) => {
        const fname = path.resolve(dir, name)
        this.archive.lstat(fname, (err2, lstat) => {
          if (err2) {
            this.cb(err2)
            return
          }

          // The base is always prefixed, so a simple string slice should do.
          const relname = fname.slice(this.slice_offset)

          // We have a symbolic link? Resolve it.
          if (lstat.isSymbolicLink()) {
            this.archive.readlink(fname, (err3, linktarget) => {
              if (err3) {
                this.cb(err3)
                return
              }

              this.reportAndRecurse(relname, fname, lstat, linktarget)
            })
          } else {
            this.reportAndRecurse(relname, fname, lstat)
          }
        })
      })

      this.checkPending(dir)
    })
  }
}

/*
 * Recursively walk a file system hierarchy (in undefined order), returning all
 * entries via the callback(err, relname, lstat, [linktarget]). The name relative
 * to the base is returned.
 *
 * You can optionally pass an 'archive', i.e. a class or module that responds to
 * file system like functions. If you don't, then the 'fs' module is assumed as
 * default.
 *
 * The callback is invoked one last time without data to signal the end of data.
 */
module.exports = function (base, archive, cb) {
  // Archive is optional and defaults to fs, but cb is not.
  if (!cb) {
    cb = archive
    archive = fs
  }

  const resolved = path.resolve(base)
  const w = new Walker(archive, resolved, cb)
  w.walk(resolved)
}
