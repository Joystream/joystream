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

const { Keyring } = require('joystream/crypto/keyring');
const mutual = require('joystream/protocols/mutual');
const { ALICE_SEED, BOB_SEED } = require('../common');

function run_protocol(auth1, auth2, done)
{
  // Auth1/key1 initiates.
  auth1.initiate((err, type, challenge) => {
    expect(err).to.be.null;
    expect(type).to.equal(mutual.MSG_CHALLENGE);
    expect(auth1.peer_authenticated()).to.be.false;

    // Consume message on auth2
    auth2.consume(type, challenge, (err, type, response) => {
      expect(err).to.be.null;
      expect(type).to.equal(mutual.MSG_RESPONSE);
      expect(auth2.peer_authenticated()).to.be.false;

      // Consume response on auth1
      auth1.consume(type, response, (err, type, finalize) => {
        expect(err).to.be.null;
        expect(type).to.equal(mutual.MSG_FINALIZE);
        expect(auth1.peer_authenticated()).to.be.true;

        // Consume finalize on auth2
        auth2.consume(type, finalize, (err) => {
          expect(err).to.be.null;
          expect(auth2.peer_authenticated()).to.be.true;

          // Both authenticated, awesome.
          done();
        });
      });
    });
  });
}

describe('protocols/mutual', () => {
  var alice, bob, alice_pub, bob_pub;

  before(async () => {
    const kr = await Keyring.create();
    const alice_p = kr.from_seed('ed25519', ALICE_SEED);
    alice = kr.convert_keypair(alice_p);
    const bob_p = kr.from_seed('ed25519', BOB_SEED);
    bob = kr.convert_keypair(bob_p);

    bob_pub = {};
    Object.assign(bob_pub, bob);
    bob_pub.secretKey = undefined;

    alice_pub = {};
    Object.assign(alice_pub, alice);
    alice_pub.secretKey = undefined;
  });


  it('mutually authenticates two peers', (done) => {
    var auth1 = new mutual.MutualAuthenticator(alice, bob_pub, 8);
    var auth2 = new mutual.MutualAuthenticator(bob, alice_pub, 8);

    run_protocol(auth1, auth2, done);
  });

  it('mutually authenticates two peers when the initiating peer needs to share its public key', function(done)
  {
    // Auth1 initiates, and auth2 does not know their public key.
    var auth1 = new mutual.MutualAuthenticator(alice, bob_pub, 8);
    var auth2 = new mutual.MutualAuthenticator(bob, undefined, 8);

    run_protocol(auth1, auth2, done);
  });

  it('works with long challenges (512 Bytes)', (done) => {
    var auth1 = new mutual.MutualAuthenticator(alice, bob_pub, 512);
    var auth2 = new mutual.MutualAuthenticator(bob, alice_pub, 512);

    run_protocol(auth1, auth2, done);
  });

  it('describes a message range', function()
  {
    const auth = new mutual.MutualAuthenticator(alice);
    expect(auth).to.have.property('MESSAGE_RANGE');
    expect(auth.MESSAGE_RANGE).to.be.have.lengthOf(2);
  });
});
