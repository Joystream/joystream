// @ts-check

import { ApiPromise, WsProvider /*RuntimeVersion*/ } from '@polkadot/api';

import { makeQueryService, IndexBuilder, QueryEventProcessingPack } from '.';
import { getConnection } from 'typeorm';

import BootstrapPack from './BootstrapPack';

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
  

  private constructor(websocketProvider: WsProvider, api: ApiPromise, 
    indexBuilder: IndexBuilder) {
    this._state = QueryNodeState.NOT_STARTED;
    this._websocketProvider = websocketProvider;
    this._api = api;
    this._indexBuilder = indexBuilder;
  }

  static async create(
    ws_provider_endpoint_uri: string,
    processing_pack: QueryEventProcessingPack,
    type_registrator: () => void,
  ) {
    // TODO: Do we really need to do it like this?
    // Its pretty ugly, but the registrtion appears to be
    // accessing some sort of global state, and has to be done after
    // the provider is created.

    // Initialise the provider to connect to the local node
    const provider = new WsProvider(ws_provider_endpoint_uri);

    // Register types before creating the api
    type_registrator();

    // Create the API and wait until ready
    const api = await ApiPromise.create({ provider });

    const service = makeQueryService(api);

    const index_buider = IndexBuilder.create(service, processing_pack);

    return new QueryNode(provider, api, index_buider);
  }

  async start() {
    if (this._state != QueryNodeState.NOT_STARTED) throw new Error('Starting requires ');

    this._state = QueryNodeState.STARTING;

    // Start the
    await this._indexBuilder.start();

    this._state = QueryNodeState.STARTED;
  }

  async bootstrap(bootstrapPack: BootstrapPack) {
    debug("Bootstraping the database");
    const queryRunner = getConnection().createQueryRunner();
    const api = this._api;
    await queryRunner.connect();
      
    try {
      await queryRunner.startTransaction();
        
      // establish real database connection
      // perform all the bootstrap logic in one large
      // atomic transaction 
      for (const boot of bootstrapPack.pack) {
        await boot(api, queryRunner);
      }
      debug("Database bootstrap successfull");
      await queryRunner.commitTransaction();

    } catch (error) {
      console.error(error);
      await queryRunner.rollbackTransaction();
      throw new Error(`Bootstrapping failed: ${error}`);
    } finally {
      await queryRunner.release();
    }
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
