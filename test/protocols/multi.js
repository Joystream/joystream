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
});
