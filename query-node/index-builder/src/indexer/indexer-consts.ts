import { numberEnv } from '../utils/env-flags'

// keep one hour of blocks by default
export const BLOCK_CACHE_TTL_SEC = numberEnv('BLOCK_CACHE_TTL_SEC') || 60 * 60
// expire indexer head key after 15 minutes
export const INDEXER_HEAD_TTL_SEC = numberEnv('INDEXER_HEAD_TTL_SEC') || 60 * 15

// Number of indexer workers
export const WORKERS_NUMBER = numberEnv('INDEXER_WORKERS') || 5

// Number of time the worker tries to fetch a block
export const BLOCK_PRODUCER_FETCH_RETRIES =
  numberEnv('BLOCK_PRODUCER_FETCH_RETRIES') || 3

// Timeout (in milliseconds) for each API call
export const SUBSTRATE_API_TIMEOUT =
  numberEnv('SUBSTRATE_API_TIMEOUT') || 1000 * 60 * 5
// Number of times an API call is retried before giving up and throwing and error
export const SUBSTRATE_API_CALL_RETRIES =
  numberEnv('SUBSTRATE_API_CALL_RETRIES') || 5

// If the block producer does not recieve a new block within this time limit,
// panic and thow an error. This is needed to prevent the situation when the
// API is disconnected yet no error is thrown, with the block producer stuck in the waiting loop
export const NEW_BLOCK_TIMEOUT_MS =
  numberEnv('NEW_BLOCK_TIMEOUT_MS') || 60 * 10 * 1000 // 10 minutes
