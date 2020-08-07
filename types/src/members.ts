import { Option, Null, bool, u32, u64, u128, Text } from '@polkadot/types'
import { BlockNumber, Moment } from '@polkadot/types/interfaces'
import AccountId from '@polkadot/types/generic/AccountId'
import { RegistryTypes } from '@polkadot/types/types'
import { JoyEnum, JoyStructDecorated } from './common'

export class MemberId extends u64 {}
export class PaidTermId extends u64 {}
export class SubscriptionId extends u64 {}
export class ActorId extends u64 {}

export class Paid extends PaidTermId {}
export class Screening extends AccountId {}
export class Genesis extends Null {}
export class EntryMethod extends JoyEnum({
  Paid,
  Screening,
  Genesis,
}) {}

export type IMembership = {
  handle: Text
  avatar_uri: Text
  about: Text
  registered_at_block: BlockNumber
  registered_at_time: Moment
  entry: EntryMethod
  suspended: bool
  subscription: Option<SubscriptionId>
  root_account: AccountId
  controller_account: AccountId
}
export class Membership
  extends JoyStructDecorated({
    handle: Text,
    avatar_uri: Text,
    about: Text,
    registered_at_block: u32,
    registered_at_time: u64,
    entry: EntryMethod,
    suspended: bool,
    subscription: Option.with(SubscriptionId),
    root_account: AccountId,
    controller_account: AccountId,
  })
  implements IMembership {}

export class PaidMembershipTerms extends JoyStructDecorated({
  fee: u128, // BalanceOf
  text: Text,
}) {}

export const membersTypes: RegistryTypes = {
  EntryMethod,
  MemberId,
  PaidTermId,
  SubscriptionId,
  Membership,
  PaidMembershipTerms,
  ActorId,
}

export default membersTypes
