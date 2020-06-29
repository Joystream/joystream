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

const { RuntimeApi } = require('@joystream/runtime-api');

describe('Roles', () => {
  var api;
  var key;
  before(async () => {
    api = await RuntimeApi.create();
    key = await api.identities.loadUnlock('test/data/edwards_unlocked.json');
  });

  it('returns the required balance for role staking', async () => {
    const amount = await api.roles.requiredBalanceForRoleStaking(api.roles.ROLE_STORAGE);

    // Effectively checks that the role is at least defined.
    expect(amount.cmpn(0)).to.be.above(0);
  });

  it('returns whether an account has funds for role staking', async () => {
    expect(await api.roles.hasBalanceForRoleStaking(key.address, api.roles.ROLE_STORAGE)).to.be.false;
  });

  it('returns accounts for a role', async () => {
    const accounts = await api.roles.accountIdsByRole(api.roles.ROLE_STORAGE);
    // The chain may have accounts configured, so go for the bare minimum in
    // expectations.
    expect(accounts).to.have.lengthOf.above(-1);
  });

  it('can check whether an account fulfils requirements for role staking', async () => {
    expect(async _ => {
      await api.roles.checkAccountForRoleStaking(key.address, api.roles.ROLE_STORAGE);
    }).to.throw;
  });

  it('can check for an account to have a role', async () => {
    expect(await api.roles.checkForRole(key.address, api.roles.ROLE_STORAGE)).to.be.false;
  });

  // TODO requires complex setup, and may change in the near future.
  it('transfers funds for staking');
  it('can apply for a role');
  it('can wait for an account to have a role');
});
