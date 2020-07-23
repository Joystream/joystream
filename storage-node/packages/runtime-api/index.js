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
const { SystemApi } = require('@joystream/storage-runtime-api/system')
const AsyncLock = require('async-lock')
const { newExternallyControlledPromise } = require('@joystream/storage-utils/externalPromise')

/*
 * Initialize runtime (substrate) API and keyring.
 */
class RuntimeApi {
  static async create(options) {
    const runtimeApi = new RuntimeApi()
    await runtimeApi.init(options || {})
    return runtimeApi
  }

  async init(options) {
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
      accountFile: options.account_file,
      passphrase: options.passphrase,
      canPromptForPassphrase: options.canPromptForPassphrase,
    })
    this.balances = await BalancesApi.create(this)
    this.workers = await WorkersApi.create(this)
    this.assets = await AssetsApi.create(this)
    this.discovery = await DiscoveryApi.create(this)
    this.system = await SystemApi.create(this)
  }

  disconnect() {
    this.api.disconnect()
  }

  executeWithAccountLock(accountId, func) {
    return this.asyncLock.acquire(`${accountId}`, func)
  }

  static matchingEvents(subscribed, events) {
    if (!events.length) return []

    const filtered = events.filter((record) => {
      const { event /*phase*/ } = record

      // Show what we are busy with
      // debug(`\t${event.section}:${event.method}:: (phase=${phase.toString()})`)
      // debug(`\t\t${event.meta.documentation.toString()}`)

      // Skip events we're not interested in.
      const matching = subscribed.filter((value) => {
        return event.section === value[0] && event.method === value[1]
      })
      return matching.length > 0
    })

    const mapped = filtered.map((record) => {
      const { event } = record
      const types = event.typeDef

      // Loop through each of the parameters, displaying the type and data
      const payload = {}
      event.data.forEach((data, index) => {
        // debug(`\t${types[index].type}: ${data.toString()}`)
        payload[types[index].type] = data
      })

      const fullName = `${event.section}.${event.method}`
      return [fullName, payload]
    })

    debug('Events', JSON.stringify(mapped))

    return mapped
  }

  // Returns a function that takes events from transaction lifecycle updates
  // that look for matching events and makes a callback and absorbs any expections
  // raised by the callback to ensure we continue to process the complete
  // transaction lifecyle.
  static makeEventsHandler(subscribed, callback) {
    return function eventsHandler(events) {
      try {
        if (subscribed && callback) {
          const matched = RuntimeApi.matchingEvents(subscribed, events)
          if (matched.length) {
            callback(matched)
          }
        }
      } catch (err) {
        debug(`Error handling events ${err.stack}`)
      }
    }
  }

  /*
   * signAndSend() with nonce tracking, to enable concurrent sending of transacctions
   * so that they can be included in the same block. Allows you to use the accountId instead
   * of the key, without requiring an external Signer configured on the underlying ApiPromie
   *
   * If the subscribed events are given, and a callback as well, then the
   * callback is invoked with matching events.
   */
  async signAndSend(accountId, tx, subscribed, callback) {
    accountId = this.identities.keyring.encodeAddress(accountId)

    // Key must be unlocked
    const fromKey = this.identities.keyring.getPair(accountId)

    if (fromKey.isLocked) {
      throw new Error('Must unlock key before using it to sign!')
    }

    // Promise that will be resolved when the submitted transaction is finalized
    // it will be rejected if the transaction is rejected by the node.
    const finalizedPromise = newExternallyControlledPromise()

    // function assigned when transaction is successfully submitted. Call
    // it to unsubsribe from events.
    let unsubscribe

    const handleEvents = RuntimeApi.makeEventsHandler(subscribed, callback)

    const handleTxUpdates = ({ events = [], status }) => {
      // when handling tx life cycle we cannot detect api disconnect and could be waiting
      // for events for ever!
      handleEvents(events)

      if (status.isFinalized) {
        // transaction was included in block (finalized)
        // resolve with the transaction hash
        unsubscribe()
        finalizedPromise.resolve(status.asFinalized)
      } else if (status.isFuture) {
        // This can happen if the code is incorrect, but also in a scenario where a joystream-node
        // lost connectivity, the storage node submitted a few transactions, and incremented the nonce.
        // The joystream-node later was restarted and storage-node continues using cached nonce.

        // Can we detect api disconnect and reset nonce?

        debug(`== Error: Submitted transaction with future nonce ==`)
        delete this.nonces[accountId]
        finalizedPromise.reject('Future Tx Nonce')
      }
    }

    // synchronize access to nonce
    await this.executeWithAccountLock(accountId, async () => {
      // Try to get the next nonce to use
      let nonce = this.nonces[accountId]
      // Remember if we read a previously saved nonce
      const nonceWasCached = nonce !== undefined
      // If it wasn't cached read it from chain and save it
      nonce = this.nonces[accountId] = nonce || (await this.api.query.system.accountNonce(accountId))

      try {
        unsubscribe = await tx.sign(fromKey, { nonce }).send(handleTxUpdates)
        // transaction submitted successfully, increment and save nonce,
        // unless it was reset in handleTxCycle()
        if (this.nonces[accountId] !== undefined) {
          this.nonces[accountId] = nonce.addn(1)
        }
      } catch (err) {
        debug('Transaction Rejected:', err.toString())
        // Error here could be simply bad input to the transactions. It may also
        // be due to bad nonce, resulting in attempt to replace transactions with same nonce
        // either that were future transactions,
        // or because of stale nonces (this will happen while a joystream-node is far behind in syncing because
        // we will read the nonce from chain and by the time we submit the transaction, the node would have fetched a few more blocks
        // where the nonce of the account might have changed to a higher value)
        // Occasionally the storage node operator will use their role account from another application
        // to send transactions to manage their role which will change the nonce, and due to a race condition
        // between reading the nonce from chain, and signing a transaction, the selected nonce may become stale.

        // All we can do is reset the nonce and re-read it from chain on next tx submit attempt.
        // The storage node will eventually recover.
        if (nonceWasCached) {
          delete this.nonces[accountId]
        }

        finalizedPromise.reject(err)
      }
    })

    return finalizedPromise.promise
  }

  /*
   * Sign and send a transaction expect event from
   * module and return eventProperty from the event.
   */
  async signAndSendThenGetEventResult(senderAccountId, tx, { eventModule, eventName, eventProperty }) {
    // event from a module,
    const subscribed = [[eventModule, eventName]]
    // TODO: rewrite this method to async-await style
    // eslint-disable-next-line  no-async-promise-executor
    return new Promise(async (resolve, reject) => {
      try {
        await this.signAndSend(senderAccountId, tx, subscribed, (events) => {
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
  RuntimeApi,
}
