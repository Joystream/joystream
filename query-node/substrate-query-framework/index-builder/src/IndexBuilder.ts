// @ts-check

import { getRepository, getConnection } from 'typeorm';
import * as BN from 'bn.js';

import {
  QueryBlockProducer,
  QueryEventProcessingPack,
  QueryEventBlock,
  ISubstrateQueryService,
  SavedEntityEvent,
  makeDatabaseManager,
  QueryEvent,
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
  private _indexedBlocksQueue = new Set<BN>();

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
    // check state

    // STORE THIS SOMEWHERE
    //this._producer.on('QueryEventBlock', (query_event_block: QueryEventBlock) => {
    //  this._onQueryEventBlock(query_event_block);
    //});

    debug('Spawned worker.');

    if (atBlock) {
      debug(`Got block height hint: ${atBlock.toString()}`);
    }
    
    const lastProcessedEvent = await getRepository(SavedEntityEvent).findOne({ where: { id: 1 } });

    if (lastProcessedEvent) {
      debug(`Found the most recent processed event at block ${lastProcessedEvent.blockNumber.toString()}`);
    }

    if (atBlock && lastProcessedEvent) {
      debug(
        `WARNING! Existing processed history detected on the database!
        Last processed block is ${lastProcessedEvent.blockNumber.toString()}. The indexer 
        will continue from block ${lastProcessedEvent.blockNumber.toString()} and ignore the block height hints.`
      );
    }

    // if (lastProcessedEvent) {
    //   this.lastProcessedEvent = lastProcessedEvent;
    //   await this._producer.start(this.lastProcessedEvent.blockNumber, this.lastProcessedEvent.index);
    // } else {
    //   // Setup worker
    //   await this._producer.start(atBlock);
    // }

    this._indexerHead = await this._restoreIndexerHead();
    debug(`Last processed block in the database: ${this._indexerHead.toString()}`);
    await this._producer.start(this._indexerHead.addn(1));

    // for await (const eventBlock of this._producer.blocks()) {
    //   try {
    //     await this._onQueryEventBlock(eventBlock);
    //   } catch (e) {
    //     throw new Error(e);
    //   }
    //   debug(`Successfully processed block ${eventBlock.block_number.toString()}`)
    // }

    const poolExecutor = new PooledExecutor(100, this._producer.blockHeights(), this._processBlock());

    await poolExecutor.run(() => this._stopped);

    debug('Started worker.');
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

      this._indexedBlocksQueue.add(h);
      this._updateIndexerHead();
    }
  }

  private _updateIndexerHead(): void {
    let nextHead = this._indexerHead.addn(1);
    while (this._indexedBlocksQueue.has(nextHead)) {
      this._indexerHead = nextHead;
      debug(`Updated indexer head to ${this._indexerHead.toString()}`);
      this._indexedBlocksQueue.delete(nextHead);
      nextHead = nextHead.addn(1);
    }
  }

  public get indexerHead(): BN {
    return this._indexerHead;
  }

  async _onQueryEventBlock(query_event_block: QueryEventBlock): Promise<void> {
    debug(`Yay, block producer at height: #${query_event_block.block_number.toString()}`);

    await asyncForEach(query_event_block.query_events, async (query_event: QueryEvent, i: number) => {
      
      debug(`Processing event ${query_event.event_name}, index: ${i}`)
      query_event.log(0, debug);
  
      await doInTransaction(async (queryRunner) => {
        // Call event handler
        if (this._processing_pack[query_event.event_method]) {
          debug(`Recognized: ` + query_event.event_name);
          await this._processing_pack[query_event.event_method](makeDatabaseManager(queryRunner.manager), query_event);
        } else {
          debug(`No mapping for  ${query_event.event_name}, skipping`);
        }
        // Update last processed event
        await SavedEntityEvent.update(query_event, queryRunner.manager);
      })
    });
  }
}

async function asyncForEach<T>(array: Array<T>, callback: (o: T, i: number, a: Array<T>) => Promise<void>): Promise<void> {
  for (let index = 0; index < array.length; index++) {
    await callback(array[index], index, array);
  }
}
