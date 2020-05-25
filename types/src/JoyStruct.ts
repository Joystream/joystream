import { Option, Struct, Enum } from '@polkadot/types/codec';
import { Text, bool as Bool } from '@polkadot/types';
import { Codec } from '@polkadot/types/types';

export class JoyStruct<T extends {
  [K: string]: Codec;
}> extends Struct {

  getField<C extends Codec> (name: keyof T): C {
    return super.get(name as string) as C;
  }

  getString (name: keyof T): string {
    return this.getField<Text>(name).toString();
  }

  getBoolean (name: keyof T): boolean {
    return this.getField<Bool>(name).valueOf();
  }

  getEnumAsString<EnumValue extends string> (name: keyof T): EnumValue {
    return this.getField<Enum>(name).toString() as EnumValue;
  }

  unwrapOrUndefined<C extends Codec> (name: keyof T): C | undefined {
    return this.getField<Option<C>>(name).unwrapOr(undefined);
  }

  getOptionalString (name: keyof T): string | undefined {
    const text = this.unwrapOrUndefined<Text>(name);
    return text ? text.toString() : undefined;
  }

  cloneValues (): T {
    const objectClone = {} as { [K: string]: Codec };

    super.forEach((v, k) => {
      objectClone[k] = v; // shallow copy acceptable ?
    });

    return objectClone as T;
  }
}