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

const debug = require('debug')('joystream:substrate:base');

const { registerJoystreamTypes } = require('joystream/substrate/types');
const { ApiPromise } = require('@polkadot/api');

class SubstrateApi
{
  static async create()
  {
    const ret = new SubstrateApi();
    await ret.init();
    return ret;
  }

  async init()
  {
    debug('Init');

    // Register joystream types
    registerJoystreamTypes();

    // Create the API instrance
    this.api = await ApiPromise.create();
  }

  async waitForEvent(module, name)
  {
    return new Promise((resolve, reject) => {
      this.api.query.system.events((events) => {
        debug(`Number of events: ${events.length}`);
        events.forEach((record) => {
          // extract the phase, event and the event types
          const { event, phase } = record;
          const types = event.typeDef;

          // show what we are busy with
          debug(`\t${event.section}:${event.method}:: (phase=${phase.toString()})`);
          debug(`\t\t${event.meta.documentation.toString()}`);

          // Skip events we're not interested in.
          if (event.section != module || event.method != name) {
            // Nothing to do here.
            return;
          }

          // loop through each of the parameters, displaying the type and data
          const payload = {};
          event.data.forEach((data, index) => {
            debug(`\t\t\t${types[index].type}: ${data.toString()}`);
            payload[types[index].type] = data;
          });

          const full_name = `${module}.${name}`;
          resolve([full_name, payload]);
        });
      });
    });
  }
}

module.exports = {
  SubstrateApi: SubstrateApi,
}
