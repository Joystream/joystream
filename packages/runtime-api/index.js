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

const debug = require('debug')('joystream:runtime:base');

const { registerJoystreamTypes } = require('@joystream/types');
const { ApiPromise } = require('@polkadot/api');

const { IdentitiesApi } = require('@joystream/runtime-api/identities');
const { BalancesApi } = require('@joystream/runtime-api/balances');
const { RolesApi } = require('@joystream/runtime-api/roles');
const { AssetsApi } = require('@joystream/runtime-api/assets');
const { DiscoveryApi } = require('@joystream/runtime-api/discovery');
const AsyncLock = require('async-lock');

/*
 * Initialize runtime (substrate) API and keyring.
 */
class RuntimeApi
{
  static async create(options)
  {
    const ret = new RuntimeApi();
    await ret.init(options || {});
    return ret;
  }

  async init(options)
  {
    debug('Init');

    // Register joystream types
    registerJoystreamTypes();

    // Create the API instrance
    this.api = await ApiPromise.create();

    this.asyncLock = new AsyncLock();

    // Keep track locally of account nonces.
    this.nonces = {};

    // Ok, create individual APIs
    this.identities = await IdentitiesApi.create(this, options.account_file);
    this.balances = await BalancesApi.create(this);
    this.roles = await RolesApi.create(this);
    this.assets = await AssetsApi.create(this);
    this.discovery = await DiscoveryApi.create(this);
  }

  disconnect()
  {
    this.api.disconnect();
  }

  executeWithLock(execFunction) {
    return this.asyncLock.acquire(RuntimeApi.NONCE_LOCK_KEY, execFunction);
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

  /*
   * Same as waitForEvent, but filter on multiple events. The parameter is an
   * array of arrays containing module and name. Calling waitForEvent is
   * identical to calling this with [[module, name]].
   *
   * Returns the first matched event *only*.
   */
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
   * of the key, making calls a little simpler. Will lock to prevent concurrent
   * calls so correct nonce is used.
   *
   * If the subscribed events are given, and a callback as well, then the
   * callback is invoked with matching events.
   */
  async signAndSend(accountId, tx, attempts, subscribed, callback)
  {
    // Prepare key
    const from_key = this.identities.keyring.getPair(accountId);
    if (from_key.isLocked()) {
      throw new Error('Must unlock key before using it to sign!');
    }

    const finalizedPromise = (function() {
      // externally controller promise
      let resolve, reject;
      const promise = new Promise((res, rej) => {
        resolve = res;
        reject = rej;
      });
      return {resolve, reject, promise}
    })();

    let unsubscribe = await this.executeWithLock(async () => {
      // Try to get the next nonce to use
      var nonce = this.nonces[accountId];

      const incrementNonce = () => {
        nonce = nonce.addn(1);
        this.nonces[accountId] = nonce;
      }

      // If the nonce isn't available, get it from chain.
      if (!nonce) {
        // current nonce
        nonce = await this.api.query.system.accountNonce(accountId);
        debug(`Got nonce for ${accountId} from chain: ${nonce}`);
      }

      return new Promise((resolve, reject) => {
        debug('Signing and sending tx');
        // send(statusUpdates) returns a function for unsubscribing from status updates
        let unsubscribe = tx.sign(from_key, { nonce })
          .send(({events = [], status}) => {
            debug(`TX status: ${status.type}`);

            if (status.isReady) {
              debug('TX Ready.');
              // Assumption is that transaction is valid and with a good nonce
              // prepare nonce for next tx
              incrementNonce();
              // releases lock
              resolve(unsubscribe);
            } else if (status.isBrodcast) {
              debug('TX Broadcast.');
            } else if (status.isFinalized) {
              debug('TX Finalized.');
              finalizedPromise.resolve(status)
            } else if (status.isFuture) {
              // comes before ready.
              // does that mean it will remain in mempool or in api internal queue?
              // nonce was set in the future. Treating it as an error for now.
              debug('TX Future!')
              // nonce is likely out of sync, delete it so we reload it from chain on next attempt
              delete this.nonces[accountId];
              const err = new Error('transaction nonce set in future');
              finalizedPromise.reject(err);
              reject(err);
            }

            /* why don't we see these status updates on local devchain (single node)
            isUsurped
            isBroadcast
            isDropped
            isInvalid
            */

            // Handle these events after processing status to make sure any exceptions in handlers
            // doesn't affect us.

            // Whatever events we get, process them if there's someone interested.
            if (subscribed && callback) {
              const matched = this._matchingEvents(subscribed, events);
              debug('Matching events:', matched);
              if (matched.length) {
                callback(matched);
              }
            }

          })
          .catch((err) => {
            // 1014 error: Most likely you are sending transaction with the same nonce,
            // so it assumes you want to replace existing one, but the priority is too low to replace it (priority = fee = len(encoded_transaction) currently)
            // Remember this can also happen if in the past we sent a tx with a future nonce, and the current nonce
            // now matches it.
            if (err) {
              const errstr = err.toString();
              // not the best way to check error code.
              // https://github.com/polkadot-js/api/blob/master/packages/rpc-provider/src/coder/index.ts#L52
              if (errstr.indexOf('Error: 1014:') < 0 && // low priority
                  errstr.indexOf('Error: 1010:') < 0) // bad transaction
              {
                // Error but not nonce related. (bad arguments maybe)
                debug('TX error', err);
              } else {
                // nonce is likely out of sync, delete it so we reload it from chain on next attempt
                delete this.nonces[accountId];
              }
            }

            // releases lock
            reject(err);
          });
      });
    })

    // when does it make sense to manyally unsubscribe?
    // at this point unsubscribe.then and unsubscribe.catch have been deleted
    // unsubscribe(); // don't unsubscribe if we want to wait for additional status
    // updates to know when the tx has been finalized
    return finalizedPromise.promise;
  }
}

RuntimeApi.NONCE_LOCK_KEY = 'nonce';

module.exports = {
  RuntimeApi: RuntimeApi,
}
