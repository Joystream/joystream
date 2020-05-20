// @ts-check

import { getRepository, getConnection } from 'typeorm';

import {
  QueryBlockProducer,
  QueryEventProcessingPack,
  QueryEventBlock,
  ISubstrateQueryService,
  DB,
  SavedEntityEvent,
} from '.';

const debug = require('debug')('index-builder:indexer');

export default class IndexBuilder {
  private _producer: QueryBlockProducer;

  private _processing_pack!: QueryEventProcessingPack;

  private constructor(producer: QueryBlockProducer, processing_pack: QueryEventProcessingPack) {
    this._producer = producer;
    this._processing_pack = processing_pack;
  }

  static create(service: ISubstrateQueryService, processing_pack: QueryEventProcessingPack): IndexBuilder {
    const producer = new QueryBlockProducer(service);

    return new IndexBuilder(producer, processing_pack);
  }

  async start() {
    // check state

    // STORE THIS SOMEWHERE
    this._producer.on('QueryEventBlock', (query_event_block: QueryEventBlock): void => {
      this._onQueryEventBlock(query_event_block);
    });

    debug('Spawned worker.');

    // Get the last processed event
    // Should use db.get(SavedEntityEvent, {}) ???
    const savedEntityEvent = await getRepository(SavedEntityEvent).findOne();

    if (savedEntityEvent !== undefined) {
      await this._producer.start(savedEntityEvent.blockNumber);
    } else {
      // Setup worker
      await this._producer.start();
    }

    debug('Started worker.');
  }

  async stop() {}

  _onQueryEventBlock(query_event_block: QueryEventBlock): void {
    debug(`Yay, block producer at height: #${query_event_block.block_number}`);

    query_event_block.query_events.forEach(async (query_event, index) => {
      if (!this._processing_pack[query_event.event_method]) {
        debug(`Unrecognized: ` + query_event.event_name);

        query_event.log(0, debug);
      } else {
        debug(`Recognized: ` + query_event.event_name);

        const queryRunner = getConnection().createQueryRunner();
        try {
          // establish real database connection
          await queryRunner.connect();
          await queryRunner.startTransaction();

          const db = new DB(query_event, queryRunner.manager);

          // Call event handler
          await this._processing_pack[query_event.event_method](db);

          // Update last processed event
          await SavedEntityEvent.update(query_event, queryRunner.manager);

          await queryRunner.commitTransaction();
        } catch (error) {
          debug(`There are errors. Rolling back the transaction. Reason: ${error.message}`);

          // Since we have errors lets rollback changes we made
          await queryRunner.rollbackTransaction();
          throw new Error(error);
        } finally {
          // Query runner needs to be released manually.
          await queryRunner.release();
        }
      }
    });
  }
}
