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

const debug = require('debug')('joystream:runtime:roles');

const { Null, u64 } = require('@polkadot/types');

const { _ } = require('lodash');

/*
 * Add worker related functionality to the substrate API.
 */
class WorkersApi
{
  static async create(base)
  {
    const ret = new WorkersApi();
    ret.base = base;
    await ret.init();
    return ret;
  }

  async init()
  {
    debug('Init');
  }


  /*
   * Check whether the given account and id is an active storage provider
   */
  async checkForRole(roleAccountId, storageProviderId)
  {
    const worker = await this.base.api.query.storageWorkingGroup.workerById(storageProviderId);

    // FIXME: get single linked entry

    if (_.isEqual(worker.raw, new Null())) {
      return false
    }

    return worker.raw.role_account == roleAccountId
  }

}

module.exports = {
  WorkersApi: WorkersApi
}
