'use strict'

const debug = require('debug')('joystream:runtime:system')

/*
 * Add system functionality to the substrate API.
 */
class SystemApi {
  static async create(base) {
    const ret = new SystemApi()
    ret.base = base
    await SystemApi.init()
    return ret
  }

  static async init() {
    debug('Init')
  }

  /*
   * Check the running chain for the development setup.
   */
  async isDevelopmentChain() {
    const developmentChainName = 'Development'
    const runningChainName = await this.base.api.rpc.system.chain()

    return runningChainName.toString() === developmentChainName
  }
}

module.exports = {
  SystemApi,
}
