import { Struct, Option, Text, bool, u16, u32, u64, Null, U8aFixed, BTreeSet, UInt, u128 } from '@polkadot/types'
import { BlockNumber, Hash as PolkadotHash, Moment } from '@polkadot/types/interfaces'
import { Codec, Constructor, RegistryTypes } from '@polkadot/types/types'
// we get 'moment' because it is a dependency of @polkadot/util, via @polkadot/keyring
import moment from 'moment'
import { JoyStructCustom, JoyStructDecorated } from './JoyStruct'
import { JoyEnum } from './JoyEnum'
import { GenericAccountId as AccountId } from '@polkadot/types/generic/AccountId'

export { JoyEnum, JoyStructCustom, JoyStructDecorated }

// Adds sorting during BTreeSet toU8a encoding (required by the runtime)
// Currently only supports values that extend UInt
// FIXME: Will not cover cases where BTreeSet is part of extrinsic args metadata
export interface ExtendedBTreeSet<V extends UInt> extends BTreeSet<V> {
  toArray(): V[]
}

export function JoyBTreeSet<V extends UInt>(valType: Constructor<V>): Constructor<ExtendedBTreeSet<V>> {
  return class extends BTreeSet.with(valType) {
    public forEach(callbackFn: (value: V, value2: V, set: Set<V>) => void, thisArg?: unknown): void {
      const sorted = this.toArray()
      return new Set(sorted).forEach(callbackFn, thisArg)
    }

    public toArray() {
      return Array.from(this).sort((a, b) => (a.lt(b) ? -1 : 1))
    }
  }
}

export class Url extends Text {}

export class ChannelId extends u64 {}
export class DAOId extends u64 {}

// common types between Forum and Proposal Discussions modules
export class ThreadId extends u64 {}
export class PostId extends u64 {}

export class Hash extends U8aFixed implements PolkadotHash {}

export type BlockAndTimeType = {
  block: BlockNumber
  time: Moment
}

export class BlockAndTime extends JoyStructDecorated({ block: u32, time: u64 }) implements BlockAndTimeType {
  get momentDate(): moment.Moment {
    const YEAR_2000_MILLISECONDS = 946684801000

    // overflowing in ~270,000 years
    const timestamp = this.time.toNumber()

    // TODO: remove once https://github.com/Joystream/joystream/issues/705 is resolved
    // due to a bug, timestamp can be either in seconds or milliseconds
    let timestampInMillis = timestamp
    if (timestamp < YEAR_2000_MILLISECONDS) {
      // timestamp is in seconds
      timestampInMillis = timestamp * 1000
    }

    return moment(timestampInMillis)
  }
}

export function getTextPropAsString(struct: Struct, fieldName: string): string {
  return (struct.get(fieldName) as Text).toString()
}

export function getBoolPropAsBoolean(struct: Struct, fieldName: string): boolean {
  return (struct.get(fieldName) as bool).valueOf()
}

export function getOptionPropOrUndefined<T extends Codec>(struct: Struct, fieldName: string): T | undefined {
  return (struct.get(fieldName) as Option<T>).unwrapOr(undefined)
}

export class OptionText extends Option.with(Text) {}

export type InputValidationLengthConstraintType = {
  min: u16
  max_min_diff: u16
}

export class InputValidationLengthConstraint
  extends JoyStructDecorated({ min: u16, max_min_diff: u16 })
  implements InputValidationLengthConstraintType {
  get max(): u16 {
    return this.registry.createType('u16', this.min.add(this.max_min_diff))
  }
}

// Reserved keys are not part of the exported definition const, since they are not intented to be used
export const WorkingGroupDef = {
  // _Reserved0
  // _Reserved1
  Storage: Null,
  Content: Null,
  Operations: Null,
  Gateway: Null,
  Distribution: Null,
} as const
export type WorkingGroupKey = keyof typeof WorkingGroupDef
export class WorkingGroup extends JoyEnum({
  _Reserved0: Null,
  _Reserved1: Null,
  ...WorkingGroupDef,
}) {}

// Temporarly in "common", because used both by /working-group and /content-working-group:
export type ISlashableTerms = {
  max_count: u16
  max_percent_pts_per_time: u16
}

export class SlashableTerms
  extends JoyStructDecorated({
    max_count: u16,
    max_percent_pts_per_time: u16,
  })
  implements ISlashableTerms {}

export class UnslashableTerms extends Null {}

export class SlashingTerms extends JoyEnum({
  Unslashable: UnslashableTerms,
  Slashable: SlashableTerms,
} as const) {}

export class MemoText extends Text {}

// @polkadot/types overrides required since migration to Substrate 2.0,
// see: https://polkadot.js.org/api/start/FAQ.html#the-node-returns-a-could-not-convert-error-on-send
export class Address extends AccountId {}
export class LookupSource extends AccountId {}
export class BalanceOf extends u128 {}

export const commonTypes: RegistryTypes = {
  BlockAndTime,
  ThreadId,
  PostId,
  InputValidationLengthConstraint,
  WorkingGroup,
  // Expose in registry for api.createType purposes:
  SlashingTerms,
  SlashableTerms,
  MemoText,
  Address,
  LookupSource,
  ChannelId,
  DAOId,
  Url,
}

export default commonTypes
