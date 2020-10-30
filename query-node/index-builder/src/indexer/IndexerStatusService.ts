import Container, { Service } from 'typedi'
import { getIndexerHead as slowIndexerHead } from '../db/dal'
import Debug from 'debug'
import * as IORedis from 'ioredis'
import { logError } from '../utils/errors'
import { BlockPayload } from './../model'
import { stringifyWithTs } from '../utils/stringify'
import {
  INDEXER_HEAD_BLOCK,
  INDEXER_NEW_HEAD_CHANNEL,
  BLOCK_START_CHANNEL,
  BLOCK_COMPLETE_CHANNEL,
  EVENT_LAST,
  EVENT_TOTAL,
  BLOCK_CACHE_PREFIX,
} from './redis-keys'
import { IStatusService } from './IStatusService'
import { RedisClientFactory } from '../redis/RedisClientFactory'
import { BLOCK_CACHE_TTL_SEC, INDEXER_HEAD_TTL_SEC } from './indexer-consts'

const debug = Debug('index-builder:status-server')

@Service('StatusService')
export class IndexerStatusService implements IStatusService {
  private redisSub: IORedis.Redis
  private redisPub: IORedis.Redis
  private redisClient: IORedis.Redis

  constructor() {
    const clientFactory = Container.get<RedisClientFactory>(
      'RedisClientFactory'
    )
    this.redisSub = clientFactory.getClient()
    this.redisPub = clientFactory.getClient()
    this.redisClient = clientFactory.getClient()
    this.redisSub
      .subscribe([BLOCK_START_CHANNEL, BLOCK_COMPLETE_CHANNEL])
      .then(() => debug(`Subscribed to the indexer channels`))
      .catch((e) => {
        throw new Error(e)
      })

    this.redisSub.on('message', (channel, message) => {
      this.onNewMessage(channel, message).catch((e) => {
        throw new Error(`Error connecting to Redis: ${logError(e)}`)
      })
    })
  }

  async onBlockComplete(payload: BlockPayload): Promise<void> {
    if (await this.isComplete(payload.height)) {
      debug(`Ignoring ${payload.height}: already processed`)
      return
    }
    // TODO: move into a separate cache service and cache also events, extrinsics etc
    await this.updateBlockCache(payload)
    await this.updateIndexerHead()
    await this.updateLastEvents(payload)
  }

  async onNewMessage(channel: string, message: string): Promise<void> {
    if (channel === BLOCK_COMPLETE_CHANNEL) {
      const payload = JSON.parse(message) as BlockPayload
      await this.onBlockComplete(payload)
    }
  }

  async getIndexerHead(): Promise<number> {
    const headVal = await this.redisClient.get(INDEXER_HEAD_BLOCK)
    if (headVal !== null) {
      return Number.parseInt(headVal)
    }

    debug(`Redis cache is empty, loading from the database`)
    const _indexerHead = await this.slowIndexerHead()
    debug(`Loaded ${_indexerHead}`)
    await this.updateHeadKey(_indexerHead)
    return _indexerHead
  }

  /**
   * Simply re-delegate to simplify mocking purpose
   * */
  async slowIndexerHead(): Promise<number> {
    return await slowIndexerHead()
  }

  private async updateHeadKey(height: number): Promise<void> {
    // set TTL to the indexer head key. If the indexer status is stuck for some reason,
    // this will result in fetching the indexer head from the database
    await this.redisClient.set(
      INDEXER_HEAD_BLOCK,
      height,
      'EX',
      INDEXER_HEAD_TTL_SEC
    )
    await this.redisPub.publish(
      INDEXER_NEW_HEAD_CHANNEL,
      stringifyWithTs({ height })
    )
    debug(`Updated the indexer head to ${height}`)
  }

  async updateLastEvents(payload: BlockPayload): Promise<void> {
    if (!payload.events) {
      debug(`No events in the payload`)
      return
    }
    for (const e of payload.events) {
      await this.redisClient.hset(EVENT_LAST, e.name, e.id)
      await this.redisClient.hincrby(EVENT_TOTAL, e.name, 1)
      await this.redisClient.hincrby(EVENT_TOTAL, 'ALL', 1)
    }
  }

  async updateBlockCache(payload: BlockPayload): Promise<void> {
    await this.redisClient.set(
      `${BLOCK_CACHE_PREFIX}:${payload.height}`,
      JSON.stringify(payload),
      'EX',
      BLOCK_CACHE_TTL_SEC
    )
  }

  async isComplete(h: number): Promise<boolean> {
    const head = await this.getIndexerHead() // this op is fast
    if (h <= head) {
      return true
    }
    const key = `${BLOCK_CACHE_PREFIX}:${h}`
    const isRecent = await this.redisClient.get(key)
    const isComplete = isRecent !== null
    if (isComplete) {
      await this.redisClient.expire(key, BLOCK_CACHE_TTL_SEC)
    }
    return isComplete
  }

  /**
   *
   * @param h height of the completed block
   */
  async updateIndexerHead(): Promise<void> {
    let head = await this.getIndexerHead()
    let nextHeadComplete = false
    do {
      nextHeadComplete = await this.isComplete(head + 1)
      if (nextHeadComplete) {
        head++
      }
    } while (nextHeadComplete)

    const currentHead = await this.getIndexerHead()
    if (head > currentHead) {
      debug(`Updating the indexer head from ${currentHead} to ${head}`)
      await this.updateHeadKey(head)
    }
  }
}
