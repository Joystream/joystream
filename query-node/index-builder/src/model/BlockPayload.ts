import { formatEventId, QueryEventBlock } from '.'
import { withTs } from '../utils/stringify'

export interface BlockPayload {
  height: number,
  ts: number 
  events?: { id: string, name: string }[]
}

export function toPayload(qeb: QueryEventBlock): BlockPayload {
    return (withTs({
      height: qeb.block_number,
      events: qeb.query_events.map((e) => {
        return {
          name: e.eventName,
          id: formatEventId(qeb.block_number, e.index)
        }
      })
    }) as unknown) as BlockPayload
}