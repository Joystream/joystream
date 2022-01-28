import { Struct, Option, Text, bool, u16, u32, u64, Null, U8aFixed, u128 } from '@polkadot/types'
import { Hash as PolkadotHash, Moment } from '@polkadot/types/interfaces'
import { Codec, RegistryTypes } from '@polkadot/types/types'
// we get 'moment' because it is a dependency of @polkadot/util, via @polkadot/keyring
import moment from 'moment'
import { JoyStructCustom, JoyStructDecorated } from './JoyStruct'
import { JoyEnum } from './JoyEnum'
import { GenericAccountId } from '@polkadot/types/generic/AccountId'

export { JoyEnum, JoyStructCustom, JoyStructDecorated }

export class Balance extends u128 {}
export class BlockNumber extends u32 {}

export class ActorId extends u64 {}
export class MemberId extends u64 {}
export class Url extends Text {}

export class ChannelId extends u64 {}

// Indentical type names for Forum and Proposal Discussions modules
// Ensure they are both configured in runtime to have same type
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
  extends JoyStructDecorated({
    min: u16,
    max_min_diff: u16,
  })
  implements InputValidationLengthConstraintType {
  get max(): u16 {
    return this.registry.createType('u16', this.min.add(this.max_min_diff))
  }
}

export const WorkingGroupDef = {
  Forum: Null,
  Storage: Null,
  Content: Null,
  OperationsAlpha: Null,
  Gateway: Null,
  Distribution: Null,
  OperationsBeta: Null,
  OperationsGamma: Null,
  Membership: Null,
} as const
export type WorkingGroupKey = keyof typeof WorkingGroupDef
export class WorkingGroup extends JoyEnum(WorkingGroupDef) {}

export class MemoText extends Text {}

export class BalanceKind extends JoyEnum({
  Positive: Null,
  Negative: Null,
}) {}

// @polkadot/types overrides required since migration to Substrate 2.0,
// see: https://polkadot.js.org/docs/api/FAQ#i-cannot-send-transactions-sending-yields-address-decoding-failures
export class AccountId extends GenericAccountId {}
export class Address extends AccountId {}
export class LookupSource extends AccountId {}
export class BalanceOf extends Balance {}

export const commonTypes: RegistryTypes = {
  ActorId,
  MemberId,
  BlockAndTime,
  ThreadId,
  PostId,
  InputValidationLengthConstraint,
  WorkingGroup,
  MemoText,
  BalanceKind,
  // Customize Address type for joystream chain
  Address,
  LookupSource,
  ChannelId,
  Url,
}

export default commonTypes
