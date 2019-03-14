'use strict';

const { Transform } = require('stream');

const debug = require('debug')('joystream:protocols:stream');

/*
 * A ProcotolStream is a Transform stream. When something is written to it,
 * it feeds the data to its consume() function. Results are pushed to its
 * output.
 *
 * The class extends the stream functionality by an initiate() function that
 * delegates to the protocol's initiate() function.
 */
class ProtocolStream extends Transform
{
  constructor(proto, options)
  {
    options = options || {};
    options.objectMode = true;
    super(options);
    this.proto = proto;
  }

  _transform(data, encoding, callback)
  {
    debug('Received', data);
    const type = data[0];
    const payload = data[1];

    // We can't really do all that much. Something has been fed into the stream,
    // so our protocol must consume it.
    this.proto.consume(type, payload, (err, type, res) => {
      this._handle_internal(err, type, res, callback);
    });
  }

  _flush(callback)
  {
    debug('Protocol stream ends.');
    callback(null);
  }

  _handle_internal(err, type, payload, callback)
  {
    if (err) {
      debug('Protcol error', err);
      this.emit('error', err);
      callback(err);
      return;
    }

    if (typeof type === 'undefined' || typeof payload === 'undefined') {
      debug('No message or message type; ending stream.');
      this.push(null);
    }
    else {
      debug('Producing', type, payload);
      this.push([type, payload]);
    }
    callback(null);
  }

  initiate(cb)
  {
    this.proto.initiate((err, type, res) => {
      this._handle_internal(err, type, res, (err2) => {
        if (cb) {
          cb(err2);
        }
      });
    });
  }
}

module.exports = {
  ProtocolStream: ProtocolStream,
}
