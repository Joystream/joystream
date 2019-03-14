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

    // Create message map
    this._create_message_mapping();
  }


  /*
   * Given the registered protocols, create a mapping of all messages
   * of all protocols to their respective handlers.
   */
  _create_message_mapping()
  {
    const mapping = {};
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
        mapping[cur] = [map_offset, i];
      }

      map_offset += end;
    }

    this.proto_mapping = mapping;
    debug('Mapping is', this.proto_mapping);
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
        proto.initiate(cb);
        break;
      }
    }
  }

  /*
   * Consume messages and dispatch to protocol implementation.
   */
  consume(message_type, message, cb)
  {
    debug('Received message of raw type', message_type);

    const map_info = this.proto_mapping[message_type];
    if (!map_info) {
      cb(new Error('Unknown raw message type', message_type));
      return;
    }

    // Modify the message type and dispatch
    const modified = message_type - map_info[0];
    const proto = this.protocols[map_info[1]];
    debug('Converted message for', proto.PROTO_NAME, 'is', modified);
    proto.consume(modified, message, (err, type, res) => {
      if (err) {
        cb(err);
        return;
      }

      cb(null, map_info[0] + type, res);
    });
  }

}

module.exports = {
  MultiProtocol: MultiProtocol,
}
