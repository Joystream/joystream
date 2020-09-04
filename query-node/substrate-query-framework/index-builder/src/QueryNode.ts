// @ts-check

import { ApiPromise, WsProvider /*RuntimeVersion*/ } from '@polkadot/api';

import { makeQueryService, IndexBuilder, QueryNodeStartUpOptions } from '.';

export enum QueryNodeState {
  NOT_STARTED,
  BOOTSTRAPPING,
  STARTING,
  STARTED,
  STOPPING,
  STOPPED,
}

export default class QueryNode {
  // State of the node,
  private _state: QueryNodeState;

  // ..
  private _websocketProvider: WsProvider;

  // API instance for talking to Substrate full node.
  private _api: ApiPromise;

  // Query index building node.
  private _indexBuilder: IndexBuilder;

  private _atBlock?: number;

  private constructor(websocketProvider: WsProvider, api: ApiPromise, indexBuilder: IndexBuilder, atBlock?: number) {
    this._state = QueryNodeState.NOT_STARTED;
    this._websocketProvider = websocketProvider;
    this._api = api;
    this._indexBuilder = indexBuilder;
    this._atBlock = atBlock;
  }

  static async create(options: QueryNodeStartUpOptions): Promise<QueryNode> {
    // TODO: Do we really need to do it like this?
    // Its pretty ugly, but the registrtion appears to be
    // accessing some sort of global state, and has to be done after
    // the provider is created.

    const { wsProviderURI, typeRegistrator, atBlock } = options;

    // Initialise the provider to connect to the local node
    const provider = new WsProvider(wsProviderURI);

    // Register types before creating the api
    typeRegistrator ? typeRegistrator() : null;

    // Create the API and wait until ready
    const api = await ApiPromise.create({ provider });

    const service = makeQueryService(api);

    const index_buider = IndexBuilder.create(service);

    return new QueryNode(provider, api, index_buider, atBlock);
  }

  async start(): Promise<void> {
    if (this._state != QueryNodeState.NOT_STARTED) throw new Error('Starting requires ');

    this._state = QueryNodeState.STARTING;

    // Start only the indexer
    await this._indexBuilder.start(this._atBlock);
    
    this._state = QueryNodeState.STARTED;
  }

  async stop(): Promise<void> {
    if (this._state != QueryNodeState.STARTED) throw new Error('Can only stop once fully started');

    this._state = QueryNodeState.STOPPING;

    await this._indexBuilder.stop();

    this._state = QueryNodeState.STOPPED;
  }

  get state(): QueryNodeState {
    return this._state;
  }
}
