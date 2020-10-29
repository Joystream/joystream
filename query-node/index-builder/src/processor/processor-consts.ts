import { numberEnv } from '../utils/env-flags'

export const DEFAULT_PROCESSOR_NAME = 'hydra'

// Number of blocks to scan in a single request to the indexer
export const BLOCK_WINDOW = 100000

// Maximal number of events to process in a single transaction
export const BATCH_SIZE = numberEnv('PROCESSOR_BATCH_SIZE') || 10

// Interval at which the processor pulls new blocks from the database
// The interval is reasonably large by default. The trade-off is the latency
// between the updates and the load to the database
export const PROCESSOR_POLL_INTERVAL =
  numberEnv('PROCESSOR_POLL_INTERVAL') || 60 * 1000 // 10 seconds

// Wait for the indexer head block to be ahead for at least that number of blocsk
export const MINIMUM_BLOCKS_AHEAD = 2
