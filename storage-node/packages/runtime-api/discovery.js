'use strict'

const debug = require('debug')('joystream:runtime:discovery')

/*
 * Add discovery related functionality to the substrate API.
 */
class DiscoveryApi {
  static async create(base) {
    const ret = new DiscoveryApi()
    ret.base = base
    await DiscoveryApi.init()
    return ret
  }

  static async init() {
    debug('Init')
  }

  /*
   * Get Bootstrap endpoints
   */
  async getBootstrapEndpoints() {
    return this.base.api.query.discovery.bootstrapEndpoints()
  }

  /*
   * Set Bootstrap endpoints, requires the sudo account to be provided and unlocked
   */
  async setBootstrapEndpoints(sudoAccount, endpoints) {
    const tx = this.base.api.tx.discovery.setBootstrapEndpoints(endpoints)
    // make sudo call
    return this.base.signAndSend(sudoAccount, this.base.api.tx.sudo.sudo(tx))
  }

  /*
   * Get AccountInfo of a storage provider
   */
  async getAccountInfo(storageProviderId) {
    const info = await this.base.api.query.discovery.accountInfoByStorageProviderId(storageProviderId)
    // Not an Option so we use default value check to know if info was found
    return info.expires_at.eq(0) ? null : info
  }

  /*
   * Set AccountInfo of our storage provider
   */
  async setAccountInfo(ipnsId) {
    const roleAccountId = this.base.identities.key.address
    const storageProviderId = this.base.storageProviderId
    const isProvider = await this.base.workers.isStorageProvider(storageProviderId)
    if (isProvider) {
      const tx = this.base.api.tx.discovery.setIpnsId(storageProviderId, ipnsId)
      return this.base.signAndSend(roleAccountId, tx)
    }
    throw new Error('Cannot set AccountInfo, id is not a storage provider')
  }

  /*
   * Clear AccountInfo of our storage provider
   */
  async unsetAccountInfo() {
    const roleAccountId = this.base.identities.key.address
    const storageProviderId = this.base.storageProviderId
    const tx = this.base.api.tx.discovery.unsetIpnsId(storageProviderId)
    return this.base.signAndSend(roleAccountId, tx)
  }
}

module.exports = {
  DiscoveryApi,
}
