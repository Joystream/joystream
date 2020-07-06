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

const { RuntimeApi } = require('@joystream/storage-runtime-api')

describe('Assets', () => {
  let api
  before(async () => {
    api = await RuntimeApi.create()
    await api.identities.loadUnlock('test/data/edwards_unlocked.json')
  })

  it('returns DataObjects for a content ID', async () => {
    const obj = await api.assets.getDataObject('foo')
    expect(obj.isNone).to.be.true
  })

  it('can check the liaison for a DataObject', async () => {
    expect(async () => {
      await api.assets.checkLiaisonForDataObject('foo', 'bar')
    }).to.throw
  })

  // Needs properly staked accounts
  it('can accept content')
  it('can reject content')
  it('can create a storage relationship for content')
  it('can toggle a storage relationship to ready state')
})
