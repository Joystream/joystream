// @ts-check

import { getConnection } from 'typeorm';
import * as BN from 'bn.js';

import {
  QueryBlockProducer,
  QueryEventProcessingPack,
  QueryEventBlock,
  ISubstrateQueryService,
  SavedEntityEvent,
} from '.';

import Debug from 'debug';
import { doInTransaction } from './db/helper';
import { PooledExecutor } from './PooledExecutor';
import { QueryEventEntity } from './entities/QueryEventEntity';

const debug = Debug('index-builder:indexer');

export default class IndexBuilder {
  private _producer: QueryBlockProducer;
  private _stopped = false;

  private _indexerHead: BN = new BN(-1);

  // set containing the indexer block heights that are ahead 
  // of the current indexer head
  private _recentlyIndexedBlocks = new Set<BN>();

  private _processing_pack!: QueryEventProcessingPack;

  private lastProcessedEvent!: SavedEntityEvent;

  private constructor(producer: QueryBlockProducer, processing_pack: QueryEventProcessingPack) {
    this._producer = producer;
    this._processing_pack = processing_pack;
  }

  static create(service: ISubstrateQueryService, processing_pack: QueryEventProcessingPack): IndexBuilder {
    const producer = new QueryBlockProducer(service);

    return new IndexBuilder(producer, processing_pack);
  }

  async start(atBlock?: BN): Promise<void> {
    debug('Spawned worker.');

    this._indexerHead = await this._restoreIndexerHead();
    debug(`Last indexed block in the database: ${this._indexerHead.toString()}`);
    let startBlock = this._indexerHead.addn(1);
    
    if (atBlock) {
      debug(`Got block height hint: ${atBlock.toString()}`);
      if (this._indexerHead.gten(0) && process.env.FORCE_BLOCK_HEIGHT !== 'true') {
        debug(
          `WARNING! The database contains indexed blocks.
          The last indexed block height is ${this._indexerHead.toString()}. The indexer 
          will continue from block ${this._indexerHead.toString()} ignoring the start 
          block height hint. Set the environment variable FORCE_BLOCK_HEIGHT to true 
          if you want to start from ${atBlock.toString()} anyway.`
        );
      } else {
        startBlock = BN.max(startBlock, atBlock);
        this._indexerHead = startBlock.addn(-1);
      }
    }

    debug(`Starting the block indexer at block ${startBlock.toString()}`);

    await this._producer.start(startBlock);

    const poolExecutor = new PooledExecutor(100, this._producer.blockHeights(), this._processBlock());
    
    debug('Started a pool of indexers.');

    await poolExecutor.run(() => this._stopped);

  }

  async stop(): Promise<void> { 
    return new Promise<void>((resolve) => {
      debug('Index builder has been stopped (NOOP)');
      this._stopped = true;
      resolve();
    });
  }


  async _restoreIndexerHead(): Promise<BN> {
    const qr = getConnection().createQueryRunner();
    // take the first block such that next one has not yet been saved
    const rawRslts = await qr.query(`
      SELECT MIN(stats.block_number) as blk FROM 
        (SELECT q.id, q.block_number, n.id as next 
          FROM query_event_entity q 
          LEFT JOIN query_event_entity n 
          ON q.block_number + 1 = n.block_number) stats 
      WHERE stats.next is NULL
    `) as Array<any>; 
    
    if ((rawRslts === undefined) || (rawRslts.length === 0)) {
      return new BN(-1);
    }     

    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const blk = rawRslts[0].blk as number;
    console.debug(`Got blknum: ${JSON.stringify(blk, null, 2)}`);
    
    return (blk) ? new BN(blk) : new BN(-1);
  }

  _processBlock(): (h: BN) => Promise<void> {
    return async (h: BN) => {
      debug(`Processing block #${h.toString()}`);  
      const queryEventsBlock: QueryEventBlock = await this._producer.fetchBlock(h);
      
      debug(`Read ${queryEventsBlock.query_events.length} events`);  
      
      const qeEntities: QueryEventEntity[] = queryEventsBlock.query_events.map(
        (qe) => QueryEventEntity.fromQueryEvent(qe));
      
      await doInTransaction(async (queryRunner) => {
        debug(`Saving query event entities`);
        await queryRunner.manager.save(qeEntities);
        debug(`Done block #${h.toString()}`);
      });

      this._recentlyIndexedBlocks.add(h);
      this._updateIndexerHead();
    }
  }

  private _updateIndexerHead(): void {
    let nextHead = this._indexerHead.addn(1);
    debug(`Next indexer head: ${nextHead.toString()}`);
    while (this._recentlyIndexedBlocks.has(nextHead)) {
      this._indexerHead = nextHead;
      debug(`Updated indexer head to ${this._indexerHead.toString()}`);
      // remove from the set as we don't need to keep it anymore
      this._recentlyIndexedBlocks.delete(nextHead);
      nextHead = nextHead.addn(1);
    }
  }

  public get indexerHead(): BN {
    return this._indexerHead;
  }
  
}
