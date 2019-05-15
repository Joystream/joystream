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

const { Keyring, KEY_TYPES } = require('@joystream/crypto/keyring');
const putil = require('@polkadot/util');

const { ALICE_SEED, BOB_SEED } = require('./common');

describe('crypto/keyring', () => {
  it('can be created', async () => {
    const kr = await Keyring.create();
    expect(kr).to.respondTo('from_seed');
  });

  KEY_TYPES.forEach((type) => {
    it(`can create a ${type} key from hex seed`, async () => {
      const kr = await Keyring.create();

      const pair = kr.from_seed(type, ALICE_SEED);
      expect(pair.type).to.equal(type);
      expect(pair.compatibility).to.equal('polkadot');
      expect(pair).to.have.property('publicKey');
      expect(pair).to.have.property('secretKey');
    });
  });

  it('can convert an ed25519 key to NaCl', async () => {
    const kr = await Keyring.create();
    const seed = putil.hexToU8a(ALICE_SEED);
    const pair = kr.addFromSeed(seed, undefined, 'ed25519');

    const converted = kr.convert_keypair(pair);
    expect(converted.type).to.equal('ed25519');
    expect(converted.compatibility).to.equal('nacl');
    expect(converted).to.have.property('publicKey');
    expect(converted).to.have.property('secretKey');
  });

  it('can convert a polkadot ed25519 key to NaCl', async () => {
    const kr = await Keyring.create();
    const pair = kr.from_seed('ed25519', ALICE_SEED);

    const converted = kr.convert_keypair(pair);
    expect(converted.type).to.equal('ed25519');
    expect(converted.compatibility).to.equal('nacl');
    expect(converted).to.have.property('publicKey');
    expect(converted).to.have.property('secretKey');
  });

  it('can convert a polkadot ed25519 address to NaCl', async () => {
    const kr = await Keyring.create();
    const pair = kr.addFromAddress('5FvCDYpVNbQo1LHbwWUyvasEDZjpRs1n9ceUtvs9iYZqTwpb'); // ALICE

    const converted = kr.convert_keypair(pair);
    expect(converted.type).to.equal('ed25519');
    expect(converted.compatibility).to.equal('nacl');
    expect(converted).to.have.property('publicKey');
    expect(converted).not.to.have.property('secretKey');
  });

  it('cannot convert a sr25519 key to NaCl', async () => {
    const kr = await Keyring.create();
    const pair = kr.from_seed('sr25519', ALICE_SEED);

    expect(_ => kr.convert_keypair(pair)).to.throw();
  });
});
