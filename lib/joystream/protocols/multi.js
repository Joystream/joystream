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

const debug = require('debug')('joystream::protocols:multi');

/*
 * The MultiProtocol class maps message types from multiple
 * encapsulated protocol objects into a common value space.
 *
 * Note that the order of protocols passed to the class is important.
 * Not only do message types get assigned to the universal value space
 * in order, but other functions such as initiate() also proceed in
 * order.
 *
 * Transitions between multiple protocols are not easy to deduce
 * automatically, such as whether a new protocol should start when
 * the other has finished. Therefore, it's possible to register
 * handlers that are being invoked when a message has been generated
 * or received on one protocol, and those can initiate another if
 * necessary.
 */
class MultiProtocol
{
  /*
   * Pass protocol instances to the constructor. The order matters, as
   * mappings are created in the order in which the protocol instances are
   * found.
   */
  constructor()
  {
    this.protocols = Array.prototype.slice.apply(arguments);
    this.handlers = {};

    // Create message map
    this._create_message_mapping();
  }


  /*
   * Given the registered protocols, create a mapping of all messages
   * of all protocols to their respective handlers.
   */
  _create_message_mapping()
  {
    const forward_mapping = {};
    const back_mapping = {}
    var map_offset = 0;

    for (var i = 0 ; i < this.protocols.length ; ++i) {
      const proto = this.protocols[i];
      debug('Protocol found', proto.PROTO_NAME);
      const range = proto.MESSAGE_RANGE;
      if (range[0] > range[1]) {
        throw new Error('Message range of protocol', proto.PROTO_NAME, 'is out of order!');
      }
      debug('Mapping message range', range);

      // We map the range into our mapping with the appropriate offset.
      // The end of the range is inclusive.
      const end = range[1] + 1;
      for (var r = range[0] ; r < end ; ++r) {
        var cur = map_offset + r;
        forward_mapping[cur] = [map_offset, i];
      }

      // The back mapping is a fair bit simpler: we just need to know which
      // offset to substract for a given proto instance. We'll use the index,
      // though, which makes lookup mildly slower but we avoid storing multiple
      // references to the same object.
      back_mapping[i] = map_offset;

      map_offset += end;
    }

    this.forward_mapping = forward_mapping;
    this.back_mapping = back_mapping;
    debug('Mapping is', this.forward_mapping, this.back_mapping);
  }

  /*
   * The initiate() function calls the first protocol's initiate() function
   * that has one - and only this one. You must therefore order your protocols
   * such that the correct protocol comes first.
   */
  initiate(cb)
  {
    for (var i = 0 ; i < this.protocols.length ; ++i) {
      const proto = this.protocols[i];
      if (proto.initiate) {
        proto.initiate((err, type, msg) => {
          if (err) {
            cb(err);
            return;
          }

          const mapped = this.map_type(proto, type);
          debug('Initiate resulted in', type, '->', mapped);
          this.run_handlers(mapped, msg, 'outgoing');

          cb(err, type, msg);
        });
        break;
      }
    }
  }

  /*
   * Return the mapped message type for a given protocol instance (!) and
   * its private message type.
   */
  map_type(proto, type)
  {
    // Find instance index
    for (var i = 0 ; i < this.protocols.length ; ++i) {
      const p = this.protocols[i];
      if (proto == p) {
        break;
      }
    }
    if (i >= this.protocols.length) {
      throw Error('Unknown protocol!');
    }

    return type + this.back_mapping[i];
  }

  /*
   * Return the unmapped message type. The result is specific to a particular
   * protocol, so return the protocol instance as well. The map offset is also
   * returned as the last value.
   */
  lookup_type(type)
  {
    if (isNaN(type)) {
      return;
    }

    const map_info = this.forward_mapping[type];
    if (!map_info) {
      throw new Error(`Unknown raw message type: ${type}`);
    }

    // Modify the message type and dispatch
    const modified = type - map_info[0];
    const proto = this.protocols[map_info[1]];

    return [proto, modified, map_info[0]];
  }

  /*
   * Consume messages and dispatch to protocol implementation.
   */
  consume(message_type, message, cb)
  {
    debug('Received message of raw type', message_type);

    var res;
    try {
      res = this.lookup_type(message_type);
      if (!res) {
        cb(new Error('Cannot consume unknown message.'));
        return;
      }
    } catch (err) {
      cb(err);
      return;
    }

    const proto = res[0];
    const unmapped = res[1];
    const offset = res[2];
    debug('Converted message for', proto.PROTO_NAME, 'is', unmapped);
    proto.consume(unmapped, message, (err, type, response) => {
      if (err) {
        cb(err);
        return;
      }

      // Run incoming handlers after protocol had a chance to process them.
      this.run_handlers(res, message, 'incoming');

      // Run outgoing handlers with the response the protocol generated.
      this.run_handlers(offset + type, response, 'outgoing');
      cb(null, offset + type, response);
    });
  }

  /*
   * Register handler for a mapped message type. The handler is called with
   * the unmapped protocol instance and unmapped type and message.
   *
   * The second parameter is a string or array of strings for the direction
   * of the message. If the handler should be called for consumed messages,
   * the direction should be 'incoming', for produced messages 'outgoing'.
   *
   * Handlers are only invoked for messages, not errors.
   */
  register(message_type, direction, handler)
  {
    // Normalize and validate direction.
    if (typeof direction === 'string') {
      direction = [direction];
    }

    for (var dir of direction) {
      const d = dir.toLowerCase();
      if (d != 'incoming' && d != 'outgoing') {
        throw new Error(`Invalid direction "${dir}"!`);
      }
    }

    // Register handler for each direction.
    this.handlers[message_type] = this.handlers[message_type] || {};
    this.handlers[message_type].incoming = this.handlers[message_type].incoming || [];
    this.handlers[message_type].outgoing = this.handlers[message_type].outgoing || [];

    for (var dir of direction) {
      const d = dir.toLowerCase();
      this.handlers[message_type][d].push(handler);
      debug('Registered', d, 'handler for', message_type);
    }
    debug('Handlers now', this.handlers);
  }

  /*
   * Run handlers for the given message type and direction. The message type is
   * either a mapped type, or a result of lookup_type.
   */
  run_handlers(message_type, message, direction)
  {
    var unmapped;
    if (typeof message_type === 'number') {
      unmapped = this.lookup_type(message_type);
      if (!unmapped) {
        // Just ignore.
        return;
      }
    }
    else {
      unmapped = message_type;
    }
    const proto = unmapped[0];
    const type = unmapped[1];
    const mapped_type = type + unmapped[2];
    debug('Unmapped message for handlers', proto.PROTO_NAME, type, 'mapped', mapped_type);

    direction = direction.toLowerCase();
    const handlers = this.handlers[mapped_type] || {};
    const dir_handlers = handlers[direction] || [];
    debug('Got', dir_handlers.length, 'for direction', direction);

    for (var handler of dir_handlers) {
      handler(proto, type, message);
    }
  }

}

module.exports = {
  MultiProtocol: MultiProtocol,
}
