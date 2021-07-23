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

// Time to wait between sync runs. The lower the better chance to consume all
// available sync sessions allowed.
const INTERVAL_BETWEEN_SYNC_RUNS_MS = 3000
// Time between refreshing content ids from chain
const CONTENT_ID_REFRESH_INTERVAL_MS = 60000
// Minimum concurrency. Must be greater than zero.
const MIN_CONCURRENT_SYNC_ITEMS = 5

async function syncRun({ api, storage, contentBeingSynced, contentCompletedSync, flags, contentIds }) {
  // The number of concurrent items to attemp to fetch.
  const MAX_CONCURRENT_SYNC_ITEMS = Math.max(MIN_CONCURRENT_SYNC_ITEMS, flags.maxSync)

  // Select ids which may need to be synced
  const idsNotSynced = contentIds
    .filter((id) => !contentCompletedSync.has(id))
    .filter((id) => !contentBeingSynced.has(id))

  // We are limiting how many content ids can be synced concurrently, so to ensure
  // better distribution of content across storage nodes during a potentially long
  // sync process we don't want all nodes to replicate items in the same order, so
  // we simply shuffle.
  const idsToSync = _.shuffle(idsNotSynced)

  while (contentBeingSynced.size < MAX_CONCURRENT_SYNC_ITEMS && idsToSync.length) {
    const id = idsToSync.shift()

    try {
      contentBeingSynced.set(id)
      const contentId = ContentId.decode(api.api.registry, id)
      await storage.synchronize(contentId, (err, status) => {
        if (err) {
          contentBeingSynced.delete(id)
          debug(`Error Syncing ${err}`)
        } else if (status.synced) {
          contentBeingSynced.delete(id)
          contentCompletedSync.set(id)
        }
      })
    } catch (err) {
      // Most likely failed to resolve the content id
      debug(`Failed calling synchronize ${err}`)
      contentBeingSynced.delete(id)
    }

    // Allow callbacks to call to storage.synchronize() to be invoked during this sync run
    // This will happen if content is found to be local and will speed overall sync process.
    await nextTick()
  }
}

async function syncRunner({ api, flags, storage, contentBeingSynced, contentCompletedSync, contentIds }) {
  const retry = () => {
    setTimeout(syncRunner, INTERVAL_BETWEEN_SYNC_RUNS_MS, {
      api,
      flags,
      storage,
      contentBeingSynced,
      contentCompletedSync,
      contentIds,
    })
  }

  try {
    if (await api.chainIsSyncing()) {
      debug('Chain is syncing. Postponing sync.')
    } else {
      const now = Date.now()

      // Do not fetch content ids on every singe run as it is expensive operation
      if (!contentIds || now - contentIds.fetchedAt > CONTENT_ID_REFRESH_INTERVAL_MS) {
        // re-fetch content ids
        contentIds = (await api.assets.getAcceptedContentIds()).map((id) => id.encode())
        contentIds.fetchedAt = Date.now()

        debug(`======== sync status ==========`)
        debug(`objects syncing : ${contentBeingSynced.size}`)
        debug(`objects local   : ${contentCompletedSync.size}`)
        debug(`objects known   : ${contentIds.length}`)
      }

      await syncRun({
        api,
        storage,
        contentBeingSynced,
        contentCompletedSync,
        flags,
        contentIds,
      })
    }
  } catch (err) {
    debug(`Error during sync ${err.stack}`)
  }

  // schedule next sync run
  retry()
}

function startSyncing(api, flags, storage) {
  // ids of content currently being synced
  const contentBeingSynced = new Map()
  // ids of content that completed sync
  const contentCompletedSync = new Map()

  syncRunner({ api, flags, storage, contentBeingSynced, contentCompletedSync })
}

module.exports = {
  startSyncing,
}
