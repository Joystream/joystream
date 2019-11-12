import { u16, Null } from '@polkadot/types';
import { Enum, Tuple } from '@polkadot/types/codec';
import ClassId from './ClassId';

export class None extends Null {}

// Single values:

export class Bool extends Null {}
export class Uint16 extends Null {}
export class Uint32 extends Null {}
export class Uint64 extends Null {}
export class Int16 extends Null {}
export class Int32 extends Null {}
export class Int64 extends Null {}
export class Text extends u16 {}
export class Internal extends ClassId {}

// Vectors:

export class BoolVec extends u16 {}
export class Uint16Vec extends u16 {}
export class Uint32Vec extends u16 {}
export class Uint64Vec extends u16 {}
export class Int16Vec extends u16 {}
export class Int32Vec extends u16 {}
export class Int64Vec extends u16 {}

export class TextVec extends Tuple.with([u16, u16]) {
  static newTypesafe (maxItems: u16 | number, maxTextLength: u16 | number) {
    return new this([ maxItems, maxTextLength ]);
  }
}

export class InternalVec extends Tuple.with([u16, ClassId]) {
  static newTypesafe (maxItems: u16 | number, classId: ClassId | number) {
    return new this([ maxItems, classId ]);
  }
}

export type PropertyTypeEnum =
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
  InternalVec
;

type PropertyTypeEnumValue = {
  [typeName: string]: PropertyTypeEnum;
};

export class PropertyType extends Enum {
  constructor (value?: PropertyTypeEnumValue, index?: number) {
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

export default PropertyType;
