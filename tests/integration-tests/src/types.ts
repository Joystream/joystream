import { MemberId } from '@joystream/types/common'
import { ApplicationId, OpeningId } from '@joystream/types/working-group'
import { Event } from '@polkadot/types/interfaces/system'
import { Event as GenericEventData } from './QueryNodeApiSchema.generated'

export type MemberContext = {
  account: string
  memberId: MemberId
}

export type AnyQueryNodeEvent = { event: GenericEventData }

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

export interface OpeningAddedEventDetails extends EventDetails {
  openingId: OpeningId
}

export interface AppliedOnOpeningEventDetails extends EventDetails {
  applicationId: ApplicationId
}

export type WorkingGroupsEventName =
  | 'OpeningAdded'
  | 'AppliedOnOpening'
  | 'OpeningFilled'
  | 'LeaderSet'
  | 'WorkerRoleAccountUpdated'
  | 'LeaderUnset'
  | 'WorkerExited'
  | 'TerminatedWorker'
  | 'TerminatedLeader'
  | 'StakeSlashed'
  | 'StakeDecreased'
  | 'StakeIncreased'
  | 'ApplicationWithdrawn'
  | 'OpeningCanceled'
  | 'BudgetSet'
  | 'WorkerRewardAccountUpdated'
  | 'WorkerRewardAmountUpdated'
  | 'StatusTextChanged'
  | 'BudgetSpending'

// TODO: Other groups...
export type WorkingGroupModuleName = 'storageWorkingGroup'
