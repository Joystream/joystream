import { Tuple, Vec } from '@polkadot/types';
import { Codec, Constructor } from '@polkadot/types/types';
import Linkage from '@polkadot/types/codec/Linkage';

export class SingleLinkedMapEntry<T extends Codec> extends Tuple {
  constructor (Type: Constructor<T>, value?: any) {
    super({
      value: Type,
      linkage: Linkage.withKey(Type)
    }, value);
  }

  static withType<O extends Codec> (Type: Constructor<O>): Constructor<SingleLinkedMapEntry<O>> {
    return class extends SingleLinkedMapEntry<O> {
      constructor (value?: Constructor<O>) {
        super(Type, value);
      }
    };
  }

  get value (): T {
    return this[0] as unknown as T;
  }

  get linkage (): Linkage<T> {
    return this[1] as unknown as Linkage<T>;
  }
}

export class MultipleLinkedMapEntry<K extends Codec, V extends Codec> extends Tuple {
  constructor (KeyType: Constructor<K>, ValueType: Constructor<V>, value?: any) {
    super({
      keys: Vec.with(KeyType),
      values: Vec.with(ValueType)
    }, value);
  }

  static withType<O extends Codec> (Type: Constructor<O>): Constructor<SingleLinkedMapEntry<O>> {
    return class extends SingleLinkedMapEntry<O> {
      constructor (value?: any) {
        super(Type, value);
      }
    };
  }

  get linked_keys (): Vec<K> {
    return this[0] as unknown as Vec<K>;
  }

  get linked_values (): Vec<V> {
    return this[1] as unknown as Vec<V>;
  }
}
