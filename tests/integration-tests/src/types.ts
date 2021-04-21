import { MemberId } from '@joystream/types/common'
import { ApplicationId, OpeningId, WorkerId, ApplyOnOpeningParameters } from '@joystream/types/working-group'
import { Event } from '@polkadot/types/interfaces/system'
import { BTreeMap } from '@polkadot/types'
import { Event as GenericEventData } from './QueryNodeApiSchema.generated'

export type MemberContext = {
  account: string
  memberId: MemberId
}

export type AnyQueryNodeEvent = { event: GenericEventData }

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

export type WorkingGroupModuleName =
  | 'storageWorkingGroup'
  | 'contentDirectoryWorkingGroup'
  | 'forumWorkingGroup'
  | 'membershipWorkingGroup'

export const workingGroups: WorkingGroupModuleName[] = [
  'storageWorkingGroup',
  'contentDirectoryWorkingGroup',
  'forumWorkingGroup',
  'membershipWorkingGroup',
]

export const lockIdByWorkingGroup: { [K in WorkingGroupModuleName]: string } = {
  storageWorkingGroup: '0x0606060606060606',
  contentDirectoryWorkingGroup: '0x0707070707070707',
  forumWorkingGroup: '0x0808080808080808',
  membershipWorkingGroup: '0x0909090909090909',
}
