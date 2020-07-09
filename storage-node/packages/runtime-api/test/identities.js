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

'use strict'

const expect = require('chai').expect
const sinon = require('sinon')
const temp = require('temp').track()

const { RuntimeApi } = require('@joystream/storage-runtime-api')

describe('Identities', () => {
  let api
  before(async () => {
    api = await RuntimeApi.create({ canPromptForPassphrase: true })
  })

  it('imports keys', async () => {
    // Unlocked keys can be imported without asking for a passphrase
    await api.identities.loadUnlock('test/data/edwards_unlocked.json')

    // Edwards and schnorr keys should unlock
    const passphraseStub = sinon.stub(api.identities, 'askForPassphrase').callsFake(() => 'asdf')
    await api.identities.loadUnlock('test/data/edwards.json')
    await api.identities.loadUnlock('test/data/schnorr.json')
    passphraseStub.restore()

    // Except if the wrong passphrase is given
    const passphraseStubBad = sinon.stub(api.identities, 'askForPassphrase').callsFake(() => 'bad')
    expect(async () => {
      await api.identities.loadUnlock('test/data/edwards.json')
    }).to.throw
    passphraseStubBad.restore()
  })

  it('knows about membership', async () => {
    const key = await api.identities.loadUnlock('test/data/edwards_unlocked.json')
    const addr = key.address

    // Without seeding the runtime with data, we can only verify that the API
    // reacts well in the absence of membership
    expect(await api.identities.isMember(addr)).to.be.false
    const memberId = await api.identities.firstMemberIdOf(addr)

    expect(memberId).to.be.undefined
  })

  it('exports keys', async () => {
    const key = await api.identities.loadUnlock('test/data/edwards_unlocked.json')

    const passphraseStub = sinon.stub(api.identities, 'askForPassphrase').callsFake(() => 'asdf')
    const exported = await api.identities.exportKeyPair(key.address)
    passphraseStub.restore()

    expect(exported).to.have.property('address')
    expect(exported.address).to.equal(key.address)

    expect(exported).to.have.property('encoding')

    expect(exported.encoding).to.have.property('version', '2')

    expect(exported.encoding).to.have.property('content')
    expect(exported.encoding.content).to.include('pkcs8')
    expect(exported.encoding.content).to.include('ed25519')

    expect(exported.encoding).to.have.property('type')
    expect(exported.encoding.type).to.include('salsa20')
  })

  it('writes key export files', async () => {
    const prefix = temp.mkdirSync('joystream-runtime-api-test')

    const key = await api.identities.loadUnlock('test/data/edwards_unlocked.json')

    const passphraseStub = sinon.stub(api.identities, 'askForPassphrase').callsFake(() => 'asdf')
    const filename = await api.identities.writeKeyPairExport(key.address, prefix)
    passphraseStub.restore()

    const fs = require('fs')
    const stat = fs.statSync(filename)
    expect(stat.isFile()).to.be.true
  })
})
