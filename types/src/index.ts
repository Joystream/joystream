import { Codec, DetectCodec, RegistryTypes, ITuple } from '@polkadot/types/types'
import common from './common'
import members from './members'
import council from './council'
import forum from './forum'
import workingGroup from './working-group'
import storage from './storage'
import blog from './blog'
import proposals from './proposals'
import referendum from './referendum'
import constitution from './constitution'
import bounty from './bounty'
import content from './content'
import { TypeRegistry, Text, UInt, Null, bool, Option, Vec, BTreeSet, BTreeMap, Tuple } from '@polkadot/types'
import { ExtendedEnum } from './JoyEnum'
import { ExtendedStruct } from './JoyStruct'

import BN from 'bn.js'

export { common, members, council, forum, workingGroup, proposals, content }

export const types: RegistryTypes = {
  ...common,
  ...members,
  ...council,
  ...forum,
  ...workingGroup,
  ...storage,
  ...blog,
  ...proposals,
  ...referendum,
  ...constitution,
  ...bounty,
  ...content,
  // https://github.com/polkadot-js/api/blob/master/CHANGELOG.md#351-jan-18-2020
  AccountInfo: 'AccountInfoWithRefCount',
  // Required for compatibility with @polkadot/api version >= 6.0
  ValidatorPrefs: 'ValidatorPrefsWithCommission',
}

// Allows creating types without api instance (it's not a recommended way though, so should be used just for mocks)
export const registry = new TypeRegistry()
registry.register(types)

// Tweaked version of https://stackoverflow.com/a/62163715 for handling enum variants
// Based on type (T) like: { a: string; b: number; c: Null; }
// will create a type like: { a: string } | { b: number } | { c: Null } | "c"
type EnumVariant<T> = keyof T extends infer K
  ? K extends keyof T
    ? T[K] extends Null | null
      ? K | { [I in K]: T[I] }
      : { [I in K]: T[I] }
    : never
  : never

// Create simple interface for any Codec type (inlcuding JoyEnums and JoyStructs)
// Cannot handle Option here, since that would cause circular reference error
type CreateInterface_NoOption<T extends Codec> =
  | T
  | (T extends ExtendedEnum<infer S>
      ? EnumVariant<{ [K in keyof S]: CreateInterface<InstanceType<T['typeDefinitions'][K]>> }>
      : T extends ExtendedStruct<infer S>
      ? { [K in keyof S]?: CreateInterface<InstanceType<T['typeDefs'][K]>> }
      : T extends Text
      ? string
      : T extends UInt
      ? number | BN
      : T extends bool
      ? boolean
      : T extends Vec<infer S> | BTreeSet<infer S>
      ? CreateInterface<S>[]
      : T extends ITuple<infer S>
      ? S extends Tuple
        ? any[]
        : { [K in keyof S]: CreateInterface<T[K]> }
      : T extends BTreeMap<infer K, infer V>
      ? Map<K, V>
      : T extends Null
      ? null
      : unknown)

// Wrapper for CreateInterface_NoOption that includes resolving an Option
// (nested Options like Option<Option<Codec>> will resolve to Option<any>, but there are very edge case)
export type CreateInterface<T> = T extends Codec
  ? T | (T extends Option<infer S> ? undefined | null | S | CreateInterface_NoOption<S> : CreateInterface_NoOption<T>)
  : any

export function createType<T extends Codec, TN extends string>(
  typeName: TN,
  value: CreateInterface<T>
): DetectCodec<T, TN> {
  return registry.createType<T, TN>(typeName, value)
}
