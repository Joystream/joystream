'use strict';

const debug = require('debug')('joystream:substrate:base');

const { registerJoystreamTypes } = require('joystream/types');
const { ApiPromise } = require('@polkadot/api');

class SubstrateApi
{
  static async create()
  {
    const ret = new SubstrateApi();
    await ret.init();
    return ret;
  }

  async init()
  {
    debug('Init');

    // Register joystream types
    registerJoystreamTypes();

    // Create the API instrance
    this.api = await ApiPromise.create();
  }
}

module.exports = {
  SubstrateApi: SubstrateApi,
}
