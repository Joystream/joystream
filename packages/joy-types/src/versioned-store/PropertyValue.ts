import { Vector, Text as PolkaText, Bool as PolkaBool, Null, u16, u32, u64, i16, i32, i64 } from '@polkadot/types';
import { EnumType, Tuple } from '@polkadot/types/codec';
import EntityId from './EntityId';

class None extends Null {}

// Single values:

class Bool extends PolkaBool {}
class Uint16 extends u16 {}
class Uint32 extends u32 {}
class Uint64 extends u64 {}
class Int16 extends i16 {}
class Int32 extends i32 {}
class Int64 extends i64 {}
class Text extends PolkaText {}
class Internal extends EntityId {}

// Vectors:

class BoolVec extends Vector.with(PolkaBool) {}
class Uint16Vec extends Vector.with(u16) {}
class Uint32Vec extends Vector.with(u32) {}
class Uint64Vec extends Vector.with(u64) {}
class Int16Vec extends Vector.with(i16) {}
class Int32Vec extends Vector.with(i32) {}
class Int64Vec extends Vector.with(i64) {}

class TextVec extends Vector.with(PolkaText) {}
class InternalVec extends Vector.with(EntityId) {}

type PropertyValueEnumType =
  None |

  // Single values:
  Bool |
  Uint16 |
  Uint32 |
  Uint64 |
  Int16 |
  Int32 |
  Int64 |
  Text |
  Internal |

  // Vectors:
  BoolVec |
  Uint16Vec |
  Uint32Vec |
  Uint64Vec |
  Int16Vec |
  Int32Vec |
  Int64Vec |
  TextVec |
  InternalVec;

export default class PropertyValue extends EnumType<PropertyValueEnumType> {
  constructor (value?: PropertyValueEnumType, index?: number) {
    super({
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
      InternalVec
    }, value, index);
  }
}
