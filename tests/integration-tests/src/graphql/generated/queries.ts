import * as Types from './schema'

import gql from 'graphql-tag'
export type BlockFieldsFragment = { number: number; timestamp: any; network: Types.Network }

export type EventFieldsFragment = {
  id: string
  inExtrinsic?: Types.Maybe<string>
  indexInBlock: number
  type: Types.EventType
  inBlock: BlockFieldsFragment
}

export type MemberMetadataFieldsFragment = { name?: Types.Maybe<string>; about?: Types.Maybe<string> }

export type MembershipFieldsFragment = {
  id: string
  handle: string
  controllerAccount: string
  rootAccount: string
  registeredAtTime: any
  entry: Types.MembershipEntryMethod
  isVerified: boolean
  inviteCount: number
  boundAccounts: Array<string>
  metadata: MemberMetadataFieldsFragment
  registeredAtBlock: BlockFieldsFragment
  invitedBy?: Types.Maybe<{ id: string }>
  invitees: Array<{ id: string }>
}

export type GetMemberByIdQueryVariables = Types.Exact<{
  id: Types.Scalars['ID']
}>

export type GetMemberByIdQuery = { membershipByUniqueInput?: Types.Maybe<MembershipFieldsFragment> }

export type MembershipSystemSnapshotFieldsFragment = {
  snapshotTime: any
  referralCut: number
  invitedInitialBalance: any
  defaultInviteCount: number
  membershipPrice: any
  snapshotBlock: BlockFieldsFragment
}

export type GetMembershipSystemSnapshotAtQueryVariables = Types.Exact<{
  time: Types.Scalars['DateTime']
}>

export type GetMembershipSystemSnapshotAtQuery = {
  membershipSystemSnapshots: Array<MembershipSystemSnapshotFieldsFragment>
}

export type GetMembershipSystemSnapshotBeforeQueryVariables = Types.Exact<{
  time: Types.Scalars['DateTime']
}>

export type GetMembershipSystemSnapshotBeforeQuery = {
  membershipSystemSnapshots: Array<MembershipSystemSnapshotFieldsFragment>
}

export type MembershipBoughtEventFieldsFragment = {
  id: string
  rootAccount: string
  controllerAccount: string
  handle: string
  event: EventFieldsFragment
  newMember: { id: string }
  metadata: MemberMetadataFieldsFragment
  referrer?: Types.Maybe<{ id: string }>
}

export type GetMembershipBoughtEventsByMemberIdQueryVariables = Types.Exact<{
  memberId: Types.Scalars['ID']
}>

export type GetMembershipBoughtEventsByMemberIdQuery = {
  membershipBoughtEvents: Array<MembershipBoughtEventFieldsFragment>
}

export type MemberProfileUpdatedEventFieldsFragment = {
  id: string
  newHandle?: Types.Maybe<string>
  event: EventFieldsFragment
  member: { id: string }
  newMetadata: { name?: Types.Maybe<string>; about?: Types.Maybe<string> }
}

export type GetMemberProfileUpdatedEventsByMemberIdQueryVariables = Types.Exact<{
  memberId: Types.Scalars['ID']
}>

export type GetMemberProfileUpdatedEventsByMemberIdQuery = {
  memberProfileUpdatedEvents: Array<MemberProfileUpdatedEventFieldsFragment>
}

export type MemberAccountsUpdatedEventFieldsFragment = {
  id: string
  newRootAccount?: Types.Maybe<string>
  newControllerAccount?: Types.Maybe<string>
  event: EventFieldsFragment
  member: { id: string }
}

export type GetMemberAccountsUpdatedEventsByMemberIdQueryVariables = Types.Exact<{
  memberId: Types.Scalars['ID']
}>

export type GetMemberAccountsUpdatedEventsByMemberIdQuery = {
  memberAccountsUpdatedEvents: Array<MemberAccountsUpdatedEventFieldsFragment>
}

export type MemberInvitedEventFieldsFragment = {
  id: string
  rootAccount: string
  controllerAccount: string
  handle: string
  event: EventFieldsFragment
  invitingMember: { id: string }
  newMember: { id: string }
  metadata: MemberMetadataFieldsFragment
}

export type GetMemberInvitedEventsByNewMemberIdQueryVariables = Types.Exact<{
  newMemberId: Types.Scalars['ID']
}>

export type GetMemberInvitedEventsByNewMemberIdQuery = { memberInvitedEvents: Array<MemberInvitedEventFieldsFragment> }

export type InvitesTransferredEventFieldsFragment = {
  id: string
  numberOfInvites: number
  event: EventFieldsFragment
  sourceMember: { id: string }
  targetMember: { id: string }
}

export type GetInvitesTransferredEventsBySourceMemberIdQueryVariables = Types.Exact<{
  sourceMemberId: Types.Scalars['ID']
}>

export type GetInvitesTransferredEventsBySourceMemberIdQuery = {
  invitesTransferredEvents: Array<InvitesTransferredEventFieldsFragment>
}

export type StakingAccountAddedEventFieldsFragment = {
  id: string
  account: string
  event: EventFieldsFragment
  member: { id: string }
}

export type GetStakingAccountAddedEventsByMemberIdQueryVariables = Types.Exact<{
  memberId: Types.Scalars['ID']
}>

export type GetStakingAccountAddedEventsByMemberIdQuery = {
  stakingAccountAddedEvents: Array<StakingAccountAddedEventFieldsFragment>
}

export type StakingAccountConfirmedEventFieldsFragment = {
  id: string
  account: string
  event: EventFieldsFragment
  member: { id: string }
}

export type GetStakingAccountConfirmedEventsByMemberIdQueryVariables = Types.Exact<{
  memberId: Types.Scalars['ID']
}>

export type GetStakingAccountConfirmedEventsByMemberIdQuery = {
  stakingAccountConfirmedEvents: Array<StakingAccountConfirmedEventFieldsFragment>
}

export type StakingAccountRemovedEventFieldsFragment = {
  id: string
  account: string
  event: EventFieldsFragment
  member: { id: string }
}

export type GetStakingAccountRemovedEventsByMemberIdQueryVariables = Types.Exact<{
  memberId: Types.Scalars['ID']
}>

export type GetStakingAccountRemovedEventsByMemberIdQuery = {
  stakingAccountRemovedEvents: Array<StakingAccountRemovedEventFieldsFragment>
}

export type ReferralCutUpdatedEventFieldsFragment = { id: string; newValue: number; event: EventFieldsFragment }

export type GetReferralCutUpdatedEventsByEventIdQueryVariables = Types.Exact<{
  eventId: Types.Scalars['ID']
}>

export type GetReferralCutUpdatedEventsByEventIdQuery = {
  referralCutUpdatedEvents: Array<ReferralCutUpdatedEventFieldsFragment>
}

export type MembershipPriceUpdatedEventFieldsFragment = { id: string; newPrice: any; event: EventFieldsFragment }

export type GetMembershipPriceUpdatedEventsByEventIdQueryVariables = Types.Exact<{
  eventId: Types.Scalars['ID']
}>

export type GetMembershipPriceUpdatedEventsByEventIdQuery = {
  membershipPriceUpdatedEvents: Array<MembershipPriceUpdatedEventFieldsFragment>
}

export type InitialInvitationBalanceUpdatedEventFieldsFragment = {
  id: string
  newInitialBalance: any
  event: EventFieldsFragment
}

export type GetInitialInvitationBalanceUpdatedEventsByEventIdQueryVariables = Types.Exact<{
  eventId: Types.Scalars['ID']
}>

export type GetInitialInvitationBalanceUpdatedEventsByEventIdQuery = {
  initialInvitationBalanceUpdatedEvents: Array<InitialInvitationBalanceUpdatedEventFieldsFragment>
}

export type InitialInvitationCountUpdatedEventFieldsFragment = {
  id: string
  newInitialInvitationCount: number
  event: EventFieldsFragment
}

export type GetInitialInvitationCountUpdatedEventsByEventIdQueryVariables = Types.Exact<{
  eventId: Types.Scalars['ID']
}>

export type GetInitialInvitationCountUpdatedEventsByEventIdQuery = {
  initialInvitationCountUpdatedEvents: Array<InitialInvitationCountUpdatedEventFieldsFragment>
}

export type ApplicationBasicFieldsFragment = {
  id: string
  runtimeId: number
  status:
    | { __typename: 'ApplicationStatusPending' }
    | { __typename: 'ApplicationStatusAccepted'; openingFilledEvent?: Types.Maybe<{ id: string }> }
    | { __typename: 'ApplicationStatusRejected'; openingFilledEvent?: Types.Maybe<{ id: string }> }
    | { __typename: 'ApplicationStatusWithdrawn'; applicationWithdrawnEvent?: Types.Maybe<{ id: string }> }
    | { __typename: 'ApplicationStatusCancelled'; openingCanceledEvent?: Types.Maybe<{ id: string }> }
}

type OpeningStatusFields_OpeningStatusOpen_Fragment = { __typename: 'OpeningStatusOpen' }

type OpeningStatusFields_OpeningStatusFilled_Fragment = {
  __typename: 'OpeningStatusFilled'
  openingFilledEvent?: Types.Maybe<{ id: string }>
}

type OpeningStatusFields_OpeningStatusCancelled_Fragment = {
  __typename: 'OpeningStatusCancelled'
  openingCanceledEvent?: Types.Maybe<{ id: string }>
}

export type OpeningStatusFieldsFragment =
  | OpeningStatusFields_OpeningStatusOpen_Fragment
  | OpeningStatusFields_OpeningStatusFilled_Fragment
  | OpeningStatusFields_OpeningStatusCancelled_Fragment

export type ApplicationFormQuestionFieldsFragment = {
  question?: Types.Maybe<string>
  type: Types.ApplicationFormQuestionType
  index: number
}

export type OpeningMetadataFieldsFragment = {
  shortDescription?: Types.Maybe<string>
  description?: Types.Maybe<string>
  hiringLimit?: Types.Maybe<number>
  expectedEnding?: Types.Maybe<any>
  applicationDetails?: Types.Maybe<string>
  applicationFormQuestions: Array<ApplicationFormQuestionFieldsFragment>
}

export type WorkerFieldsFragment = {
  id: string
  runtimeId: number
  roleAccount: string
  rewardAccount: string
  stakeAccount: string
  isLead: boolean
  stake: any
  hiredAtTime: any
  storage?: Types.Maybe<string>
  rewardPerBlock: any
  missingRewardAmount?: Types.Maybe<any>
  group: { name: string }
  membership: { id: string }
  status:
    | { __typename: 'WorkerStatusActive' }
    | {
        __typename: 'WorkerStatusLeft'
        workerStartedLeavingEvent?: Types.Maybe<{ id: string }>
        workerExitedEvent?: Types.Maybe<{ id: string }>
      }
    | { __typename: 'WorkerStatusTerminated'; terminatedWorkerEvent?: Types.Maybe<{ id: string }> }
  payouts: Array<{ id: string }>
  slashes: Array<{ id: string }>
  hiredAtBlock: BlockFieldsFragment
  application: ApplicationBasicFieldsFragment
}

export type WorkingGroupMetadataFieldsFragment = {
  id: string
  status?: Types.Maybe<string>
  statusMessage?: Types.Maybe<string>
  about?: Types.Maybe<string>
  description?: Types.Maybe<string>
  setAtBlock: BlockFieldsFragment
  setInEvent: { event: EventFieldsFragment }
}

export type OpeningFieldsFragment = {
  id: string
  runtimeId: number
  type: Types.WorkingGroupOpeningType
  stakeAmount: any
  unstakingPeriod: number
  rewardPerBlock: any
  createdAt: any
  group: { name: string }
  applications: Array<ApplicationBasicFieldsFragment>
  status:
    | OpeningStatusFields_OpeningStatusOpen_Fragment
    | OpeningStatusFields_OpeningStatusFilled_Fragment
    | OpeningStatusFields_OpeningStatusCancelled_Fragment
  metadata: OpeningMetadataFieldsFragment
  createdAtBlock: BlockFieldsFragment
}

export type GetOpeningByIdQueryVariables = Types.Exact<{
  openingId: Types.Scalars['ID']
}>

export type GetOpeningByIdQuery = { workingGroupOpeningByUniqueInput?: Types.Maybe<OpeningFieldsFragment> }

export type GetOpeningsByIdsQueryVariables = Types.Exact<{
  openingIds?: Types.Maybe<Array<Types.Scalars['ID']> | Types.Scalars['ID']>
}>

export type GetOpeningsByIdsQuery = { workingGroupOpenings: Array<OpeningFieldsFragment> }

export type ApplicationFieldsFragment = {
  createdAt: any
  roleAccount: string
  rewardAccount: string
  stakingAccount: string
  stake: any
  createdAtBlock: BlockFieldsFragment
  opening: { id: string; runtimeId: number }
  applicant: { id: string }
  answers: Array<{ answer: string; question: { question?: Types.Maybe<string> } }>
} & ApplicationBasicFieldsFragment

export type GetApplicationByIdQueryVariables = Types.Exact<{
  applicationId: Types.Scalars['ID']
}>

export type GetApplicationByIdQuery = { workingGroupApplicationByUniqueInput?: Types.Maybe<ApplicationFieldsFragment> }

export type GetApplicationsByIdsQueryVariables = Types.Exact<{
  applicationIds?: Types.Maybe<Array<Types.Scalars['ID']> | Types.Scalars['ID']>
}>

export type GetApplicationsByIdsQuery = { workingGroupApplications: Array<ApplicationFieldsFragment> }

export type WorkingGroupFieldsFragment = {
  id: string
  name: string
  budget: any
  metadata?: Types.Maybe<WorkingGroupMetadataFieldsFragment>
  leader?: Types.Maybe<{ id: string; runtimeId: number }>
}

export type GetWorkingGroupByNameQueryVariables = Types.Exact<{
  name: Types.Scalars['String']
}>

export type GetWorkingGroupByNameQuery = { workingGroupByUniqueInput?: Types.Maybe<WorkingGroupFieldsFragment> }

export type UpcomingOpeningFieldsFragment = {
  id: string
  expectedStart?: Types.Maybe<any>
  stakeAmount?: Types.Maybe<any>
  rewardPerBlock?: Types.Maybe<any>
  createdAt: any
  group: { name: string }
  metadata: OpeningMetadataFieldsFragment
  createdAtBlock: BlockFieldsFragment
  createdInEvent: { id: string }
}

export type GetUpcomingOpeningByIdQueryVariables = Types.Exact<{
  id: Types.Scalars['ID']
}>

export type GetUpcomingOpeningByIdQuery = {
  upcomingWorkingGroupOpeningByUniqueInput?: Types.Maybe<UpcomingOpeningFieldsFragment>
}

export type GetUpcomingOpeningsByCreatedInEventIdsQueryVariables = Types.Exact<{
  createdInEventIds?: Types.Maybe<Array<Types.Scalars['ID']> | Types.Scalars['ID']>
}>

export type GetUpcomingOpeningsByCreatedInEventIdsQuery = {
  upcomingWorkingGroupOpenings: Array<UpcomingOpeningFieldsFragment>
}

export type GetWorkingGroupMetadataSnapshotsByTimeAscQueryVariables = Types.Exact<{
  groupId: Types.Scalars['ID']
}>

export type GetWorkingGroupMetadataSnapshotsByTimeAscQuery = {
  workingGroupMetadata: Array<WorkingGroupMetadataFieldsFragment>
}

export type GetWorkersByRuntimeIdsQueryVariables = Types.Exact<{
  workerIds?: Types.Maybe<Array<Types.Scalars['Int']> | Types.Scalars['Int']>
  groupId: Types.Scalars['ID']
}>

export type GetWorkersByRuntimeIdsQuery = { workers: Array<WorkerFieldsFragment> }

export type AppliedOnOpeningEventFieldsFragment = {
  id: string
  event: EventFieldsFragment
  group: { name: string }
  opening: { id: string; runtimeId: number }
  application: { id: string; runtimeId: number }
}

export type GetAppliedOnOpeningEventsByEventIdsQueryVariables = Types.Exact<{
  eventIds?: Types.Maybe<Array<Types.Scalars['ID']> | Types.Scalars['ID']>
}>

export type GetAppliedOnOpeningEventsByEventIdsQuery = {
  appliedOnOpeningEvents: Array<AppliedOnOpeningEventFieldsFragment>
}

export type OpeningAddedEventFieldsFragment = {
  id: string
  event: EventFieldsFragment
  group: { name: string }
  opening: { id: string; runtimeId: number }
}

export type GetOpeningAddedEventsByEventIdsQueryVariables = Types.Exact<{
  eventIds?: Types.Maybe<Array<Types.Scalars['ID']> | Types.Scalars['ID']>
}>

export type GetOpeningAddedEventsByEventIdsQuery = { openingAddedEvents: Array<OpeningAddedEventFieldsFragment> }

export type LeaderSetEventFieldsFragment = {
  id: string
  event: EventFieldsFragment
  group: { name: string }
  worker?: Types.Maybe<{ id: string; runtimeId: number }>
}

export type GetLeaderSetEventsByEventIdsQueryVariables = Types.Exact<{
  eventIds?: Types.Maybe<Array<Types.Scalars['ID']> | Types.Scalars['ID']>
}>

export type GetLeaderSetEventsByEventIdsQuery = { leaderSetEvents: Array<LeaderSetEventFieldsFragment> }

export type OpeningFilledEventFieldsFragment = {
  id: string
  event: EventFieldsFragment
  group: { name: string }
  opening: { id: string; runtimeId: number }
  workersHired: Array<WorkerFieldsFragment>
}

export type GetOpeningFilledEventsByEventIdsQueryVariables = Types.Exact<{
  eventIds?: Types.Maybe<Array<Types.Scalars['ID']> | Types.Scalars['ID']>
}>

export type GetOpeningFilledEventsByEventIdsQuery = { openingFilledEvents: Array<OpeningFilledEventFieldsFragment> }

export type ApplicationWithdrawnEventFieldsFragment = {
  id: string
  event: EventFieldsFragment
  group: { name: string }
  application: { id: string; runtimeId: number }
}

export type GetApplicationWithdrawnEventsByEventIdsQueryVariables = Types.Exact<{
  eventIds?: Types.Maybe<Array<Types.Scalars['ID']> | Types.Scalars['ID']>
}>

export type GetApplicationWithdrawnEventsByEventIdsQuery = {
  applicationWithdrawnEvents: Array<ApplicationWithdrawnEventFieldsFragment>
}

export type OpeningCanceledEventFieldsFragment = {
  id: string
  event: EventFieldsFragment
  group: { name: string }
  opening: { id: string; runtimeId: number }
}

export type GetOpeningCancelledEventsByEventIdsQueryVariables = Types.Exact<{
  eventIds?: Types.Maybe<Array<Types.Scalars['ID']> | Types.Scalars['ID']>
}>

export type GetOpeningCancelledEventsByEventIdsQuery = {
  openingCanceledEvents: Array<OpeningCanceledEventFieldsFragment>
}

export type StatusTextChangedEventFieldsFragment = {
  id: string
  metadata?: Types.Maybe<string>
  event: EventFieldsFragment
  group: { name: string }
  result:
    | { __typename: 'UpcomingOpeningAdded'; upcomingOpeningId: string }
    | { __typename: 'UpcomingOpeningRemoved'; upcomingOpeningId: string }
    | { __typename: 'WorkingGroupMetadataSet'; metadata?: Types.Maybe<{ id: string }> }
    | { __typename: 'InvalidActionMetadata'; reason: string }
}

export type GetStatusTextChangedEventsByEventIdsQueryVariables = Types.Exact<{
  eventIds?: Types.Maybe<Array<Types.Scalars['ID']> | Types.Scalars['ID']>
}>

export type GetStatusTextChangedEventsByEventIdsQuery = {
  statusTextChangedEvents: Array<StatusTextChangedEventFieldsFragment>
}

export type WorkerRoleAccountUpdatedEventFieldsFragment = {
  id: string
  newRoleAccount: string
  event: EventFieldsFragment
  group: { name: string }
  worker: { id: string; runtimeId: number }
}

export type GetWorkerRoleAccountUpdatedEventsByEventIdsQueryVariables = Types.Exact<{
  eventIds?: Types.Maybe<Array<Types.Scalars['ID']> | Types.Scalars['ID']>
}>

export type GetWorkerRoleAccountUpdatedEventsByEventIdsQuery = {
  workerRoleAccountUpdatedEvents: Array<WorkerRoleAccountUpdatedEventFieldsFragment>
}

export type WorkerRewardAccountUpdatedEventFieldsFragment = {
  id: string
  newRewardAccount: string
  event: EventFieldsFragment
  group: { name: string }
  worker: { id: string; runtimeId: number }
}

export type GetWorkerRewardAccountUpdatedEventsByEventIdsQueryVariables = Types.Exact<{
  eventIds?: Types.Maybe<Array<Types.Scalars['ID']> | Types.Scalars['ID']>
}>

export type GetWorkerRewardAccountUpdatedEventsByEventIdsQuery = {
  workerRewardAccountUpdatedEvents: Array<WorkerRewardAccountUpdatedEventFieldsFragment>
}

export type StakeIncreasedEventFieldsFragment = {
  id: string
  amount: any
  event: EventFieldsFragment
  group: { name: string }
  worker: { id: string; runtimeId: number }
}

export type GetStakeIncreasedEventsByEventIdsQueryVariables = Types.Exact<{
  eventIds?: Types.Maybe<Array<Types.Scalars['ID']> | Types.Scalars['ID']>
}>

export type GetStakeIncreasedEventsByEventIdsQuery = { stakeIncreasedEvents: Array<StakeIncreasedEventFieldsFragment> }

export type WorkerStartedLeavingEventFieldsFragment = {
  id: string
  rationale?: Types.Maybe<string>
  event: EventFieldsFragment
  group: { name: string }
  worker: { id: string; runtimeId: number }
}

export type GetWorkerStartedLeavingEventsByEventIdsQueryVariables = Types.Exact<{
  eventIds?: Types.Maybe<Array<Types.Scalars['ID']> | Types.Scalars['ID']>
}>

export type GetWorkerStartedLeavingEventsByEventIdsQuery = {
  workerStartedLeavingEvents: Array<WorkerStartedLeavingEventFieldsFragment>
}

export type WorkerRewardAmountUpdatedEventFieldsFragment = {
  id: string
  newRewardPerBlock: any
  event: EventFieldsFragment
  group: { name: string }
  worker: { id: string; runtimeId: number }
}

export type GetWorkerRewardAmountUpdatedEventsByEventIdsQueryVariables = Types.Exact<{
  eventIds?: Types.Maybe<Array<Types.Scalars['ID']> | Types.Scalars['ID']>
}>

export type GetWorkerRewardAmountUpdatedEventsByEventIdsQuery = {
  workerRewardAmountUpdatedEvents: Array<WorkerRewardAmountUpdatedEventFieldsFragment>
}

export type StakeSlashedEventFieldsFragment = {
  id: string
  requestedAmount: any
  slashedAmount: any
  rationale?: Types.Maybe<string>
  event: EventFieldsFragment
  group: { name: string }
  worker: { id: string; runtimeId: number }
}

export type GetStakeSlashedEventsByEventIdsQueryVariables = Types.Exact<{
  eventIds?: Types.Maybe<Array<Types.Scalars['ID']> | Types.Scalars['ID']>
}>

export type GetStakeSlashedEventsByEventIdsQuery = { stakeSlashedEvents: Array<StakeSlashedEventFieldsFragment> }

export type StakeDecreasedEventFieldsFragment = {
  id: string
  amount: any
  event: EventFieldsFragment
  group: { name: string }
  worker: { id: string; runtimeId: number }
}

export type GetStakeDecreasedEventsByEventIdsQueryVariables = Types.Exact<{
  eventIds?: Types.Maybe<Array<Types.Scalars['ID']> | Types.Scalars['ID']>
}>

export type GetStakeDecreasedEventsByEventIdsQuery = { stakeDecreasedEvents: Array<StakeDecreasedEventFieldsFragment> }

export type TerminatedWorkerEventFieldsFragment = {
  id: string
  penalty?: Types.Maybe<any>
  rationale?: Types.Maybe<string>
  event: EventFieldsFragment
  group: { name: string }
  worker: { id: string; runtimeId: number }
}

export type GetTerminatedWorkerEventsByEventIdsQueryVariables = Types.Exact<{
  eventIds?: Types.Maybe<Array<Types.Scalars['ID']> | Types.Scalars['ID']>
}>

export type GetTerminatedWorkerEventsByEventIdsQuery = {
  terminatedWorkerEvents: Array<TerminatedWorkerEventFieldsFragment>
}

export type TerminatedLeaderEventFieldsFragment = {
  id: string
  penalty?: Types.Maybe<any>
  rationale?: Types.Maybe<string>
  event: EventFieldsFragment
  group: { name: string }
  worker: { id: string; runtimeId: number }
}

export type GetTerminatedLeaderEventsByEventIdsQueryVariables = Types.Exact<{
  eventIds?: Types.Maybe<Array<Types.Scalars['ID']> | Types.Scalars['ID']>
}>

export type GetTerminatedLeaderEventsByEventIdsQuery = {
  terminatedLeaderEvents: Array<TerminatedLeaderEventFieldsFragment>
}

export type LeaderUnsetEventFieldsFragment = {
  id: string
  event: EventFieldsFragment
  group: { name: string }
  leader: { id: string; runtimeId: number }
}

export type GetLeaderUnsetEventsByEventIdsQueryVariables = Types.Exact<{
  eventIds?: Types.Maybe<Array<Types.Scalars['ID']> | Types.Scalars['ID']>
}>

export type GetLeaderUnsetEventsByEventIdsQuery = { leaderUnsetEvents: Array<LeaderUnsetEventFieldsFragment> }

export type BudgetSetEventFieldsFragment = {
  id: string
  newBudget: any
  event: EventFieldsFragment
  group: { name: string }
}

export type GetBudgetSetEventsByEventIdsQueryVariables = Types.Exact<{
  eventIds?: Types.Maybe<Array<Types.Scalars['ID']> | Types.Scalars['ID']>
}>

export type GetBudgetSetEventsByEventIdsQuery = { budgetSetEvents: Array<BudgetSetEventFieldsFragment> }

export type BudgetSpendingEventFieldsFragment = {
  id: string
  reciever: string
  amount: any
  rationale?: Types.Maybe<string>
  event: EventFieldsFragment
  group: { name: string }
}

export type GetBudgetSpendingEventsByEventIdsQueryVariables = Types.Exact<{
  eventIds?: Types.Maybe<Array<Types.Scalars['ID']> | Types.Scalars['ID']>
}>

export type GetBudgetSpendingEventsByEventIdsQuery = { budgetSpendingEvents: Array<BudgetSpendingEventFieldsFragment> }

export const MemberMetadataFields = gql`
  fragment MemberMetadataFields on MemberMetadata {
    name
    about
  }
`
export const BlockFields = gql`
  fragment BlockFields on Block {
    number
    timestamp
    network
  }
`
export const MembershipFields = gql`
  fragment MembershipFields on Membership {
    id
    handle
    metadata {
      ...MemberMetadataFields
    }
    controllerAccount
    rootAccount
    registeredAtBlock {
      ...BlockFields
    }
    registeredAtTime
    entry
    isVerified
    inviteCount
    invitedBy {
      id
    }
    invitees {
      id
    }
    boundAccounts
  }
  ${MemberMetadataFields}
  ${BlockFields}
`
export const MembershipSystemSnapshotFields = gql`
  fragment MembershipSystemSnapshotFields on MembershipSystemSnapshot {
    snapshotBlock {
      ...BlockFields
    }
    snapshotTime
    referralCut
    invitedInitialBalance
    defaultInviteCount
    membershipPrice
  }
  ${BlockFields}
`
export const EventFields = gql`
  fragment EventFields on Event {
    id
    inBlock {
      ...BlockFields
    }
    inExtrinsic
    indexInBlock
    type
  }
  ${BlockFields}
`
export const MembershipBoughtEventFields = gql`
  fragment MembershipBoughtEventFields on MembershipBoughtEvent {
    id
    event {
      ...EventFields
    }
    newMember {
      id
    }
    rootAccount
    controllerAccount
    handle
    metadata {
      ...MemberMetadataFields
    }
    referrer {
      id
    }
  }
  ${EventFields}
  ${MemberMetadataFields}
`
export const MemberProfileUpdatedEventFields = gql`
  fragment MemberProfileUpdatedEventFields on MemberProfileUpdatedEvent {
    id
    event {
      ...EventFields
    }
    member {
      id
    }
    newHandle
    newMetadata {
      name
      about
    }
  }
  ${EventFields}
`
export const MemberAccountsUpdatedEventFields = gql`
  fragment MemberAccountsUpdatedEventFields on MemberAccountsUpdatedEvent {
    id
    event {
      ...EventFields
    }
    member {
      id
    }
    newRootAccount
    newControllerAccount
  }
  ${EventFields}
`
export const MemberInvitedEventFields = gql`
  fragment MemberInvitedEventFields on MemberInvitedEvent {
    id
    event {
      ...EventFields
    }
    invitingMember {
      id
    }
    newMember {
      id
    }
    rootAccount
    controllerAccount
    handle
    metadata {
      ...MemberMetadataFields
    }
  }
  ${EventFields}
  ${MemberMetadataFields}
`
export const InvitesTransferredEventFields = gql`
  fragment InvitesTransferredEventFields on InvitesTransferredEvent {
    id
    event {
      ...EventFields
    }
    sourceMember {
      id
    }
    targetMember {
      id
    }
    numberOfInvites
  }
  ${EventFields}
`
export const StakingAccountAddedEventFields = gql`
  fragment StakingAccountAddedEventFields on StakingAccountAddedEvent {
    id
    event {
      ...EventFields
    }
    member {
      id
    }
    account
  }
  ${EventFields}
`
export const StakingAccountConfirmedEventFields = gql`
  fragment StakingAccountConfirmedEventFields on StakingAccountConfirmedEvent {
    id
    event {
      ...EventFields
    }
    member {
      id
    }
    account
  }
  ${EventFields}
`
export const StakingAccountRemovedEventFields = gql`
  fragment StakingAccountRemovedEventFields on StakingAccountRemovedEvent {
    id
    event {
      ...EventFields
    }
    member {
      id
    }
    account
  }
  ${EventFields}
`
export const ReferralCutUpdatedEventFields = gql`
  fragment ReferralCutUpdatedEventFields on ReferralCutUpdatedEvent {
    id
    event {
      ...EventFields
    }
    newValue
  }
  ${EventFields}
`
export const MembershipPriceUpdatedEventFields = gql`
  fragment MembershipPriceUpdatedEventFields on MembershipPriceUpdatedEvent {
    id
    event {
      ...EventFields
    }
    newPrice
  }
  ${EventFields}
`
export const InitialInvitationBalanceUpdatedEventFields = gql`
  fragment InitialInvitationBalanceUpdatedEventFields on InitialInvitationBalanceUpdatedEvent {
    id
    event {
      ...EventFields
    }
    newInitialBalance
  }
  ${EventFields}
`
export const InitialInvitationCountUpdatedEventFields = gql`
  fragment InitialInvitationCountUpdatedEventFields on InitialInvitationCountUpdatedEvent {
    id
    event {
      ...EventFields
    }
    newInitialInvitationCount
  }
  ${EventFields}
`
export const ApplicationBasicFields = gql`
  fragment ApplicationBasicFields on WorkingGroupApplication {
    id
    runtimeId
    status {
      __typename
      ... on ApplicationStatusCancelled {
        openingCanceledEvent {
          id
        }
      }
      ... on ApplicationStatusWithdrawn {
        applicationWithdrawnEvent {
          id
        }
      }
      ... on ApplicationStatusAccepted {
        openingFilledEvent {
          id
        }
      }
      ... on ApplicationStatusRejected {
        openingFilledEvent {
          id
        }
      }
    }
  }
`
export const OpeningStatusFields = gql`
  fragment OpeningStatusFields on WorkingGroupOpeningStatus {
    __typename
    ... on OpeningStatusFilled {
      openingFilledEvent {
        id
      }
    }
    ... on OpeningStatusCancelled {
      openingCanceledEvent {
        id
      }
    }
  }
`
export const ApplicationFormQuestionFields = gql`
  fragment ApplicationFormQuestionFields on ApplicationFormQuestion {
    question
    type
    index
  }
`
export const OpeningMetadataFields = gql`
  fragment OpeningMetadataFields on WorkingGroupOpeningMetadata {
    shortDescription
    description
    hiringLimit
    expectedEnding
    applicationDetails
    applicationFormQuestions {
      ...ApplicationFormQuestionFields
    }
  }
  ${ApplicationFormQuestionFields}
`
export const OpeningFields = gql`
  fragment OpeningFields on WorkingGroupOpening {
    id
    runtimeId
    group {
      name
    }
    applications {
      ...ApplicationBasicFields
    }
    type
    status {
      ...OpeningStatusFields
    }
    metadata {
      ...OpeningMetadataFields
    }
    stakeAmount
    unstakingPeriod
    rewardPerBlock
    createdAtBlock {
      ...BlockFields
    }
    createdAt
  }
  ${ApplicationBasicFields}
  ${OpeningStatusFields}
  ${OpeningMetadataFields}
  ${BlockFields}
`
export const ApplicationFields = gql`
  fragment ApplicationFields on WorkingGroupApplication {
    ...ApplicationBasicFields
    createdAtBlock {
      ...BlockFields
    }
    createdAt
    opening {
      id
      runtimeId
    }
    applicant {
      id
    }
    roleAccount
    rewardAccount
    stakingAccount
    answers {
      question {
        question
      }
      answer
    }
    stake
  }
  ${ApplicationBasicFields}
  ${BlockFields}
`
export const WorkingGroupMetadataFields = gql`
  fragment WorkingGroupMetadataFields on WorkingGroupMetadata {
    id
    status
    statusMessage
    about
    description
    setAtBlock {
      ...BlockFields
    }
    setInEvent {
      event {
        ...EventFields
      }
    }
  }
  ${BlockFields}
  ${EventFields}
`
export const WorkingGroupFields = gql`
  fragment WorkingGroupFields on WorkingGroup {
    id
    name
    metadata {
      ...WorkingGroupMetadataFields
    }
    leader {
      id
      runtimeId
    }
    budget
  }
  ${WorkingGroupMetadataFields}
`
export const UpcomingOpeningFields = gql`
  fragment UpcomingOpeningFields on UpcomingWorkingGroupOpening {
    id
    group {
      name
    }
    metadata {
      ...OpeningMetadataFields
    }
    expectedStart
    stakeAmount
    rewardPerBlock
    createdAtBlock {
      ...BlockFields
    }
    createdInEvent {
      id
    }
    createdAt
  }
  ${OpeningMetadataFields}
  ${BlockFields}
`
export const AppliedOnOpeningEventFields = gql`
  fragment AppliedOnOpeningEventFields on AppliedOnOpeningEvent {
    id
    event {
      ...EventFields
    }
    group {
      name
    }
    opening {
      id
      runtimeId
    }
    application {
      id
      runtimeId
    }
  }
  ${EventFields}
`
export const OpeningAddedEventFields = gql`
  fragment OpeningAddedEventFields on OpeningAddedEvent {
    id
    event {
      ...EventFields
    }
    group {
      name
    }
    opening {
      id
      runtimeId
    }
  }
  ${EventFields}
`
export const LeaderSetEventFields = gql`
  fragment LeaderSetEventFields on LeaderSetEvent {
    id
    event {
      ...EventFields
    }
    group {
      name
    }
    worker {
      id
      runtimeId
    }
  }
  ${EventFields}
`
export const WorkerFields = gql`
  fragment WorkerFields on Worker {
    id
    runtimeId
    group {
      name
    }
    membership {
      id
    }
    roleAccount
    rewardAccount
    stakeAccount
    status {
      __typename
      ... on WorkerStatusLeft {
        workerStartedLeavingEvent {
          id
        }
        workerExitedEvent {
          id
        }
      }
      ... on WorkerStatusTerminated {
        terminatedWorkerEvent {
          id
        }
      }
    }
    isLead
    stake
    payouts {
      id
    }
    slashes {
      id
    }
    hiredAtBlock {
      ...BlockFields
    }
    hiredAtTime
    application {
      ...ApplicationBasicFields
    }
    storage
    rewardPerBlock
    missingRewardAmount
  }
  ${BlockFields}
  ${ApplicationBasicFields}
`
export const OpeningFilledEventFields = gql`
  fragment OpeningFilledEventFields on OpeningFilledEvent {
    id
    event {
      ...EventFields
    }
    group {
      name
    }
    opening {
      id
      runtimeId
    }
    workersHired {
      ...WorkerFields
    }
  }
  ${EventFields}
  ${WorkerFields}
`
export const ApplicationWithdrawnEventFields = gql`
  fragment ApplicationWithdrawnEventFields on ApplicationWithdrawnEvent {
    id
    event {
      ...EventFields
    }
    group {
      name
    }
    application {
      id
      runtimeId
    }
  }
  ${EventFields}
`
export const OpeningCanceledEventFields = gql`
  fragment OpeningCanceledEventFields on OpeningCanceledEvent {
    id
    event {
      ...EventFields
    }
    group {
      name
    }
    opening {
      id
      runtimeId
    }
  }
  ${EventFields}
`
export const StatusTextChangedEventFields = gql`
  fragment StatusTextChangedEventFields on StatusTextChangedEvent {
    id
    event {
      ...EventFields
    }
    group {
      name
    }
    metadata
    result {
      __typename
      ... on UpcomingOpeningAdded {
        upcomingOpeningId
      }
      ... on UpcomingOpeningRemoved {
        upcomingOpeningId
      }
      ... on WorkingGroupMetadataSet {
        metadata {
          id
        }
      }
      ... on InvalidActionMetadata {
        reason
      }
    }
  }
  ${EventFields}
`
export const WorkerRoleAccountUpdatedEventFields = gql`
  fragment WorkerRoleAccountUpdatedEventFields on WorkerRoleAccountUpdatedEvent {
    id
    event {
      ...EventFields
    }
    group {
      name
    }
    worker {
      id
      runtimeId
    }
    newRoleAccount
  }
  ${EventFields}
`
export const WorkerRewardAccountUpdatedEventFields = gql`
  fragment WorkerRewardAccountUpdatedEventFields on WorkerRewardAccountUpdatedEvent {
    id
    event {
      ...EventFields
    }
    group {
      name
    }
    worker {
      id
      runtimeId
    }
    newRewardAccount
  }
  ${EventFields}
`
export const StakeIncreasedEventFields = gql`
  fragment StakeIncreasedEventFields on StakeIncreasedEvent {
    id
    event {
      ...EventFields
    }
    group {
      name
    }
    worker {
      id
      runtimeId
    }
    amount
  }
  ${EventFields}
`
export const WorkerStartedLeavingEventFields = gql`
  fragment WorkerStartedLeavingEventFields on WorkerStartedLeavingEvent {
    id
    event {
      ...EventFields
    }
    group {
      name
    }
    worker {
      id
      runtimeId
    }
    rationale
  }
  ${EventFields}
`
export const WorkerRewardAmountUpdatedEventFields = gql`
  fragment WorkerRewardAmountUpdatedEventFields on WorkerRewardAmountUpdatedEvent {
    id
    event {
      ...EventFields
    }
    group {
      name
    }
    worker {
      id
      runtimeId
    }
    newRewardPerBlock
  }
  ${EventFields}
`
export const StakeSlashedEventFields = gql`
  fragment StakeSlashedEventFields on StakeSlashedEvent {
    id
    event {
      ...EventFields
    }
    group {
      name
    }
    worker {
      id
      runtimeId
    }
    requestedAmount
    slashedAmount
    rationale
  }
  ${EventFields}
`
export const StakeDecreasedEventFields = gql`
  fragment StakeDecreasedEventFields on StakeDecreasedEvent {
    id
    event {
      ...EventFields
    }
    group {
      name
    }
    worker {
      id
      runtimeId
    }
    amount
  }
  ${EventFields}
`
export const TerminatedWorkerEventFields = gql`
  fragment TerminatedWorkerEventFields on TerminatedWorkerEvent {
    id
    event {
      ...EventFields
    }
    group {
      name
    }
    worker {
      id
      runtimeId
    }
    penalty
    rationale
  }
  ${EventFields}
`
export const TerminatedLeaderEventFields = gql`
  fragment TerminatedLeaderEventFields on TerminatedLeaderEvent {
    id
    event {
      ...EventFields
    }
    group {
      name
    }
    worker {
      id
      runtimeId
    }
    penalty
    rationale
  }
  ${EventFields}
`
export const LeaderUnsetEventFields = gql`
  fragment LeaderUnsetEventFields on LeaderUnsetEvent {
    id
    event {
      ...EventFields
    }
    group {
      name
    }
    leader {
      id
      runtimeId
    }
  }
  ${EventFields}
`
export const BudgetSetEventFields = gql`
  fragment BudgetSetEventFields on BudgetSetEvent {
    id
    event {
      ...EventFields
    }
    group {
      name
    }
    newBudget
  }
  ${EventFields}
`
export const BudgetSpendingEventFields = gql`
  fragment BudgetSpendingEventFields on BudgetSpendingEvent {
    id
    event {
      ...EventFields
    }
    group {
      name
    }
    reciever
    amount
    rationale
  }
  ${EventFields}
`
export const GetMemberById = gql`
  query getMemberById($id: ID!) {
    membershipByUniqueInput(where: { id: $id }) {
      ...MembershipFields
    }
  }
  ${MembershipFields}
`
export const GetMembershipSystemSnapshotAt = gql`
  query getMembershipSystemSnapshotAt($time: DateTime!) {
    membershipSystemSnapshots(where: { snapshotTime_eq: $time }, orderBy: snapshotTime_DESC, limit: 1) {
      ...MembershipSystemSnapshotFields
    }
  }
  ${MembershipSystemSnapshotFields}
`
export const GetMembershipSystemSnapshotBefore = gql`
  query getMembershipSystemSnapshotBefore($time: DateTime!) {
    membershipSystemSnapshots(where: { snapshotTime_lt: $time }, orderBy: snapshotTime_DESC, limit: 1) {
      ...MembershipSystemSnapshotFields
    }
  }
  ${MembershipSystemSnapshotFields}
`
export const GetMembershipBoughtEventsByMemberId = gql`
  query getMembershipBoughtEventsByMemberId($memberId: ID!) {
    membershipBoughtEvents(where: { newMember: { id_eq: $memberId } }) {
      ...MembershipBoughtEventFields
    }
  }
  ${MembershipBoughtEventFields}
`
export const GetMemberProfileUpdatedEventsByMemberId = gql`
  query getMemberProfileUpdatedEventsByMemberId($memberId: ID!) {
    memberProfileUpdatedEvents(where: { member: { id_eq: $memberId } }) {
      ...MemberProfileUpdatedEventFields
    }
  }
  ${MemberProfileUpdatedEventFields}
`
export const GetMemberAccountsUpdatedEventsByMemberId = gql`
  query getMemberAccountsUpdatedEventsByMemberId($memberId: ID!) {
    memberAccountsUpdatedEvents(where: { member: { id_eq: $memberId } }) {
      ...MemberAccountsUpdatedEventFields
    }
  }
  ${MemberAccountsUpdatedEventFields}
`
export const GetMemberInvitedEventsByNewMemberId = gql`
  query getMemberInvitedEventsByNewMemberId($newMemberId: ID!) {
    memberInvitedEvents(where: { newMember: { id_eq: $newMemberId } }) {
      ...MemberInvitedEventFields
    }
  }
  ${MemberInvitedEventFields}
`
export const GetInvitesTransferredEventsBySourceMemberId = gql`
  query getInvitesTransferredEventsBySourceMemberId($sourceMemberId: ID!) {
    invitesTransferredEvents(where: { sourceMember: { id_eq: $sourceMemberId } }) {
      ...InvitesTransferredEventFields
    }
  }
  ${InvitesTransferredEventFields}
`
export const GetStakingAccountAddedEventsByMemberId = gql`
  query getStakingAccountAddedEventsByMemberId($memberId: ID!) {
    stakingAccountAddedEvents(where: { member: { id_eq: $memberId } }) {
      ...StakingAccountAddedEventFields
    }
  }
  ${StakingAccountAddedEventFields}
`
export const GetStakingAccountConfirmedEventsByMemberId = gql`
  query getStakingAccountConfirmedEventsByMemberId($memberId: ID!) {
    stakingAccountConfirmedEvents(where: { member: { id_eq: $memberId } }) {
      ...StakingAccountConfirmedEventFields
    }
  }
  ${StakingAccountConfirmedEventFields}
`
export const GetStakingAccountRemovedEventsByMemberId = gql`
  query getStakingAccountRemovedEventsByMemberId($memberId: ID!) {
    stakingAccountRemovedEvents(where: { member: { id_eq: $memberId } }) {
      ...StakingAccountRemovedEventFields
    }
  }
  ${StakingAccountRemovedEventFields}
`
export const GetReferralCutUpdatedEventsByEventId = gql`
  query getReferralCutUpdatedEventsByEventId($eventId: ID!) {
    referralCutUpdatedEvents(where: { event: { id_eq: $eventId } }) {
      ...ReferralCutUpdatedEventFields
    }
  }
  ${ReferralCutUpdatedEventFields}
`
export const GetMembershipPriceUpdatedEventsByEventId = gql`
  query getMembershipPriceUpdatedEventsByEventId($eventId: ID!) {
    membershipPriceUpdatedEvents(where: { event: { id_eq: $eventId } }) {
      ...MembershipPriceUpdatedEventFields
    }
  }
  ${MembershipPriceUpdatedEventFields}
`
export const GetInitialInvitationBalanceUpdatedEventsByEventId = gql`
  query getInitialInvitationBalanceUpdatedEventsByEventId($eventId: ID!) {
    initialInvitationBalanceUpdatedEvents(where: { event: { id_eq: $eventId } }) {
      ...InitialInvitationBalanceUpdatedEventFields
    }
  }
  ${InitialInvitationBalanceUpdatedEventFields}
`
export const GetInitialInvitationCountUpdatedEventsByEventId = gql`
  query getInitialInvitationCountUpdatedEventsByEventId($eventId: ID!) {
    initialInvitationCountUpdatedEvents(where: { event: { id_eq: $eventId } }) {
      ...InitialInvitationCountUpdatedEventFields
    }
  }
  ${InitialInvitationCountUpdatedEventFields}
`
export const GetOpeningById = gql`
  query getOpeningById($openingId: ID!) {
    workingGroupOpeningByUniqueInput(where: { id: $openingId }) {
      ...OpeningFields
    }
  }
  ${OpeningFields}
`
export const GetOpeningsByIds = gql`
  query getOpeningsByIds($openingIds: [ID!]) {
    workingGroupOpenings(where: { id_in: $openingIds }) {
      ...OpeningFields
    }
  }
  ${OpeningFields}
`
export const GetApplicationById = gql`
  query getApplicationById($applicationId: ID!) {
    workingGroupApplicationByUniqueInput(where: { id: $applicationId }) {
      ...ApplicationFields
    }
  }
  ${ApplicationFields}
`
export const GetApplicationsByIds = gql`
  query getApplicationsByIds($applicationIds: [ID!]) {
    workingGroupApplications(where: { id_in: $applicationIds }) {
      ...ApplicationFields
    }
  }
  ${ApplicationFields}
`
export const GetWorkingGroupByName = gql`
  query getWorkingGroupByName($name: String!) {
    workingGroupByUniqueInput(where: { name: $name }) {
      ...WorkingGroupFields
    }
  }
  ${WorkingGroupFields}
`
export const GetUpcomingOpeningById = gql`
  query getUpcomingOpeningById($id: ID!) {
    upcomingWorkingGroupOpeningByUniqueInput(where: { id: $id }) {
      ...UpcomingOpeningFields
    }
  }
  ${UpcomingOpeningFields}
`
export const GetUpcomingOpeningsByCreatedInEventIds = gql`
  query getUpcomingOpeningsByCreatedInEventIds($createdInEventIds: [ID!]) {
    upcomingWorkingGroupOpenings(where: { createdInEvent: { id_in: $createdInEventIds } }) {
      ...UpcomingOpeningFields
    }
  }
  ${UpcomingOpeningFields}
`
export const GetWorkingGroupMetadataSnapshotsByTimeAsc = gql`
  query getWorkingGroupMetadataSnapshotsByTimeAsc($groupId: ID!) {
    workingGroupMetadata(where: { group: { id_eq: $groupId } }, orderBy: createdAt_ASC) {
      ...WorkingGroupMetadataFields
    }
  }
  ${WorkingGroupMetadataFields}
`
export const GetWorkersByRuntimeIds = gql`
  query getWorkersByRuntimeIds($workerIds: [Int!], $groupId: ID!) {
    workers(where: { runtimeId_in: $workerIds, group: { id_eq: $groupId } }) {
      ...WorkerFields
    }
  }
  ${WorkerFields}
`
export const GetAppliedOnOpeningEventsByEventIds = gql`
  query getAppliedOnOpeningEventsByEventIds($eventIds: [ID!]) {
    appliedOnOpeningEvents(where: { event: { id_in: $eventIds } }) {
      ...AppliedOnOpeningEventFields
    }
  }
  ${AppliedOnOpeningEventFields}
`
export const GetOpeningAddedEventsByEventIds = gql`
  query getOpeningAddedEventsByEventIds($eventIds: [ID!]) {
    openingAddedEvents(where: { event: { id_in: $eventIds } }) {
      ...OpeningAddedEventFields
    }
  }
  ${OpeningAddedEventFields}
`
export const GetLeaderSetEventsByEventIds = gql`
  query getLeaderSetEventsByEventIds($eventIds: [ID!]) {
    leaderSetEvents(where: { event: { id_in: $eventIds } }) {
      ...LeaderSetEventFields
    }
  }
  ${LeaderSetEventFields}
`
export const GetOpeningFilledEventsByEventIds = gql`
  query getOpeningFilledEventsByEventIds($eventIds: [ID!]) {
    openingFilledEvents(where: { event: { id_in: $eventIds } }) {
      ...OpeningFilledEventFields
    }
  }
  ${OpeningFilledEventFields}
`
export const GetApplicationWithdrawnEventsByEventIds = gql`
  query getApplicationWithdrawnEventsByEventIds($eventIds: [ID!]) {
    applicationWithdrawnEvents(where: { event: { id_in: $eventIds } }) {
      ...ApplicationWithdrawnEventFields
    }
  }
  ${ApplicationWithdrawnEventFields}
`
export const GetOpeningCancelledEventsByEventIds = gql`
  query getOpeningCancelledEventsByEventIds($eventIds: [ID!]) {
    openingCanceledEvents(where: { event: { id_in: $eventIds } }) {
      ...OpeningCanceledEventFields
    }
  }
  ${OpeningCanceledEventFields}
`
export const GetStatusTextChangedEventsByEventIds = gql`
  query getStatusTextChangedEventsByEventIds($eventIds: [ID!]) {
    statusTextChangedEvents(where: { event: { id_in: $eventIds } }) {
      ...StatusTextChangedEventFields
    }
  }
  ${StatusTextChangedEventFields}
`
export const GetWorkerRoleAccountUpdatedEventsByEventIds = gql`
  query getWorkerRoleAccountUpdatedEventsByEventIds($eventIds: [ID!]) {
    workerRoleAccountUpdatedEvents(where: { event: { id_in: $eventIds } }) {
      ...WorkerRoleAccountUpdatedEventFields
    }
  }
  ${WorkerRoleAccountUpdatedEventFields}
`
export const GetWorkerRewardAccountUpdatedEventsByEventIds = gql`
  query getWorkerRewardAccountUpdatedEventsByEventIds($eventIds: [ID!]) {
    workerRewardAccountUpdatedEvents(where: { event: { id_in: $eventIds } }) {
      ...WorkerRewardAccountUpdatedEventFields
    }
  }
  ${WorkerRewardAccountUpdatedEventFields}
`
export const GetStakeIncreasedEventsByEventIds = gql`
  query getStakeIncreasedEventsByEventIds($eventIds: [ID!]) {
    stakeIncreasedEvents(where: { event: { id_in: $eventIds } }) {
      ...StakeIncreasedEventFields
    }
  }
  ${StakeIncreasedEventFields}
`
export const GetWorkerStartedLeavingEventsByEventIds = gql`
  query getWorkerStartedLeavingEventsByEventIds($eventIds: [ID!]) {
    workerStartedLeavingEvents(where: { event: { id_in: $eventIds } }) {
      ...WorkerStartedLeavingEventFields
    }
  }
  ${WorkerStartedLeavingEventFields}
`
export const GetWorkerRewardAmountUpdatedEventsByEventIds = gql`
  query getWorkerRewardAmountUpdatedEventsByEventIds($eventIds: [ID!]) {
    workerRewardAmountUpdatedEvents(where: { event: { id_in: $eventIds } }) {
      ...WorkerRewardAmountUpdatedEventFields
    }
  }
  ${WorkerRewardAmountUpdatedEventFields}
`
export const GetStakeSlashedEventsByEventIds = gql`
  query getStakeSlashedEventsByEventIds($eventIds: [ID!]) {
    stakeSlashedEvents(where: { event: { id_in: $eventIds } }) {
      ...StakeSlashedEventFields
    }
  }
  ${StakeSlashedEventFields}
`
export const GetStakeDecreasedEventsByEventIds = gql`
  query getStakeDecreasedEventsByEventIds($eventIds: [ID!]) {
    stakeDecreasedEvents(where: { event: { id_in: $eventIds } }) {
      ...StakeDecreasedEventFields
    }
  }
  ${StakeDecreasedEventFields}
`
export const GetTerminatedWorkerEventsByEventIds = gql`
  query getTerminatedWorkerEventsByEventIds($eventIds: [ID!]) {
    terminatedWorkerEvents(where: { event: { id_in: $eventIds } }) {
      ...TerminatedWorkerEventFields
    }
  }
  ${TerminatedWorkerEventFields}
`
export const GetTerminatedLeaderEventsByEventIds = gql`
  query getTerminatedLeaderEventsByEventIds($eventIds: [ID!]) {
    terminatedLeaderEvents(where: { event: { id_in: $eventIds } }) {
      ...TerminatedLeaderEventFields
    }
  }
  ${TerminatedLeaderEventFields}
`
export const GetLeaderUnsetEventsByEventIds = gql`
  query getLeaderUnsetEventsByEventIds($eventIds: [ID!]) {
    leaderUnsetEvents(where: { event: { id_in: $eventIds } }) {
      ...LeaderUnsetEventFields
    }
  }
  ${LeaderUnsetEventFields}
`
export const GetBudgetSetEventsByEventIds = gql`
  query getBudgetSetEventsByEventIds($eventIds: [ID!]) {
    budgetSetEvents(where: { event: { id_in: $eventIds } }) {
      ...BudgetSetEventFields
    }
  }
  ${BudgetSetEventFields}
`
export const GetBudgetSpendingEventsByEventIds = gql`
  query getBudgetSpendingEventsByEventIds($eventIds: [ID!]) {
    budgetSpendingEvents(where: { event: { id_in: $eventIds } }) {
      ...BudgetSpendingEventFields
    }
  }
  ${BudgetSpendingEventFields}
`
