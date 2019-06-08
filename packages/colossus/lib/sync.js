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

'use strict';

const debug = require('debug')('joystream:sync');

async function sync_callback(api, config, storage)
{
  debug('Trying to sync...');

  // The first step is to gather all data objects from chain.
  // TODO: in future, limit to a configured tranche
  // FIXME this isn't actually on chain yet, so we'll fake it.
  const sync_objects = (config.sync || {}).objects || [];

  // Iterate over all sync objects, and ensure they're synced. We don't
  // need to explicitly contact the liaison; that's what the backend does for
  // us.
  sync_objects.forEach(async (content_id) => {
    try {
      await storage.synchronize(content_id);
    } catch (err) {
      debug(`Error synchronizing ${content_id}: ${err.stack}`);
    }
  });
}


async function sync_periodic(api, config, storage)
{
  await sync_callback(api, config, storage);
  setTimeout(sync_periodic, config.get('syncPeriod'), api, config, storage);
}


function start_syncing(api, config, storage)
{
  setTimeout(sync_periodic, config.get('syncPeriod'), api, config, storage);
}

module.exports = {
  start_syncing: start_syncing,
}
