'use strict';

const { createHash } = require('crypto');

const debug = require('debug')('joystream::protocols:envelope');

const HASH_FUNCTION = 'sha256';

/*
 * The Envelope class envelopes multiple protocol implementations.
 * It maps each implementation's message codes to unique values, and
 * itself follows the protocol 'specification' of providing a consumption
 * function. Furthermore, it provides for a checksum on the message
 * payloads.
 */
class Envelope
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

  /*
   * Consume message buffer, verify contents, and dispatch to the protocol
   * implementation. The callback receives the response in an envelope, and
   * without separate message type.
   */
  consume_raw(message, cb)
  {
    debug('Raw message', message);

    const parsed = this.verify(message);

    // The payload is untampered with; pass to consume() function.
    this.consume(parsed[0], parsed[1], (err, resp_type, response) => {
      if (err) {
        cb(err);
        return;
      }
      debug('resp_type', resp_type);
      debug('response', response);

      cb(null, this.envelope(resp_type, response));
    });
  }

  /*
   * Envelope payload.
   */
  envelope(message_type, payload)
  {
    if (typeof payload === 'string') {
      payload = Buffer.from(payload);
    }

    const res = Buffer.alloc(35 + payload.length);

    // Encode type
    res[0] = message_type;

    // Encode payload length
    res[1] = parseInt(payload.length / 256, 10);
    res[2] = parseInt(payload.length % 256, 10);

    // Copy payload over.
    payload.copy(res, 3, 0, payload.length);
    debug('Encoded type and payload to', res);

    // Create hash over payload
    const hasher = createHash(HASH_FUNCTION);
    hasher.update(res.slice(0, 3 + payload.length));
    const digest = hasher.digest();
    debug('Digest is', digest);

    // Copy digest over and return.
    digest.copy(res, 3 + payload.length, 0, digest.length);
    debug('Enveloped message is', res);

    return res;
  }

  /*
   * Verifies an enveloped message digest and returns the payload.
   */
  verify(message)
  {
    // Minimum message size is: type + payload size field + hash size.
    if (message.length < 35) {
      cb(new Error('Message is too short!'));
      return;
    }

    const message_type = message[0];
    const payload_size = message[1] * 256 + message[2];
    if (35 + payload_size != message.length) {
      cb(new Error('Message payload size does not match buffer size!'));
      return;
    }

    const payload = message.slice(3, 3 + payload_size);
    const digest = message.slice(3 + payload_size);
    debug('Got', message_type, 'with payload', payload, 'and digest', digest);

    // Calculate digest ourselves.
    const hasher = createHash(HASH_FUNCTION);
    hasher.update(message.slice(0, 3 + payload_size));
    const calculated = hasher.digest();
    if (0 != calculated.compare(digest)) {
      debug('Digest mismatch between', calculated, 'and', digest);
      cb(new Error('Calculated digest does not match sent!'));
      return;
    }
    debug('Message digest matches.');

    return [message_type, payload];
  }
}

module.exports = {
  Envelope: Envelope,
}
