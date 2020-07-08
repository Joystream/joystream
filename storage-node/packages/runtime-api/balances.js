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

const debug = require('debug')('joystream:runtime:balances')

/*
 * Bundle API calls related to account balances.
 */
class BalancesApi {
  static async create(base) {
    const ret = new BalancesApi()
    ret.base = base
    await BalancesApi.init()
    return ret
  }

  static async init() {
    debug('Init')
  }

  /*
   * Return true/false if the account has the minimum balance given.
   */
  async hasMinimumBalanceOf(accountId, min) {
    const balance = await this.freeBalance(accountId)
    if (typeof min === 'number') {
      return balance.cmpn(min) >= 0
    }
    return balance.cmp(min) >= 0
  }

  /*
   * Return the account's current free balance.
   */
  async freeBalance(accountId) {
    const decoded = this.base.identities.keyring.decodeAddress(accountId, true)
    return this.base.api.query.balances.freeBalance(decoded)
  }

  /*
   * Return the base transaction fee.
   */
  baseTransactionFee() {
    return this.base.api.consts.transactionPayment.transactionBaseFee
  }

  /*
   * Transfer amount currency from one address to another. The sending
   * address must be an unlocked key pair!
   */
  async transfer(from, to, amount) {
    const decode = require('@polkadot/keyring').decodeAddress
    const toDecoded = decode(to, true)

    const tx = this.base.api.tx.balances.transfer(toDecoded, amount)
    return this.base.signAndSend(from, tx)
  }
}

module.exports = {
  BalancesApi,
}
