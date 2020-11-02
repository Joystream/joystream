import * as dotenv from 'dotenv'
// we should set env variables before all other imports to avoid config errors or warthog caused by DI
dotenv.config({ path: './test/.env' })
import { createDb, dropDb } from '../utils'
import { QueryNodeManager } from '../../src'
import { createDBConnection } from '../../src/db/helper'
import * as Redis from 'ioredis'

export async function resetDb(): Promise<void> {
  try {
    await dropDb()
  } catch (e) {
    // ignore
  }
  try {
    await setupDb()
  } catch (e) {
    //ignore;
  }
}

export async function setupDb(): Promise<void> {
  await createDb()
  await QueryNodeManager.migrate()
}

export async function clearRedis(): Promise<void> {
  const redisURL = process.env.REDIS_URI
  if (!redisURL) {
    throw new Error(`Redis URL is not provided`)
  }
  const redis = new Redis(redisURL)
  await redis.flushall()
  await redis.quit()
}

beforeEach(async () => {
  await setupDb()
  await createDBConnection()
})

afterEach(async () => {
  try {
    await QueryNodeManager.cleanUp()
    await dropDb()
  } catch (e) {
    console.error(e)
  }
})
