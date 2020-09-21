import {
  Vec as Vector,
  Text as PolkaText,
  bool as PolkaBool,
  Null,
  u16,
  u32,
  u64,
  i16,
  i32,
  i64,
} from '@polkadot/types'
import EntityId from './EntityId'
import { JoyEnum } from '../common'

export class None extends Null {}

// Single values:

export class Bool extends PolkaBool {}
export class Uint16 extends u16 {}
export class Uint32 extends u32 {}
export class Uint64 extends u64 {}
export class Int16 extends i16 {}
export class Int32 extends i32 {}
export class Int64 extends i64 {}
export class Text extends PolkaText {}
export class Internal extends EntityId {}

// Vectors:

export class BoolVec extends Vector.with(PolkaBool) {}
export class Uint16Vec extends Vector.with(u16) {}
export class Uint32Vec extends Vector.with(u32) {}
export class Uint64Vec extends Vector.with(u64) {}
export class Int16Vec extends Vector.with(i16) {}
export class Int32Vec extends Vector.with(i32) {}
export class Int64Vec extends Vector.with(i64) {}

export class TextVec extends Vector.with(PolkaText) {}
export class InternalVec extends Vector.with(EntityId) {}

export const PropertyValueDef = {
  None,
  // Single values:
  Bool,
  Uint16,
  Uint32,
  Uint64,
  Int16,
  Int32,
  Int64,
  Text,
  Internal,
  // Vectors:
  BoolVec,
  Uint16Vec,
  Uint32Vec,
  Uint64Vec,
  Int16Vec,
  Int32Vec,
  Int64Vec,
  TextVec,
  InternalVec,
} as const

// FIXME: Fix naming conventions, or remove those later?
export type PropertyValueEnum = InstanceType<typeof PropertyValueDef[keyof typeof PropertyValueDef]>
export type PropertyValueEnumValue = {
  [typeName: string]: PropertyValueEnum
}

export class PropertyValue extends JoyEnum(PropertyValueDef) {}

export default PropertyValue
