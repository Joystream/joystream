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
const { Worker } = require('@joystream/types/working-group')

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
   * Check whether the given account and id represent an enrolled storage provider
   */
  async isRoleAccountOfStorageProvider (storageProviderId, roleAccountId) {
    const id = new BN(storageProviderId)
    const roleAccount = this.base.identities.keyring.decodeAddress(roleAccountId)
    const providerAccount = await this.storageProviderRoleAccount(id)
    return providerAccount && providerAccount.eq(roleAccount)
  }

  /*
   * Returns true if the provider id is enrolled
   */
  async isStorageProvider (storageProviderId) {
    const worker = await this.storageWorkerByProviderId(storageProviderId)
    return worker !== null
  }

  /*
   * Returns a provider's role account or null if provider doesn't exist
   */
  async storageProviderRoleAccount (storageProviderId) {
    const worker = await this.storageWorkerByProviderId(storageProviderId)
    return worker ? worker.role_account_id : null
  }

  /*
   * Returns a Worker instance or null if provider does not exist
   */
  async storageWorkerByProviderId (storageProviderId) {
    const id = new BN(storageProviderId)
    const { providers } = await this.getAllProviders()
    return providers[id.toNumber()] || null
  }

  /*
   * Returns the the first found provider id with a role account or null if not found
   */
  async findProviderIdByRoleAccount (roleAccount) {
    const { ids, providers } = await this.getAllProviders()

    for (let i = 0; i < ids.length; i++) {
      const id = ids[i]
      if (providers[id].role_account_id.eq(roleAccount)) {
        return id
      }
    }

    return null
  }

  /*
   * Returns the set of ids and Worker instances of providers enrolled on the network
   */
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

  // Helper methods below don't really belong in the colossus runtime api library.
  // They are only used by the dev-init command in the cli to setup a development environment

  /*
   * Add a new storage group opening using the lead account. Returns the
   * new opening id.
   */
  async dev_addStorageOpening(leadAccount) {
    const openTx = this.dev_makeAddOpeningTx('Worker')
    return this.dev_submitAddOpeningTx(openTx, leadAccount)
  }

  /*
   * Add a new storage working group lead opening using sudo account. Returns the
   * new opening id.
   */
  async dev_addStorageLeadOpening(sudoAccount) {
    const openTx = this.dev_makeAddOpeningTx('Leader')
    const sudoTx = this.base.api.tx.sudo.sudo(openTx)
    return this.dev_submitAddOpeningTx(sudoTx, sudoAccount)
  }

  /*
   * Constructs an addOpening tx of openingType
   */
  dev_makeAddOpeningTx(openingType) {
    const openTx = this.base.api.tx.storageWorkingGroup.addOpening(
      'CurrentBlock',
      {
        application_rationing_policy: {
          'max_active_applicants': 1
        },
        max_review_period_length: 1000
        // default values for everything else..
      },
      'dev-opening',
      openingType
    )

    return openTx
  }

  /*
   * Submits a tx (expecting it to dispatch storageWorkingGroup.addOpening) and returns
   * the OpeningId from the resulting event.
   */
  async dev_submitAddOpeningTx(tx, senderAccount) {
    const openingId = await this.base.signAndSendThenGetEventResult(senderAccount, tx, {
      eventModule: 'storageWorkingGroup',
      eventName: 'OpeningAdded',
      eventProperty: 'OpeningId'
    })

    return openingId
  }

  /*
   * Apply on an opening, returns the application id.
   */
  async dev_applyOnOpening(openingId, memberId, memberAccount, roleAccount) {
    const applyTx = this.base.api.tx.storageWorkingGroup.applyOnOpening(
      memberId, openingId, roleAccount, null, null, `colossus-${memberId}`
    )
    const applicationId = await this.base.signAndSendThenGetEventResult(memberAccount, applyTx, {
      eventModule: 'storageWorkingGroup',
      eventName: 'AppliedOnOpening',
      eventProperty: 'ApplicationId'
    })

    return applicationId
  }

  /*
   * Move lead opening to review state using sudo account
   */
  async dev_beginLeadOpeningReview(openingId, sudoAccount) {
    const beginReviewTx = this.dev_makeBeginOpeningReviewTx(openingId)
    const sudoTx = this.base.api.tx.sudo.sudo(beginReviewTx)
    return this.base.signAndSend(sudoAccount, sudoTx)
  }

  /*
   * Move a storage opening to review state using lead account
   */
  async dev_beginStorageOpeningReview(openingId, leadAccount) {
    const beginReviewTx = this.dev_makeBeginOpeningReviewTx(openingId)
    return this.base.signAndSend(leadAccount, beginReviewTx)
  }

  /*
   * Constructs a beingApplicantReview tx for openingId, which puts an opening into the review state
   */
  dev_makeBeginOpeningReviewTx(openingId) {
    return this.base.api.tx.storageWorkingGroup.beginApplicantReview(openingId)
  }

  /*
   * Fill a lead opening, return the assigned worker id, using the sudo account
   */
  async dev_fillLeadOpening(openingId, applicationId, sudoAccount) {
    const fillTx = this.dev_makeFillOpeningTx(openingId, applicationId)
    const sudoTx = this.base.api.tx.sudo.sudo(fillTx)
    const filled = await this.dev_submitFillOpeningTx(sudoAccount, sudoTx)
    return getWorkerIdFromApplicationIdToWorkerIdMap(filled, applicationId)
  }

  /*
   * Fill a storage opening, return the assigned worker id, using the lead account
   */
  async dev_fillStorageOpening(openingId, applicationId, leadAccount) {
    const fillTx = this.dev_makeFillOpeningTx(openingId, applicationId)
    const filled = await this.dev_submitFillOpeningTx(leadAccount, fillTx)
    return getWorkerIdFromApplicationIdToWorkerIdMap(filled, applicationId)
  }

  /*
   * Constructs a FillOpening transaction
   */
  dev_makeFillOpeningTx(openingId, applicationId) {
    const fillTx = this.base.api.tx.storageWorkingGroup.fillOpening(openingId, [applicationId], null)
    return fillTx
  }

  /*
   * Dispatches a fill opening tx and returns a map of the application id to their new assigned worker ids.
   */
  async dev_submitFillOpeningTx(senderAccount, tx) {
    const filledMap = await this.base.signAndSendThenGetEventResult(senderAccount, tx, {
      eventModule: 'storageWorkingGroup',
      eventName: 'OpeningFilled',
      eventProperty: 'ApplicationIdToWorkerIdMap'
    })

    return filledMap
  }
}

/*
 * Finds assigned worker id corresponding to the application id from the resulting
 * ApplicationIdToWorkerIdMap map in the OpeningFilled event. Expects map to
 * contain at least one entry.
 */
function getWorkerIdFromApplicationIdToWorkerIdMap (filledMap, applicationId) {
  if (filledMap.size === 0) {
    throw new Error('Expected opening to be filled!')
  }

  let ourApplicationIdKey

  for (let key of filledMap.keys()) {
    if (key.eq(applicationId)) {
      ourApplicationIdKey = key
      break
    }
  }

  if (!ourApplicationIdKey) {
    throw new Error('Expected application id to have been filled!')
  }

  const workerId = filledMap.get(ourApplicationIdKey)

  return workerId
}

module.exports = {
  WorkersApi
}
