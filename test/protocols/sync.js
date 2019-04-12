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

const sync = require('joystream/protocols/sync');

function id_generator(ids)
{
  return (callback) => {
    for (var i = 0 ; i < ids.length ; ++i) {
      callback(null, ids[i]);
    }
    callback(null, undefined);
  }
}

function error_id_generator()
{
  return (callback) => {
    callback(null, 'error');
    callback(null, undefined);
  }
}

function missing_id_generator()
{
  return (callback) => {
    callback(null, 'missing');
    callback(null, undefined);
  }
}

function read_opener(id)
{
  if (id != 'foo' && id != 'bar' && id != 'error') {
    throw new Error(`Invalid ID "${id}"`);
  }

  const buf = new stream_buf.ReadableStreamBuffer();
  buf.emit('open');
  if (id == 'foo') {
    buf.put('foo-data');
  }
  else if (id == 'bar') {
    buf.put('bar-data');
  }
  else if (id == 'error') {
    buf.emit('error', new Error('test error in stream'));
  }

  buf.stop();
  return buf;
}

describe('protocols/sync', function()
{
  it('streams two streams in sequence', function(done)
  {
    const foo_result = new stream_buf.WritableStreamBuffer();
    const bar_result = new stream_buf.WritableStreamBuffer();

    const proto1 = new sync.SyncProtocol({
      store: {
        repos: id_generator(['foo', 'bar']),
        read_open: read_opener,
      }
    });
    const proto2 = new sync.SyncProtocol({
      store: {
        repos: id_generator([]),
        write_open: (id) => {
          id = id.toString();
          if (id == 'foo') {
            return foo_result;
          }
          if (id == 'bar') {
            return bar_result;
          }
          throw new Error(`Invalid ID "${id}"`);
        }
      }
    });

    const expected_sequence = [
      [sync.MSG_START_ID, 'foo'],
      [sync.MSG_DATA, 'foo-data'],
      [sync.MSG_END_ID, 'foo'],
      [sync.MSG_START_ID, 'bar'],
      [sync.MSG_DATA, 'bar-data'],
      [sync.MSG_END_ID, 'bar'],
      [sync.MSG_FINALIZE],
    ];
    var produced_expected_offset = 0;
    var consumed_expected_offset = 0;

    proto1.initiate((err, type, data) => {
      expect(err).to.be.null;

      // Check that what's produced matches expecations
      const expected = expected_sequence[produced_expected_offset];
      ++produced_expected_offset;

      expect(type).to.equal(expected[0]);
      if (data) {
        expect(data.toString()).to.equal(expected[1]);
      }

      // Consume
      proto2.consume(type, data, (err2, type2, data2) => {
        expect(foo_result.getContentsAsString()).to.equal('foo-data');
        expect(bar_result.getContentsAsString()).to.equal('bar-data');
        done();
      });
    });
  });

  it('streams bi-directionally', function(done)
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

    const proto1 = new sync.SyncProtocol({
      store: {
        repos: id_generator(['foo']),
        read_open: read_opener,
        write_open: write_open,
      }
    });
    const proto2 = new sync.SyncProtocol({
      store: {
        repos: id_generator(['bar']),
        read_open: read_opener,
        write_open: write_open,
      }
    });

    proto1.initiate((err, type, data) => {
      expect(err).to.be.null;

      proto2.consume(type, data, (err, type, data) => {
        expect(err).to.be.null;

        if (typeof type !== 'undefined') {
          proto1.consume(type, data, (err, type, data) => {
            expect(err).to.be.null;

            if (typeof type === 'undefined') {
              // All done
              expect(foo_result.getContentsAsString()).to.equal('foo-data');
              expect(bar_result.getContentsAsString()).to.equal('bar-data');
              done();
            }
          });
        }
      });
    });
  });

  it('handles errors during opening', function(done)
  {
    const proto = new sync.SyncProtocol({
      store: {
        repos: missing_id_generator(),
        read_open: read_opener,
      }
    });

    proto.initiate((err, type, data) => {
      expect(err).not.to.be.null;
      done();
    });
  });

  it('handles errors during streaming', function(done)
  {
    const proto = new sync.SyncProtocol({
      store: {
        repos: error_id_generator(),
        read_open: read_opener,
      }
    });

    proto.initiate((err, type, data) => {
      expect(err).not.to.be.null;
      done();
    });

  });
});
