// Copyright 2017-2020 @polkadot/rpc-provider authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

/* eslint-disable camelcase */

// WsProvider implementation copied from @polkadot/api v1.26.1
// It wasn't possible to extend or even monkey-patch it because of the
// use of ECMAScript Private Fields.
// The only modification is construction of the `w3cwebsocket` instance
// in the connect() method to increase the fragment size to 256K from the
// default of 16K

import {
  JsonRpcResponse,
  ProviderInterface,
  ProviderInterfaceCallback,
  ProviderInterfaceEmitted,
  ProviderInterfaceEmitCb,
} from '@polkadot/rpc-provider/types'

import EventEmitter from 'eventemitter3'
import { assert, isNull, isUndefined, isChildClass, logger } from '@polkadot/util'

import Coder from '@polkadot/rpc-provider/coder'
import defaults from '@polkadot/rpc-provider/defaults'
import getWSClass from '@polkadot/rpc-provider/ws/getWSClass'

interface SubscriptionHandler {
  callback: ProviderInterfaceCallback
  type: string
}

interface WsStateAwaiting {
  callback: ProviderInterfaceCallback
  method: string
  params: any[]
  subscription?: SubscriptionHandler
}

interface WsStateSubscription extends SubscriptionHandler {
  method: string
  params: any[]
}

interface WSProviderInterface extends ProviderInterface {
  connect(): void
}

const ALIASSES: { [index: string]: string } = {
  chain_finalisedHead: 'chain_finalizedHead',
  chain_subscribeFinalisedHeads: 'chain_subscribeFinalizedHeads',
  chain_unsubscribeFinalisedHeads: 'chain_unsubscribeFinalizedHeads',
}

const l = logger('api-ws')

/**
 * # @polkadot/rpc-provider/ws
 *
 * @name WsProvider
 *
 * @description The WebSocket Provider allows sending requests using WebSocket to a WebSocket RPC server TCP port. Unlike the [[HttpProvider]], it does support subscriptions and allows listening to events such as new blocks or balance changes.
 *
 * @example
 * <BR>
 *
 * ```javascript
 * import Api from '@polkadot/api/promise';
 * import WsProvider from '@polkadot/rpc-provider/ws';
 *
 * const provider = new WsProvider('ws://127.0.0.1:9944');
 * const api = new Api(provider);
 * ```
 *
 * @see [[HttpProvider]]
 */
export default class WsProvider implements WSProviderInterface {
  readonly coder: Coder

  readonly endpoints: string[]

  readonly headers: Record<string, string>

  readonly eventemitter: EventEmitter

  readonly handlers: Record<string, WsStateAwaiting> = {}

  readonly queued: Record<string, string> = {}

  readonly waitingForId: Record<string, JsonRpcResponse> = {}

  private autoConnectMs: number

  private endpointIndex: number

  private _isConnected = false

  private subscriptions: Record<string, WsStateSubscription> = {}

  private websocket: WebSocket | null

  /**
   * @param {string | string[]}  endpoint    The endpoint url. Usually `ws://ip:9944` or `wss://ip:9944`, may provide an array of endpoint strings.
   * @param {boolean} autoConnect Whether to connect automatically or not.
   */
  constructor(
    endpoint: string | string[] = defaults.WS_URL,
    autoConnectMs: number | false = 1000,
    headers: Record<string, string> = {}
  ) {
    const endpoints = Array.isArray(endpoint) ? endpoint : [endpoint]

    assert(endpoints.length !== 0, 'WsProvider requires at least one Endpoint')

    endpoints.forEach((endpoint) => {
      assert(/^(wss|ws):\/\//.test(endpoint), `Endpoint should start with 'ws://', received '${endpoint}'`)
    })

    this.eventemitter = new EventEmitter()
    this.autoConnectMs = autoConnectMs || 0
    this.coder = new Coder()
    this.endpointIndex = -1
    this.endpoints = endpoints
    this.headers = headers
    this.websocket = null

    if (autoConnectMs > 0) {
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      this.connect()
    }
  }

  /**
   * @summary `true` when this provider supports subscriptions
   */
  public get hasSubscriptions(): boolean {
    return true
  }

  /**
   * @description Returns a clone of the object
   */
  public clone(): WsProvider {
    return new WsProvider(this.endpoints)
  }

  /**
   * @summary Manually connect
   * @description The [[WsProvider]] connects automatically by default, however if you decided otherwise, you may
   * connect manually using this method.
   */
  public async connect(): Promise<void> {
    try {
      this.endpointIndex = (this.endpointIndex + 1) % this.endpoints.length

      const WS = await getWSClass()

      this.websocket =
        typeof WebSocket !== 'undefined' && isChildClass(WebSocket, WS)
          ? new WS(this.endpoints[this.endpointIndex])
          : // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore - WS may be an instance of w3cwebsocket, which supports headers
            new WS(this.endpoints[this.endpointIndex], undefined, undefined, this.headers, undefined, {
              // default: true
              fragmentOutgoingMessages: true,
              // default: 16K
              fragmentationThreshold: 256 * 1024,
            })
      this.websocket.onclose = this.onSocketClose
      this.websocket.onerror = this.onSocketError
      this.websocket.onmessage = this.onSocketMessage
      this.websocket.onopen = this.onSocketOpen
    } catch (error) {
      l.error(error)
    }
  }

  /**
   * @description Manually disconnect from the connection, clearing autoconnect logic
   */
  public disconnect(): void {
    if (isNull(this.websocket)) {
      throw new Error('Cannot disconnect on a non-open websocket')
    }

    // switch off autoConnect, we are in manual mode now
    this.autoConnectMs = 0

    // 1000 - Normal closure; the connection successfully completed
    this.websocket.close(1000)
    this.websocket = null
  }

  /**
   * @summary Whether the node is connected or not.
   * @return {boolean} true if connected
   */
  public isConnected(): boolean {
    return this._isConnected
  }

  /**
   * @summary Listens on events after having subscribed using the [[subscribe]] function.
   * @param  {ProviderInterfaceEmitted} type Event
   * @param  {ProviderInterfaceEmitCb}  sub  Callback
   * @return unsubscribe function
   */
  public on(type: ProviderInterfaceEmitted, sub: ProviderInterfaceEmitCb): () => void {
    this.eventemitter.on(type, sub)

    return (): void => {
      this.eventemitter.removeListener(type, sub)
    }
  }

  /**
   * @summary Send JSON data using WebSockets to configured HTTP Endpoint or queue.
   * @param method The RPC methods to execute
   * @param params Encoded paramaters as appliucable for the method
   * @param subscription Subscription details (internally used)
   */
  public send(method: string, params: any[], subscription?: SubscriptionHandler): Promise<any> {
    return new Promise((resolve, reject): void => {
      try {
        const json = this.coder.encodeJson(method, params)
        const id = this.coder.getId()

        const callback = (error?: Error | null, result?: any): void => {
          error ? reject(error) : resolve(result)
        }

        l.debug((): string[] => ['calling', method, json])

        this.handlers[id] = {
          callback,
          method,
          params,
          subscription,
        }

        if (this.isConnected() && !isNull(this.websocket)) {
          this.websocket.send(json)
        } else {
          this.queued[id] = json
        }
      } catch (error) {
        reject(error)
      }
    })
  }

  /**
   * @name subscribe
   * @summary Allows subscribing to a specific event.
   * @param  {string}                     type     Subscription type
   * @param  {string}                     method   Subscription method
   * @param  {any[]}                 params   Parameters
   * @param  {ProviderInterfaceCallback} callback Callback
   * @return {Promise<number>}                     Promise resolving to the dd of the subscription you can use with [[unsubscribe]].
   *
   * @example
   * <BR>
   *
   * ```javascript
   * const provider = new WsProvider('ws://127.0.0.1:9944');
   * const rpc = new Rpc(provider);
   *
   * rpc.state.subscribeStorage([[storage.system.account, <Address>]], (_, values) => {
   *   console.log(values)
   * }).then((subscriptionId) => {
   *   console.log('balance changes subscription id: ', subscriptionId)
   * })
   * ```
   */
  public async subscribe(
    type: string,
    method: string,
    params: any[],
    callback: ProviderInterfaceCallback
  ): Promise<number | string> {
    const id = (await this.send(method, params, { callback, type })) as Promise<number | string>

    return id
  }

  /**
   * @summary Allows unsubscribing to subscriptions made with [[subscribe]].
   */
  public async unsubscribe(type: string, method: string, id: number | string): Promise<boolean> {
    const subscription = `${type}::${id}`

    // FIXME This now could happen with re-subscriptions. The issue is that with a re-sub
    // the assigned id now does not match what the API user originally received. It has
    // a slight complication in solving - since we cannot rely on the send id, but rather
    // need to find the actual subscription id to map it
    if (isUndefined(this.subscriptions[subscription])) {
      l.debug((): string => `Unable to find active subscription=${subscription}`)

      return false
    }

    delete this.subscriptions[subscription]

    const result = (await this.send(method, [id])) as Promise<boolean>

    return result
  }

  emit = (type: ProviderInterfaceEmitted, ...args: any[]): void => {
    this.eventemitter.emit(type, ...args)
  }

  onSocketClose = (event: CloseEvent): void => {
    if (this.autoConnectMs > 0) {
      l.error(`disconnected from ${this.endpoints[this.endpointIndex]} code: '${event.code}' reason: '${event.reason}'`)
    }

    this._isConnected = false
    this.emit('disconnected')

    if (this.autoConnectMs > 0) {
      setTimeout((): void => {
        // eslint-disable-next-line @typescript-eslint/no-floating-promises
        this.connect()
      }, this.autoConnectMs)
    }
  }

  onSocketError = (error: Event): void => {
    l.debug((): any => ['socket error', error])
    this.emit('error', error)
  }

  onSocketMessage = (message: MessageEvent): void => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    l.debug(() => ['received', message.data])

    const response = JSON.parse(message.data as string) as JsonRpcResponse

    return isUndefined(response.method) ? this.onSocketMessageResult(response) : this.onSocketMessageSubscribe(response)
  }

  onSocketMessageResult = (response: JsonRpcResponse): void => {
    const handler = this.handlers[response.id]

    if (!handler) {
      l.debug((): string => `Unable to find handler for id=${response.id}`)

      return
    }

    try {
      const { method, params, subscription } = handler
      const result = this.coder.decodeResponse(response) as string

      // first send the result - in case of subs, we may have an update
      // immediately if we have some queued results already
      handler.callback(null, result)

      if (subscription) {
        const subId = `${subscription.type}::${result}`

        this.subscriptions[subId] = {
          ...subscription,
          method,
          params,
        }

        // if we have a result waiting for this subscription already
        if (this.waitingForId[subId]) {
          this.onSocketMessageSubscribe(this.waitingForId[subId])
        }
      }
    } catch (error) {
      handler.callback(error, undefined)
    }

    delete this.handlers[response.id]
  }

  onSocketMessageSubscribe = (response: JsonRpcResponse): void => {
    const method = ALIASSES[response.method as string] || response.method || 'invalid'
    const subId = `${method}::${response.params.subscription}`
    const handler = this.subscriptions[subId]

    if (!handler) {
      // store the JSON, we could have out-of-order subid coming in
      this.waitingForId[subId] = response

      l.debug((): string => `Unable to find handler for subscription=${subId}`)

      return
    }

    // housekeeping
    delete this.waitingForId[subId]

    try {
      const result = this.coder.decodeResponse(response)

      handler.callback(null, result)
    } catch (error) {
      handler.callback(error, undefined)
    }
  }

  onSocketOpen = (): boolean => {
    assert(!isNull(this.websocket), 'WebSocket cannot be null in onOpen')

    l.debug((): any[] => ['connected to', this.endpoints[this.endpointIndex]])

    this._isConnected = true

    this.emit('connected')
    this.sendQueue()
    this.resubscribe()

    return true
  }

  resubscribe = (): void => {
    const subscriptions = this.subscriptions

    this.subscriptions = {}

    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    Object.keys(subscriptions).forEach(
      async (id): Promise<void> => {
        const { callback, method, params, type } = subscriptions[id]

        // only re-create subscriptions which are not in author (only area where
        // transactions are created, i.e. submissions such as 'author_submitAndWatchExtrinsic'
        // are not included (and will not be re-broadcast)
        if (type.startsWith('author_')) {
          return
        }

        try {
          await this.subscribe(type, method, params, callback)
        } catch (error) {
          l.error(error)
        }
      }
    )
  }

  sendQueue = (): void => {
    Object.keys(this.queued).forEach((id): void => {
      try {
        // we have done the websocket check in onSocketOpen, if an issue, will catch it
        ;(this.websocket as WebSocket).send(this.queued[id])

        delete this.queued[id]
      } catch (error) {
        l.error(error)
      }
    })
  }
}
