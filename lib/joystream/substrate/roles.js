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

const debug = require('debug')('joystream:substrate:roles');

const { Null, U64 } = require('@polkadot/types/primitive');

const { _ } = require('lodash');

const { BalancesApi } = require('joystream/substrate/balances');

const ROLE_STORAGE = new U64(0x00);

class RolesApi extends BalancesApi
{
  static async create(account_file)
  {
    const ret = new RolesApi();
    await ret.init(account_file);
    return ret;
  }

  async init(account_file)
  {
    debug('Init');

    // Super init
    await super.init(account_file);
  }

  async checkAccountForStaking(accountId, role)
  {
    role = role || ROLE_STORAGE;

    if (!await this.isMember(accountId)) {
      const msg = `Account with id "${accountId}" is not a member!`;
      debug(msg);
      throw new Error(msg);
    }

    if (!await this.hasBalanceForRoleStaking(accountId, role)) {
      const msg = `Account with id "${accountId}" does not have sufficient free balance for role staking!`;
      debug(msg);
      throw new Error(msg);
    }

    debug(`Account with id "${accountId}" is a member with sufficient free balance, able to proceed.`);
    return true;
  }

  async requiredBalanceForRoleStaking(role)
  {
    const params = await this.api.query.actors.parameters(role);
    if (_.isEqual(params.raw, new Null())) {
      throw new Error(`Role ${role} is not defined!`);
    }
    const result = params.raw.min_stake.add(params.raw.entry_request_fee);
    return result;
  }

  async hasBalanceForRoleStaking(accountId, role)
  {
    const required = await this.requiredBalanceForRoleStaking(role);
    return await this.hasMinimumBalanceOf(accountId, required);
  }

  async transferForStaking(from, to, role)
  {
    const required = await this.requiredBalanceForRoleStaking(role);
    return await this.transfer(from, to, required);
  }


  async applyForRole(roleAccountId, role, memberAccountId)
  {
    const memberId = await this.memberIdOf(memberAccountId);
    if (_.isEqual(memberId.raw, new Null())) {
      throw new Error('Account is not a member!');
    }
    const converted = memberId.raw;

    const from_key = this.keyring.getPair(roleAccountId);
    if (from_key.isLocked()) {
      throw new Error('Must unlock key before using it to sign!');
    }

    return await this.api.tx.actors.roleEntryRequest(role, converted)
      .signAndSend(from_key);
  }

  async checkForRole(roleAccountId, role)
  {
    const actor = await this.api.query.actors.actorByAccountId(roleAccountId);
    return !_.isEqual(actor.raw, new Null());
  }

  async waitForRole(roleAccountId, role)
  {
    if (await this.checkForRole(roleAccountId, role)) {
      return true;
    }

    return new Promise((resolve, reject) => {
      this.waitForEvent('actors', 'Staked').then((values) => {
        const name = values[0];
        const payload = values[1];

        if (payload.AccountId == roleAccountId) {
          resolve(true);
        }
      });
    });
  }
}

module.exports = {
  RolesApi: RolesApi,
  ROLE_STORAGE: ROLE_STORAGE,
}
