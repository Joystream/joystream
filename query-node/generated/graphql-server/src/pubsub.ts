import { PubSubEngine, PubSub } from 'graphql-subscriptions'

import createSubscriber from 'pg-listen'
import { Logger } from './logger'

const pubSub: PubSubEngine = new PubSub()

export enum TOPICS {
  processorState = 'PROCESSOR_STATE',
}

export function getPubSub(): PubSubEngine {
  return pubSub
}

export async function startPgSubsribers() {
  // use PG_** env variables to connect
  const subscriber = createSubscriber()
  const channel = 'processed_events_log_update'

  subscriber.notifications.on(channel, (payload: unknown) => {
    const { data } = payload as {
      data: {
        event_id: string
        last_scanned_block: number
        indexer_head: number
        chain_head: number
      }
    }

    // Payload as passed to subscriber.notify() (see below)
    pubSub.publish(TOPICS.processorState, {
      lastProcessedEvent: data.event_id,
      lastScannedBlock: data.last_scanned_block,
      chainHead: data.chain_head,
      indexerHead: data.indexer_head,
    })
  })

  subscriber.events.on('error', (error) => {
    Logger.error('Fatal database connection error:', error)
    process.exit(1)
  })

  process.on('exit', () => {
    Logger.log(`Closing the subscriber`)
    subscriber.close()
  })

  await subscriber.connect()
  await subscriber.listenTo(channel)
}
