'use strict';

const mocha = require('mocha');
const expect = require('chai').expect;
const stream_buf = require('stream-buffers');
const net = require('net');

const { Transform } = require('stream');

const stacks = require('joystream/protocols/stacks');
const keys = require('joystream/crypto/keys');

function id_generator(ids)
{
  return (callback) => {
    for (var i = 0 ; i < ids.length ; ++i) {
      callback(null, ids[i]);
    }
    callback(null, undefined);
  }
}


function read_opener(id)
{
  const buf = new stream_buf.ReadableStreamBuffer();
  buf.emit('open');
  if (id == 'foo') {
    buf.put('foo-data');
  }
  else if (id == 'bar') {
    buf.put('bar-data');
  }

  buf.stop();
  return buf;
}

describe('protocols/stacks', function()
{
  it('synchronizes with mutual authentication', function(done)
  {
    const foo_result = new stream_buf.WritableStreamBuffer();
    const bar_result = new stream_buf.WritableStreamBuffer();
    const write_open = (id) => {
      id = id.toString();
      if (id == 'foo') {
        return foo_result;
      }
      if (id == 'bar') {
        return bar_result;
      }
      throw new Error(`Invalid ID "${id}"`);
    };

    const server_key = keys.key_pair();
    const client_key = keys.key_pair();

    const server_options = {
      keyPair: server_key,
      store: {
        repos: id_generator(['foo']),
        read_open: read_opener,
        write_open: write_open,
      }
    };
    const client_options = {
      keyPair: client_key,
      serverKey: server_key.pubKey,
      store: {
        repos: id_generator(['bar']),
        read_open: read_opener,
        write_open: write_open,
      }
    };

    // Client/server test
    const server = net.createServer((socket) => {
      stacks.create_sync_server(socket, server_options);
    });
    server.listen(10000);

    const client = net.connect(10000);
    const cprot = stacks.create_sync_client(client, client_options);

    client.on('finish', () => {
      expect(foo_result.getContentsAsString()).to.equal('foo-data');
      expect(bar_result.getContentsAsString()).to.equal('bar-data');

      server.close();
      done();
    });
    cprot.initiate();
  });
});
