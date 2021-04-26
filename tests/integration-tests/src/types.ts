import { MemberId } from '@joystream/types/common'
import { ApplicationId, OpeningId, WorkerId, ApplyOnOpeningParameters } from '@joystream/types/working-group'
import { Event } from '@polkadot/types/interfaces/system'
import { BTreeMap } from '@polkadot/types'
import { EventFieldsFragment } from './graphql/generated/queries'

export type MemberContext = {
  account: string
  memberId: MemberId
}

export type AnyQueryNodeEvent = { event: EventFieldsFragment }

export interface EventDetails {
  event: Event
  blockNumber: number
  blockTimestamp: number
  blockHash: string
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
  params: ApplyOnOpeningParameters
}

export interface OpeningFilledEventDetails extends EventDetails {
  applicationIdToWorkerIdMap: BTreeMap<ApplicationId, WorkerId>
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
  | 'WorkerStartedLeaving'
  | 'RewardPaid'
  | 'NewMissedRewardLevelReached'

export type WorkingGroupModuleName =
  | 'storageWorkingGroup'
  | 'contentDirectoryWorkingGroup'
  | 'forumWorkingGroup'
  | 'membershipWorkingGroup'
