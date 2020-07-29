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
 * Finds assigned worker id corresponding to the application id from the resulting
 * ApplicationIdToWorkerIdMap map in the OpeningFilled event. Expects map to
 * contain at least one entry.
 */
function getWorkerIdFromApplicationIdToWorkerIdMap(filledMap, applicationId) {
  if (filledMap.size === 0) {
    throw new Error('Expected opening to be filled!')
  }

  let ourApplicationIdKey

  for (const key of filledMap.keys()) {
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

/*
 * Add worker related functionality to the substrate API.
 */
class WorkersApi {
  static async create(base) {
    const ret = new WorkersApi()
    ret.base = base
    await ret.init()
    return ret
  }

  // eslint-disable-next-line class-methods-use-this, require-await
  async init() {
    debug('Init')
  }

  /*
   * Check whether the given account and id represent an enrolled storage provider
   */
  async isRoleAccountOfStorageProvider(storageProviderId, roleAccountId) {
    const id = new BN(storageProviderId)
    const roleAccount = this.base.identities.keyring.decodeAddress(roleAccountId)
    const providerAccount = await this.storageProviderRoleAccount(id)
    return providerAccount && providerAccount.eq(roleAccount)
  }

  /*
   * Returns true if the provider id is enrolled
   */
  async isStorageProvider(storageProviderId) {
    const worker = await this.storageWorkerByProviderId(storageProviderId)
    return worker !== null
  }

  /*
   * Returns a provider's role account or null if provider doesn't exist
   */
  async storageProviderRoleAccount(storageProviderId) {
    const worker = await this.storageWorkerByProviderId(storageProviderId)
    return worker ? worker.role_account_id : null
  }

  /*
   * Returns a Worker instance or null if provider does not exist
   */
  async storageWorkerByProviderId(storageProviderId) {
    const id = new BN(storageProviderId)
    const { providers } = await this.getAllProviders()
    return providers[id.toNumber()] || null
  }

  /*
   * Returns the the first found provider id with a role account or null if not found
   */
  async findProviderIdByRoleAccount(roleAccount) {
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
  async getAllProviders() {
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
      let value = await this.base.api.rpc.state.getStorage(this.base.api.query.storageWorkingGroup.workerById.key(id))

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

  async getLeadRoleAccount() {
    const currentLead = await this.base.api.query.storageWorkingGroup.currentLead()
    if (currentLead.isSome) {
      const leadWorkerId = currentLead.unwrap()
      const worker = await this.base.api.query.storageWorkingGroup.workerById(leadWorkerId)
      return worker[0].role_account_id
    }
    return null
  }

  // Helper methods below don't really belong in the colossus runtime api library.
  // They are only used by the dev-init command in the cli to setup a development environment

  /*
   * Add a new storage group opening using the lead account. Returns the
   * new opening id.
   */
  async devAddStorageOpening() {
    const openTx = this.devMakeAddOpeningTx('Worker')
    return this.devSubmitAddOpeningTx(openTx, await this.getLeadRoleAccount())
  }

  /*
   * Add a new storage working group lead opening using sudo account. Returns the
   * new opening id.
   */
  async devAddStorageLeadOpening() {
    const openTx = this.devMakeAddOpeningTx('Leader')
    const sudoTx = this.base.api.tx.sudo.sudo(openTx)
    return this.devSubmitAddOpeningTx(sudoTx, await this.base.identities.getSudoAccount())
  }

  /*
   * Constructs an addOpening tx of openingType
   */
  devMakeAddOpeningTx(openingType) {
    return this.base.api.tx.storageWorkingGroup.addOpening(
      'CurrentBlock',
      {
        application_rationing_policy: {
          max_active_applicants: 1,
        },
        max_review_period_length: 1000,
        // default values for everything else..
      },
      'dev-opening',
      openingType
    )
  }

  /*
   * Submits a tx (expecting it to dispatch storageWorkingGroup.addOpening) and returns
   * the OpeningId from the resulting event.
   */
  async devSubmitAddOpeningTx(tx, senderAccount) {
    return this.base.signAndSendThenGetEventResult(senderAccount, tx, {
      module: 'storageWorkingGroup',
      event: 'OpeningAdded',
      type: 'OpeningId',
      index: 0,
    })
  }

  /*
   * Apply on an opening, returns the application id.
   */
  async devApplyOnOpening(openingId, memberId, memberAccount, roleAccount) {
    const applyTx = this.base.api.tx.storageWorkingGroup.applyOnOpening(
      memberId,
      openingId,
      roleAccount,
      null,
      null,
      `colossus-${memberId}`
    )

    return this.base.signAndSendThenGetEventResult(memberAccount, applyTx, {
      module: 'storageWorkingGroup',
      event: 'AppliedOnOpening',
      type: 'ApplicationId',
      index: 1,
    })
  }

  /*
   * Move lead opening to review state using sudo account
   */
  async devBeginLeadOpeningReview(openingId) {
    const beginReviewTx = this.devMakeBeginOpeningReviewTx(openingId)
    const sudoTx = this.base.api.tx.sudo.sudo(beginReviewTx)
    return this.base.signAndSend(await this.base.identities.getSudoAccount(), sudoTx)
  }

  /*
   * Move a storage opening to review state using lead account
   */
  async devBeginStorageOpeningReview(openingId) {
    const beginReviewTx = this.devMakeBeginOpeningReviewTx(openingId)
    return this.base.signAndSend(await this.getLeadRoleAccount(), beginReviewTx)
  }

  /*
   * Constructs a beingApplicantReview tx for openingId, which puts an opening into the review state
   */
  devMakeBeginOpeningReviewTx(openingId) {
    return this.base.api.tx.storageWorkingGroup.beginApplicantReview(openingId)
  }

  /*
   * Fill a lead opening, return the assigned worker id, using the sudo account
   */
  async devFillLeadOpening(openingId, applicationId) {
    const fillTx = this.devMakeFillOpeningTx(openingId, applicationId)
    const sudoTx = this.base.api.tx.sudo.sudo(fillTx)
    const filled = await this.devSubmitFillOpeningTx(await this.base.identities.getSudoAccount(), sudoTx)
    return getWorkerIdFromApplicationIdToWorkerIdMap(filled, applicationId)
  }

  /*
   * Fill a storage opening, return the assigned worker id, using the lead account
   */
  async devFillStorageOpening(openingId, applicationId) {
    const fillTx = this.devMakeFillOpeningTx(openingId, applicationId)
    const filled = await this.devSubmitFillOpeningTx(await this.getLeadRoleAccount(), fillTx)
    return getWorkerIdFromApplicationIdToWorkerIdMap(filled, applicationId)
  }

  /*
   * Constructs a FillOpening transaction
   */
  devMakeFillOpeningTx(openingId, applicationId) {
    return this.base.api.tx.storageWorkingGroup.fillOpening(openingId, [applicationId], null)
  }

  /*
   * Dispatches a fill opening tx and returns a map of the application id to their new assigned worker ids.
   */
  async devSubmitFillOpeningTx(senderAccount, tx) {
    return this.base.signAndSendThenGetEventResult(senderAccount, tx, {
      module: 'storageWorkingGroup',
      event: 'OpeningFilled',
      type: 'ApplicationIdToWorkerIdMap',
      index: 1,
    })
  }
}

module.exports = {
  WorkersApi,
}
