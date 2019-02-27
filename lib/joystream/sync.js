'use strict';

const net = require('net');

const syncserver = require('joystream/sync/server');
const lru = require('joystream/util/lru');

const connections = new lru.LRUCache();

function create_server(flags, config)
{
  const server = net.createServer((socket) =>
  {
    // Remote ID
    const remote_key = syncserver.key(socket);

    // Ensure server state machine exists.
    var sync_server = connections.get(remote_key);
    if (!sync_server) {
      sync_server = new syncserver.SyncServer(socket, remote_key);
      connections.put(remote_key, sync_server);
    }
  });
  return server;
}

module.exports = create_server;
