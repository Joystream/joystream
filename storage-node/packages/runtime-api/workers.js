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

const debug = require('debug')('joystream:runtime:roles')
const BN = require('bn.js')
// const { createType } = require('@polkadot/types')
const { Worker } = require('@joystream/types/lib/working-group')

/*
 * Add worker related functionality to the substrate API.
 */
class WorkersApi {
  static async create (base) {
    const ret = new WorkersApi()
    ret.base = base
    await ret.init()
    return ret
  }

  async init () {
    debug('Init')
  }

  /*
   * Check whether the given account and id represent an active storage provider
   */
  async isRoleAccountOfStorageProvider (storageProviderId, roleAccountId) {
    storageProviderId = new BN(storageProviderId)
    roleAccountId = this.base.identities.keyring.decodeAddress(roleAccountId)
    const account = await this.storageProviderRoleAccount(storageProviderId)
    return account && account.eq(roleAccountId)
  }

  async isStorageProvider (storageProviderId) {
    const worker = await this.storageWorkerByProviderId(storageProviderId)
    return worker !== null
  }

  // Returns a provider's role account or null if provider doesn't exist
  async storageProviderRoleAccount (storageProviderId) {
    const worker = await this.storageWorkerByProviderId(storageProviderId)
    return worker ? worker.role_account : null
  }

  // Returns a Worker instance or null if provider does not exist
  async storageWorkerByProviderId (storageProviderId) {
    storageProviderId = new BN(storageProviderId)
    const { providers } = await this.getAllProviders()
    return providers[storageProviderId.toNumber()] || null
  }

  async getAllProviders () {
    // const workerEntries = await this.base.api.query.storageWorkingGroup.workerById()
    // can't rely on .isEmpty or isNone property to detect empty map
    // return workerEntries.isNone ? [] : workerEntries[0]
    // return workerEntries.isEmpty ? [] : workerEntries[0]
    // So we iterate over possible ids which may or may not exist, by reading directly
    // from storage value
    const nextWorkerId = (await this.base.api.query.storageWorkingGroup.nextWorkerId()).toNumber()
    let ids = []
    let providers = {}
    for (let id = 0; id < nextWorkerId; id++) {
      // We get back an Option. Will be None if value doesn't exist
      let value = await this.base.api.rpc.state.getStorage(
        this.base.api.query.storageWorkingGroup.workerById.key(id)
      )

      if (!value.isNone) {
        // no need to read from storage again!
        // const worker = (await this.base.api.query.storageWorkingGroup.workerById(id))[0]
        value = value.unwrap()
        // construct the Worker type from raw data
        // const worker = createType('WorkerOf', value)
        // const worker = new Worker(value)
        ids.push(id)
        providers[id] = new Worker(value)
      }
    }

    return { ids, providers }
  }
}

module.exports = {
  WorkersApi
}
