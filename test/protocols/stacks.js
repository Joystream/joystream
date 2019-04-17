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

const mocha = require('mocha');
const expect = require('chai').expect;
const stream_buf = require('stream-buffers');
const net = require('net');

const { Transform } = require('stream');

const { Keyring } = require('joystream/crypto/keyring');
const { ALICE_SEED, BOB_SEED } = require('../common');

const stacks = require('joystream/protocols/stacks');

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
  var alice, bob, alice_pub, bob_pub;

  before(async () => {
    const kr = await Keyring.create();
    const alice_p = kr.from_seed('ed25519', ALICE_SEED);
    alice = kr.convert_keypair(alice_p);
    const bob_p = kr.from_seed('ed25519', BOB_SEED);
    bob = kr.convert_keypair(bob_p);

    bob_pub = {};
    Object.assign(bob_pub, bob);
    bob_pub.secretKey = undefined;

    alice_pub = {};
    Object.assign(alice_pub, alice);
    alice_pub.secretKey = undefined;
  });

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

    const server_options = {
      keyPair: alice,
      store: {
        repos: id_generator(['foo']),
        read_open: read_opener,
        write_open: write_open,
      }
    };
    const client_options = {
      keyPair: bob,
      serverKey: alice_pub,
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
