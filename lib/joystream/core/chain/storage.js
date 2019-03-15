'use strict';

/*
 * Currently a mock. TODO do something real with it.
 */
class StorageNodes
{
  constructor(storage_pubkeys)
  {
    this._storage_pubkeys = storage_pubkeys;

    // TODO periodically query chain to update storage pubkeys
  }
}

/*
 * Generator for pubkeys
 */
StorageNodes.prototype.storage_pubkeys = function*()
{
  // Keep copy, in case the member gets updated in flight.
  const keys = this._storage_pubkeys;

  for (var x in keys) {
    yield x;
  }
  return keys.length;
}

module.exports = {
  StorageNodes: StorageNodes,
}
