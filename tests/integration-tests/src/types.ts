import { MemberId } from '@joystream/types/common'
import { Event } from '@polkadot/types/interfaces/system'

export interface EventDetails {
  event: Event
  blockNumber: number
  indexInBlock: number
}

export interface MembershipBoughtEventDetails extends EventDetails {
  memberId: MemberId
}

export interface MemberInvitedEventDetails extends EventDetails {
  newMemberId: MemberId
}

export type MembershipEventName =
  | 'MembershipBought'
  | 'MemberProfileUpdated'
  | 'MemberAccountsUpdated'
  | 'MemberVerificationStatusUpdated'
  | 'InvitesTransferred'
  | 'MemberInvited'
  | 'StakingAccountAdded'
  | 'StakingAccountConfirmed'
  | 'StakingAccountRemoved'
  | 'InitialInvitationCountUpdated'
  | 'MembershipPriceUpdated'
  | 'ReferralCutUpdated'
  | 'InitialInvitationBalanceUpdated'
  | 'LeaderInvitationQuotaUpdated'
