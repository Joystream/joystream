// @ts-check
import { QueryEventBlock } from '../model'
import * as _ from 'lodash'

import Debug from 'debug'
import { doInTransaction } from '../db/helper'
import { PooledExecutor } from './PooledExecutor'
import { SubstrateEventEntity } from '../entities'
import { Inject, Service } from 'typedi'
import { BLOCK_START_CHANNEL, BLOCK_COMPLETE_CHANNEL } from './redis-keys'
import { IBlockProducer } from './IBlockProducer'
import { assert } from 'console'
import { EventEmitter } from 'events'
import { IStatusService } from './IStatusService'
import { WORKERS_NUMBER } from './indexer-consts'
import { toPayload } from '../model/BlockPayload'

const debug = Debug('index-builder:indexer')

@Service('IndexBuilder')
export class IndexBuilder extends EventEmitter {
  private _stopped = false

  public constructor(
    @Inject('BlockProducer')
    protected readonly producer: IBlockProducer<QueryEventBlock>,
    @Inject('StatusService') protected readonly statusService: IStatusService
  ) {
    super()
  }

  async start(atBlock?: number): Promise<void> {
    assert(this.producer, 'BlockProducer must be set')
    assert(this.statusService, 'StatusService must be set')

    debug('Spawned worker.')

    const lastHead = await this.statusService.getIndexerHead()

    debug(`Last indexed block in the database: ${lastHead.toString()}`)
    let startBlock = lastHead + 1

    if (atBlock) {
      debug(`Got block height hint: ${atBlock}`)
      if (lastHead >= 0 && process.env.FORCE_BLOCK_HEIGHT !== 'true') {
        debug(
          `WARNING! The database contains indexed blocks.
          The last indexed block height is ${lastHead}. The indexer 
          will continue from block ${lastHead} ignoring the start 
          block height hint. Set the environment variable FORCE_BLOCK_HEIGHT to true 
          if you want to start from ${atBlock} anyway.`
        )
      } else {
        startBlock = Math.max(startBlock, atBlock)
      }
    }

    debug(`Starting the block indexer at block ${startBlock}`)

    await this.producer.start(startBlock)

    const poolExecutor = new PooledExecutor(
      WORKERS_NUMBER,
      this.producer.blockHeights(),
      this._indexBlock()
    )

    debug('Started a pool of indexers.')

    try {
      await poolExecutor.run(() => this._stopped)
    } finally {
      await this.stop()
    }
  }

  async stop(): Promise<void> {
    debug('Index builder has been stopped')
    this._stopped = true
    await this.producer.stop()
  }

  _indexBlock(): (h: number) => Promise<void> {
    return async (h: number) => {
      debug(`Processing block #${h.toString()}`)

      const done = await this.statusService.isComplete(h)
      if (done) {
        debug(`Block ${h} has already been indexed`)
        return
      }

      this.emit(BLOCK_START_CHANNEL, {
        height: h,
      })

      const queryEventsBlock: QueryEventBlock = await this.producer.fetchBlock(
        h
      )

      await this.transformAndPersist(queryEventsBlock)
      debug(`Done block #${h.toString()}`)

      this.emit(BLOCK_COMPLETE_CHANNEL, toPayload(queryEventsBlock))
    }
  }

  async transformAndPersist(queryEventsBlock: QueryEventBlock): Promise<void> {
    const batches = _.chunk(queryEventsBlock.query_events, 100)
    debug(
      `Read ${queryEventsBlock.query_events.length} events; saving in ${batches.length} batches`
    )

    await doInTransaction(async (queryRunner) => {
      debug(`Saving event entities`)

      let saved = 0
      for (let batch of batches) {
        const qeEntities = batch.map((event) =>
          SubstrateEventEntity.fromQueryEvent(event)
        )
        await queryRunner.manager.save(qeEntities)
        saved += qeEntities.length
        batch = []
        debug(`Saved ${saved} events`)
      }
    })
  }
}
