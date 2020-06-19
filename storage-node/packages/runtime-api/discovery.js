'use strict';

const debug = require('debug')('joystream:runtime:discovery');

/*
 * Add discovery related functionality to the substrate API.
 */
class DiscoveryApi
{
  static async create(base)
  {
    const ret = new DiscoveryApi();
    ret.base = base;
    await ret.init();
    return ret;
  }

  async init(account_file)
  {
    debug('Init');
  }

  /*
   * Get Bootstrap endpoints
   */
  async getBootstrapEndpoints() {
    return this.base.api.query.discovery.bootstrapEndpoints()
  }

  /*
   * Get AccountInfo of an accountId
   */
  async getAccountInfo(accountId) {
    const decoded = this.base.identities.keyring.decodeAddress(accountId, true)
    const info = await this.base.api.query.discovery.accountInfoByAccountId(decoded)
    // Not an Option so we use default value check to know if info was found
    return info.expires_at.eq(0) ? null : info
  }

  /*
   * Set AccountInfo of an accountId
   */
  async setAccountInfo(accountId, ipnsId, ttl) {
    const isActor = await this.base.identities.isActor(accountId)
    if (isActor) {
      const tx = this.base.api.tx.discovery.setIpnsId(ipnsId, ttl)
      return this.base.signAndSend(accountId, tx)
    } else {
      throw new Error('Cannot set AccountInfo for non actor account')
    }
  }

  /*
   * Clear AccountInfo of an accountId
   */
  async unsetAccountInfo(accountId) {
    var tx = this.base.api.tx.discovery.unsetIpnsId()
    return this.base.signAndSend(accountId, tx)
  }
}

module.exports = {
  DiscoveryApi: DiscoveryApi,
}
