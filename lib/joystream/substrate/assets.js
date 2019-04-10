'use strict';

const debug = require('debug')('joystream:substrate:assets');

const { Null, U64 } = require('@polkadot/types/primitive');

const { _ } = require('lodash');

const { RolesApi } = require('joystream/substrate/roles');

/*
 * Add role related functionality to the substrate API.
 */
class AssetApi extends RolesApi
{
  static async create(account_file)
  {
    const ret = new AssetApi();
    await ret.init(account_file);
    return ret;
  }

  async init(account_file)
  {
    debug('Init');

    // Super init
    await super.init(account_file);
  }
}

module.exports = {
  AssetApi: AssetApi,
}
