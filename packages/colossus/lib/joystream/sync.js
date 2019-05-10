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
 * Create and return a server instance for synchronizing repositories.
 */
function create_server(config, substrate, storage_callbacks)
{
  // We can't use the substrate key; need to convert it.
  const sync_key = substrate.keyring.convert_keypair(substrate.key);

  const options = {
    keyPair: sync_key,
    generator: storage_callbacks.generator,
    read_open: storage_callbacks.read_open,
    write_open: storage_callbacks.write_open,
  };
  debug('Sync server options', options);

  const server = net.createServer((socket) =>
  {
    try {
      // Remote ID
      const remote_connid = connection_id(socket);

      // Ensure server state machine exists.
      var sync_server = server_connections.get(remote_connid);
      if (!sync_server) {
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
  if (!keyPair.type === 'ed25519' || !keyPair.compatibiltiy === 'nacl') {
    throw new Error('Key pair must be a NaCl compatible ed25519 key.');
  }
  if (!serverKey.type === 'ed25519' || !serverKey.compatibiltiy === 'nacl') {
    throw new Error('Server key must be a NaCl compatible ed25519 key.');
  }

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
 * Synchronize with a single peer host.
 */
function synchronize_host(peer, address, keyPair, config, substrate, dht_client, storage_callbacks)
{
  debug('Trying to sync with', peer, 'at', address);

  // Convert peer address to a public key we can use.
  const polka_pub = substrate.keyring.addFromAddress(peer);
  const pubkey = substrate.keyring.convert_keypair(polka_pub);

  const proto = create_client(address, pubkey, keyPair, storage_callbacks, (err, proto) => {
    if (err) return;

    // Initiate
    try {
      proto.initiate((err, type, msg) => {
        debug('Init', err, type, msg);
      });
    } catch (err) {
      debug(err);
    }
  });
}


/*
 * Synchronize with a single peer
 */
function synchronize_peer(peer, keyPair, config, substrate, dht_client, storage_callbacks)
{
  debug('Trying to resolve', peer);
  dht_client.lookup(peer)
    .then((peer_info) => {
      debug('Found', Object.keys(peer_info).length, 'host(s) for', peer);
      for (var host in peer_info) {
        if (!peer_info.hasOwnProperty(host)) {
          continue;
        }

        const sync_port = peer_info[host].sync_port;
        if (!sync_port) {
          debug('Skipping host', host, 'for', peer, 'because there is no sync port.');
          continue;
        }

        const address = {
          host: host,
          port: sync_port,
        };
        synchronize_host(peer, address, keyPair, config, substrate, dht_client, storage_callbacks);
      }
    })
    .catch((err) => {
      debug(err);
    });
}

/*
 * Called for each synchrnizaton run.
 */
function synchronize_interval(config, keyPair, substrate, dht_client, storage_callbacks)
{
  // Grab storage providers off the chain.
  substrate.accountIdsByRole(substrate.ROLE_STORAGE)
    .then((results) => {
      // Filter out our own address.
      const own_addr = substrate.key.address();
      const others = results.filter(addr => addr != own_addr);

      if (others.length <= 0) {
        debug('No other storage providers found, retrying later.');
        return;
      }

      others.forEach((address) => synchronize_peer(address, keyPair, config,
        substrate, dht_client, storage_callbacks));
    })
    .catch((err) => {
      debug(err);
    });
}

function synchronize(config, substrate, dht_client, storage_callbacks)
{
  // Convert our own key pair to be NaCl compatible.
  const keyPair = substrate.keyring.convert_keypair(substrate.key);

  // Run once immediately
  setImmediate(synchronize_interval, config, keyPair, substrate, dht_client,
    storage_callbacks);

  // And then also periodically.
  const period = config.get('syncPeriod');
  return setInterval(synchronize_interval, period, config, keyPair, substrate,
    dht_client, storage_callbacks);
}

module.exports = {
  create_server: create_server,
  create_client: create_client,
  synchronize: synchronize,
}
