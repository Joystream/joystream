import BN from 'bn.js'
import { ChannelId } from "@joystream/types/content-working-group"
import { EntityId, ClassId } from "@joystream/types/versioned-store"

export type AnyChannelId = ChannelId | BN | number | string

export type AnyEntityId = EntityId | BN | number | string

export type AnyClassId = ClassId | BN | number | string

function canBeId(id: BN | number | string): boolean {
  return id instanceof BN || typeof id === 'number' || typeof id === 'string'
}

export function asChannelId(id: AnyChannelId): ChannelId {
  if (id instanceof ChannelId) {
    return id
  } else if (canBeId(id)) {
    return new ChannelId(id)
  } else {
    throw new Error(`Not supported format for Channel id: ${id}`)
  }
}

export function asEntityId(id: AnyEntityId): EntityId {
  if (id instanceof EntityId) {
    return id
  } else if (canBeId(id)) {
    return new EntityId(id)
  } else {
    throw new Error(`Not supported format for Entity id: ${id}`)
  }
}

export function asClassId(id: AnyClassId): ClassId {
  if (id instanceof ClassId) {
    return id
  } else if (canBeId(id)) {
    return new ClassId(id)
  } else {
    throw new Error(`Not supported format for Class id: ${id}`)
  }
}
