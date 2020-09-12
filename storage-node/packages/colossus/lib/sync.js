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

const MAX_CONCURRENT_SYNC_ITEMS = 15
const contentBeingSynced = new Map()

async function syncCallback(api, storage) {
  const knownContentIds = await api.assets.getKnownContentIds()
  const roleAddress = api.identities.key.address
  const providerId = api.storageProviderId

  // Iterate over all objects, and start syncing if required.
  // compile list of already syncedIds (as reported by storage
  // subsytem). The only async part here is resolving content id
  // by storage to ipfs cid, maybe we can resolve them locally
  // and cache result to simplify async code below and reduce
  // queries

  // Since we are limiting concurrent content ids being synced, to ensure
  // better distribution of content across storage nodes during a potentially long
  // sync process we don't want all nodes to replicate items in the same order, so
  // we simply shuffle ids around.
  const shuffledIds = _.shuffle(knownContentIds)

  const syncedIds = (
    await Promise.all(
      shuffledIds.map(async (contentId) => {
        // TODO: get the data object
        // make sure the data object was Accepted by the liaison,
        // don't just blindly attempt to fetch them

        try {
          const { synced, syncing } = await storage.syncStatus(contentId)

          if (synced) {
            return contentId
          }

          if (!synced && !syncing && contentBeingSynced.size < MAX_CONCURRENT_SYNC_ITEMS) {
            try {
              contentBeingSynced.set(contentId, true)

              await storage.synchronize(contentId, () => {
                contentBeingSynced.delete(contentId)
              })
            } catch (err) {
              contentBeingSynced.delete(contentId)
            }
          }
        } catch (err) {
          //
        }

        return null
      })
    )
  ).filter((id) => id !== null)

  // Create new relationships for synced content if required and
  // compose list of relationship ids to be set to ready.
  const relationshipIds = (
    await Promise.all(
      syncedIds.map(async (contentId) => {
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

  // Set relationships to ready state
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

async function syncPeriodic(api, flags, storage) {
  try {
    debug('Starting sync run...')

    const chainIsSyncing = await api.chainIsSyncing()
    if (chainIsSyncing) {
      debug('Chain is syncing. Postponing sync run.')
      return setTimeout(syncPeriodic, flags.syncPeriod, api, flags, storage)
    }

    const recommendedBalance = await api.providerHasMinimumBalance(300)
    if (!recommendedBalance) {
      debug('Warning: Provider role account is running low on balance.')
    }

    const sufficientBalance = await api.providerHasMinimumBalance(100)
    if (!sufficientBalance) {
      debug('Provider role account does not have sufficient balance. Postponing sync run!')
      return setTimeout(syncPeriodic, flags.syncPeriod, api, flags, storage)
    }

    await syncCallback(api, storage)
    debug('sync run complete')
  } catch (err) {
    debug(`Error in syncPeriodic ${err.stack}`)
  }
  // always try again
  setTimeout(syncPeriodic, flags.syncPeriod, api, flags, storage)
}

function startSyncing(api, flags, storage) {
  syncPeriodic(api, flags, storage)
}

module.exports = {
  startSyncing,
}
