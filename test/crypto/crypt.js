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
const { encrypt, decrypt } = require('joystream/crypto/crypt');

const { ALICE_SEED, BOB_SEED } = require('../common');

describe('crypto/crypt', () => {
  it('cannot be used with sr25519 keys', async () => {
    const kr = await Keyring.create();
    const alice = kr.from_seed('sr25519', ALICE_SEED);
    const bob = kr.from_seed('sr25519', BOB_SEED);

    expect(_ => encrypt(alice, bob, 'foo')).to.throw();
  });

  it('cannot be used with polkadot ed25519 keys', async () => {
    const kr = await Keyring.create();
    const alice = kr.from_seed('ed25519', ALICE_SEED);
    const bob = kr.from_seed('ed25519', BOB_SEED);

    expect(_ => encrypt(alice, bob, 'foo')).to.throw();
  });

  it('can be used with NaCl ed25519 keys', async () => {
    const kr = await Keyring.create();
    const alice_p = kr.from_seed('ed25519', ALICE_SEED);
    const alice = kr.convert_keypair(alice_p);
    const bob_p = kr.from_seed('ed25519', BOB_SEED);
    const bob = kr.convert_keypair(bob_p);

    expect(_ => encrypt(alice, bob, 'foo')).not.to.throw();
  });

  it('can decrypt an encrypted message', async () => {
    const kr = await Keyring.create();
    const alice_p = kr.from_seed('ed25519', ALICE_SEED);
    const alice = kr.convert_keypair(alice_p);
    const bob_p = kr.from_seed('ed25519', BOB_SEED);
    const bob = kr.convert_keypair(bob_p);

    const plain = 'Hello, world!';
    const cipher = encrypt(alice, bob, plain);
    const decrypted = decrypt(alice, bob, cipher);

    expect(decrypted.toString('utf8')).to.equal(plain);
  });
});
