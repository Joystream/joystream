import { QueryEventProcessingPack, makeDatabaseManager, SubstrateEvent } from '..';
import { Codec } from '@polkadot/types/types';
import Debug from 'debug';
import { getRepository, QueryRunner, In, MoreThan } from 'typeorm';
import { doInTransaction } from '../db/helper';
import { SubstrateEventEntity } from '../entities';
import { numberEnv } from '../utils/env-flags';
import { getIndexerHead, getLastProcessedEvent } from '../db/dal';
import { ProcessedEventsLogEntity } from '../entities/ProcessedEventsLogEntity';
import { ProcessorOptions } from '../QueryNodeStartOptions';

const debug = Debug('index-builder:processor');

const DEFAULT_PROCESSOR_NAME = 'hydra';

const BATCH_SIZE = numberEnv('PROCESSOR_BATCH_SIZE') || 10;
// Interval at which the processor pulls new blocks from the database
// The interval is reasonably large by default. The trade-off is the latency 
// between the updates and the load to the database
const PROCESSOR_BLOCKS_POLL_INTERVAL = numberEnv('PROCESSOR_BLOCKS_POLL_INTERVAL') || 2000; // 1 second

// mapping name is the same as the event name: <section>_<method>
const DEFAULT_MAPPINGS_TRANSLATOR = (m: string) => m;

export default class MappingsProcessor {
  
  private _lastEventIndex = SubstrateEventEntity.formatId(0, -1);
  private _started = false;
  
  private _options!: ProcessorOptions;
  private _processingPack: QueryEventProcessingPack;
  private _translator = DEFAULT_MAPPINGS_TRANSLATOR;
  private _name = DEFAULT_PROCESSOR_NAME;
  private _indexerHead!: number;
  private _events: string[] = [];

  private constructor(options: ProcessorOptions) {
    this._options = options;
    this._translator = options.mappingToEventTranslator || DEFAULT_MAPPINGS_TRANSLATOR;
    this._name = options.name || DEFAULT_PROCESSOR_NAME;
    this._processingPack = options.processingPack;
    this._events = Object.keys(this._processingPack).map((mapping:string) => this._translator(mapping));
  }


  static create(options: ProcessorOptions): MappingsProcessor {
    return new MappingsProcessor(options);
  }


  async start(): Promise<void> { 
    debug('Spawned the processor');
    debug(`The following events will be processed: ${JSON.stringify(this._events, null, 2)}`);

    await this.init(this._options.atBlock)

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
            name: In(this._events),
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
      await asyncForEach(query_event_block, async (event: SubstrateEventEntity) => {
      
        debug(`Processing event ${event.name}, 
          id: ${event.id}`)

        debug(`JSON: ${JSON.stringify(event, null, 2)}`);  
        //query_event.log(0, debug);
    
        await this._processingPack[event.name](makeDatabaseManager(queryRunner.manager), this.convert(event));
        
        const processed = new ProcessedEventsLogEntity();
        processed.processor = this._name;
        processed.eventId = event.id;
        processed.updatedAt = new Date();

        const lastSavedEvent = await getRepository('ProcessedEventsLogEntity').save(processed);
        this._lastEventIndex = event.id;

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
