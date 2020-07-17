// @ts-check

import { ApiPromise, WsProvider /*RuntimeVersion*/ } from '@polkadot/api';
import * as BN from 'bn.js';

import { makeQueryService, IndexBuilder, QueryEventProcessingPack, QueryNodeStartUpOptions } from '.';

export enum QueryNodeState {
  NOT_STARTED,
  BOOTSTRAPPING,
  STARTING,
  STARTED,
  STOPPING,
  STOPPED,
}

const debug = require('debug')('index-builder:query-node');

export default class QueryNode {
  // State of the node,
  private _state: QueryNodeState;

  // ..
  private _websocketProvider: WsProvider;

  // API instance for talking to Substrate full node.
  private _api: ApiPromise;

  // Query index building node.
  private _indexBuilder: IndexBuilder;

  private _atBlock?: BN;

  private constructor(websocketProvider: WsProvider, api: ApiPromise, indexBuilder: IndexBuilder, atBlock?: BN) {
    this._state = QueryNodeState.NOT_STARTED;
    this._websocketProvider = websocketProvider;
    this._api = api;
    this._indexBuilder = indexBuilder;
    this._atBlock = atBlock;
  }

  static async create(options: QueryNodeStartUpOptions) {
    // TODO: Do we really need to do it like this?
    // Its pretty ugly, but the registrtion appears to be
    // accessing some sort of global state, and has to be done after
    // the provider is created.

    const { wsProviderURI, typeRegistrator, processingPack, atBlock } = options;

    // Initialise the provider to connect to the local node
    const provider = new WsProvider(wsProviderURI);

    // Register types before creating the api
    typeRegistrator ? typeRegistrator() : null;

    // Create the API and wait until ready
    const api = await ApiPromise.create({ provider });

    const service = makeQueryService(api);

    const index_buider = IndexBuilder.create(service, processingPack as QueryEventProcessingPack);

    return new QueryNode(provider, api, index_buider, atBlock);
  }

  async start() {
    if (this._state != QueryNodeState.NOT_STARTED) throw new Error('Starting requires ');

    this._state = QueryNodeState.STARTING;

    // Start the
    await this._indexBuilder.start(this._atBlock);

    this._state = QueryNodeState.STARTED;
  }

  async stop() {
    if (this._state != QueryNodeState.STARTED) throw new Error('Can only stop once fully started');

    this._state = QueryNodeState.STOPPING;

    await this._indexBuilder.stop();

    this._state = QueryNodeState.STOPPED;
  }

  get state() {
    return this._state;
  }
}
