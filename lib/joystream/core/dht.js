'use strict';

/*
 * Currently a mock; do something real with it TODO
 */
class DHT
{
  constructor(address_map)
  {
    this.address_map = address_map;
    // TODO get address map from DHT
  }

  resolve(pubkey, callback)
  {
    const address = this.address_map[pubkey];
    if (!address) {
      callback(new Error(`Cannot resolve "${pubkey}"!`));
      return;
    }
    callback(null, address);
  }
}

module.exports = {
  DHT: DHT,
}
