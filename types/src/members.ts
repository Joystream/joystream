import { Option, bool, u32, Text, Bytes } from '@polkadot/types'
import { RegistryTypes } from '@polkadot/types/types'
import { MemberId, JoyStructDecorated, AccountId } from './common'

export type IMembership = {
  handle_hash: Bytes
  root_account: AccountId
  controller_account: AccountId
  verified: bool
  invites: u32
}

export class Membership
  extends JoyStructDecorated({
    handle_hash: Bytes,
    root_account: AccountId,
    controller_account: AccountId,
    verified: bool,
    invites: u32,
  })
  implements IMembership {}

export type IStakingAccountMemberBinding = {
  member_id: MemberId
  confirmed: bool
}

export class StakingAccountMemberBinding
  extends JoyStructDecorated({
    member_id: MemberId,
    confirmed: bool,
  })
  implements IStakingAccountMemberBinding {}

export type IBuyMembershipParameters = {
  root_account: AccountId
  controller_account: AccountId
  handle: Option<Text>
  metadata: Bytes
  referrer_id: Option<MemberId>
}

export class BuyMembershipParameters
  extends JoyStructDecorated({
    root_account: AccountId,
    controller_account: AccountId,
    handle: Option.with(Text),
    metadata: Bytes,
    referrer_id: Option.with(MemberId),
  })
  implements IBuyMembershipParameters {}

export type IInviteMembershipParameters = {
  inviting_member_id: MemberId
  root_account: AccountId
  controller_account: AccountId
  handle: Option<Text>
  metadata: Bytes
}

export class InviteMembershipParameters
  extends JoyStructDecorated({
    inviting_member_id: MemberId,
    root_account: AccountId,
    controller_account: AccountId,
    handle: Option.with(Text),
    metadata: Bytes,
  })
  implements IInviteMembershipParameters {}

export const membersTypes: RegistryTypes = {
  Membership,
  StakingAccountMemberBinding,
  BuyMembershipParameters,
  InviteMembershipParameters,
}

export default membersTypes
