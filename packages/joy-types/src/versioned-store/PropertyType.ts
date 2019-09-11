import { u16, Null } from '@polkadot/types';
import { EnumType, Tuple } from '@polkadot/types/codec';
import ClassId from './ClassId';

class None extends Null {}

// Single values:

class Bool extends Null {}
class Uint16 extends Null {}
class Uint32 extends Null {}
class Uint64 extends Null {}
class Int16 extends Null {}
class Int32 extends Null {}
class Int64 extends Null {}
class Text extends u16 {}
class Internal extends ClassId {}

// Vectors:

class BoolVec extends u16 {}
class Uint16Vec extends u16 {}
class Uint32Vec extends u16 {}
class Uint64Vec extends u16 {}
class Int16Vec extends u16 {}
class Int32Vec extends u16 {}
class Int64Vec extends u16 {}

class TextVec extends Tuple.with([u16, u16]) {}
class InternalVec extends Tuple.with([u16, ClassId]) {}

type PropertyTypeEnumType =
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

export default class PropertyType extends EnumType<PropertyTypeEnumType> {
  constructor (value?: PropertyTypeEnumType, index?: number) {
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
