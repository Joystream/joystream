'use strict';

const mocha = require('mocha');
const expect = require('chai').expect;

const net = require('net');

const protostream = require('joystream/protocols/stream');
const mutual = require('joystream/protocols/mutual');
const envelope = require('joystream/protocols/envelope');
const keys = require('joystream/crypto/keys');

describe('protocols/stream', function()
{
  it('can stream mutual authentication in object mode', function(done)
  {
    const key1 = keys.key_pair();
    const key2 = keys.key_pair();

    const auth1 = new mutual.MutualAuthenticator(key1, key2.pubKey, 8);
    const auth2 = new mutual.MutualAuthenticator(key2, key1.pubKey, 8);

    const proto1 = new protostream.ProtocolStream(auth1, { objectMode: true });
    const proto2 = new protostream.ProtocolStream(auth2, { objectMode: true });

    // Precondition
    expect(auth1.peer_authenticated).to.be.false;
    expect(auth2.peer_authenticated).to.be.false;

    proto1.pipe(proto2).pipe(proto1);
    proto2.on('finish', () => {
      // Postcondition
      expect(auth1.peer_authenticated).to.be.true;
      expect(auth2.peer_authenticated).to.be.true;
      done();
    });
    proto1.initiate();
  });

  it('can stream mutual authentication with envelopes', function(done)
  {
    const key1 = keys.key_pair();
    const key2 = keys.key_pair();

    const auth1 = new mutual.MutualAuthenticator(key1, key2.pubKey, 8);
    const auth2 = new mutual.MutualAuthenticator(key2, key1.pubKey, 8);

    const ser1 = new envelope.Serializer();
    const des1 = new envelope.Deserializer();
    const ser2 = new envelope.Serializer();
    const des2 = new envelope.Deserializer();

    const proto1 = new protostream.ProtocolStream(auth1);
    const proto2 = new protostream.ProtocolStream(auth2);

    // Precondition
    expect(auth1.peer_authenticated).to.be.false;
    expect(auth2.peer_authenticated).to.be.false;

    proto1.pipe(ser1).pipe(des2).pipe(proto2).pipe(ser2).pipe(des1).pipe(proto1);
    proto2.on('finish', () => {
      // Postcondition
      expect(auth1.peer_authenticated).to.be.true;
      expect(auth2.peer_authenticated).to.be.true;
      done();
    });
    proto1.initiate();
  });

  it('can stream mutual authentication through localhost', function(done)
  {
    const key1 = keys.key_pair();
    const key2 = keys.key_pair();

    const auth1 = new mutual.MutualAuthenticator(key1, key2.pubKey, 8);
    const auth2 = new mutual.MutualAuthenticator(key2, key1.pubKey, 8);

    // Serializer and Deserializer
    const ser1 = new envelope.Serializer();
    const des1 = new envelope.Deserializer();
    const ser2 = new envelope.Serializer();
    const des2 = new envelope.Deserializer();

    const proto1 = new protostream.ProtocolStream(auth1);
    const proto2 = new protostream.ProtocolStream(auth2);

    // Precondition
    expect(auth1.peer_authenticated).to.be.false;
    expect(auth2.peer_authenticated).to.be.false;

    const server = net.createServer((socket) => {
      socket.pipe(des1).pipe(proto1).pipe(ser1).pipe(socket);
    });
    server.listen(10000);

    const client = net.connect(10000);
    client.pipe(des2).pipe(proto2).pipe(ser2).pipe(client);

    proto2.on('finish', () => {
      // Postcondition
      expect(auth1.peer_authenticated).to.be.true;
      expect(auth2.peer_authenticated).to.be.true;

      server.close();
      done();
    });
    proto1.initiate();
  });
});
