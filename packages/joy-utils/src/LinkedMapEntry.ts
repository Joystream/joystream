import { Tuple } from '@polkadot/types'
import { Codec, Constructor } from '@polkadot/types/types'
import Linkage from '@polkadot/types/codec/Linkage'

export class LinkedMapEntry<T extends Codec> extends Tuple {
	constructor(Type: any, value?: any) {
		super({
				value: Type, 
				linkage: Linkage.withKey(Type),
		}, value)
	}

	static withType<O extends Codec>(Type: Constructor): Constructor<LinkedMapEntry<O>> {
		return class extends LinkedMapEntry<O> {
			constructor(value?: any) {
				super(Type, value)
			}
		}
	}

	get value(): T {
		return this[0] as unknown as T
	}

	get linkage(): Linkage<T> {
		return this[1] as unknown as Linkage<T>
	}
}


