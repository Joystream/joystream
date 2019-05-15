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

const { Keyring } = require('@joystream/crypto/keyring');
const { MutualAuthenticator } = require('@joystream/crypto/mutual');

const { ALICE_SEED, BOB_SEED } = require('./common');

/*
 * Makes a bad key by manipulating one byte of one of the keys.
 */
function make_bad_key(pair)
{
  const mutated = Array.from(pair.publicKey.values());
  mutated[0] += 128;

  const bad = {};
  Object.assign(bad, pair);
  bad.publicKey = Buffer.from(mutated);

  return bad;
}

describe('crypto/mutual', () => {
  var alice, bob, bob_pub;

  before(async () => {
    const kr = await Keyring.create();
    const alice_p = kr.from_seed('ed25519', ALICE_SEED);
    alice = kr.convert_keypair(alice_p);
    const bob_p = kr.from_seed('ed25519', BOB_SEED);
    bob = kr.convert_keypair(bob_p);

    bob_pub = {};
    Object.assign(bob_pub, bob);
    bob_pub.secretKey = undefined;
  });

  it('can authenticate both peers', () => {
    // The initiating party needs the public key of the recipient.
    const alice_auth = new MutualAuthenticator(alice, bob_pub);
    const bob_auth = new MutualAuthenticator(bob);
    expect(alice_auth.peer_authenticated).to.be.false;
    expect(bob_auth.peer_authenticated).to.be.false;

    const challenge = alice_auth.initiate();
    const reply1 = bob_auth.mutual_challenge(challenge);
    const reply2 = alice_auth.final_reply(reply1);
    expect(alice_auth.peer_authenticated).to.be.true;

    bob_auth.consume_final(reply2);
    expect(bob_auth.peer_authenticated).to.be.true;
  });

  describe('failures with a bad key pair', () => {
    it('it fails if the first peer has a bad key pair', () => {
      const bad_alice = make_bad_key(alice);

      // The initiating party needs the public key of the recipient.
      const alice_auth = new MutualAuthenticator(bad_alice, bob_pub);
      const bob_auth = new MutualAuthenticator(bob);
      expect(alice_auth.peer_authenticated).to.be.false;
      expect(bob_auth.peer_authenticated).to.be.false;

      const challenge = alice_auth.initiate();
      expect(_ => bob_auth.mutual_challenge(challenge)).to.throw();
    });

    it ('it fails if the second peer has a bad key pair', () => {
      const bad_bob = make_bad_key(bob);

      // The initiating party needs the public key of the recipient.
      const alice_auth = new MutualAuthenticator(alice, bad_bob);
      const bob_auth = new MutualAuthenticator(bad_bob);
      expect(alice_auth.peer_authenticated).to.be.false;
      expect(bob_auth.peer_authenticated).to.be.false;

      const challenge = alice_auth.initiate();
      expect(_ => bob_auth.mutual_challenge(challenge)).to.throw();
    });
  });
});
