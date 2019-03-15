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
    for (var i = 0 ; i < this.address_map.length ; ++i) {
      const item = this.address_map[i];
      console.log(item, pubkey);
      if (pubkey == item[0]) {
        callback(null, item[1]);
        return;
      }
    }
    callback(new Error(`Cannot resolve "${pubkey}"!`));
  }
}

module.exports = {
  DHT: DHT,
}
