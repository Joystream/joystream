'use strict';

const debug = require('debug')('joystream:substrate:balances');

const { IdentitiesApi } = require('joystream/substrate/identities');

/*
 * Bundle API calls related to account balances.
 */
class BalancesApi extends IdentitiesApi
{
  static async create(account_file)
  {
    const ret = new BalancesApi();
    await ret.init(account_file);
    return ret;
  }

  async init(account_file)
  {
    debug('Init');

    // Super init
    await super.init(account_file);
  }

  /*
   * Return true/false if the account has the minimum balance given.
   */
  async hasMinimumBalanceOf(accountId, min)
  {
    const balance = await this.freeBalance(accountId);
    if (typeof min === 'number') {
      return balance.cmpn(min) >= 0;
    }
    else {
      return balance.cmp(min) >= 0;
    }
  }

  /*
   * Return the account's current free balance.
   */
  async freeBalance(accountId)
  {
    const decoded = this.keyring.decodeAddress(accountId, true);
    return await this.api.query.balances.freeBalance(decoded);
  }

  /*
   * Transfer amount currency from one address to another. The sending
   * address must be an unlocked key pair!
   */
  async transfer(from, to, amount)
  {
    const decode = require('@polkadot/keyring/address/decode').default;
    const to_decoded = decode(to, true);

    const tx = this.api.tx.balances.transfer(to_decoded, amount);
    return await this.signAndSendWithRetry(from, tx);
  }
}

module.exports = {
  BalancesApi: BalancesApi,
}
