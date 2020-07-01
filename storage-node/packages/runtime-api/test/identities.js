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
const sinon = require('sinon');
const temp = require('temp').track();

const { RuntimeApi } = require('@joystream/storage-runtime-api');

describe('Identities', () => {
  var api;
  before(async () => {
    api = await RuntimeApi.create({ canPromptForPassphrase: true });
  });

  it('imports keys', async () => {
    // Unlocked keys can be imported without asking for a passphrase
    await api.identities.loadUnlock('test/data/edwards_unlocked.json');

    // Edwards and schnorr keys should unlock
    const passphrase_stub = sinon.stub(api.identities, 'askForPassphrase').callsFake(_ => 'asdf');
    await api.identities.loadUnlock('test/data/edwards.json');
    await api.identities.loadUnlock('test/data/schnorr.json');
    passphrase_stub.restore();

    // Except if the wrong passphrase is given
    const passphrase_stub_bad = sinon.stub(api.identities, 'askForPassphrase').callsFake(_ => 'bad');
    expect(async () => {
      await api.identities.loadUnlock('test/data/edwards.json');
    }).to.throw;
    passphrase_stub_bad.restore();
  });

  it('knows about membership', async () => {
    const key = await api.identities.loadUnlock('test/data/edwards_unlocked.json');
    const addr = key.address;

    // Without seeding the runtime with data, we can only verify that the API
    // reacts well in the absence of membership
    expect(await api.identities.isMember(addr)).to.be.false;
    const member_id = await api.identities.firstMemberIdOf(addr);

    expect(member_id).to.be.undefined;
  });

  it('exports keys', async () => {
    const key = await api.identities.loadUnlock('test/data/edwards_unlocked.json');

    const passphrase_stub = sinon.stub(api.identities, 'askForPassphrase').callsFake(_ => 'asdf');
    const exported = await api.identities.exportKeyPair(key.address);
    passphrase_stub.restore();

    expect(exported).to.have.property('address');
    expect(exported.address).to.equal(key.address);

    expect(exported).to.have.property('encoding');

    expect(exported.encoding).to.have.property('version', '2');

    expect(exported.encoding).to.have.property('content');
    expect(exported.encoding.content).to.include('pkcs8');
    expect(exported.encoding.content).to.include('ed25519');

    expect(exported.encoding).to.have.property('type');
    expect(exported.encoding.type).to.include('salsa20');
  });

  it('writes key export files', async () => {
    const prefix = temp.mkdirSync('joystream-runtime-api-test');

    const key = await api.identities.loadUnlock('test/data/edwards_unlocked.json');

    const passphrase_stub = sinon.stub(api.identities, 'askForPassphrase').callsFake(_ => 'asdf');
    const filename = await api.identities.writeKeyPairExport(key.address, prefix);
    passphrase_stub.restore();

    const fs = require('fs');
    const stat = fs.statSync(filename);
    expect(stat.isFile()).to.be.true;
  });
});
