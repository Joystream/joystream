/*
eslint-disable @typescript-eslint/naming-convention
*/
import { SubstrateEvent } from '@dzlzv/hydra-common'
import { EventType } from 'query-node/dist/src/modules/enums/enums'
import { Event } from 'query-node/dist/src/modules/event/event.model'

export function createEvent(event_: SubstrateEvent, type: EventType): Event {
  return new Event({
    inBlock: event_.blockNumber,
    inExtrinsic: event_.extrinsic?.hash,
    indexInBlock: event_.index,
    type,
  })
}
