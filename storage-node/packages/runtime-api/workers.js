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


  // eslint-disable-next-line class-methods-use-this, require-await
  async init () {
    debug('Init')
  }

  /*
   * Check whether the given account and id represent an active storage provider
   */
  async isRoleAccountOfStorageProvider (storageProviderId, roleAccountId) {
    const id = new BN(storageProviderId)
    const roleAccount = this.base.identities.keyring.decodeAddress(roleAccountId)
    const providerAccount = await this.storageProviderRoleAccount(id)
    return providerAccount && providerAccount.eq(roleAccount)
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
    const id = new BN(storageProviderId)
    const { providers } = await this.getAllProviders()
    return providers[id.toNumber()] || null
  }

  async findProviderIdByRoleAccount (roleAccount) {
    const { ids, providers } = await this.getAllProviders()

    for (let i = 0; i < ids.length; i++) {
      const id = ids[i]
      if (providers[id].role_account.eq(roleAccount)) {
        return id
      }
    }

    return null
  }

  async getAllProviders () {
    // const workerEntries = await this.base.api.query.storageWorkingGroup.workerById()
    // can't rely on .isEmpty or isNone property to detect empty map
    // return workerEntries.isNone ? [] : workerEntries[0]
    // return workerEntries.isEmpty ? [] : workerEntries[0]
    // So we iterate over possible ids which may or may not exist, by reading directly
    // from storage value
    const nextWorkerId = (await this.base.api.query.storageWorkingGroup.nextWorkerId()).toNumber()
    const ids = []
    const providers = {}
    for (let id = 0; id < nextWorkerId; id++) {
      // We get back an Option. Will be None if value doesn't exist
      // eslint-disable-next-line no-await-in-loop
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

  // Helper methods below don't really belong in the colossus api, they are here
  // mainly to be used by the dev-init command in the cli to setup a development environment

  async dev_setLead(sudo, memberId, roleAccount) {
    const setLeadTx = this.base.api.tx.storageWorkingGroup.setLead(memberId, roleAccount)
    // make sudo call
    return this.base.signAndSend(
      sudo,
      this.base.api.tx.sudo.sudo(setLeadTx)
    )
  }

  async dev_addWorkerOpening(leadAccount) {
    const openTx = this.base.api.tx.storageWorkingGroup.addWorkerOpening('CurrentBlock', {
      application_rationing_policy: {
        'max_active_applicants': 1
      },
      max_review_period_length: 1000
      // default values for everything else..
    }, 'dev-opening')

    const openingId = await this.base.signAndSendThenGetEventResult(leadAccount, openTx, {
      eventModule: 'storageWorkingGroup',
      eventName: 'WorkerOpeningAdded',
      eventProperty: 'WorkerOpeningId'
    })

    return openingId
  }

  async dev_applyOnOpening(openingId, memberId, memberAccount, roleAccount) {
    const applyTx = this.base.api.tx.storageWorkingGroup.applyOnWorkerOpening(
      memberId, openingId, roleAccount, null, null, `colossus-${memberId}`
    )
    const applicationId = await this.base.signAndSendThenGetEventResult(memberAccount, applyTx, {
      eventModule: 'storageWorkingGroup',
      eventName: 'AppliedOnWorkerOpening',
      eventProperty: 'WorkerApplicationId'
    })

    return applicationId
  }

  async dev_beginOpeningReview(openingId, leadAccount) {
    const reviewTx = this.base.api.tx.storageWorkingGroup.beginWorkerApplicantReview(openingId)
    return this.base.signAndSend(leadAccount, reviewTx)
  }

  async dev_fillOpeningWithSingleApplication(openingId, leadAccount, applicationId) {
    const fillTx = this.base.api.tx.storageWorkingGroup.fillWorkerOpening(openingId, [applicationId], null)

    const filledMap = await this.base.signAndSendThenGetEventResult(leadAccount, fillTx, {
      eventModule: 'storageWorkingGroup',
      eventName: 'WorkerOpeningFilled',
      eventProperty: 'WorkerApplicationIdToWorkerIdMap'
    })

    return filledMap
  }
}

module.exports = {
  WorkersApi
}
