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

const path = require('path')

const debug = require('debug')('joystream:util:fs:resolve')

/*
 * Resolves name relative to base, throwing an error if the given
 * name wants to break out of the base directory.
 *
 * The problem is, we want to use node's functions so we don't add
 * platform dependent code, but node's path.resolve() function is a little
 * useless for our case because it does not care about breaking out of
 * a base directory.
 */
function resolve(base, name) {
  debug('Resolving', name)

  // In a firs step, we strip leading slashes from the name, because they're
  // just saying "relative to the base" in our use case.
  let res = name.replace(/^\/+/, '')
  debug('Stripped', res)

  // At this point resolving the path should stay within the base we specify.
  // We do specify a base other than the file system root, because the file
  // everything is always relative to the file system root.
  const testBase = path.join(path.sep, 'test-base')
  debug('Test base is', testBase)
  res = path.resolve(testBase, res)
  debug('Resolved', res)

  // Ok, we can check for violations now.
  if (res.slice(0, testBase.length) !== testBase) {
    throw Error(`Name "${name}" cannot be resolved to a repo relative path, aborting!`)
  }

  // If we strip the base now, we have the relative name resolved.
  res = res.slice(testBase.length + 1)
  debug('Relative', res)

  // Finally we can join this relative name to the requested base.
  res = path.join(base, res)
  debug('Result', res)
  return res
}

module.exports = resolve
