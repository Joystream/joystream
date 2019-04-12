'use strict';

const dht = require('bittorrent-dht');
const { SHA3 } = require('sha3');

const debug = require('debug')('joystream-dht');

const DEFAULT_ANNOUNCE_PERIOD = 5 * 60 * 1000;

/*
 * Resolves storage provider IDs (substrate public keys, as strings) to IP
 * addresses.
 */
class JoystreamDHT
{
  constructor(own_address, dht_port, static_addresses, options)
  {
    // Store parameters
    this.own_address = own_address;
    this.dht_port = dht_port;
    this.static_addresses = static_addresses;
    this.options = options || {};

    // Create announcement hash
    this.own_hash = this.addressHash(this.own_address);

    // Create DHT
    this.dht = new dht();
    this.dht.listen(this.dht_port, () => {
      debug(`Now listening on: ${this.dht_port}`);
    });

    this.dht.on('peer', (peer, hash, from) => {
      console.log(peer, hash.toString('hex'), from);
    });

    // Add nodes from static_addresses
    // TODO

    // Announce self
    this.announcePeriodically();
  }

  /*
   * Announce periodically
   */
  announcePeriodically()
  {
    const period = this.options.announce_period || DEFAULT_ANNOUNCE_PERIOD;
    debug(`Announcing ${this.own_hash}, again in ${period}ms.`);
    this.dht.announce(this.own_hash, this.dht_port, (err) => {
      if (err) {
        debug('Error announcing:', err);
      }
    });

    setTimeout(() => this.announcePeriodically(), period);
  }

  /*
   * Address hash; we'll use a SHA3 truncated to 40 hex chars.
   */
  addressHash(address)
  {
    const hash = new SHA3(256);
    hash.update(address);
    const hex = hash.digest('hex');
    return hex.slice(0, 40);
  }

  // FIXME
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

};

module.exports = {
  JoystreamDHT: JoystreamDHT,
}
