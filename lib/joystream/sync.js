'use strict';

const net = require('net');

const debug = require('debug')('joystream:sync');

const syncserver = require('joystream/sync/server');
const lru = require('joystream/util/lru');

const connections = new lru.LRUCache();

function create_server(flags, config)
{
  const server = net.createServer((socket) =>
  {
    try {
      // Remote ID
      const remote_key = syncserver.key(socket);

      // Ensure server state machine exists.
      var sync_server = connections.get(remote_key);
      if (!sync_server) {
        sync_server = new syncserver.SyncServer(socket, remote_key, (key) => {
          // Remove from connection map.
          connections.del(key);
        });
        connections.put(remote_key, sync_server);
      }
    } catch (err) {
      console.log('Error', err, err.stack);
    }
  });
  return server;
}

module.exports = create_server;
