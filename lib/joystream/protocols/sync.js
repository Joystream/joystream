'use strict';

const debug = require('debug')('joystream::protocols:sync');

const MSG_START_ID = 0x00;
const MSG_DATA     = 0x01;
const MSG_END_ID   = 0x02;
const MSG_FINALIZE = 0x03;

const RESERVED_MESSAGE_SLOTS = 10;

/*
 * The SyncProtocol class is a protocol implementation that synchronizes multiple
 * streams of data. It takes three callbacks:
 * - The first is used to iterate through a number of identifiers for items to
 *   synchronize.
 * - The second is used to open a stream for any of the identifiers for reading
 *   on the sending side of the protocol.
 * - The third is used to open a stream for any of the identifiers for writing
 *   on the receiving side of the protocol.
 *
 * The protocol advertises each identifier in turn, then passes through the
 * associated stream, until no more data is left.
 */
class SyncProtocol
{
  constructor(options)
  {
    this.PROTO_NAME = 'SyncProtocol';
    this.MESSAGE_RANGE = [MSG_START_ID, MSG_FINALIZE + RESERVED_MESSAGE_SLOTS];

    options = options || {};
    this.generator = options.generator;
    this.read_open = options.read_open;
    this.write_open = options.write_open;

    this.read_current = null;
    this.write_current = null;

    this.handlers = {};
    this.handlers[MSG_START_ID] = this.handle_start_id.bind(this);
    this.handlers[MSG_DATA]     = this.handle_data.bind(this);
    this.handlers[MSG_END_ID]   = this.handle_end_id.bind(this);
    this.handlers[MSG_FINALIZE] = this.handle_finalize.bind(this);
  }

  initiate(callback)
  {
    this._read_next(callback);
  }

  _read_next(callback)
  {
    if (!this.generator) {
      return;
    }

    const res = this.generator.next();
    if (res.done) {
      // There's nothing more to read, so let's emit a finalize message.
      debug('All streams finalized.');
      callback(null, MSG_FINALIZE);
      return;
    }
    this._read_stream(res.value, callback);
  }

  _read_stream(id, callback)
  {
    debug('Got ID', id);

    // Opening a stream
    this.read_current = null;
    try {
      this.read_current = this.read_open(id);
      debug('Got read stream for', id);
    } catch (err) {
      debug('Error opening stream for ID', id, err);
      callback(err);
      return;
    }

    // Emit 'ID' message.
    var encoded;
    if (Buffer.isBuffer(id)) {
      encoded = id;
    }
    else if (typeof id === 'number') {
      encoded = Buffer.from(`${id}`);
    }
    else {
      encoded = Buffer.from(id);
    }
    callback(null, MSG_START_ID, encoded);

    // Start piping stream.
    this.read_current.on('data', (data) => {
      if (!Buffer.isBuffer(data)) {
        callback(new Error('Data is not a buffer!', data));
        return;
      }

      debug('Got data for', id, ':', data.length, data);
      callback(null, MSG_DATA, data);
    });
    this.read_current.on('error', (err) => {
      debug('Got an error for', id, ':', err);
      callback(err);
    });
    this.read_current.on('end', () => {
      debug('Data finished for', id);
      this.read_current = null;
      callback(null, MSG_END_ID, encoded);

      // Alright, resume next.
      this._read_next(callback);
    });
    this.read_current.resume();
  }

  consume(type, payload, callback)
  {
    debug('Consume', type, payload);

    // Try initiating; if it hasn't happened already, it's a no-op.
    if (!this.initiated) {
      this.initiated = true;
      this.initiate(callback);
    }

    const handler = this.handlers[type]
    if (!handler) {
      callback(new Error('Unknown message type', type));
      return;
    }

    handler(payload, callback);
  }


  handle_start_id(idbuf, callback)
  {
    if (this.write_current) {
      this.write_current.end();
      this.write_current = null;
    }

    try {
      this.write_current = this.write_open(idbuf);
      debug('Got write stream for', idbuf);
    } catch (err) {
      callback(err);
      return;
    }
  }

  handle_data(data, callback)
  {
    if (!this.write_current) {
      callback(new Error('No stream currently opened for writing!'));
      return;
    }

    this.write_current.write(data);
  }

  handle_end_id(idbuf, callback)
  {
    if (!this.write_current) {
      callback(new Error('No stream currently opened for writing!'));
      return;
    }

    this.write_current.end();
    this.write_current = null;
  }

  handle_finalize(_, callback)
  {
    callback(null);
  }
}

module.exports = {
  MSG_START_ID: MSG_START_ID,
  MSG_DATA: MSG_DATA,
  MSG_END_ID: MSG_END_ID,
  MSG_FINALIZE: MSG_FINALIZE,

  SyncProtocol: SyncProtocol,
}
