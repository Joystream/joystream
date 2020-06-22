'use strict'

const debug = require('debug')('joystream:runtime:discovery')

/*
 * Add discovery related functionality to the substrate API.
 */
class DiscoveryApi {
  static async create (base) {
    const ret = new DiscoveryApi()
    ret.base = base
    await ret.init()
    return ret
  }

  async init () {
    debug('Init')
  }

  /*
   * Get Bootstrap endpoints
   */
  async getBootstrapEndpoints () {
    return this.base.api.query.discovery.bootstrapEndpoints()
  }

  /*
   * Get AccountInfo of a storage provider
   */
  async getAccountInfo (storageProviderId) {
    const info = await this.base.api.query.discovery.accountInfoByAccountId(storageProviderId)
    // Not an Option so we use default value check to know if info was found
    return info.expires_at.eq(0) ? null : info
  }

  /*
   * Set AccountInfo of an accountId
   */
  async setAccountInfo (storageProviderId, ipnsId) {
    const isProvider = await this.base.workers.isStorageProvider(storageProviderId)
    if (isProvider) {
      const tx = this.base.api.tx.discovery.setIpnsId(storageProviderId, ipnsId)
      return this.base.signAndSend(this.base.identities.key.address, tx)
    } else {
      throw new Error('Cannot set AccountInfo, id is not a storage provider')
    }
  }

  /*
   * Clear AccountInfo of an accountId
   */
  async unsetAccountInfo (storageProviderId) {
    var tx = this.base.api.tx.discovery.unsetIpnsId(storageProviderId)
    return this.base.signAndSend(this.base.identities.key.address, tx)
  }
}

module.exports = {
  DiscoveryApi
}
