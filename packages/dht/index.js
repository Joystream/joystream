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

'use strict';

const dht = require('bittorrent-dht');
const RpcServer = require('rpc-websockets').Server;
const { SHA3 } = require('sha3');

const debug = require('debug')('joystream-dht');

const DEFAULT_ANNOUNCE_PERIOD = 10 * 60 * 1000;
const DEFAULT_GRACE_PERIOD = 3 * 60 * 1000;

/*
 * Resolves storage provider IDs (substrate public keys, as strings) to IP
 * addresses.
 */
class JoystreamDHT
{
  /*
   * Uses a bittorrent DHT for advertising own address and sync port, listening
   * on the DHT port. Then runs a JSON-RPC over websockets.
   *
   * The other_ports field is an object; each property should name a particular
   * port to announce.
   *
   * Options include:
   * - announce_period: period over which own address gets re-announced
   * - nodes: list of nodes to seed the DHT with.
   */
  constructor(own_address, dht_port, other_ports, options)
  {
    // Store parameters
    this.own_address = own_address;
    this.dht_port = dht_port;
    this.other_ports = other_ports || {};
    this.options = options || {};

    // Create announcement hash
    this.own_hash = this.address_hash(this.own_address);

    // Create cache. The cache takes a peer address as the key.
    // Each value is an record we have and the timestamp we received
    // it.
    this.cache = new Map([]);

    // Create DHT
    this.dht = new dht();
    this.dht.listen(this.dht_port, () => {
      debug(`Now listening on: ${this.dht_port}`);

      // Announce self
      this.announce_periodically();
    });

    this.dht.on('peer', (peer, hash, from) => {
      const hex_hash = hash.toString('hex');
      this.update_hash(hex_hash, from, peer);
    });

    // If we have an RPC port defined, let's start a server for that.
    const rpc_port = this.other_ports.rpc_port;
    if (rpc_port) {
      this.create_rpc_server(rpc_port);
    }

    // Add nodes we may already know.
    this._add_nodes();

  }

  /*
   * Creates an RPC server at the given port.
   */
  create_rpc_server(rpc_port)
  {
    this.rpc_server = new RpcServer({ port: rpc_port });

    // Lookup method
    this.rpc_server.register('lookup', (params) => {
      const key = params[0];
      return new Promise((resolve, reject) => {
        this.resolve(key, results => {
          if (!results || !results.length) {
            reject(new Error('No results.'));
            return;
          }
          resolve(results);
        });
      });
    });

    // Info method - get all ports and their purposes
    this.rpc_server.register('info', (params) => {
      const address = params[0];
      return new Promise((resolve, reject) => {
        if (address != this.own_address) {
          reject(new Error(`Asking the wrong host for address ${address}.`));
          return;
        }

        const ports = params[1];
        const result = {
          dht_port: this.dht_port,
        };
        for (var property in this.other_ports) {
          if (!this.other_ports.hasOwnProperty(property)) {
            continue;
          }

          result[property] = this.other_ports[property];
        }
        resolve(result);
      });
    });
  }

  /*
   * Announce own address + sync port periodically.
   */
  announce_periodically()
  {
    const period = this.options.announce_period || DEFAULT_ANNOUNCE_PERIOD;
    debug(`Announcing ${this.own_hash}, again in ${period}ms.`);

    for (var property in this.other_ports) {
      if (!this.other_ports.hasOwnProperty(property)) {
        continue;
      }

      const port = this.other_ports[property];
      debug(`Announcing port ${port} for ${property}`);
      this.dht.announce(this.own_hash, port, (err) => {
        if (err) {
          debug(`Error announcing port ${port}:`, err);
        }
      });
    }

    setTimeout(() => this.announce_periodically(), period);
  }

  /*
   * Add nodes from config
   */
  _add_nodes()
  {
    const nodes = this.options.nodes || [];
    nodes.forEach(node_info => {
      this.dht.addNode(node_info);
    });
  }

  /*
   * Address hash; we'll use a SHA3 truncated to 40 hex chars.
   */
  address_hash(address)
  {
    const hash = new SHA3(256);
    hash.update(address);
    const hex = hash.digest('hex');
    return hex.slice(0, 40);
  }

  /*
   * Update the cache entry for a given peer hash, any number of IP:port
   * combinations may exist, and we won't know exactly which to talk to.
   *
   * So we're storing all (host, port) combinations with a timestamp to
   * sort by.
   */
  update_hash(hash, from, details)
  {
    var hash_data = this.cache.get(hash);
    if (!hash_data) {
      debug(`Hash ${hash} not yet found in cache.`);
      hash_data = new Map([]);
    }

    // In order to keep the key determinstic, we serialize the host
    // and port to a string.
    const peer_key = `[${details.host}]:${details.port}`;

    // The will be a timestamp and the unserialized details.
    const entry = {
      timestamp: Date.now(),
      data: details,
    };
    debug('Adding', hash, 'as', peer_key, '=>', entry);
    hash_data.set(peer_key, entry);

    // Update cache
    this.cache.set(hash, hash_data);
    this.expire_outdated();
  }


  /*
   * Expire outdated cache entries.
   */
  expire_outdated()
  {
    // Expire anything older than the announce timeout
    const threshold = Date.now()
      - (this.options.announce_period || DEFAULT_ANNOUNCE_PERIOD)
      - (this.options.grace_period || DEFAULT_GRACE_PERIOD);

    this.cache.forEach((hash_data, hash, outer) => {
      hash_data.forEach((entry, peer_key, inner) => {
        if (entry.timestamp < threshold) {
          debug('Expiring', peer_key);
          inner.delete(peer_key);
        }
      });
      if (!hash_data.size) {
        outer.delete(hash);
      }
    });
  }

  /*
   * Return the currently known set of address/port combinations.
   */
  get(hash)
  {
    debug('Looking up', hash);
    const hash_data = this.cache.get(hash);
    if (!hash_data) {
      debug('Hash not found!');
      return; // undefined
    }

    // Iterate over the data, sort by most recent.
    const result = [];
    hash_data.forEach((entry, peer_key, map) => {
      result.push(entry);
    });

    // Sort by timestamp, newest first
    result.sort((first, second) => {
      if (first.timestamp == second.timestamp) {
        return 0;
      }
      return first.timestamp < second.timestamp;
    });

    const mapped = result.map(entry => entry.data);

    // For testing
    if (this.options.add_localhost) {
      mapped.push({ host: 'localhost', port: this.dht_port });

      for (var property in this.other_ports) {
        if (!this.other_ports.hasOwnProperty(property)) {
          continue;
        }

        const port = this.other_ports[property];
        mapped.push({ host: 'localhost', port: port });
      }
    }

    return mapped;
  }

  /*
   * Resolve address.
   */
  resolve(address, callback)
  {
    // Call the DHT to resolve.
    const lookup = this.address_hash(address);
    debug(`Looking up ${address} as ${lookup}...`);
    this.dht.lookup(lookup, (err, peers) => {
      debug('Found by', peers, 'peers.');
      callback(this.get(lookup));
    });
  }

  /*
   * Destroy DHT
   */
  destroy()
  {
    if (this.rpc_server) {
      this.rpc_server.close();
    }
    this.dht.destroy();
  }
};

module.exports = {
  JoystreamDHT: JoystreamDHT,
}
