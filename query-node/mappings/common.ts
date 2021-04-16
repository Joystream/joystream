import { SubstrateEvent } from '@dzlzv/hydra-common'
import { EventType } from 'query-node/dist/src/modules/enums/enums'
import { Event } from 'query-node/dist/src/modules/event/event.model'
import { Bytes } from '@polkadot/types'

export function createEvent({ blockNumber, extrinsic, index }: SubstrateEvent, type: EventType): Event {
  return new Event({
    id: `${blockNumber}-${index}`,
    inBlock: blockNumber,
    inExtrinsic: extrinsic?.hash,
    indexInBlock: index,
    type,
  })
}

type MetadataClass<T> = {
  deserializeBinary: (bytes: Uint8Array) => T
}

export function deserializeMetadata<T>(metadataType: MetadataClass<T>, metadataBytes: Bytes): T | null {
  try {
    return metadataType.deserializeBinary(metadataBytes.toU8a(true))
  } catch (e) {
    console.error(`Invalid opening metadata! (${metadataBytes.toHex()})`)
    return null
  }
}
