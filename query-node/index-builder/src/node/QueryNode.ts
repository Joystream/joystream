// @ts-check
import { ApiPromise, WsProvider /*RuntimeVersion*/ } from '@polkadot/api'

import { IndexBuilder } from '..'
import { IndexerOptions } from '.'
import Debug from 'debug'

import Container, { Inject, Service } from 'typedi'
import registry from '../substrate/typeRegistry'
import typesSpec from '../substrate/typesSpec'

import { RedisClientFactory } from '../redis/RedisClientFactory'
import { retry, waitFor } from '../utils/wait-for'
import { SUBSTRATE_API_CALL_RETRIES } from '../indexer/indexer-consts'
import { RedisRelayer } from '../indexer/RedisRelayer'

const debug = Debug('index-builder:query-node')

export enum QueryNodeState {
  NOT_STARTED,
  BOOTSTRAPPING,
  STARTING,
  STARTED,
  STOPPING,
  STOPPED,
}

@Service('QueryNode')
export class QueryNode {
  // State of the node,
  private _state: QueryNodeState

  // API instance for talking to Substrate full node.
  @Inject('ApiPromise')
  readonly api!: ApiPromise

  // Query index building node.
  @Inject('IndexBuilder')
  readonly indexBuilder!: IndexBuilder

  @Inject('IndexerOptions')
  readonly indexerOptions!: IndexerOptions

  private constructor() {
    this._state = QueryNodeState.NOT_STARTED

    // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
  }

  static async create(options: IndexerOptions): Promise<QueryNode> {
    // TODO: Do we really need to do it like this?
    // Its pretty ugly, but the registrtion appears to be
    // accessing some sort of global state, and has to be done after
    // the provider is created.

    Container.set('IndexerOptions', options)

    const { wsProviderURI, types } = options

    await QueryNode.createApi(wsProviderURI, types)

    const redisURL = options.redisURI || process.env.REDIS_URI
    Container.set('RedisClientFactory', new RedisClientFactory(redisURL))
    Container.set('RedisRelayer', new RedisRelayer())
    return Container.get<QueryNode>('QueryNode')
  }

  static async createApi(
    wsProviderURI: string,
    types: Record<string, Record<string, string>> = {}
  ): Promise<void> {
    const provider = new WsProvider(wsProviderURI)

    const names = Object.keys(types)

    names.length && debug(`Injected types: ${names.join(', ')}`)

    // Create the API and wait until ready
    const api = await retry(
      () =>
        new ApiPromise({ provider, registry, types, typesSpec }).isReadyOrError,
      SUBSTRATE_API_CALL_RETRIES
    )

    debug(`Api is ready`)

    Container.set('ApiPromise', api)
  }

  async start(): Promise<void> {
    if (this._state != QueryNodeState.NOT_STARTED)
      throw new Error('Starting requires ')

    this._state = QueryNodeState.STARTED

    // Start only the indexer
    try {
      await this.indexBuilder.start(this.indexerOptions.atBlock)
    } finally {
      // if due tot error, it will bubble up
      debug(`Stopping the query node`)
      // stop only when the indexer has stopped or thrown an error
      this._state = QueryNodeState.STOPPED
    }
  }

  async stop(): Promise<void> {
    debug(`Query node state: ${this._state}`)
    if (this._state !== QueryNodeState.STARTED) {
      debug('Query node is not running')
      return
    }

    this._state = QueryNodeState.STOPPING

    await this.indexBuilder.stop()

    await waitFor(() => this.state == QueryNodeState.STOPPED)
  }

  get state(): QueryNodeState {
    return this._state
  }
}
