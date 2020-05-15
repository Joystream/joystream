import QueryNode, { QueryNodeState } from './QueryNode';
import { QueryEventProcessingPack } from '.';
import { EventEmitter } from 'events';
import BootstrapPack from './BootstrapPack';

// Respondible for creating, starting up and shutting down the query node.
// Currently this class is a bit thin, but it will almost certainly grow
// as the integration logic between the library types and the application
// evolves, and that will pay abstraction overhead off in terms of testability of otherwise
// anonymous code in root file scope.
export default class QueryNodeManager {
  private _query_node!: QueryNode;

  constructor(exitEmitter: EventEmitter) {
    // Hook into application
    process.on('exit', this._onProcessExit);
  }

  async start(
    ws_provider_endpoint_uri: string,
    processing_pack: QueryEventProcessingPack,
    type_registrator: () => void,
    bootstrap_pack?: BootstrapPack
  ) {
    if (this._query_node) throw Error('Cannot start the same manager multiple times.');

    this._query_node = await QueryNode.create(ws_provider_endpoint_uri, processing_pack, type_registrator);

    if (process.env.QUERY_NODE_BOOTSTRAP_DB && bootstrap_pack) {
        await this._query_node.bootstrap(bootstrap_pack);
    } else {
        await this._query_node.start();
    }

  }

  async _onProcessExit(code: number) {
    // Stop if query node has been constructed and started.
    if (this._query_node && this._query_node.state == QueryNodeState.STARTED) {
      await this._query_node.stop();
    }
    code;
  }
}
