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

const { createHash } = require('crypto');
const { Transform } = require('stream');

const debug = require('debug')('joystream::protocols:envelope');

const HASH_FUNCTION = 'sha256';

/*
 * The parse function takes a Buffer containing an enveloped message, and
 * returns a message type and a buffer containing the verified payload.
 * If the payload could not be verified, an Error is thrown.
 */
function parse(message)
{
  // Minimum message size is: type + payload size field + hash size.
  if (message.length < 35) {
    throw new Error('Message is too short!');
  }

  const message_type = message[0];
  const payload_size = message[1] * 256 + message[2];
  if (35 + payload_size != message.length) {
    throw new Error('Message payload size does not match buffer size!');
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
    throw new Error('Calculated digest does not match sent!');
  }
  debug('Message digest matches.');

  return [message_type, payload];
}


/*
 * The serialize function takes a message type and payload Buffer, and returns
 * a new Buffer containing the serialized message with checksum.
 */
function serialize(message_type, payload)
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
 * Serializer is Transform stream that consumes Arrays that contain first
 * a messae type, and second a message payload. It then produces Buffers via
 * the serialize() function.
 */
class Serializer extends Transform
{
  constructor(options)
  {
    options = options || {};
    options.objectMode = true;
    super(options);
  }

  _transform(data, encoding, callback)
  {
    debug('Serializer got', data);
    if (!data) {
      this.push(null);
      callback(null);
      return;
    }

    // Data must be an array with two fields.
    const serialized = serialize(data[0], data[1]);
    this.push(serialized);
    callback(null);
  }
}

/*
 * Conversely, Deserializer consumes serialized messages and produces
 * Arrays of type and payload.
 */
class Deserializer extends Transform
{
  constructor(options)
  {
    options = options || {};
    options.objectMode = true;
    super(options);
  }

  _transform(data, encoding, callback)
  {
    debug('Deserializer got', data);
    if (!data) {
      this.push(null);
      callback(null);
      return;
    }

    try {
      const res = parse(data);
      this.push(res);
      callback(null);
    } catch (err) {
      callback(err);
    }
  }
}

module.exports = {
  parse: parse,
  serialize: serialize,
  Serializer: Serializer,
  Deserializer: Deserializer,
}
