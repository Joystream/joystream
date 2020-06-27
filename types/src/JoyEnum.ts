import { Constructor } from '@polkadot/types/types';
import { Enum } from '@polkadot/types/codec';
import { EnumConstructor } from '@polkadot/types/codec/Enum';

export interface ExtendedEnum<Types extends Record<string, Constructor>> extends Enum {
  isOfType: (type: keyof Types) => boolean;
  asType<TypeKey extends keyof Types>(type: TypeKey): InstanceType<Types[TypeKey]>;
};

// Helper for creating extended Enum type with TS-compatible isOfType and asType helpers
export function JoyEnum<Types extends Record<string, Constructor>>(types: Types): EnumConstructor<ExtendedEnum<Types>>
{
  // Unique values check
  if (Object.values(types).some((val, i) => Object.values(types).indexOf(val, i + 1) !== -1)) {
    throw new Error('Values passed to JoyEnum are not unique. Create an individual class for each value.');
  }

  return class extends Enum {
    constructor(value?: any, index?: number) {
      super(types, value, index);
    }
    public isOfType(typeKey: keyof Types) {
      return this.value instanceof types[typeKey];
    }
    public asType<TypeKey extends keyof Types>(typeKey: TypeKey) {
      if (!(this.value instanceof types[typeKey])) {
        throw new Error(`Enum.asType(${typeKey}) - value is not of type ${typeKey}`);
      }
      return this.value as InstanceType<Types[TypeKey]>;
    }
  }
}
