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

const DEFAULT_CAPACITY = 100

const debug = require('debug')('joystream:util:lru')

/*
 * Simple least recently used cache.
 */
class LRUCache {
  constructor(capacity = DEFAULT_CAPACITY) {
    this.capacity = capacity
    this.clear()
  }

  /*
   * Return the entry with the given key, and update it's usage.
   */
  get(key) {
    const val = this.store.get(key)
    if (val) {
      this.access.set(key, Date.now())
    }
    return val
  }

  /*
   * Return true if the key is the cache, false otherwise.
   */
  has(key) {
    return this.store.has(key)
  }

  /*
   * Put a value into the cache.
   */
  put(key, value) {
    this.store.set(key, value)
    this.access.set(key, Date.now())
    this._prune()
  }

  /*
   * Delete a value from the cache.
   */
  del(key) {
    this.store.delete(key)
    this.access.delete(key)
  }

  /*
   * Current size of the cache
   */
  size() {
    return this.store.size
  }

  /*
   * Clear the LRU cache entirely.
   */
  clear() {
    this.store = new Map()
    this.access = new Map()
  }

  /*
   * Internal pruning function.
   */
  _prune() {
    debug('About to prune; have', this.store.size, 'and capacity is', this.capacity)

    const sorted = Array.from(this.access.entries())
    sorted.sort((first, second) => {
      if (first[1] === second[1]) {
        return 0
      }
      return first[1] < second[1] ? -1 : 1
    })
    debug('Sorted keys are:', sorted)

    debug('Have to prune', this.store.size - this.capacity, 'items.')
    let idx = 0
    const toPrune = []
    while (idx < sorted.length && toPrune.length < this.store.size - this.capacity) {
      toPrune.push(sorted[idx][0])
      ++idx
    }

    toPrune.forEach((key) => {
      this.store.delete(key)
      this.access.delete(key)
    })
    debug('Size after pruning', this.store.size)
  }
}

module.exports = {
  LRUCache,
}
