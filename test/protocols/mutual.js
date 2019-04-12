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

const mutual = require('joystream/protocols/mutual');
const keys = require('joystream/crypto/keys');

function run_protocol(auth1, auth2, done)
{
  // Auth1/key1 initiates.
  auth1.initiate((err, type, challenge) => {
    expect(err).to.be.null;
    expect(type).to.equal(mutual.MSG_CHALLENGE);
    expect(auth1.peer_authenticated).to.be.false;

    // Consume message on auth2
    auth2.consume(type, challenge, (err, type, response) => {
      expect(err).to.be.null;
      expect(type).to.equal(mutual.MSG_RESPONSE);
      expect(auth2.peer_authenticated).to.be.false;

      // Consume response on auth1
      auth1.consume(type, response, (err, type, finalize) => {
        expect(err).to.be.null;
        expect(type).to.equal(mutual.MSG_FINALIZE);
        expect(auth1.peer_authenticated).to.be.true;

        // Consume finalize on auth2
        auth2.consume(type, finalize, (err) => {
          expect(err).to.be.null;
          expect(auth2.peer_authenticated).to.be.true;

          // Both authenticated, awesome.
          done();
        });
      });
    });
  });
}

describe('protocols/mutual', function()
{
  it('mutually authenticates two peers', function(done)
  {
    const key1 = keys.key_pair();
    const key2 = keys.key_pair();

    var auth1 = new mutual.MutualAuthenticator(key1, key2.pubKey, 8);
    var auth2 = new mutual.MutualAuthenticator(key2, key1.pubKey, 8);

    run_protocol(auth1, auth2, done);
  });

  it('mutually authenticates two peers when the initiating peer needs to share its public key', function(done)
  {
    const key1 = keys.key_pair();
    const key2 = keys.key_pair();

    // Auth1 initiates, and auth2 does not know their public key.
    var auth1 = new mutual.MutualAuthenticator(key1, key2.pubKey, 8);
    var auth2 = new mutual.MutualAuthenticator(key2, undefined, 8);

    run_protocol(auth1, auth2, done);
  });

  it('describes a message range', function()
  {
    const auth = new mutual.MutualAuthenticator(keys.key_pair());
    expect(auth).to.have.property('MESSAGE_RANGE');
    expect(auth.MESSAGE_RANGE).to.be.have.lengthOf(2);
  });

  describe('failures with a bad key pair', function()
  {
    it ('it fails if the first peer has a bad key pair', function(done)
    {
      const key1 = keys.key_pair();
      // Change private key of key1
      key1.privKey[0] += 1;

      const key2 = keys.key_pair();

      var auth1 = new mutual.MutualAuthenticator(key1, key2.pubKey, 8);
      var auth2 = new mutual.MutualAuthenticator(key2, key1.pubKey, 8);

      // Auth1/key1 initiates.
      auth1.initiate((err, type, challenge) => {
        expect(err).to.be.null;
        expect(type).to.equal(mutual.MSG_CHALLENGE);
        expect(auth1.peer_authenticated).to.be.false;

        // Consume message on auth2
        auth2.consume(type, challenge, (err, type, response) => {
          expect(err).to.be.null;
          expect(type).to.equal(mutual.MSG_RESPONSE);
          expect(auth2.peer_authenticated).to.be.false;

          // Consume response on auth1
          auth1.consume(type, response, (err, type, finalize) => {
            // Since the private key of peer1 does not match their public
            // key, they experience the failure in authentication - the
            // response challenge can't be descrypted.
            expect(err).not.to.be.null;
            done();
          });
        });
      });
    });

    it ('it fails if the second peer has a bad key pair', function(done)
    {
      const key1 = keys.key_pair();
      const key2 = keys.key_pair();
      // Change private key of key2
      key2.privKey[0] += 1;

      var auth1 = new mutual.MutualAuthenticator(key1, key2.pubKey, 8);
      var auth2 = new mutual.MutualAuthenticator(key2, key1.pubKey, 8);

      // Auth1/key1 initiates.
      auth1.initiate((err, type, challenge) => {
        expect(err).to.be.null;
        expect(auth1.peer_authenticated).to.be.false;

        // Consume message on auth2
        auth2.consume(type, challenge, (err, type, response) => {
          expect(err).to.be.null;
          expect(auth2.peer_authenticated).to.be.false;

          // Consume response on auth1
          auth1.consume(type, response, (err, type, finalize) => {
            // Again, it's the initiating peer that experiences the
            // authentication failure. In this case, though, it's because
            // the other peer sent a bad response.
            expect(err).not.to.be.null;
            done();
          });
        });
      });
    });
  });
});
