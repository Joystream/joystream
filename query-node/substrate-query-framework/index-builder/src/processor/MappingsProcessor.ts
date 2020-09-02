import { QueryEventProcessingPack, makeDatabaseManager, SubstrateEvent } from '..';
import { Codec } from '@polkadot/types/types';
import Debug from 'debug';
import { getRepository, QueryRunner, In, MoreThan } from 'typeorm';
import { doInTransaction } from '../db/helper';
import { SubstrateEventEntity } from '../entities';
import { numberEnv } from '../utils/env-flags';
import { getIndexerHead, getLastProcessedEvent } from '../db/dal';
import { ProcessedEventsLogEntity } from '../entities/ProcessedEventsLogEntity';

const debug = Debug('index-builder:processor');

const DEFAULT_PROCESSOR_NAME = 'hydra';

const BATCH_SIZE = numberEnv('PROCESSOR_BATCH_SIZE') || 10;
// Interval at which the processor pulls new blocks from the database
// The interval is reasonably large by default. The trade-off is the latency 
// between the updates and the load to the database
const PROCESSOR_BLOCKS_POLL_INTERVAL = numberEnv('PROCESSOR_BLOCKS_POLL_INTERVAL') || 2000; // 1 second

export default class MappingsProcessor {
  private _processing_pack!: QueryEventProcessingPack;
  
  private _lastEventIndex = SubstrateEventEntity.formatId(0, -1);
  
  private _started = false;
  private _indexerHead!: number;

  private constructor(processing_pack: QueryEventProcessingPack) {
    this._processing_pack = processing_pack;
  }


  static create(processing_pack: QueryEventProcessingPack): MappingsProcessor {
    return new MappingsProcessor(processing_pack);
  }


  async start(atBlock?: number): Promise<void> { 
    debug('Spawned the processor');

    await this.init(atBlock)

    this._started = true;

    for await (const events of this._streamEventsToProcess()) {
      try {
        debug(`Processing new batch of events of size: ${events.length}`);
        if (events.length > 0) {
          await this._onQueryEventBlock(events);
        } else {
          // If there is nothing to process, wait and update the indexer head
          await new Promise(resolve => setTimeout(resolve, PROCESSOR_BLOCKS_POLL_INTERVAL));
          this._indexerHead = await getIndexerHead();
          debug(`Updated indexer head to ${this._indexerHead}`);
        }
        //debug(`Next batch starts from height ${this._blockToProcessNext.toString()}`);
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

  async * _streamEventsToProcess(): AsyncGenerator<SubstrateEventEntity[]> {
    while (this._started) {
      // scan up to the indexer head or a big chunk whatever is closer
      yield await getRepository(SubstrateEventEntity).find({ 
        relations: ["extrinsic"],
        where: [
          {
            id: MoreThan(this._lastEventIndex),
            method: In(Object.keys(this._processing_pack)),
          }],
        order: {
          id: 'ASC'
        },
        take: BATCH_SIZE
      })
      //this._blockToProcessNext = upperBound + 1;
    }
    debug(`The processor has been stopped`);
  }

  private convert(qee: SubstrateEventEntity): SubstrateEvent {
    const params: { [key: string]: Codec } = {};
    qee.params.map((p) => {
      params[p.type] = (p.value as unknown) as Codec;
    })
    return {
      event_name: qee.name,
      event_method: qee.method,
      event_params: params,
      index: qee.index,
      block_number: qee.blockNumber,
      extrinsic: qee.extrinsic
    } as SubstrateEvent;
  }

  async _onQueryEventBlock(query_event_block: SubstrateEventEntity[]): Promise<void> {
    //debug(`Yay, block producer at height: #${query_event_block.block_number.toString()}`);

    await doInTransaction(async (queryRunner: QueryRunner) => {
      await asyncForEach(query_event_block, async (query_event: SubstrateEventEntity) => {
      
        debug(`Processing event ${query_event.name}, 
          method: ${query_event.method}, 
          block: ${query_event.blockNumber.toString()},
          index: ${query_event.index}`)

        debug(`JSON: ${JSON.stringify(query_event, null, 2)}`);  
        //query_event.log(0, debug);
    
        await this._processing_pack[query_event.method](makeDatabaseManager(queryRunner.manager), this.convert(query_event));
        
        const processed = new ProcessedEventsLogEntity();
        processed.processor = DEFAULT_PROCESSOR_NAME;
        processed.eventId = query_event.id;
        processed.updatedAt = new Date();

        const lastSavedEvent = await getRepository('ProcessedEventsLogEntity').save(processed);
        this._lastEventIndex = query_event.id;

        debug(`Last saved event: ${JSON.stringify(lastSavedEvent, null, 2)}`);
      });
      
    });
  }


  private async init(atBlock?: number): Promise<void> {
    if (atBlock) {
      debug(`Got block height hint: ${atBlock}`);
    }
    
    const lastProcessedEvent = await getLastProcessedEvent(DEFAULT_PROCESSOR_NAME);

    if (lastProcessedEvent) {
      debug(`Found the most recent processed event ${lastProcessedEvent.eventId}`);
      this._lastEventIndex = lastProcessedEvent.eventId;
    } 

    if (atBlock && lastProcessedEvent) {
      debug(
        `WARNING! Existing processed history detected on the database!
        Last processed event id ${this._lastEventIndex}. The indexer 
        will continue from block ${this._lastEventIndex.split('-')[0]} and ignore the block height hint.`
      );
    }
    
    //debug(`Starting the processor from ${this._blockToProcessNext}`);

    this._indexerHead = await getIndexerHead();
    debug(`Current indexer head: ${this._indexerHead}`);
  }
}

async function asyncForEach<T>(array: Array<T>, callback: (o: T, i: number, a: Array<T>) => Promise<void>): Promise<void> {
  for (let index = 0; index < array.length; index++) {
    await callback(array[index], index, array);
  }
}
