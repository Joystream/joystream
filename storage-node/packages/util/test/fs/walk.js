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

const expect = require('chai').expect
// Disabling the rule because of the 'temp' package API.
// eslint-disable-next-line no-unused-vars
const temp = require('temp').track()

const fs = require('fs')
const path = require('path')

const fswalk = require('@joystream/storage-utils/fs/walk')

function walktest(archive, base, done) {
  const results = new Map()

  fswalk(base, archive, (err, relname, stat, linktarget) => {
    expect(err).to.be.null

    if (relname) {
      results.set(relname, [stat, linktarget])
      return
    }

    // End of data, do testing
    const entries = Array.from(results.keys())
    expect(entries).to.include('foo')
    expect(results.get('foo')[0].isDirectory()).to.be.true

    expect(entries).to.include('bar')
    expect(results.get('bar')[0].isFile()).to.be.true

    if (archive === fs) {
      expect(entries).to.include('quux')
      expect(results.get('quux')[0].isSymbolicLink()).to.be.true
      expect(results.get('quux')[1]).to.equal('foo/baz')
    }

    expect(entries).to.include('foo/baz')
    expect(results.get('foo/baz')[0].isFile()).to.be.true

    done()
  })
}

describe('util/fs/walk', function () {
  it('reports all files in a file system hierarchy', function (done) {
    walktest(fs, path.resolve(__dirname, '../data'), done)
  })
})
