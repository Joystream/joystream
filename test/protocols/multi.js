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

const multi = require('joystream/protocols/multi');

class MockProto1
{
  constructor(cb)
  {
    this.PROTO_NAME = 'MockProto1';
    this.MESSAGE_RANGE = [0, 2];
    this.cb = cb;
  }

  consume(message_type, message, cb)
  {
    if (this.cb) {
      this.cb(message_type);
    }

    const next = message_type + 1;
    if (next >= this.MESSAGE_RANGE[1]) {
      cb(null);
    }
    else {
      cb(null, next, 'mock1');
    }
  }

  initiate(cb)
  {
    cb(null, 0, 'init1');
  }
}


class MockProto2
{
  constructor(cb)
  {
    this.PROTO_NAME = 'MockProto2';
    this.MESSAGE_RANGE = [0, 3];
    this.cb = cb;
  }

  consume(message_type, message, cb)
  {
    if (this.cb) {
      this.cb(message_type);
    }

    const next = message_type + 1;
    if (next >= this.MESSAGE_RANGE[1]) {
      cb(null);
    }
    else {
      cb(null, next, 'mock2');
    }
  }

  initiate(cb)
  {
    cb(null, 0, 'init2');
  }
}


describe('protocols/multi', function(done)
{
  it('wraps a single protocol without modifying message types', function(done)
  {
    var mock1 = new MockProto1((type) => {
      // Callback for the converted message type
      expect(type).to.equal(0);
    });

    var m = new multi.MultiProtocol(mock1);

    m.consume(0, 'foo', (err, type, msg) => {
      // First test should simply increment the message type
      expect(err).to.be.null;
      expect(type).to.equal(1);

      // Second test should be out of range and throw errors.
      m.consume(3, 'bar', (err) => {
        expect(err).not.to.be.null;
        done();
      });
    });
  });

  it('wraps multiple protocols with modifying message types', function(done)
  {
    var mock1 = new MockProto1((type) => {
      // Callback for the converted message type
      expect(type).to.equal(0);
    });
    var mock2 = new MockProto2((type) => {
      // Callback for the converted message type
      expect(type).to.equal(0);
    });
    var m = new multi.MultiProtocol(mock1, mock2);

    m.consume(0, 'foo', (err, type, msg) => {
      // First test should simply increment the message type. The message should
      // come from mock1
      expect(err).to.be.null;
      expect(type).to.equal(1);
      expect(msg).to.equal('mock1');

      // Second test should come from the second mock.
      m.consume(3, 'bar', (err, type, msg) => {
        expect(err).to.be.null;
        expect(type).to.equal(4);
        expect(msg).to.equal('mock2');
        done();
      });
    });
  });

  it('knowns how to map and unmap message types', function()
  {
    var mock1 = new MockProto1();
    var mock2 = new MockProto2();
    var m = new multi.MultiProtocol(mock1, mock2);

    var mapped = m.map_type(mock1, 0);
    expect(mapped).to.equal(0);
    var unmapped = m.lookup_type(mapped);
    expect(unmapped[0]).to.equal(mock1);
    expect(unmapped[1]).to.equal(0);

    mapped = m.map_type(mock2, 1);
    expect(mapped).to.equal(4);
    unmapped = m.lookup_type(mapped);
    expect(unmapped[0]).to.equal(mock2);
    expect(unmapped[1]).to.equal(1);
  });

  it('can handle protocol transitions with handlers', function(done)
  {
    var mock1 = new MockProto1();
    var mock2 = new MockProto2();
    var m = new multi.MultiProtocol(mock1, mock2);

    // Handler gets called after m.initiate()
    m.register(m.map_type(mock1, 0), 'outgoing', (proto, type, message) => {
      expect(proto).to.equal(mock1);
      expect(type).to.equal(0);

      // Initiate mock2 now.
      mock2.initiate((err, type, msg) => {
        expect(err).to.be.null;
        const mapped = m.map_type(mock2, type);
        m.consume(mapped, msg, () => {});
      });
    });

    // Handler gets called after mock2.initiate()
    m.register(m.map_type(mock2, 0), 'incoming', (proto, type, message) => {
      expect(proto).to.equal(mock2);
      expect(type).to.equal(0);

      done();
    });

    // Initiate
    m.initiate((err, type, msg) => {
      expect(err).to.be.null;
      const mapped = m.map_type(mock1, type);
      m.consume(mapped, msg, () => {});
    });
  });
});
