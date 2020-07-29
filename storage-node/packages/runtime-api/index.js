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
const debugTx = require('debug')('joystream:runtime:base:tx')

const { registerJoystreamTypes } = require('@joystream/types')
const { ApiPromise, WsProvider } = require('@polkadot/api')
const { IdentitiesApi } = require('@joystream/storage-runtime-api/identities')
const { BalancesApi } = require('@joystream/storage-runtime-api/balances')
const { WorkersApi } = require('@joystream/storage-runtime-api/workers')
const { AssetsApi } = require('@joystream/storage-runtime-api/assets')
const { DiscoveryApi } = require('@joystream/storage-runtime-api/discovery')
const { SystemApi } = require('@joystream/storage-runtime-api/system')
const AsyncLock = require('async-lock')
const Promise = require('bluebird')
const { sleep } = require('@joystream/storage-utils/sleep')

Promise.config({
  cancellation: true,
})

const TX_TIMEOUT = 20 * 1000

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

  async untilChainIsSynced() {
    debug('Waiting for chain to be synced before proceeding.')
    while (true) {
      const isSyncing = await this.chainIsSyncing()
      if (isSyncing) {
        debug('Still waiting for chain to be synced.')
        await sleep(1 * 30 * 1000)
      } else {
        return
      }
    }
  }

  async chainIsSyncing() {
    const { isSyncing } = await this.api.rpc.system.health()
    return isSyncing.isTrue
  }

  async providerHasMinimumBalance(minimumBalance) {
    const providerAccountId = this.identities.key.address
    return this.balances.hasMinimumBalanceOf(providerAccountId, minimumBalance)
  }

  executeWithAccountLock(accountId, func) {
    return this.asyncLock.acquire(`${accountId}`, func)
  }

  static matchingEvents(subscribed = [], events = []) {
    const filtered = events.filter((record) => {
      const { event } = record

      // Skip events we're not interested in.
      const matching = subscribed.filter((value) => {
        if (value[0] === '*' && value[1] === '*') {
          return true
        } else if (value[0] === '*') {
          return event.method === value[1]
        } else if (value[1] === '*') {
          return event.section === value[0]
        } else {
          return event.section === value[0] && event.method === value[1]
        }
      })
      return matching.length > 0
    })

    return filtered.map((record) => {
      const { event } = record
      const types = event.typeDef
      const payload = new Map()

      // this check may be un-necessary but doing it just incase
      if (event.data) {
        event.data.forEach((data, index) => {
          const type = types[index].type
          payload.set(index, { type, data })
        })
      }
      const fullName = `${event.section}.${event.method}`
      debugTx(`matched event: ${fullName} =>`, event.data && event.data.join(', '))
      return [fullName, payload]
    })
  }

  // Get cached nonce and use unless system nonce is greater, to avoid stale nonce if
  // there was a long gap in time between calls to signAndSend during which an external app
  // submitted a transaction.
  async selectBestNonce(accountId) {
    const cachedNonce = this.nonces[accountId]
    // In future use this rpc method to take the pending tx pool into account when fetching the nonce
    // const nonce = await this.api.rpc.system.accountNextIndex(accountId)
    const systemNonce = await this.api.query.system.accountNonce(accountId)

    const bestNonce = cachedNonce && cachedNonce.gte(systemNonce) ? cachedNonce : systemNonce

    this.nonces[accountId] = bestNonce

    return bestNonce.toNumber()
  }

  incrementAndSaveNonce(accountId) {
    this.nonces[accountId] = this.nonces[accountId].addn(1)
  }

  /*
   * signAndSend() with nonce tracking, to enable concurrent sending of transacctions
   * so that they can be included in the same block. Allows you to use the accountId instead
   * of the key, without requiring an external Signer configured on the underlying ApiPromie
   *
   * If the subscribed events are given, then the matchedEvents will be returned in the resolved
   * value.
   * Resolves when a transaction finalizes with a successful dispatch (for both signed and root origins)
   * Rejects in all other cases.
   * Will also reject on timeout if the transaction doesn't finalize in time.
   */
  async signAndSend(accountId, tx, subscribed) {
    // Accept both a string or AccountId as argument
    accountId = this.identities.keyring.encodeAddress(accountId)

    // Throws if keyPair is not found
    const fromKey = this.identities.keyring.getPair(accountId)

    // Key must be unlocked to use
    if (fromKey.isLocked) {
      throw new Error('Must unlock key before using it to sign!')
    }

    const callbacks = {
      // Functions to be called when the submitted transaction is finalized. They are initialized
      // after the transaction is submitted to the resolve and reject function of the final promise
      // returned by signAndSend
      // on extrinsic success
      onFinalizedSuccess: null,
      // on extrinsic failure
      onFinalizedFailed: null,
      // Function assigned when transaction is successfully submitted. Invoking it ubsubscribes from
      // listening to tx status updates.
      unsubscribe: null,
    }

    // object used to communicate back information from the tx updates handler
    const out = {
      lastResult: undefined,
    }

    // synchronize access to nonce
    await this.executeWithAccountLock(accountId, async () => {
      const nonce = await this.selectBestNonce(accountId)
      const signed = tx.sign(fromKey, { nonce })
      const txhash = signed.hash

      try {
        callbacks.unsubscribe = await signed.send(
          RuntimeApi.createTxUpdateHandler(callbacks, { nonce, txhash, subscribed }, out)
        )

        const serialized = JSON.stringify({
          nonce,
          txhash,
          tx: signed.toHex(),
        })

        // We are depending on the behaviour that at this point the Ready status
        // Elaboration: when the tx is rejected and therefore the tx isn't added
        // to the tx pool ready queue status is not updated and
        // .send() throws, so we don't reach this code.
        if (out.lastResult.status.isFuture) {
          debugTx(`Warning: Submitted Tx with future nonce: ${serialized}`)
        } else {
          debugTx(`Submitted: ${serialized}`)
        }

        // transaction submitted successfully, increment and save nonce.
        this.incrementAndSaveNonce(accountId)
      } catch (err) {
        const errstr = err.toString()
        debugTx(`Rejected: ${errstr} txhash: ${txhash} nonce: ${nonce}`)
        throw err
      }
    })

    // Here again we assume that the transaction has been accepted into the tx pool
    // and status was updated.
    // We cannot get tx updates for a future tx so return now to avoid blocking caller
    if (out.lastResult.status.isFuture) {
      return {}
    }

    // Return a promise that will resolve when the transaction finalizes.
    // On timeout it will be rejected. Timeout is a workaround for dealing with the
    // fact that if rpc connection is lost to node we have no way of detecting it or recovering.
    // Timeout can also occur if a transaction that was part of batch of transactions submitted
    // gets usurped.
    return new Promise((resolve, reject) => {
      callbacks.onFinalizedSuccess = resolve
      callbacks.onFinalizedFailed = reject
    }).timeout(TX_TIMEOUT)
  }

  /*
   * Sign and send a transaction expect event from
   * module and return specific(index) value from event data
   */
  async signAndSendThenGetEventResult(senderAccountId, tx, { module, event, index, type }) {
    if (!module || !event || index === undefined || !type) {
      throw new Error('MissingSubscribeEventDetails')
    }

    const subscribed = [[module, event]]

    const { mappedEvents } = await this.signAndSend(senderAccountId, tx, subscribed)

    if (!mappedEvents) {
      // The tx was a future so it was not possible and will not be possible to get events
      throw new Error('NoEventsWereCaptured')
    }

    if (!mappedEvents.length) {
      // our expected event was not emitted
      throw new Error('ExpectedEventNotFound')
    }

    // fix - we may not necessarily want the first event
    // when there are multiple instances of the same event
    const firstEvent = mappedEvents[0]

    if (firstEvent[0] !== `${module}.${event}`) {
      throw new Error('WrongEventCaptured')
    }

    const payload = firstEvent[1]
    if (!payload.has(index)) {
      throw new Error('DataIndexOutOfRange')
    }

    const value = payload.get(index)
    if (value.type !== type) {
      throw new Error('DataTypeNotExpectedType')
    }

    return value.data
  }

  static createTxUpdateHandler(callbacks, submittedTx, out = {}) {
    const { nonce, txhash, subscribed } = submittedTx

    return function handleTxUpdates(result) {
      const { events = [], status } = result
      const { unsubscribe, onFinalizedFailed, onFinalizedSuccess } = callbacks

      if (!result || !status) {
        return
      }

      out.lastResult = result

      const txinfo = () => {
        return JSON.stringify({
          nonce,
          txhash,
        })
      }

      if (result.isError) {
        unsubscribe()

        debugTx(`Error: ${status.type}`, txinfo())

        onFinalizedFailed &&
          onFinalizedFailed({ err: status.type, result, tx: status.isUsurped ? status.asUsurped : undefined })
      } else if (result.isFinalized) {
        unsubscribe()

        debugTx('Finalized', txinfo())

        const mappedEvents = RuntimeApi.matchingEvents(subscribed, events)
        const failed = result.findRecord('system', 'ExtrinsicFailed')
        const success = result.findRecord('system', 'ExtrinsicSuccess')
        const sudid = result.findRecord('sudo', 'Sudid')
        const sudoAsDone = result.findRecord('sudo', 'SudoAsDone')

        if (failed) {
          const {
            event: { data },
          } = failed
          const dispatchError = data[0]
          onFinalizedFailed({
            err: 'ExtrinsicFailed',
            mappedEvents,
            result,
            block: status.asFinalized,
            dispatchError, // we get module number/id and index into the Error enum
          })
        } else if (success) {
          // Note: For root origin calls, the dispatch error is logged to the joystream-node
          // console, we cannot get it in the events
          if (sudid) {
            const dispatchSuccess = sudid.event.data[0]
            if (dispatchSuccess.isTrue) {
              onFinalizedSuccess({ mappedEvents, result, block: status.asFinalized })
            } else {
              onFinalizedFailed({ err: 'SudoFailed', mappedEvents, result, block: status.asFinalized })
            }
          } else if (sudoAsDone) {
            const dispatchSuccess = sudoAsDone.event.data[0]
            if (dispatchSuccess.isTrue) {
              onFinalizedSuccess({ mappedEvents, result, block: status.asFinalized })
            } else {
              onFinalizedFailed({ err: 'SudoAsFailed', mappedEvents, result, block: status.asFinalized })
            }
          } else {
            onFinalizedSuccess({ mappedEvents, result, block: status.asFinalized })
          }
        }
      }
    }
  }
}

module.exports = {
  RuntimeApi,
}
