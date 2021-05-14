import { SubstrateEvent, DatabaseManager } from '@dzlzv/hydra-common'
import { EventType, Network } from 'query-node/dist/src/modules/enums/enums'
import { Event } from 'query-node/dist/src/modules/event/event.model'
import { Bytes } from '@polkadot/types'
import { Block } from 'query-node/dist/model'
import BN from 'bn.js'

export const CURRENT_NETWORK = Network.OLYMPIA

export async function createEvent(
  db: DatabaseManager,
  substrateEvent: SubstrateEvent,
  type: EventType
): Promise<Event> {
  const { blockNumber, indexInBlock, extrinsic } = substrateEvent
  const event = new Event({
    id: `${CURRENT_NETWORK}-${blockNumber}-${indexInBlock}`,
    inBlock: await getOrCreateBlock(db, substrateEvent),
    inExtrinsic: extrinsic?.hash,
    indexInBlock,
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
      timestamp: new BN(blockTimestamp),
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

export function hasValuesForProperties<
  T extends Record<string, unknown>,
  P extends keyof T & string,
  PA extends readonly P[]
>(obj: T, props: PA): obj is T & { [K in PA[number]]: NonNullable<K> } {
  props.forEach((p) => {
    if (obj[p] === null || obj[p] === undefined) {
      return false
    }
  })
  return true
}
