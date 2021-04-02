import { SubstrateEvent } from '@dzlzv/hydra-common'
import { EventType } from 'query-node/dist/src/modules/enums/enums'
import { Event } from 'query-node/dist/src/modules/event/event.model'

export function createEvent({ blockNumber, extrinsic, index }: SubstrateEvent, type: EventType): Event {
  return new Event({
    id: `${blockNumber}-${index}`,
    inBlock: blockNumber,
    inExtrinsic: extrinsic?.hash,
    indexInBlock: index,
    type,
  })
}
