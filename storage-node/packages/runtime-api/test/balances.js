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

describe('Balances', () => {
  let api
  let key
  before(async () => {
    api = await RuntimeApi.create()
    key = await api.identities.loadUnlock('test/data/edwards_unlocked.json')
  })

  it('returns free balance for an account', async () => {
    const balance = await api.balances.freeBalance(key.address)
    // Should be exactly zero
    expect(balance.cmpn(0)).to.equal(0)
  })

  it('checks whether a minimum balance exists', async () => {
    // A minimum of 0 should exist, but no more.
    expect(await api.balances.hasMinimumBalanceOf(key.address, 0)).to.be.true
    expect(await api.balances.hasMinimumBalanceOf(key.address, 1)).to.be.false
  })

  it('returns the base transaction fee of the chain', async () => {
    const fee = await api.balances.baseTransactionFee()
    // >= 0 comparison works
    expect(fee.cmpn(0)).to.be.at.least(0)
  })
})
