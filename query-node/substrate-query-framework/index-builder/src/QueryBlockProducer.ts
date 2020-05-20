import ISubstrateQueryService from './ISubstrateQueryService';
import QueryEvent from './QueryEvent';
import QueryEventBlock from './QueryEventBlock';
import { Header, Extrinsic, EventRecord } from '@polkadot/types/interfaces';
import { EventEmitter } from 'events';
import * as assert from 'assert';

const DEBUG_TOPIC = 'index-builder:producer';

var debug = require('debug')(DEBUG_TOPIC);

export default class QueryBlockProducer extends EventEmitter {
  private _started: boolean;

  private _producing_blocks_blocks: boolean;

  private readonly _query_service: ISubstrateQueryService;

  private _new_heads_unsubscriber: () => void;

  private _block_to_be_produced_next: number;

  // Index of the last processed event
  private _last_processed_event_index: number;

  private _height_of_chain: number;

  constructor(query_service: ISubstrateQueryService) {
    super();

    this._started = false;
    this._producing_blocks_blocks = false;
    this._query_service = query_service;

    // TODO
    // need to set this up, when state is better, it
    // will be refactored
    this._new_heads_unsubscriber = () => {};

    this._block_to_be_produced_next = 0;
    this._height_of_chain = 0;
    this._last_processed_event_index = 0;
  }

  // TODO: We cannot assume first block has events... we need more robust logic.
  async start(at_block?: number, at_event_index?: number) {
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
        return header.number.toNumber();
      });

    if (at_block) {
      this._block_to_be_produced_next = at_block;

      if (this._height_of_chain < at_block) throw Error(`Provided block is ahead of chain.`);
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

    this._height_of_chain = header.number.toNumber();

    debug(`New block found at height #${this._height_of_chain}`);

    if (!this._producing_blocks_blocks) await this._produce_blocks();
  }

  private async _produce_blocks() {
    assert(!this._producing_blocks_blocks, 'Cannot already be producing blocks.');

    this._producing_blocks_blocks = true;

    // Continue as long as we know there are outstanding blocks.
    while (this._block_to_be_produced_next <= this._height_of_chain) {
      debug(`Fetching block #${this._block_to_be_produced_next}`);

      let block_hash_of_target = await this._query_service.getBlockHash(this._block_to_be_produced_next);
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

      // This will run only once when at_block provided. And remove already processed events from the list.
      if (this._last_processed_event_index !== 0) {
        query_events = query_events.filter((event) => this._last_processed_event_index < event.index);
        this._last_processed_event_index = 0;
      }

      let query_block = new QueryEventBlock(this._block_to_be_produced_next, query_events);

      this.emit('QueryEventBlock', query_block);

      debug(`\tEmitted query event block.`);

      this._block_to_be_produced_next++;
    }

    this._producing_blocks_blocks = false;
  }
}
