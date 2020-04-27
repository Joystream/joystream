import QueryNode, { QueryNodeState } from './QueryNode';
import { QueryEventProcessingPack } from '../index-builder';
import { EventEmitter } from 'events';

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
    type_registrator: () => void
  ) {
    if (this._query_node) throw Error('Cannot start the same manager multiple times.');

    this._query_node = await QueryNode.create(
      ws_provider_endpoint_uri,
      processing_pack,
      type_registrator
    );

    await this._query_node.start();
  }

  async _onProcessExit(code: number) {
    // Stop if query node has been constructed and started.
    if (this._query_node && this._query_node.state == QueryNodeState.STARTED) {
      await this._query_node.stop();
    }
    code;
  }
}
