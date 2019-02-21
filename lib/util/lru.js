'use strict';

const DEFAULT_CAPACITY = 100;

const debug = require('debug')('joystream:util:lru');

/*
 * Simple least recently used cache.
 */
class LRUCache
{
  constructor(capacity = DEFAULT_CAPACITY)
  {
    this.capacity = capacity;
    this.clear();
  }

  /*
   * Return the entry with the given key, and update it's usage.
   */
  get(key)
  {
    const val = this.store.get(key);
    if (val) {
      this.access.set(key, Date.now());
    }
    return val;
  }

  /*
   * Return true if the key is the cache, false otherwise.
   */
  has(key)
  {
    return this.store.has(key);
  }

  /*
   * Put a value into the cache.
   */
  put(key, value)
  {
    this.store.set(key, value);
    this.access.set(key, Date.now());
    this._prune();
  }

  /*
   * Delete a value from the cache.
   */
  del(key)
  {
    this.store.delete(key);
    this.access.delete(key);
  }

  /*
   * Current size of the cache
   */
  size()
  {
    return this.store.size;
  }

  /*
   * Clear the LRU cache entirely.
   */
  clear()
  {
    this.store = new Map();
    this.access = new Map();
  }

  /*
   * Internal pruning function.
   */
  _prune()
  {
    debug('About to prune; have', this.store.size, 'and capacity is', this.capacity);

    var sorted = Array.from(this.access.entries());
    sorted.sort((first, second) => {
      return first[1] == second[1] ? 0 :
        (first[1] < second[1] ? -1 : 1);
    });
    debug('Sorted keys are:', sorted);

    debug('Have to prune', this.store.size - this.capacity, 'items.');
    var idx = 0;
    var to_prune = new Array();
    while (idx < sorted.length && to_prune.length < (this.store.size - this.capacity)) {
      to_prune.push(sorted[idx][0]);
      ++idx;
    }

    to_prune.forEach((key) => {
      this.store.delete(key);
      this.access.delete(key);
    });
    debug('Size after pruning', this.store.size);
  }
}

module.exports = {
  LRUCache: LRUCache,
};
