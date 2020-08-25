import { QueryEventProcessingPack, SavedEntityEvent, makeDatabaseManager, IndexBuilder, SubstrateEvent } from '..';
import * as BN from 'bn.js';
import { Codec } from '@polkadot/types/types';
import Debug from 'debug';
import { getRepository, QueryRunner, Between, In } from 'typeorm';
import { doInTransaction } from '../db/helper';
import { QueryEventEntity } from '../entities/QueryEventEntity';
import { waitFor } from '../utils/wait-for';

const debug = Debug('index-builder:processor');


// Time between checks if the head of the chain is beyond the
// most recently produced block. Set it to 199 to have round numbers by default
const LOOK_AHEAD_BLOCKS = 199;

export default class MappingsProcessor {
  private _processing_pack!: QueryEventProcessingPack;
  private _blockToProcessNext!: BN;
  
  private _indexer!: IndexBuilder;
  private _started = false;

  private constructor(indexer: IndexBuilder, processing_pack: QueryEventProcessingPack) {
    this._indexer = indexer;
    this._processing_pack = processing_pack;
  }


  static create(indexer: IndexBuilder, processing_pack: QueryEventProcessingPack): MappingsProcessor {
    return new MappingsProcessor(indexer, processing_pack);
  }



  async start(atBlock?: BN): Promise<void> { 
    debug('Spawned the processor');

    this._blockToProcessNext = new BN(0); // default

    if (atBlock) {
      debug(`Got block height hint: ${atBlock.toString()}`);
      this._blockToProcessNext = atBlock;
    }
    
    const lastProcessedEvent = await getRepository(SavedEntityEvent).findOne({ where: { id: 1 } });

    if (lastProcessedEvent) {
      debug(`Found the most recent processed event at block ${lastProcessedEvent.blockNumber.toString()}`);
      this._blockToProcessNext = lastProcessedEvent?.blockNumber.addn(1);
    }

    if (atBlock && lastProcessedEvent) {
      debug(
        `WARNING! Existing processed history detected on the database!
        Last processed block is ${lastProcessedEvent.blockNumber.toString()}. The indexer 
        will continue from block ${lastProcessedEvent.blockNumber.toString()} and ignore the block height hint.`
      );
    }
    
    debug(`Starting the processor from ${this._blockToProcessNext.toString()}`);
    
    this._started = true;

    for await (const events of this._streamEventsToProcess()) {
      try {
        debug(`Processing new batch of events of size: ${events.length}`);
        if (events.length > 0) {
          await this._onQueryEventBlock(events);
        }
        debug(`Next batch starts from height ${this._blockToProcessNext.toString()}`);
      } catch (e) {
        console.error(`Stopping the proccessor due to errors: ${JSON.stringify(e, null, 2)}`);
        this.stop();
        debug(`Error: ${JSON.stringify(e, null, 2)}`);
        throw new Error(e);
      }
    }
  }

  public stop(): void {
    this._started = false;
  }

  async * _streamEventsToProcess(): AsyncGenerator<QueryEventEntity[]> {
    while (this._started) {
      await this.waitForIndexerHead();
      // scan up to the indexer head or a big chunk whatever is closer
      const upperBound = BN.min(this._blockToProcessNext.addn(LOOK_AHEAD_BLOCKS), this._indexer.indexerHead);
      yield await getRepository(QueryEventEntity).find({ 
        relations: ["extrinsic"],
        where: {
          blockNumber: Between(this._blockToProcessNext.toNumber(), upperBound.toNumber()),
          method: In(Object.keys(this._processing_pack)),
        },
        order: {
          blockNumber: 'ASC',
          index: 'ASC'
        }
      })
      this._blockToProcessNext = upperBound.addn(1);
    }
    debug(`The processor has been stopped`);
  }

  // Wait until the next block is indexed
  private async waitForIndexerHead(): Promise<void> {
    return await waitFor(
      // when to resolve
      () => {
        debug(`Indexer head: ${this._indexer.indexerHead.toString()}, Processor head: ${this._blockToProcessNext.toString()}`);
        return this._blockToProcessNext.lte(this._indexer.indexerHead)
      },
      //exit condition
      () => !this._started )
    
  }

  private convert(qee: QueryEventEntity): SubstrateEvent {
    const params: { [key: string]: Codec } = {};
    qee.params.map((p) => {
      params[p.type] = (p.value as unknown) as Codec;
    })
    return {
      event_name: qee.name,
      event_method: qee.method,
      event_params: params,
      index: new BN(qee.index),
      block_number: new BN(qee.blockNumber),
      extrinsic: qee.extrinsic
    } as SubstrateEvent;
  }

  async _onQueryEventBlock(query_event_block: QueryEventEntity[]): Promise<void> {
    //debug(`Yay, block producer at height: #${query_event_block.block_number.toString()}`);

    await doInTransaction(async (queryRunner: QueryRunner) => {
      await asyncForEach(query_event_block, async (query_event: QueryEventEntity) => {
      
        debug(`Processing event ${query_event.name}, 
          method: ${query_event.method}, 
          block: ${query_event.blockNumber.toString()},
          index: ${query_event.index}`)

        debug(`JSON: ${JSON.stringify(query_event, null, 2)}`);  
        //query_event.log(0, debug);
    
        await this._processing_pack[query_event.method](makeDatabaseManager(queryRunner.manager), this.convert(query_event));
        await SavedEntityEvent.update(({
          block_number: new BN(query_event.blockNumber),
          event_name: query_event.name,
          event_method: query_event.method,
          event_params: {},
          index: new BN(query_event.index)
        }) as SubstrateEvent, queryRunner.manager);
  
      });
      
    });

  }
}

async function asyncForEach<T>(array: Array<T>, callback: (o: T, i: number, a: Array<T>) => Promise<void>): Promise<void> {
  for (let index = 0; index < array.length; index++) {
    await callback(array[index], index, array);
  }
}
