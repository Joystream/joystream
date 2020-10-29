import { ISubstrateService } from '../substrate'
import { IQueryEvent, QueryEventBlock, QueryEvent } from '../model'
import { Header, Extrinsic } from '@polkadot/types/interfaces'
import * as assert from 'assert'

import Debug from 'debug'
import { UnsubscribePromise } from '@polkadot/api/types'
import { waitFor, retry, withTimeout } from '../utils/wait-for'
import { ConstantBackOffStrategy } from '../utils/BackOffStategy'
import { IBlockProducer } from './IBlockProducer'
import { Service, Inject } from 'typedi'
import {
  BLOCK_PRODUCER_FETCH_RETRIES,
  NEW_BLOCK_TIMEOUT_MS,
} from './indexer-consts'

const DEBUG_TOPIC = 'index-builder:producer'

const debug = Debug(DEBUG_TOPIC)

@Service('BlockProducer')
export class BlockProducer implements IBlockProducer<QueryEventBlock> {
  private _started: boolean

  private _newHeadsUnsubscriber: UnsubscribePromise | undefined

  private _blockToProduceNext: number

  private _chainHeight: number

  @Inject('SubstrateService')
  private readonly substrateService!: ISubstrateService

  constructor() {
    this._started = false
    this._newHeadsUnsubscriber = undefined

    this._blockToProduceNext = 0
    this._chainHeight = 0
  }

  async start(atBlock?: number): Promise<void> {
    assert(this.substrateService, 'SubstrateService must be set')
    if (this._started) throw Error(`Cannot start when already started.`)

    // mark as started
    this._started = true

    // Try to get initial header right away
    const finalizedHeadHash = await this.substrateService.getFinalizedHead()
    const header = await this.substrateService.getHeader(finalizedHeadHash)
    this._chainHeight = header.number.toNumber()

    if (atBlock) {
      this._blockToProduceNext = atBlock

      if (atBlock > this._chainHeight)
        throw Error(`Provided block is ahead of chain.`)
    }

    //
    this._newHeadsUnsubscriber = this.substrateService.subscribeNewHeads(
      (header) => {
        this._OnNewHeads(header)
      }
    )

    debug(
      `Starting the block producer, next block: ${this._blockToProduceNext.toString()}`
    )
  }

  async stop(): Promise<void> {
    if (!this._started) {
      debug('Block producer is not started')
      return
    }

    // THIS IS VERY CRUDE, NEED TO MANAGE LOTS OF STUFF HERE!
    if (this._newHeadsUnsubscriber) {
      (await this._newHeadsUnsubscriber)()
    }
    debug('Block producer has been stopped')
    this._started = false
  }

  private _OnNewHeads(header: Header) {
    assert(this._started, 'Has to be started to process new heads.')

    this._chainHeight = header.number.toNumber()

    debug(`New block found at height #${this._chainHeight.toString()}`)
  }

  public async fetchBlock(height: number): Promise<QueryEventBlock> {
    if (height > this._chainHeight) {
      throw new Error(
        `Cannot fetch block at height ${height}, current chain height is ${this._chainHeight}`
      )
    }
    return retry(
      () => this._doBlockProduce(height),
      BLOCK_PRODUCER_FETCH_RETRIES,
      new ConstantBackOffStrategy(1000 * 5)
    ) // retry after 5 seconds
  }

  /**
   * This sub-routine does the actual fetching and block processing.
   * It can throw errors which should be handled by the top-level code
   * (in this case _produce_block())
   */
  private async _doBlockProduce(height: number): Promise<QueryEventBlock> {
    debug(`Fetching block #${height.toString()}`)

    const targetHash = await this.substrateService.getBlockHash(
      height.toString()
    )
    debug(`\tHash ${targetHash.toString()}.`)

    const records = await this.substrateService.eventsAt(targetHash)

    debug(`\tRead ${records.length} events.`)

    let blockExtrinsics: Extrinsic[] = []
    const signedBlock = await this.substrateService.getBlock(targetHash)

    debug(`\tFetched full block.`)

    blockExtrinsics = signedBlock.block.extrinsics.toArray()
    const blockEvents: IQueryEvent[] = records.map(
      (record, index): IQueryEvent => {
        // Extract the phase, event
        const { phase } = record

        // Try to recover extrinsic: only possible if its right phase, and extrinsics arra is non-empty, the last constraint
        // is needed to avoid events from build config code in genesis, and possibly other cases.
        const extrinsic =
          phase.isApplyExtrinsic && blockExtrinsics.length
            ? blockExtrinsics[
                Number.parseInt(phase.asApplyExtrinsic.toString())
              ]
            : undefined

        const event = new QueryEvent(record, height, index, extrinsic)

        // Reduce log verbosity and log only if a flag is set
        if (process.env.LOG_QUERY_EVENTS) {
          event.log(0, debug)
        }

        return event
      }
    )

    const eventBlock = new QueryEventBlock(height, blockEvents)
    //this.emit('QueryEventBlock', query_block);
    debug(`Produced query event block.`)
    return eventBlock
  }

  private async checkHeightOrWait(): Promise<void> {
    return await withTimeout(
      waitFor(
        // when to resolve
        () => this._blockToProduceNext <= this._chainHeight,
        //exit condition
        () => !this._started
      ),
      `Timed out: no block has been produced within last ${NEW_BLOCK_TIMEOUT_MS} seconds`,
      NEW_BLOCK_TIMEOUT_MS
    )
  }

  public async *blockHeights(): AsyncGenerator<number> {
    while (this._started) {
      await this.checkHeightOrWait()
      debug(`Yield: ${this._blockToProduceNext.toString()}`)
      yield this._blockToProduceNext
      this._blockToProduceNext++
    }
  }
}
