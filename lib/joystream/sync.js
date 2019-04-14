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

const net = require('net');

const debug = require('debug')('joystream:sync');

const lru = require('joystream/util/lru');
const keys = require('joystream/crypto/keys');
const stacks = require('joystream/protocols/stacks');

const server_connections = new lru.LRUCache();
const client_connections = new lru.LRUCache();

/*
 * Create a connection ID from socket information.
 */
function connection_id(socket)
{
  return `${socket.remoteFamily}:[${socket.remoteAddress}]:${socket.remotePort}`;
}

/*
 * Create a and return server instance for synchronizing repositories.
 */
function create_server(substrate, flags, config, storage_callbacks)
{
  // Parse key
  const key_opt = flags['key'] || config.get('key');
  const keyPair = keys.key_pair(key_opt);

  const server = net.createServer((socket) =>
  {
    try {
      // Remote ID
      const remote_connid = connection_id(socket);

      // Ensure server state machine exists.
      var sync_server = server_connections.get(remote_connid);
      if (!sync_server) {
        const options = {
          keyPair: keyPair,
          generator: storage_callbacks.generator,
          read_open: storage_callbacks.read_open,
          write_open: storage_callbacks.write_open,
        };

        sync_server = stacks.create_sync_server(socket, options);

        server_connections.put(remote_connid, sync_server);
        socket.on('close', () => {
          // Remove from connection map.
          server_connections.del(remote_connid);
        });
      }
    } catch (err) {
      console.log('Error', err, err.stack);
    }
  });
  return server;
}

/*
 * Analogous to create_server, but creates a client instance.
 */
function create_client(address, serverKey, keyPair, storage_callbacks, connect_cb)
{
  // Try to connect to the provided address
  const client = net.connect(address.port, address.address, () => {
    // Create client options
    const client_options = {
      keyPair: keyPair,
      serverKey: serverKey,
      generator: storage_callbacks.generator,
      read_open: storage_callbacks.read_open,
      write_open: storage_callbacks.write_open,
    }

    // Create stack
    const proto = stacks.create_sync_client(client, client_options);
    connect_cb(null, proto);

  });

  client.on('error', (err) => {
    debug('Error connecting to', address, '-', err);
    connect_cb(err);
  });
}

/*
 * Periodically try to sync with all known storage nodes.
 */
function synchronize_inner(period, keyPair, nodes, pubkey_generator, dht, storage_callbacks)
{
  const it = pubkey_generator.next();
  if (it.done) {
    debug('End of synchronization run, trying again in', period, 'ms');
    setTimeout(() => synchronize_reset(period, keyPair, nodes, dht, storage_callbacks), period);
    return;
  }

  // Resolve IP from DHT;
  const pubkey = it.value;
  debug('Trying to resolve', pubkey);
  dht.resolve(pubkey, (err, address) => {
    if (err) {
      debug('Error synchronizing:', err);
    }
    else {
      // Create a client instance and synchronize.
      debug('Trying to connect to', pubkey, 'at', address);
      const keybuf = Buffer.from(pubkey);
      const proto = create_client(address, keybuf, keyPair, storage_callbacks, (err, proto) => {
        if (err) return;

        // Initiate
        proto.initiate((err, type, msg) => {
          debug('Init', err, type, msg);
        });
      });
    }

    // Next iteration.
    synchronize_inner(period, keyPair, nodes, pubkey_generator, dht, storage_callbacks);
  });
}

function synchronize_reset(period, keyPair, nodes, dht, storage_callbacks)
{
  // Reset generator
  const generator = nodes.storage_pubkeys();
  synchronize_inner(period, keyPair, nodes, generator, dht, storage_callbacks);
}

function synchronize(flags, config, roles_api, dht, storage_callbacks)
{
  // Parse key
  const key_opt = flags['key'] || config.get('key');
  const keyPair = keys.key_pair(key_opt);

  // Parse period
  const period = flags['syncPeriod'] || config.get('syncPeriod') || 30000;

  // Grab other storage providers off the chain.
  roles_api.accountIdsByRole(roles_api.ROLE_STORAGE)
    .then((results) => {
      console.log('RESULTS', results); // FIXME

    });
//  synchronize_reset(period, keyPair, nodes, dht, storage_callbacks);
}

module.exports = {
  create_server: create_server,
  create_client: create_client,
  synchronize: synchronize,
}
