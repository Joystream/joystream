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
 * but WITHOUT ANY WARRANTY without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

'use strict'

const debug = require('debug')('joystream:runtime:base')

const { registerJoystreamTypes } = require('@joystream/types')
const { ApiPromise, WsProvider } = require('@polkadot/api')

const { IdentitiesApi } = require('@joystream/storage-runtime-api/identities')
const { BalancesApi } = require('@joystream/storage-runtime-api/balances')
const { WorkersApi } = require('@joystream/storage-runtime-api/workers')
const { AssetsApi } = require('@joystream/storage-runtime-api/assets')
const { DiscoveryApi } = require('@joystream/storage-runtime-api/discovery')
const AsyncLock = require('async-lock')
const { newExternallyControlledPromise } = require('@joystream/storage-utils/externalPromise')

/*
 * Initialize runtime (substrate) API and keyring.
 */
class RuntimeApi {
  static async create (options) {
    const runtime_api = new RuntimeApi()
    await runtime_api.init(options || {})
    return runtime_api
  }

  async init (options) {
    debug('Init')

    options = options || {}

    // Register joystream types
    registerJoystreamTypes()

    const provider = new WsProvider(options.provider_url || 'ws://localhost:9944')

    // Create the API instrance
    this.api = await ApiPromise.create({ provider })

    this.asyncLock = new AsyncLock()

    // Keep track locally of account nonces.
    this.nonces = {}

    // The storage provider id to use
    this.storageProviderId = parseInt(options.storageProviderId) // u64 instead ?

    // Ok, create individual APIs
    this.identities = await IdentitiesApi.create(this, {
      account_file: options.account_file,
      passphrase: options.passphrase,
      canPromptForPassphrase: options.canPromptForPassphrase
    })
    this.balances = await BalancesApi.create(this)
    this.workers = await WorkersApi.create(this)
    this.assets = await AssetsApi.create(this)
    this.discovery = await DiscoveryApi.create(this)
  }

  disconnect () {
    this.api.disconnect()
  }

  executeWithAccountLock (account_id, func) {
    return this.asyncLock.acquire(`${account_id}`, func)
  }

  /*
   * Wait for an event. Filters out any events that don't match the module and
   * event name.
   *
   * The result of the Promise is an array containing first the full event
   * name, and then the event fields as an object.
   */
  async waitForEvent (module, name) {
    return this.waitForEvents([[module, name]])
  }

  _matchingEvents(subscribed, events) {
    debug(`Number of events: ${events.length} subscribed to ${subscribed}`)

    const filtered = events.filter((record) => {
      const { event, phase } = record

      // Show what we are busy with
      debug(`\t${event.section}:${event.method}:: (phase=${phase.toString()})`)
      debug(`\t\t${event.meta.documentation.toString()}`)

      // Skip events we're not interested in.
      const matching = subscribed.filter((value) => {
        return event.section === value[0] && event.method === value[1]
      })
      return matching.length > 0
    })
    debug(`Filtered: ${filtered.length}`)

    const mapped = filtered.map((record) => {
      const { event } = record
      const types = event.typeDef

      // Loop through each of the parameters, displaying the type and data
      const payload = {}
      event.data.forEach((data, index) => {
        debug(`\t\t\t${types[index].type}: ${data.toString()}`)
        payload[types[index].type] = data
      })

      const full_name = `${event.section}.${event.method}`
      return [full_name, payload]
    })
    debug('Mapped', mapped)

    return mapped
  }

  /*
   * Same as waitForEvent, but filter on multiple events. The parameter is an
   * array of arrays containing module and name. Calling waitForEvent is
   * identical to calling this with [[module, name]].
   *
   * Returns the first matched event *only*.
   */
  async waitForEvents (subscribed) {
    return new Promise((resolve, reject) => {
      this.api.query.system.events((events) => {
        const matches = this._matchingEvents(subscribed, events)
        if (matches && matches.length) {
          resolve(matches)
        }
      })
    })
  }

  /*
   * Nonce-aware signAndSend(). Also allows you to use the accountId instead
   * of the key, making calls a little simpler. Will lock to prevent concurrent
   * calls so correct nonce is used.
   *
   * If the subscribed events are given, and a callback as well, then the
   * callback is invoked with matching events.
   */
  async signAndSend (accountId, tx, attempts, subscribed, callback) {
    accountId = this.identities.keyring.encodeAddress(accountId)

    // Key must be unlocked
    const from_key = this.identities.keyring.getPair(accountId)
    if (from_key.isLocked) {
      throw new Error('Must unlock key before using it to sign!')
    }

    const finalizedPromise = newExternallyControlledPromise()

    let unsubscribe = await this.executeWithAccountLock(accountId, async () => {
      // Try to get the next nonce to use
      let nonce = this.nonces[accountId]

      let incrementNonce = () => {
        // only increment once
        incrementNonce = () => {} // turn it into a no-op
        nonce = nonce.addn(1)
        this.nonces[accountId] = nonce
      }

      // If the nonce isn't available, get it from chain.
      if (!nonce) {
        // current nonce
        nonce = await this.api.query.system.accountNonce(accountId)
        debug(`Got nonce for ${accountId} from chain: ${nonce}`)
      }

      return new Promise((resolve, reject) => {
        debug('Signing and sending tx')
        // send(statusUpdates) returns a function for unsubscribing from status updates
        let unsubscribe = tx.sign(from_key, { nonce })
          .send(({events = [], status}) => {
            debug(`TX status: ${status.type}`)

            // Whatever events we get, process them if there's someone interested.
            // It is critical that this event handling doesn't prevent
            try {
              if (subscribed && callback) {
                const matched = this._matchingEvents(subscribed, events)
                debug('Matching events:', matched)
                if (matched.length) {
                  callback(matched)
                }
              }
            } catch (err) {
              debug(`Error handling events ${err.stack}`)
            }

            // We want to release lock as early as possible, sometimes Ready status
            // doesn't occur, so we do it on Broadcast instead
            if (status.isReady) {
              debug('TX Ready.')
              incrementNonce()
              resolve(unsubscribe) // releases lock
            } else if (status.isBroadcast) {
              debug('TX Broadcast.')
              incrementNonce()
              resolve(unsubscribe) // releases lock
            } else if (status.isFinalized) {
              debug('TX Finalized.')
              finalizedPromise.resolve(status)
            } else if (status.isFuture) {
              // comes before ready.
              // does that mean it will remain in mempool or in api internal queue?
              // nonce was set in the future. Treating it as an error for now.
              debug('TX Future!')
              // nonce is likely out of sync, delete it so we reload it from chain on next attempt
              delete this.nonces[accountId]
              const err = new Error('transaction nonce set in future')
              finalizedPromise.reject(err)
              reject(err)
            }

            /* why don't we see these status updates on local devchain (single node)
            isUsurped
            isBroadcast
            isDropped
            isInvalid
            */
          })
          .catch((err) => {
            // 1014 error: Most likely you are sending transaction with the same nonce,
            // so it assumes you want to replace existing one, but the priority is too low to replace it (priority = fee = len(encoded_transaction) currently)
            // Remember this can also happen if in the past we sent a tx with a future nonce, and the current nonce
            // now matches it.
            if (err) {
              const errstr = err.toString()
              // not the best way to check error code.
              // https://github.com/polkadot-js/api/blob/master/packages/rpc-provider/src/coder/index.ts#L52
              if (errstr.indexOf('Error: 1014:') < 0 && // low priority
                  errstr.indexOf('Error: 1010:') < 0) // bad transaction
              {
                // Error but not nonce related. (bad arguments maybe)
                debug('TX error', err)
              } else {
                // nonce is likely out of sync, delete it so we reload it from chain on next attempt
                delete this.nonces[accountId]
              }
            }

            finalizedPromise.reject(err)
            // releases lock
            reject(err)
          })
      })
    })

    // when does it make sense to manyally unsubscribe?
    // at this point unsubscribe.then and unsubscribe.catch have been deleted
    // unsubscribe() // don't unsubscribe if we want to wait for additional status
    // updates to know when the tx has been finalized
    return finalizedPromise.promise
  }

  /*
   * Sign and send a transaction expect event from
   * module and return eventProperty from the event.
   */
  async signAndSendThenGetEventResult (senderAccountId, tx, { eventModule, eventName, eventProperty }) {
    // event from a module,
    const subscribed = [[eventModule, eventName]]
    return new Promise(async (resolve, reject) => {
      try {
        await this.signAndSend(senderAccountId, tx, 1, subscribed, (events) => {
          events.forEach((event) => {
            // fix - we may not necessarily want the first event
            // if there are multiple events emitted,
            resolve(event[1][eventProperty])
          })
        })
      } catch (err) {
        reject(err)
      }
    })
  }

}

module.exports = {
  RuntimeApi
}
