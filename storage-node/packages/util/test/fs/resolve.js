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
const path = require('path')

const resolve = require('@joystream/storage-utils/fs/resolve')

function tests(base) {
  it('resolves absolute paths relative to the base', function () {
    const resolved = resolve(base, '/foo')
    const relative = path.relative(base, resolved)
    expect(relative).to.equal('foo')
  })

  it('allows for relative paths that stay in the base', function () {
    const resolved = resolve(base, 'foo/../bar')
    const relative = path.relative(base, resolved)
    expect(relative).to.equal('bar')
  })

  it('prevents relative paths from breaking out of the base', function () {
    expect(() => resolve(base, '../foo')).to.throw()
  })

  it('prevents long relative paths from breaking out of the base', function () {
    expect(() => resolve(base, '../../../foo')).to.throw()
  })

  it('prevents sneaky relative paths from breaking out of the base', function () {
    expect(() => resolve(base, 'foo/../../../bar')).to.throw()
  })
}

describe('util/fs/resolve', function () {
  describe('slash base', function () {
    tests('/')
  })

  describe('empty base', function () {
    tests('')
  })

  describe('short base', function () {
    tests('/base')
  })

  describe('long base', function () {
    tests('/this/base/is/very/long/indeed')
  })
})
