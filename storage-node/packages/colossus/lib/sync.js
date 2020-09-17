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

const debug = require('debug')('joystream:sync')
const _ = require('lodash')

// The number of concurrent sync sessions allowed. Must be greater than zero.
const MAX_CONCURRENT_SYNC_ITEMS = 20

async function syncContent({ api, storage, contentBeingSynced, contentCompleteSynced }) {
  const knownContentIds = await api.assets.getKnownContentIds()

  // Select ids which we have not yet fully synced
  const needsSync = knownContentIds
    .filter((id) => !contentCompleteSynced.has(id))
    .filter((id) => !contentBeingSynced.has(id))

  // Since we are limiting concurrent content ids being synced, to ensure
  // better distribution of content across storage nodes during a potentially long
  // sync process we don't want all nodes to replicate items in the same order, so
  // we simply shuffle.
  const candidatesForSync = _.shuffle(needsSync)

  // TODO: get the data object
  // make sure the data object was Accepted by the liaison,
  // don't just blindly attempt to fetch them
  while (contentBeingSynced.size < MAX_CONCURRENT_SYNC_ITEMS && candidatesForSync.length) {
    const contentId = candidatesForSync.shift()

    try {
      contentBeingSynced.set(contentId)
      await storage.synchronize(contentId, (err, status) => {
        if (err) {
          contentBeingSynced.delete(contentId)
          debug(`Error Syncing ${err}`)
        } else if (status.synced) {
          contentBeingSynced.delete(contentId)
          contentCompleteSynced.set(contentId)
        }
      })
    } catch (err) {
      // Most likely failed to resolve the content id
      debug(`Failed calling synchronize ${err}`)
      contentBeingSynced.delete(contentId)
    }
  }
}

async function createNewRelationships({ api, contentCompleteSynced }) {
  const roleAddress = api.identities.key.address
  const providerId = api.storageProviderId

  // Create new relationships for synced content if required and
  // compose list of relationship ids to be set to ready.
  return (
    await Promise.all(
      [...contentCompleteSynced.keys()].map(async (contentId) => {
        const { relationship, relationshipId } = await api.assets.getStorageRelationshipAndId(providerId, contentId)

        if (relationship) {
          // maybe prior transaction to set ready failed for some reason..
          if (!relationship.ready) {
            return relationshipId
          }
        } else {
          // create relationship
          debug(`Creating new storage relationship for ${contentId.encode()}`)
          try {
            return await api.assets.createStorageRelationship(roleAddress, providerId, contentId)
          } catch (err) {
            debug(`Error creating new storage relationship ${contentId.encode()}: ${err.stack}`)
          }
        }

        return null
      })
    )
  ).filter((id) => id !== null)
}

async function setRelationshipsReady({ api, relationshipIds }) {
  const roleAddress = api.identities.key.address
  const providerId = api.storageProviderId

  return Promise.all(
    relationshipIds.map(async (relationshipId) => {
      try {
        await api.assets.toggleStorageRelationshipReady(roleAddress, providerId, relationshipId, true)
      } catch (err) {
        debug('Error setting relationship ready')
      }
    })
  )
}

async function syncPeriodic({ api, flags, storage, contentBeingSynced, contentCompleteSynced }) {
  const retry = () => {
    setTimeout(syncPeriodic, flags.syncPeriod, {
      api,
      flags,
      storage,
      contentBeingSynced,
      contentCompleteSynced,
    })
  }

  try {
    debug('Starting sync run...')

    const chainIsSyncing = await api.chainIsSyncing()
    if (chainIsSyncing) {
      debug('Chain is syncing. Postponing sync run.')
      return retry()
    }

    const recommendedBalance = await api.providerHasMinimumBalance(300)
    if (!recommendedBalance) {
      debug('Warning: Provider role account is running low on balance.')
    }

    const sufficientBalance = await api.providerHasMinimumBalance(100)
    if (!sufficientBalance) {
      debug('Provider role account does not have sufficient balance. Postponing sync run!')
      return retry()
    }

    await syncContent({ api, storage, contentBeingSynced, contentCompleteSynced })
    const relationshipIds = await createNewRelationships({ api, contentCompleteSynced })
    await setRelationshipsReady({ api, relationshipIds })

    debug('sync run complete')
  } catch (err) {
    debug(`Error in sync run ${err.stack}`)
  }

  // always try again
  retry()
}

function startSyncing(api, flags, storage) {
  const contentBeingSynced = new Map()
  const contentCompleteSynced = new Map()
  syncPeriodic({ api, flags, storage, contentBeingSynced, contentCompleteSynced })
}

module.exports = {
  startSyncing,
}
