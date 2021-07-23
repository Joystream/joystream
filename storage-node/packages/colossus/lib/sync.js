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
const { ContentId } = require('@joystream/types/storage')
const { nextTick } = require('@joystream/storage-utils/sleep')

// The number of concurrent items to attemp to fetch. Must be greater than zero.
const MAX_CONCURRENT_SYNC_ITEMS = 30

async function syncContent({ api, storage, contentBeingSynced, contentCompleteSynced }) {
  if (contentBeingSynced.size === MAX_CONCURRENT_SYNC_ITEMS) return

  const knownEncodedContentIds = (await api.assets.getAcceptedContentIds()).map((id) => id.encode())

  // Select ids which we have not yet fully synced
  const needsSync = knownEncodedContentIds
    .filter((id) => !contentCompleteSynced.has(id))
    .filter((id) => !contentBeingSynced.has(id))

  // Since we are limiting concurrent content ids being synced, to ensure
  // better distribution of content across storage nodes during a potentially long
  // sync process we don't want all nodes to replicate items in the same order, so
  // we simply shuffle.
  const candidatesForSync = _.shuffle(needsSync)

  debug(`${candidatesForSync.length} items remaining to process`)
  let syncedItemsCount = 0

  while (contentBeingSynced.size < MAX_CONCURRENT_SYNC_ITEMS && candidatesForSync.length) {
    const id = candidatesForSync.shift()

    // Log progress
    if (syncedItemsCount % 100 === 0) {
      debug(`${candidatesForSync.length} items remaining to process`)
    }

    try {
      contentBeingSynced.set(id)
      const contentId = ContentId.decode(api.api.registry, id)
      await storage.synchronize(contentId, (err, status) => {
        if (err) {
          contentBeingSynced.delete(id)
          debug(`Error Syncing ${err}`)
        } else if (status.synced) {
          syncedItemsCount++
          contentBeingSynced.delete(id)
          contentCompleteSynced.set(id)
        }
      })

      // Allow short time for checking if content is already stored locally.
      // So we can handle more new items per run.
      await nextTick()
    } catch (err) {
      // Most likely failed to resolve the content id
      debug(`Failed calling synchronize ${err}`)
      contentBeingSynced.delete(id)
    }
  }

  debug(`Items processed in this sync run ${syncedItemsCount}`)
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
    const chainIsSyncing = await api.chainIsSyncing()

    if (chainIsSyncing) {
      debug('Chain is syncing. Postponing sync.')
    } else {
      await syncContent({ api, storage, contentBeingSynced, contentCompleteSynced })
    }
  } catch (err) {
    debug(`Error during sync ${err.stack}`)
  }

  // always try again
  retry()
}

function startSyncing(api, flags, storage) {
  // ids of content currently being synced
  const contentBeingSynced = new Map()
  // ids of content that completed sync and may require creating a new relationship
  const contentCompleteSynced = new Map()

  syncPeriodic({ api, flags, storage, contentBeingSynced, contentCompleteSynced })
}

module.exports = {
  startSyncing,
}
