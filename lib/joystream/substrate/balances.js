'use strict';

const debug = require('debug')('joystream:substrate:balances');

const { IdentitiesApi } = require('joystream/substrate/identities');

// TODO replace this with the one defined in the role
const DEFAULT_STAKING_AMOUNT = 3000;

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

  async hasBalanceForRoleStaking(accountId)
  {
    return await this.hasMinimumBalanceOf(accountId, DEFAULT_STAKING_AMOUNT);
  }

  async hasMinimumBalanceOf(accountId, min)
  {
    const balance = await this.freeBalance(accountId);
    return balance.cmpn(min) >= 0;
  }

  async freeBalance(accountId)
  {
    const decoded = this.keyring.decodeAddress(accountId, true);
    return await this.api.query.balances.freeBalance(decoded);
  }

  async transfer(from, to, amount)
  {
    const decode = require('@polkadot/keyring/address/decode').default;
    const to_decoded = decode(to, true);

    const from_key = this.keyring.getPair(from);
    if (from_key.isLocked()) {
      throw new Error('Must unlock key before using it to sign!');
    }

    return await this.api.tx.balances.transfer(to_decoded, amount)
      .signAndSend(from_key);
  }

  async transferForStaking(from, to)
  {
    return await this.transfer(from, to, DEFAULT_STAKING_AMOUNT + 100 /*FIXME */);
  }
}

module.exports = {
  BalancesApi: BalancesApi,
}
