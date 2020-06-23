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
    const worker = await this.storageWorkerByProviderId(storageProviderId)
    return worker && worker.role_account.eq(roleAccountId)
  }

  async isStorageProvider (storageProviderId) {
    const worker = await this.storageWorkerByProviderId(storageProviderId)
    return worker !== null
  }

  async storageWorkerByProviderId (storageProviderId) {
    storageProviderId = new BN(storageProviderId)
    const nextWorkerId = await this.base.api.query.storageWorkingGroup.nextWorkerId()

    if (storageProviderId.gte(nextWorkerId)) {
      return null
    }

    const workerEntry = await this.base.api.query.storageWorkingGroup.workerById(storageProviderId)
    return workerEntry[0]
  }

  async storageProviderRoleAccount (storageProviderId) {
    const worker = await this.storageWorkerByProviderId(storageProviderId)
    if (worker == null) {
      throw new Error('Storage Provider Does Not Exist')
    } else {
      return worker.role_account
    }
  }

  async getAllProviders () {
    const workerEntries = await this.base.api.query.storageWorkingGroup.workerById()
    return workerEntries[0] // keys
  }
}

module.exports = {
  WorkersApi
}
