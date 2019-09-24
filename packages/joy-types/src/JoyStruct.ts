import { Option, Struct } from '@polkadot/types/codec';
import { Text, Bool } from '@polkadot/types';
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

  unwrapOrUndefined<C extends Codec> (name: keyof T): C | undefined {
    return this.getField<Option<C>>(name).unwrapOr(undefined);
  }

  cloneValues (): T {
    const res: Partial<T> = {};
    super.forEach((v, k) => {
      res[k] = v;
    });
    return res as T;
  }
}
