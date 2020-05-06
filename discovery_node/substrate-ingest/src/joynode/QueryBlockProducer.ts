import ISubstrateQueryService from './ISubstrateQueryService';
import QueryEvent from './QueryEvent';
import QueryEventBlock from './QueryEventBlock';
import { Header, Extrinsic, EventRecord, SignedBlock, Hash } from '@polkadot/types/interfaces';
import { Codec } from '@polkadot/types/types';
import { EventEmitter } from 'events';
import * as assert from 'assert';
const logger = require('log4js').getLogger('producer');

// TODO: read off the config
const NEW_BLOCK_POLL_INTERVAL_MS = 5000;

export default class QueryBlockProducer extends EventEmitter {
    private _started: boolean;
    private _producing_blocks_blocks: boolean;
    private readonly _query_service: ISubstrateQueryService;
    private _new_heads_unsubscriber: () => void;
    private _block_to_be_produced_next: number;
    private _height_of_chain: number;

    constructor(query_service: ISubstrateQueryService) {
        super();

        this._started = false;
        this._producing_blocks_blocks = false;
        this._query_service = query_service;

        // TODO
        // need to set this up, when state is better, it
        // will be refactored
        this._new_heads_unsubscriber = () => { };

        this._block_to_be_produced_next = 0;
        this._height_of_chain = 0;
    }

    // TODO: We cannot assume first block has events... we need more robust logic.
    async start(at_block?: number) {
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

        
        this._new_heads_unsubscriber = await this._query_service.subscribeNewHeads((header) => {
            this._height_of_chain = header.number.toNumber();
            logger.debug(`New block found at height #${this._height_of_chain}`)
        });

        // Start producing blocks right away
        //if (!this._producing_blocks_blocks) this._produce_blocks();
        // starts the loop producing new blocks
        await this._produce_next_block();
    }

    async stop() {
        if (!this._started) throw new Error(`Cannot stop when not already started.`);

        // THIS IS VERY CRUDE, NEED TO MANAGE LOTS OF STUFF HERE!

        (await this._new_heads_unsubscriber)();

        this._started = false;
    }

    // private _OnNewHeads(header: Header): void {
    //      assert(this._started, 'Has to be started to process new heads.');

    //      this._height_of_chain = header.number.toNumber();

    //      logger.debug(`New block found at height #${this._height_of_chain}`);

    // }

    private async _produce_next_block() { 
        if (!this._started) {
            logger.info("Block producer is not started");
            return;
        }

        let height = this._block_to_be_produced_next;
        let block_hash_of_target = await this.getBlockHashOrWait(height);
        let records = await this._query_service.eventsAt(block_hash_of_target);
        logger.debug(`\tRead ${records.length} events of the block at height ${height}.`);

        let signed_block = await this._query_service.getBlock(block_hash_of_target);
        logger.debug(`\tFetched full block at height ${height}.`);    
        
        this.publish_block_envent(signed_block, records);
        this._block_to_be_produced_next++;
        
        await this._produce_next_block();
             
    }

    private async getBlockHashOrWait(height: number): Promise<Hash> {
        return new Promise<Hash>((resolve, reject) => {
            if (!this._started) {
                reject("The block producer is stopped")
            }
            let checkHeight = () => {
                if (this._height_of_chain >= height) {
                    this._query_service.getBlockHash(height)
                        .then((h: Hash) => resolve(h))
                        .catch((e) => reject(e));
                } else {
                    logger.debug(`Current chain height: ${this._height_of_chain}, waiting for: ${height}`);
                    setTimeout(checkHeight, NEW_BLOCK_POLL_INTERVAL_MS);
                }    

            }
            checkHeight();
        });
    }

    private publish_block_envent(signed_block: SignedBlock, records: EventRecord[] & Codec):void {
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

                    let query_event = new QueryEvent(record, extrinsic);

                    // Logging
                    query_event.log(0, (x) => logger.debug(x));

                    return query_event;
                }
            );

            let query_block = new QueryEventBlock(this._block_to_be_produced_next, query_events);
            this.emit('QueryEventBlock', query_block);
            logger.debug(`\tEmitted query event block.`);
    }


    
}