'use strict';

class SyncServer
{
  constructor(socket, key)
  {
    this.socket = socket;
    this.key = key || generate_key(socket);

    // Start processing data ASAP
    this.socket.on('data', this.process.bind(this));
  }

  process(data)
  {
    // TODO
    console.log('on', this.key, 'got', data);
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
