import ISubstrateQueryService from './ISubstrateQueryService';
import QueryEvent from './QueryEvent';
import QueryEventBlock from './QueryEventBlock';
import { Header, Extrinsic, EventRecord } from '@polkadot/types/interfaces';
import { EventEmitter } from 'events';
import * as assert from 'assert';
import * as BN from 'bn.js';

const DEBUG_TOPIC = 'index-builder:producer';

var debug = require('debug')(DEBUG_TOPIC);

export default class QueryBlockProducer extends EventEmitter {
  private _started: boolean;

  private _producing_blocks_blocks: boolean;

  private readonly _query_service: ISubstrateQueryService;

  private _new_heads_unsubscriber: () => void;

  private _block_to_be_produced_next: BN;

  // Index of the last processed event
  private _last_processed_event_index: BN;

  private _at_block: BN;

  private _height_of_chain: BN;

  constructor(query_service: ISubstrateQueryService) {
    super();

    this._started = false;
    this._producing_blocks_blocks = false;
    this._query_service = query_service;

    // TODO
    // need to set this up, when state is better, it
    // will be refactored
    this._new_heads_unsubscriber = () => {};

    this._block_to_be_produced_next = new BN(0);
    this._height_of_chain = new BN(0);
    this._last_processed_event_index = new BN(0);
    this._at_block = new BN(0)
  }

  // TODO: We cannot assume first block has events... we need more robust logic.
  async start(at_block?: BN, at_event?: BN) {
    if (this._started) throw Error(`Cannot start when already started.`);

    // mark as started
    this._started = true;

    // Try to get initial header right away
    this._height_of_chain = await this._query_service
      .getFinalizedHead()
      .then((hash) => {
        return this._query_service.getHeader(hash);
      })
      .then((header) => {
        return header.number.toBn();
      });

    if (at_block) {
      this._block_to_be_produced_next = at_block;
      this._at_block = at_block;

      if (at_block.gt(this._height_of_chain)) throw Error(`Provided block is ahead of chain.`);
    }

    if (at_event) {
      this._last_processed_event_index = at_event
    }

    //
    this._new_heads_unsubscriber = await this._query_service.subscribeNewHeads((header) => {
      this._OnNewHeads(header);
    });

    // Start producing blocks right away
    if (!this._producing_blocks_blocks) this._produce_blocks();
  }

  async stop() {
    if (!this._started) throw new Error(`Cannot stop when not already started.`);

    // THIS IS VERY CRUDE, NEED TO MANAGE LOTS OF STUFF HERE!

    (await this._new_heads_unsubscriber)();

    this._started = false;
  }

  private async _OnNewHeads(header: Header) {
    assert(this._started, 'Has to be started to process new heads.');

    this._height_of_chain = header.number.toBn();

    debug(`New block found at height #${this._height_of_chain}`);

    if (!this._producing_blocks_blocks) await this._produce_blocks();
  }

  private async _produce_blocks() {
    assert(!this._producing_blocks_blocks, 'Cannot already be producing blocks.');

    this._producing_blocks_blocks = true;

    // Continue as long as we know there are outstanding blocks.
    while (this._block_to_be_produced_next.lte(this._height_of_chain)) {
      debug(`Fetching block #${this._block_to_be_produced_next}`);

      let block_hash_of_target = await this._query_service.getBlockHash(this._block_to_be_produced_next.toString());
      // TODO: CATCH HERE

      debug(`\tHash ${block_hash_of_target.toString()}.`);

      let records = await this._query_service.eventsAt(block_hash_of_target);
      // TODO: CATCH HERE

      debug(`\tRead ${records.length} events.`);

      // Since there is at least 1 event, we will fetch block.
      let signed_block = await this._query_service.getBlock(block_hash_of_target);
      // TODO: CATCH HERE

      debug(`\tFetched full block.`);

      let extrinsics_array = signed_block.block.extrinsics.toArray();

      let query_events: QueryEvent[] = records.map(
        (record, index): QueryEvent => {
          // Extract the phase, event
          const { phase } = record;

          // Try to recover extrinsic: only possible if its right phase, and extrinsics arra is non-empty, the last constraint
          // is needed to avoid events from build config code in genesis, and possibly other cases.
          let extrinsic =
            phase.isApplyExtrinsic && extrinsics_array.length
              ? extrinsics_array[phase.asApplyExtrinsic.toBn()]
              : undefined;

          let query_event = new QueryEvent(record, this._block_to_be_produced_next, extrinsic);

          // Logging
          query_event.log(0, debug);

          return query_event;
        }
      );
      
      // Remove processed events from the list.
      if (this._block_to_be_produced_next.eq(this._at_block)) {
        query_events = query_events.filter((event) => event.index.gt(this._last_processed_event_index));
      }
      

      let query_block = new QueryEventBlock(this._block_to_be_produced_next, query_events);

      this.emit('QueryEventBlock', query_block);

      debug(`\tEmitted query event block.`);

      this._block_to_be_produced_next = this._block_to_be_produced_next.addn(1);
    }

    this._producing_blocks_blocks = false;
  }
}
