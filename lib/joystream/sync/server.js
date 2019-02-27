'use strict';

const debug = require('debug')('joystream:sync:server');

/*
 * Sync server state engine; this is the per-connection state engine
 * implementation.
 *
 * The basic protocol is as follows:
 * - Perform mutual authentication (TODO implement separately)
 * - Respond to replication requests for hyperdrive replication.
 *   - Replication can be one-off, in which case the socket is free for
 *     future replication requests.
 *   - Replication can be live, in which case the socket is occupied until
 *     it times out or gets closed from the outside.
 */
class SyncServer
{
  constructor(socket, key, end_of_life)
  {
    this.socket = socket;
    this.key = key || generate_key(socket);
    this.end_of_life = end_of_life;

    // Start processing data ASAP
    this.socket.on('data', this.process.bind(this));
    this.socket.on('close', () => {
      try {
        debug('Socket closed by peer.');
        if (this.end_of_life) {
          this.end_of_life(this.key);
        }
      } catch (err) {
        console.log('Error', err, err.stack);
      }
    });
  }

  process(data)
  {
    try {
      console.log('on', this.key, 'got', data);
      // TODO
    } catch (err) {
      console.log('Error', err, err.stack);
    }
  }

  error(message)
  {
    try {
      debug('Error, closing socket:', message);
      this.socket.send('SOME ERROR', message);
      if (this.end_of_life) {
        this.end_of_life(this.key);
      }
    } catch (err) {
      console.log('Error', err, err.stack);
    }
  }
}


function generate_key(socket)
{
  return `${socket.remoteFamily}:[${socket.remoteAddress}]:${socket.remotePort}`;
}

module.exports = {
  SyncServer: SyncServer,
  key: generate_key,
};
