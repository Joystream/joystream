import * as dotenv from 'dotenv'
// we should set env variables before all other imports to
// avoid config errors or warthog caused by DI
dotenv.config({ path: './test/.env' })
import { expect } from 'chai'
import { describe } from 'mocha'
import { IndexBuilder, QueryEventBlock, QueryNodeManager } from '../../src'
import Container from 'typedi'
import { IndexerStatusService, IBlockProducer } from '../../src/indexer'
import { sleep, waitForAsync } from '../../src/utils/wait-for'
import Debug from 'debug'
import { RedisRelayer } from '../../src/indexer/RedisRelayer'
import { RedisClientFactory } from '../../src/redis/RedisClientFactory'
import { blockPayload, queryEventBlock } from '../fixtures/mock-factory'
import { EVENT_TOTAL } from '../../src/indexer/redis-keys'
import { clearRedis, resetDb } from './setup-db'

const debug = Debug('index-builder:status-service-test')
const FINAL_CHAIN_HEIGHT = 7

class MockBlockProducer implements IBlockProducer<QueryEventBlock> {
  private height = 0

  async fetchBlock(height: number): Promise<QueryEventBlock> {
    debug(`Fetched mock block at height ${height}`)
    await sleep(100)
    return queryEventBlock(height)
  }

  async *blockHeights(): AsyncGenerator<number> {
    // we announce 7 blocks every 5 ms and then die
    while (this.height <= FINAL_CHAIN_HEIGHT) {
      yield this.height
      await sleep(5) //
      this.height++
    }
  }

  async start(height: number): Promise<void> {
    await sleep(10)
    debug(`Stated at height ${height}`)
  }

  async stop(): Promise<void> {
    await sleep(10)
    debug('Stopped')
  }
}

describe('IndexerStatusService', () => {
  let indexBuilder: IndexBuilder
  let statusService: IndexerStatusService

  beforeEach(async () => {
    await sleep(300)
    await clearRedis()
    await resetDb()

    Container.reset()
    const producer = new MockBlockProducer()
    Container.set('BlockProducer', producer)
    Container.set('RedisClientFactory', new RedisClientFactory())
    statusService = new IndexerStatusService()
    Container.set('StatusService', statusService)
    indexBuilder = new IndexBuilder(producer, statusService)
    Container.set('IndexBuilder', indexBuilder)
    Container.set('RedisRelayer', new RedisRelayer())
  })

  afterEach(async () => {
    console.log('Cleaning up')
    await QueryNodeManager.cleanUp()
  })

  it('should properly update indexer heads', async () => {
    await statusService.onBlockComplete(blockPayload(0))
    await statusService.onBlockComplete(blockPayload(1))
    await statusService.onBlockComplete(blockPayload(2))
    await statusService.onBlockComplete(blockPayload(3))
    await statusService.onBlockComplete(blockPayload(5))
    await statusService.onBlockComplete(blockPayload(6))
    await statusService.onBlockComplete(blockPayload(7))

    let head = await statusService.getIndexerHead()
    // see MockBlockProducer for the block times
    expect(head).equals(3, `Block 4 is not processed yet`) // block no 4 is slow, so the indexer head is at height 3
    await statusService.onBlockComplete(blockPayload(4)) // now wait for block no 4 to be finished
    head = await statusService.getIndexerHead()
    expect(head).equals(7, `The indexer should eventually process all blockcs`)
  })

  it('should count events', async () => {
    await indexBuilder.start()
    // wait until all blocks are produced
    await waitForAsync(
      async () => {
        const head = await statusService.getIndexerHead()
        return head == FINAL_CHAIN_HEIGHT
      },
      undefined,
      300
    )
    await sleep(300)

    const redisClient = Container.get<RedisClientFactory>(
      'RedisClientFactory'
    ).getClient()
    const totalEventsVal = (await redisClient.hget(EVENT_TOTAL, 'ALL')) || '0'
    const totalEvents = Number.parseInt(totalEventsVal)
    // we start with heigh 0, so FINAL_CHAIN_HEIGHT + 1 blocks in total
    expect(totalEvents).equals(
      (FINAL_CHAIN_HEIGHT + 1) * 3,
      `There are ${FINAL_CHAIN_HEIGHT + 1} blocks with 3 events each`
    )
  })
})
