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

const debug = require('debug')('joystream:runtime:roles');

const { Null, u64 } = require('@polkadot/types');

const { _ } = require('lodash');

/*
 * Add role related functionality to the substrate API.
 */
class RolesApi
{
  static async create(base)
  {
    const ret = new RolesApi();
    ret.base = base;
    await ret.init();
    return ret;
  }

  async init()
  {
    debug('Init');

    // Constants
    this.ROLE_STORAGE = 'StorageProvider'; // new u64(0x00);
  }

  /*
   * Raises errors if the given account ID is not valid for staking as the given
   * role. The role should be one of the ROLE_* constants above.
   */
  async checkAccountForStaking(accountId, role)
  {
    role = role || this.ROLE_STORAGE;

    if (!await this.base.identities.isMember(accountId)) {
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

  /*
   * Returns the required balance for staking for a role.
   */
  async requiredBalanceForRoleStaking(role)
  {
    const params = await this.base.api.query.actors.parameters(role);
    if (params.isNone) {
      throw new Error(`Role ${role} is not defined!`);
    }
    const result = params.raw.min_stake
      .add(params.raw.entry_request_fee)
      .add(await this.base.balances.baseTransactionFee());
    return result;
  }

  /*
   * Returns true/false if the given account has the balance required for
   * staking for the given role.
   */
  async hasBalanceForRoleStaking(accountId, role)
  {
    const required = await this.requiredBalanceForRoleStaking(role);
    return await this.base.balances.hasMinimumBalanceOf(accountId, required);
  }

  /*
   * Transfer enough funds to allow the recipient to stake for the given role.
   */
  async transferForStaking(from, to, role)
  {
    const required = await this.requiredBalanceForRoleStaking(role);
    return await this.base.balances.transfer(from, to, required);
  }

  /*
   * Return current accounts holding a role.
   */
  async accountIdsByRole(role)
  {
    const ids = await this.base.api.query.actors.accountIdsByRole(role);
    return ids.map(id => id.toString());
  }

  /*
   * Returns the number of slots available for a role
   */
  async availableSlotsForRole(role)
  {
    let params = await this.base.api.query.actors.parameters(role);
    if (params.isNone) {
      throw new Error(`Role ${role} is not defined!`);
    }
    params = params.unwrap();
    const slots = params.max_actors;
    const active = await this.accountIdsByRole(role);
    return (slots.subn(active.length)).toNumber();
  }

  /*
   * Send a role application.
   * - The role account must not be a member, but have sufficient funds for
   *   staking.
   * - The member account must be a member.
   *
   * After sending this application, the member account will have role request
   * in the 'My Requests' tab of the app.
   */
  async applyForRole(roleAccountId, role, memberAccountId)
  {
    const memberId = await this.base.identities.firstMemberIdOf(memberAccountId);
    if (memberId == undefined) {
      throw new Error('Account is not a member!');
    }

    const tx = this.base.api.tx.actors.roleEntryRequest(role, memberId);
    return await this.base.signAndSend(roleAccountId, tx);
  }

  /*
   * Check whether the given role is occupying the given role.
   */
  async checkForRole(roleAccountId, role)
  {
    const actor = await this.base.api.query.actors.actorByAccountId(roleAccountId);
    return !_.isEqual(actor.raw, new Null());
  }

  /*
   * Same as checkForRole(), but if the account is not currently occupying the
   * role, wait for the appropriate `actors.Staked` event to be emitted.
   */
  async waitForRole(roleAccountId, role)
  {
    if (await this.checkForRole(roleAccountId, role)) {
      return true;
    }

    return new Promise((resolve, reject) => {
      this.base.waitForEvent('actors', 'Staked').then((values) => {
        const name = values[0][0];
        const payload = values[0][1];

        if (payload.AccountId == roleAccountId) {
          resolve(true);
        } else {
          // reject() ?
        }
      });
    });
  }
}

module.exports = {
  RolesApi: RolesApi,
}
