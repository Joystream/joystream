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

/*
 * Initialize substrate API and keyring.
 */
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

    // Keep track locally of account nonces.
    this.nonces = {};
  }

  /*
   * Wait for an event. Filters out any events that don't match the module and
   * event name.
   *
   * The result of the Promise is an array containing first the full event
   * name, and then the event fields as an object.
   */
  async waitForEvent(module, name)
  {
    return this.waitForEvents([[module, name]]);
  }

  /*
   * Same as waitForEvent, but filter on multiple events. The parameter is an
   * array of arrays containing module and name. Calling waitForEvent is
   * identical to calling this with [[module, name]].
   *
   * Returns the first matched event *only*.
   */
  _matchingEvents(subscribed, events)
  {
    debug(`Number of events: ${events.length}; subscribed to ${subscribed}`);

    const filtered = events.filter((record) => {
      const { event, phase } = record;

      // Show what we are busy with
      debug(`\t${event.section}:${event.method}:: (phase=${phase.toString()})`);
      debug(`\t\t${event.meta.documentation.toString()}`);

      // Skip events we're not interested in.
      const matching = subscribed.filter((value) => {
        return event.section == value[0] && event.method == value[1];
      });
      return matching.length > 0;
    });
    debug(`Filtered: ${filtered.length}`);

    const mapped = filtered.map((record) => {
      const { event } = record;
      const types = event.typeDef;

      // Loop through each of the parameters, displaying the type and data
      const payload = {};
      event.data.forEach((data, index) => {
        debug(`\t\t\t${types[index].type}: ${data.toString()}`);
        payload[types[index].type] = data;
      });

      const full_name = `${event.section}.${event.method}`;
      return [full_name, payload];
    });
    debug('Mapped', mapped);

    return mapped;
  }

  async waitForEvents(subscribed)
  {
    return new Promise((resolve, reject) => {
      this.api.query.system.events((events) => {
        const matches = this._matchingEvents(subscribed, events);
        if (matches && matches.length) {
          resolve(matches);
        }
      });
    });
  }

  /*
   * Nonce-aware signAndSend(). Also allows you to use the accountId instead
   * of the key, making calls a little simpler.
   *
   * If the subscribed events are given, and a callback as well, then the
   * callback is invoked with matching events.
   */
  async signAndSendWithRetry(accountId, tx, attempts, subscribed, callback)
  {
    // Default to 3
    attempts = attempts || 3;
    var attempts_left = attempts;

    // Prepare key
    const from_key = this.keyring.getPair(accountId);
    if (from_key.isLocked()) {
      throw new Error('Must unlock key before using it to sign!');
    }

    // Try to get the nonce locally.
    var nonce = this.nonces[accountId];

    // If the nonce isn't available, get it from chain.
    if (!nonce) {
      nonce = await this.api.query.system.accountNonce(accountId);
      debug(`Got nonce for ${accountId} from chain: ${nonce}`);
    }

    // Increment and store the nonce.
    this.nonces[accountId] = nonce.addn(1);

    // Executor
    const executor = (resolve, reject) => {
      debug(`TX attempt ${attempts - attempts_left + 1}/${attempts} with nonce: ${nonce}`);
      tx.sign(from_key, { nonce })
        .send(({ events = [], status }) => {
          // Whatever events we get, process them if there's someone interested.
          if (subscribed && callback) {
            const matched = this._matchingEvents(subscribed, events);
            debug('Matching events:', matched);
            if (matched.length) {
              callback(matched);
            }
          }

          if (status.isFinalized) {
            debug('TX finalized.');
            resolve(status.raw);
          }
        })
        .catch((err) => {
          if (err && err.toString().indexOf(' 1014:') < 0) { // Bad nonce
            debug('TX error', err);
            reject(err);
            return;
          }

          if (--attempts_left <= 0) {
            const msg = `Giving up after ${attempts} attempts.`;
            debug(msg);
            reject(new Error(msg));
            return;
          }

          debug('TX nonce was invalid, incrementing.');
          nonce.iaddn(1);
          this.nonces[accountId] = nonce;

          // Try again.
          setImmediate(() => executor(resolve, reject));
        })
    };

    return new Promise(executor);
  }
}

module.exports = {
  SubstrateApi: SubstrateApi,
}
