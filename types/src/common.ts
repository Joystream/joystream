import { Struct, Option, Text, bool, Vec, u16, u32, u64, Null, U8aFixed, BTreeSet, Compact } from '@polkadot/types'
import { BlockNumber, H256, Moment } from '@polkadot/types/interfaces'
import { Codec, RegistryTypes } from '@polkadot/types/types'
import { u8aConcat, u8aToHex } from '@polkadot/util'
// we get 'moment' because it is a dependency of @polkadot/util, via @polkadot/keyring
import moment from 'moment'
import { JoyStructCustom, JoyStructDecorated } from './JoyStruct'
import { JoyEnum } from './JoyEnum'

export { JoyEnum, JoyStructCustom, JoyStructDecorated }

// Adds ".sort()" during BTreeSet toU8a encoding (required by the runtime)
// FIXME: Will not cover cases where BTreeSet is part of extrinsic args metadata
export class JoyBTreeSet<V extends Codec> extends BTreeSet<V> {
  public toU8a(isBare?: boolean): Uint8Array {
    const encoded = new Array<Uint8Array>()

    if (!isBare) {
      encoded.push(Compact.encodeU8a(this.size))
    }

    Array.from(this)
      .sort()
      .forEach((v: V) => {
        encoded.push(v.toU8a(isBare))
      })

    return u8aConcat(...encoded)
  }

  public toHex(): string {
    return u8aToHex(this.toU8a())
  }
}

export class Credential extends u64 {}
export class CredentialSet extends Vec.with(Credential) {} // BtreeSet ?

// common types between Forum and Proposal Discussions modules
export class ThreadId extends u64 {}
export class PostId extends u64 {}

export class Hash extends U8aFixed implements H256 {}

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

export class InputValidationLengthConstraint extends JoyStructDecorated({ min: u16, max_min_diff: u16 })
  implements InputValidationLengthConstraintType {
  get max(): u16 {
    return this.registry.createType('u16', this.min.add(this.max_min_diff))
  }
}

export const WorkingGroupDef = {
  Storage: Null,
} as const
export type WorkingGroupKey = keyof typeof WorkingGroupDef
export class WorkingGroup extends JoyEnum(WorkingGroupDef) {}

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

export const commonTypes: RegistryTypes = {
  Credential,
  CredentialSet,
  BlockAndTime,
  ThreadId,
  PostId,
  InputValidationLengthConstraint,
  WorkingGroup,
  // Expose in registry for api.createType purposes:
  SlashingTerms,
  SlashableTerms,
}

export default commonTypes
