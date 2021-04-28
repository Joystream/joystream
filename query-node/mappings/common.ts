import { SubstrateEvent } from '@dzlzv/hydra-common'
import { EventType, Network } from 'query-node/dist/src/modules/enums/enums'
import { Event } from 'query-node/dist/src/modules/event/event.model'
import { Bytes } from '@polkadot/types'
import { Block } from 'query-node/dist/model'
import { DatabaseManager } from '@dzlzv/hydra-db-utils'

export const CURRENT_NETWORK = Network.OLYMPIA

export async function createEvent(
  db: DatabaseManager,
  substrateEvent: SubstrateEvent,
  type: EventType
): Promise<Event> {
  const { blockNumber, index, extrinsic } = substrateEvent
  const event = new Event({
    id: `${blockNumber}-${index}`,
    inBlock: await getOrCreateBlock(db, substrateEvent),
    inExtrinsic: extrinsic?.hash,
    indexInBlock: index,
    type,
  })
  await db.save<Event>(event)

  return event
}

type AnyMessage<T> = T & {
  toJSON(): Record<string, unknown>
}

type AnyMetadataClass<T> = {
  name: string
  decode(binary: Uint8Array): AnyMessage<T>
  encode(obj: T): { finish(): Uint8Array }
  toObject(obj: AnyMessage<T>): Record<string, unknown>
}

export function deserializeMetadata<T>(metadataType: AnyMetadataClass<T>, metadataBytes: Bytes): T | null {
  try {
    // We use `toObject()` to get rid of .prototype defaults for optional fields
    return metadataType.toObject(metadataType.decode(metadataBytes.toU8a(true))) as T
  } catch (e) {
    console.error(`Cannot deserialize ${metadataType.name}! Provided bytes: (${metadataBytes.toHex()})`)
    return null
  }
}

export async function getOrCreateBlock(
  db: DatabaseManager,
  { blockNumber, blockTimestamp }: SubstrateEvent
): Promise<Block> {
  const block = await db.get(Block, { where: { number: blockNumber } })
  if (!block) {
    const newBlock = new Block({
      id: `${CURRENT_NETWORK}-${blockNumber}`,
      number: blockNumber,
      timestamp: blockTimestamp,
      network: CURRENT_NETWORK,
    })
    await db.save<Block>(newBlock)

    return newBlock
  }

  return block
}

export function bytesToString(b: Bytes): string {
  return Buffer.from(b.toU8a(true)).toString()
}
