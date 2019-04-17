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

const mutual = require('joystream/protocols/mutual');
const sync = require('joystream/protocols/sync');
const multi = require('joystream/protocols/multi');
const protostream = require('joystream/protocols/stream');
const envelope = require('joystream/protocols/envelope');

const debug = require('debug')('joystream:protocols:stack');

/*
 * Create a full stack of protocols for synchronzing, returning a stream
 * instance ready for piping into a socket or other transmission stream.
 */
function create_sync_server(transmission, options)
{
  options = options || {};

  // We first need a mutual authentication protocol configured with a key
  // pair for the server.
  const auth = new mutual.MutualAuthenticator(options.keyPair);

  // Next, we need a synchronizing protocol instance. The options hash needs
  // to include a full set of callbacks for the protocol.
  const syncproto = new sync.SyncProtocol(options);

  // Multiplex wrapper
  const wrapper = new multi.MultiProtocol(auth, syncproto);

  // After authentication, transition to sync protocol.
  const mapped = wrapper.map_type(auth, mutual.MSG_FINALIZE);
  wrapper.register(mapped, 'incoming', (proto, type, msg) => {
    debug('Authentication finished, transitioning?', auth.peer_authenticated());
    if (proto.peer_authenticated()) {
      syncproto.initiate((err, type, msg) => {
        const mapped2 = wrapper.map_type(syncproto, type);
        wrapper.consume(mapped2, msg, () => {}); // Ignore results.
      });
    }
  });

  // Wrap into a protocol stream.
  const proto = new protostream.ProtocolStream(wrapper);

  // Create serializer and deserializer instances
  const ser = new envelope.Serializer();
  const des = new envelope.Deserializer();

  // Finally, pipe through the transmission stream.
  transmission.pipe(des).pipe(proto).pipe(ser).pipe(transmission);

  return proto;
}


/*
 * Same as create_sync_server(), but for clients. Clients require the public key
 * of the server they want to connect to.
 */
function create_sync_client(transmission, options)
{
  options = options || {};

  // We first need a mutual authentication protocol configured with a key
  // pair for the server.
  const auth = new mutual.MutualAuthenticator(options.keyPair, options.serverKey);

  // Next, we need a synchronizing protocol instance. The options hash needs
  // to include a full set of callbacks for the protocol.
  const syncproto = new sync.SyncProtocol(options);

  // Multiplex wrapper
  const wrapper = new multi.MultiProtocol(auth, syncproto);

  // After authentication, transition to sync protocol.
  const mapped = wrapper.map_type(auth, mutual.MSG_RESPONSE);
  wrapper.register(mapped, 'incoming', (proto, type, msg) => {
    debug('Authentication finished, transitioning?', auth.peer_authenticated());
    if (proto.peer_authenticated()) {
      syncproto.initiate((err, type, msg) => {
        const mapped2 = wrapper.map_type(syncproto, type);
        wrapper.consume(mapped2, msg, () => {}); // Ignore results.
      });
    }
  });

  // Wrap into a protocol stream.
  const proto = new protostream.ProtocolStream(wrapper);

  // Create serializer and deserializer instances
  const ser = new envelope.Serializer();
  const des = new envelope.Deserializer();

  // Finally, pipe through the transmission stream.
  transmission.pipe(des).pipe(proto).pipe(ser).pipe(transmission);

  return proto;
}


module.exports = {
  create_sync_server: create_sync_server,
  create_sync_client: create_sync_client,
}
