import { Struct } from '@polkadot/types/codec'
import { Codec, Constructor, Registry } from '@polkadot/types/types'

export interface ExtendedStruct<FieldTypes extends Record<string, Constructor>> extends Struct<FieldTypes> {
  getField<FieldKey extends keyof FieldTypes>(key: FieldKey): InstanceType<FieldTypes[FieldKey]>
  getString<FieldKey extends keyof FieldTypes>(key: FieldKey): string
  cloneValues(): { [k in keyof FieldTypes]: FieldTypes[k] }
}

// Those getters are automatically added via Object.defineProperty when using Struct.with
export type ExtendedStructGetters<FieldTypes extends Record<string, Constructor>> = {
  [k in keyof FieldTypes]: InstanceType<FieldTypes[k]>
}
// More rich TypeScript definition of the Struct (includes automatically created getters)
export type ExtendedStructDecorated<FieldTypes extends Record<string, Constructor>> = ExtendedStructGetters<
  FieldTypes
> &
  ExtendedStruct<FieldTypes>

export interface StructConstructor<
  FieldTypes extends Record<string, Constructor>,
  StructType extends Struct<FieldTypes>
> {
  new (registry: Registry, value?: { [k in keyof FieldTypes]: InstanceType<FieldTypes[k]> }): StructType
}

export type ExtendedStructConstructor<FieldTypes extends Record<string, Constructor>> = StructConstructor<
  FieldTypes,
  ExtendedStruct<FieldTypes>
>

export type ExtendedStructDecoratedConstructor<FieldTypes extends Record<string, Constructor>> = StructConstructor<
  FieldTypes,
  ExtendedStructDecorated<FieldTypes>
>

// Helper for creating extended Struct type with TS-compatible interface
// It's called JoyStructCustom, because eventually we'd want to migrate all structs to JoyStructDecorated,
// but the latter won't allow specifying getters that return different type than the original field type.
// (ie. by using getString() instead of getField())
export function JoyStructCustom<FieldTypes extends Record<string, Constructor>>(
  fields: FieldTypes
): ExtendedStructConstructor<FieldTypes> {
  return class JoyStructObject extends Struct.with(fields) {
    constructor(registry: Registry, value?: { [k in keyof FieldTypes]: InstanceType<FieldTypes[k]> }) {
      super(registry, value)
    }
    getField<FieldKey extends keyof FieldTypes>(key: FieldKey): InstanceType<FieldTypes[FieldKey]> {
      return this.get(key as string) as InstanceType<FieldTypes[FieldKey]>
    }
    getString<FieldKey extends keyof FieldTypes>(key: FieldKey): string {
      return this.getField(key).toString()
    }
    // TODO: Check why would this ever be needed
    cloneValues(): { [k in keyof FieldTypes]: FieldTypes[k] } {
      const objectClone = {} as Partial<{ [k in keyof FieldTypes]: Codec }>

      super.forEach((v, k) => {
        objectClone[k] = v // shallow copy acceptable ?
      })

      return (objectClone as unknown) as { [k in keyof FieldTypes]: FieldTypes[k] }
    }
  }
}

// JoyStruct enriched with typescript definitions for getters automatically added by polkadot-js
export function JoyStructDecorated<FieldTypes extends Record<string, Constructor>>(
  fields: FieldTypes
): ExtendedStructDecoratedConstructor<FieldTypes> {
  // We need to cast here because there's no way to make TS aware of getters added with Object.defineProperty
  return JoyStructCustom(fields) as ExtendedStructDecoratedConstructor<FieldTypes>
}
