import * as Types from './schema'

import gql from 'graphql-tag'
export type BudgetUpdatedEventFieldsFragment = { inBlock: number; groupId: string; budgetChangeAmount: any }

export type BudgetRefillEventFieldsFragment = { inBlock: number; balance: any }

export type RewardPaidEventFieldsFragment = {
  inBlock: number
  groupId: string
  amount: any
  paymentType: Types.RewardPaymentType
  worker: WorkerFieldsFragment
}

export type WorkerFieldsFragment = { id: string; membership: MembershipOnWorkerFieldsFragment }

export type MembershipDataFieldsFragment = {
  id: string
  handle: string
  rootAccount: string
  controllerAccount: string
}

export type MembershipOnWorkerFieldsFragment = { id: string; handle: string }

export type ProposalExecutedEventFieldsFragment = {
  inBlock: number
  executionStatus:
    | { __typename: 'ProposalStatusExecuted' }
    | { __typename: 'ProposalStatusExecutionFailed'; errorMessage: string }
  proposal: {
    id: string
    details:
      | { __typename: 'SignalProposalDetails' }
      | { __typename: 'RuntimeUpgradeProposalDetails' }
      | {
          __typename: 'FundingRequestProposalDetails'
          destinationsList?: Types.Maybe<{ destinations: Array<{ amount: any; account: string }> }>
        }
      | { __typename: 'SetMaxValidatorCountProposalDetails' }
      | { __typename: 'CreateWorkingGroupLeadOpeningProposalDetails' }
      | { __typename: 'FillWorkingGroupLeadOpeningProposalDetails' }
      | { __typename: 'UpdateWorkingGroupBudgetProposalDetails' }
      | { __typename: 'DecreaseWorkingGroupLeadStakeProposalDetails' }
      | { __typename: 'SlashWorkingGroupLeadProposalDetails' }
      | { __typename: 'SetWorkingGroupLeadRewardProposalDetails' }
      | { __typename: 'TerminateWorkingGroupLeadProposalDetails' }
      | { __typename: 'AmendConstitutionProposalDetails' }
      | { __typename: 'CancelWorkingGroupLeadOpeningProposalDetails' }
      | { __typename: 'SetMembershipPriceProposalDetails' }
      | { __typename: 'SetCouncilBudgetIncrementProposalDetails' }
      | { __typename: 'SetCouncilorRewardProposalDetails' }
      | { __typename: 'SetInitialInvitationBalanceProposalDetails' }
      | { __typename: 'SetInitialInvitationCountProposalDetails' }
      | { __typename: 'SetMembershipLeadInvitationQuotaProposalDetails' }
      | { __typename: 'SetReferralCutProposalDetails' }
      | { __typename: 'CreateBlogPostProposalDetails' }
      | { __typename: 'EditBlogPostProposalDetails' }
      | { __typename: 'LockBlogPostProposalDetails' }
      | { __typename: 'UnlockBlogPostProposalDetails' }
      | { __typename: 'VetoProposalDetails' }
  }
}

export type ProposalsDecisionMadeEventsFieldsFragment = {
  inBlock: number
  id: string
  proposal: {
    id: string
    createdInEvent: { inBlock: number }
    details:
      | { __typename: 'SignalProposalDetails' }
      | { __typename: 'RuntimeUpgradeProposalDetails' }
      | { __typename: 'FundingRequestProposalDetails' }
      | { __typename: 'SetMaxValidatorCountProposalDetails' }
      | { __typename: 'CreateWorkingGroupLeadOpeningProposalDetails' }
      | { __typename: 'FillWorkingGroupLeadOpeningProposalDetails' }
      | { __typename: 'UpdateWorkingGroupBudgetProposalDetails' }
      | { __typename: 'DecreaseWorkingGroupLeadStakeProposalDetails' }
      | { __typename: 'SlashWorkingGroupLeadProposalDetails' }
      | { __typename: 'SetWorkingGroupLeadRewardProposalDetails' }
      | { __typename: 'TerminateWorkingGroupLeadProposalDetails' }
      | { __typename: 'AmendConstitutionProposalDetails' }
      | { __typename: 'CancelWorkingGroupLeadOpeningProposalDetails' }
      | { __typename: 'SetMembershipPriceProposalDetails' }
      | { __typename: 'SetCouncilBudgetIncrementProposalDetails' }
      | { __typename: 'SetCouncilorRewardProposalDetails' }
      | { __typename: 'SetInitialInvitationBalanceProposalDetails' }
      | { __typename: 'SetInitialInvitationCountProposalDetails' }
      | { __typename: 'SetMembershipLeadInvitationQuotaProposalDetails' }
      | { __typename: 'SetReferralCutProposalDetails' }
      | { __typename: 'CreateBlogPostProposalDetails' }
      | { __typename: 'EditBlogPostProposalDetails' }
      | { __typename: 'LockBlogPostProposalDetails' }
      | { __typename: 'UnlockBlogPostProposalDetails' }
      | { __typename: 'VetoProposalDetails' }
  }
  decisionStatus:
    | { __typename: 'ProposalStatusDormant' }
    | { __typename: 'ProposalStatusGracing' }
    | { __typename: 'ProposalStatusVetoed' }
    | { __typename: 'ProposalStatusSlashed' }
    | { __typename: 'ProposalStatusRejected' }
    | { __typename: 'ProposalStatusExpired' }
    | { __typename: 'ProposalStatusCancelled' }
    | { __typename: 'ProposalStatusCanceledByRuntime' }
}

export type CouncilMembersRewardFieldsFragment = {
  electedInCouncilId: string
  accumulatedReward: any
  unpaidReward: any
  rewardAccountId: string
  member: { id: string; handle: string }
}

export type AllWorkerHistoryFieldsFragment = {
  groupId: string
  isActive: boolean
  isLead: boolean
  runtimeId: number
  rewardAccount: string
  slashes: Array<{ slashedAmount: any; inBlock: number }>
  leaderunseteventleader?: Types.Maybe<Array<{ inBlock: number }>>
  status:
    | { __typename: 'WorkerStatusActive' }
    | { __typename: 'WorkerStatusLeaving' }
    | { __typename: 'WorkerStatusLeft'; workerExitedEvent?: Types.Maybe<{ inBlock: number }> }
    | { __typename: 'WorkerStatusTerminated'; terminatedWorkerEvent?: Types.Maybe<{ inBlock: number }> }
  entry: { inBlock: number }
  membership: { handle: string; id: string }
}

export type MemberInvitedEventsFieldsFragment = { inBlock: number; newMemberId: string; invitingMemberId: string }

export type OracleJudgmentSubmittedEventsBetweenBlocksFieldsFragment = {
  inBlock: number
  bounty: {
    id: string
    entries?: Types.Maybe<
      Array<{
        stakingAccount?: Types.Maybe<string>
        worker: { id: string; handle: string }
        status: { reward: number }
      }>
    >
    creator?: Types.Maybe<{ id: string; handle: string }>
    oracle?: Types.Maybe<{ id: string; handle: string }>
    createdInEvent: { inBlock: number }
  }
}

export type BountiesCreatedBetweenBlocksFieldsFragment = {
  inBlock: number
  bounty: { id: string; stage: Types.BountyStage; creator?: Types.Maybe<{ id: string; handle: string }> }
}

export type BountiesFundedBetweenBlocksFieldsFragment = {
  inBlock: number
  contribution: {
    bounty: { id: string; stage: Types.BountyStage; creator?: Types.Maybe<{ id: string; handle: string }> }
  }
}

export type AllBountiesFieldsFragment = {
  id: string
  stage: Types.BountyStage
  totalFunding: any
  isTerminated: boolean
  entrantWhitelist?: Types.Maybe<{ members: Array<MembershipOnWorkerFieldsFragment> }>
  creator?: Types.Maybe<MembershipOnWorkerFieldsFragment>
  oracle?: Types.Maybe<MembershipOnWorkerFieldsFragment>
  createdInEvent: { inBlock: number }
  contributions?: Types.Maybe<
    Array<{
      amount: any
      withdrawnInEvent?: Types.Maybe<{ inBlock: number }>
      contributor?: Types.Maybe<MembershipOnWorkerFieldsFragment>
      bountyFundedEvents: Array<{ inBlock: number }>
    }>
  >
  maxFundingReachedEvent?: Types.Maybe<{ inBlock: number }>
  judgment?: Types.Maybe<{ rationale?: Types.Maybe<string> }>
  removedInEvent?: Types.Maybe<{ inBlock: number }>
}

export type StorageBagStorageReplicationFieldsFragment = { id: string; storageBuckets: Array<{ id: string }> }

export type StorageBagDistributionStatusFieldsFragment = {
  id: string
  distributionBuckets: Array<{ familyId: string; bucketIndex: number; distributing: boolean }>
}

export type StorageBucketsDataFieldsFragment = {
  id: string
  acceptingNewBags: boolean
  dataObjectsSizeLimit: any
  dataObjectCountLimit: any
  dataObjectsCount: any
  dataObjectsSize: any
  operatorStatus: { workerId: number }
  operatorMetadata?: Types.Maybe<{ nodeEndpoint?: Types.Maybe<string> }>
}

export type BudgetUpdatedEventsBetweenDatesQueryVariables = Types.Exact<{
  startDate: Types.Scalars['DateTime']
  endDate: Types.Scalars['DateTime']
}>

export type BudgetUpdatedEventsBetweenDatesQuery = { budgetUpdatedEvents: Array<BudgetUpdatedEventFieldsFragment> }

export type BudgetUpdatedEventsBetweenBlocksQueryVariables = Types.Exact<{
  startBlock: Types.Scalars['Int']
  endBlock: Types.Scalars['Int']
}>

export type BudgetUpdatedEventsBetweenBlocksQuery = { budgetUpdatedEvents: Array<BudgetUpdatedEventFieldsFragment> }

export type BudgetRefillEventsBetweenBlocksQueryVariables = Types.Exact<{
  startBlock: Types.Scalars['Int']
  endBlock: Types.Scalars['Int']
}>

export type BudgetRefillEventsBetweenBlocksQuery = { budgetRefillEvents: Array<BudgetRefillEventFieldsFragment> }

export type RewardPaidEventsBetweenBlocksQueryVariables = Types.Exact<{
  startBlock: Types.Scalars['Int']
  endBlock: Types.Scalars['Int']
}>

export type RewardPaidEventsBetweenBlocksQuery = { rewardPaidEvents: Array<RewardPaidEventFieldsFragment> }

export type ProposalExecutedEventsBetweenBlocksQueryVariables = Types.Exact<{
  startBlock: Types.Scalars['Int']
  endBlock: Types.Scalars['Int']
}>

export type ProposalExecutedEventsBetweenBlocksQuery = {
  proposalExecutedEvents: Array<ProposalExecutedEventFieldsFragment>
}

export type CouncilMembersAtBlockQueryVariables = Types.Exact<{
  endBlock: Types.Scalars['BigInt']
}>

export type CouncilMembersAtBlockQuery = { councilMembers: Array<CouncilMembersRewardFieldsFragment> }

export type AllWorkerHistoryQueryVariables = Types.Exact<{ [key: string]: never }>

export type AllWorkerHistoryQuery = { workers: Array<AllWorkerHistoryFieldsFragment> }

export type ProposalsDecisionMadeEventsBetweenBlocksQueryVariables = Types.Exact<{
  startBlock: Types.Scalars['Int']
  endBlock: Types.Scalars['Int']
}>

export type ProposalsDecisionMadeEventsBetweenBlocksQuery = {
  proposalDecisionMadeEvents: Array<ProposalsDecisionMadeEventsFieldsFragment>
}

export type MemberInvitedEventsBetweenBlocksQueryVariables = Types.Exact<{
  startBlock: Types.Scalars['Int']
  endBlock: Types.Scalars['Int']
}>

export type MemberInvitedEventsBetweenBlocksQuery = { memberInvitedEvents: Array<MemberInvitedEventsFieldsFragment> }

export type AllBountiesQueryVariables = Types.Exact<{ [key: string]: never }>

export type AllBountiesQuery = { bounties: Array<AllBountiesFieldsFragment> }

export type BountiesFundedBetweenBlocksQueryVariables = Types.Exact<{
  startBlock: Types.Scalars['Int']
  endBlock: Types.Scalars['Int']
}>

export type BountiesFundedBetweenBlocksQuery = { bountyFundedEvents: Array<BountiesFundedBetweenBlocksFieldsFragment> }

export type BountiesCreatedBetweenBlocksQueryVariables = Types.Exact<{
  startBlock: Types.Scalars['Int']
  endBlock: Types.Scalars['Int']
}>

export type BountiesCreatedBetweenBlocksQuery = {
  bountyCreatedEvents: Array<BountiesCreatedBetweenBlocksFieldsFragment>
}

export type StorageBagStorageReplicationQueryVariables = Types.Exact<{ [key: string]: never }>

export type StorageBagStorageReplicationQuery = { storageBags: Array<StorageBagStorageReplicationFieldsFragment> }

export type StorageBagDistributionStatusQueryVariables = Types.Exact<{ [key: string]: never }>

export type StorageBagDistributionStatusQuery = { storageBags: Array<StorageBagDistributionStatusFieldsFragment> }

export type StorageBucketsDataQueryVariables = Types.Exact<{ [key: string]: never }>

export type StorageBucketsDataQuery = { storageBuckets: Array<StorageBucketsDataFieldsFragment> }

export type MembersByControllerAccountsQueryVariables = Types.Exact<{
  controllerAccounts?: Types.Maybe<Array<Types.Scalars['String']> | Types.Scalars['String']>
}>

export type MembersByControllerAccountsQuery = { memberships: Array<MembershipDataFieldsFragment> }

export type MembersByRootAccountsQueryVariables = Types.Exact<{
  rootAccounts?: Types.Maybe<Array<Types.Scalars['String']> | Types.Scalars['String']>
}>

export type MembersByRootAccountsQuery = { memberships: Array<MembershipDataFieldsFragment> }

export type OracleJudgmentSubmittedEventsBetweenBlocksQueryVariables = Types.Exact<{
  startBlock: Types.Scalars['Int']
  endBlock: Types.Scalars['Int']
}>

export type OracleJudgmentSubmittedEventsBetweenBlocksQuery = {
  oracleJudgmentSubmittedEvents: Array<OracleJudgmentSubmittedEventsBetweenBlocksFieldsFragment>
}

export type MemberMetadataFieldsFragment = { name?: Types.Maybe<string>; about?: Types.Maybe<string> }

export type MembershipFieldsFragment = { id: string; handle: string; metadata: MemberMetadataFieldsFragment }

export type GetMembersByIdsQueryVariables = Types.Exact<{
  ids?: Types.Maybe<Array<Types.Scalars['ID']> | Types.Scalars['ID']>
}>

export type GetMembersByIdsQuery = { memberships: Array<MembershipFieldsFragment> }

export type StorageNodeInfoFragment = {
  id: string
  operatorMetadata?: Types.Maybe<{ nodeEndpoint?: Types.Maybe<string> }>
}

export type GetStorageNodesInfoByBagIdQueryVariables = Types.Exact<{
  bagId?: Types.Maybe<Types.Scalars['ID']>
}>

export type GetStorageNodesInfoByBagIdQuery = { storageBuckets: Array<StorageNodeInfoFragment> }

export type DataObjectInfoFragment = {
  id: string
  size: any
  deletionPrize: any
  type:
    | { __typename: 'DataObjectTypeChannelAvatar'; channel?: Types.Maybe<{ id: string }> }
    | { __typename: 'DataObjectTypeChannelCoverPhoto'; channel?: Types.Maybe<{ id: string }> }
    | { __typename: 'DataObjectTypeVideoMedia'; video?: Types.Maybe<{ id: string }> }
    | { __typename: 'DataObjectTypeVideoThumbnail'; video?: Types.Maybe<{ id: string }> }
    | { __typename: 'DataObjectTypeUnknown' }
}

export type GetDataObjectsByBagIdQueryVariables = Types.Exact<{
  bagId?: Types.Maybe<Types.Scalars['ID']>
}>

export type GetDataObjectsByBagIdQuery = { storageDataObjects: Array<DataObjectInfoFragment> }

export type GetDataObjectsByChannelIdQueryVariables = Types.Exact<{
  channelId?: Types.Maybe<Types.Scalars['ID']>
}>

export type GetDataObjectsByChannelIdQuery = { storageDataObjects: Array<DataObjectInfoFragment> }

export type GetDataObjectsByVideoIdQueryVariables = Types.Exact<{
  videoId?: Types.Maybe<Types.Scalars['ID']>
}>

export type GetDataObjectsByVideoIdQuery = { storageDataObjects: Array<DataObjectInfoFragment> }

export type WorkingGroupOpeningMetadataFieldsFragment = {
  description?: Types.Maybe<string>
  shortDescription?: Types.Maybe<string>
  hiringLimit?: Types.Maybe<number>
  expectedEnding?: Types.Maybe<any>
  applicationDetails?: Types.Maybe<string>
  applicationFormQuestions: Array<{ question?: Types.Maybe<string>; type: Types.ApplicationFormQuestionType }>
}

export type WorkingGroupOpeningDetailsFragment = { metadata: WorkingGroupOpeningMetadataFieldsFragment }

export type WorkingGroupApplicationDetailsFragment = {
  answers: Array<{ answer: string; question: { question?: Types.Maybe<string> } }>
}

export type UpcomingWorkingGroupOpeningDetailsFragment = {
  id: string
  groupId: string
  expectedStart?: Types.Maybe<any>
  stakeAmount?: Types.Maybe<any>
  rewardPerBlock?: Types.Maybe<any>
  metadata: WorkingGroupOpeningMetadataFieldsFragment
}

export type OpeningDetailsByIdQueryVariables = Types.Exact<{
  id: Types.Scalars['ID']
}>

export type OpeningDetailsByIdQuery = {
  workingGroupOpeningByUniqueInput?: Types.Maybe<WorkingGroupOpeningDetailsFragment>
}

export type ApplicationDetailsByIdQueryVariables = Types.Exact<{
  id: Types.Scalars['ID']
}>

export type ApplicationDetailsByIdQuery = {
  workingGroupApplicationByUniqueInput?: Types.Maybe<WorkingGroupApplicationDetailsFragment>
}

export type UpcomingWorkingGroupOpeningByEventQueryVariables = Types.Exact<{
  blockNumber: Types.Scalars['Int']
  indexInBlock: Types.Scalars['Int']
}>

export type UpcomingWorkingGroupOpeningByEventQuery = {
  upcomingWorkingGroupOpenings: Array<UpcomingWorkingGroupOpeningDetailsFragment>
}

export type UpcomingWorkingGroupOpeningsByGroupQueryVariables = Types.Exact<{
  workingGroupId: Types.Scalars['ID']
}>

export type UpcomingWorkingGroupOpeningsByGroupQuery = {
  upcomingWorkingGroupOpenings: Array<UpcomingWorkingGroupOpeningDetailsFragment>
}

export type UpcomingWorkingGroupOpeningByIdQueryVariables = Types.Exact<{
  id: Types.Scalars['ID']
}>

export type UpcomingWorkingGroupOpeningByIdQuery = {
  upcomingWorkingGroupOpeningByUniqueInput?: Types.Maybe<UpcomingWorkingGroupOpeningDetailsFragment>
}

export const BudgetUpdatedEventFields = gql`
  fragment BudgetUpdatedEventFields on BudgetUpdatedEvent {
    inBlock
    groupId
    budgetChangeAmount
  }
`
export const BudgetRefillEventFields = gql`
  fragment BudgetRefillEventFields on BudgetRefillEvent {
    inBlock
    balance
  }
`
export const MembershipOnWorkerFields = gql`
  fragment MembershipOnWorkerFields on Membership {
    id
    handle
  }
`
export const WorkerFields = gql`
  fragment WorkerFields on Worker {
    id
    membership {
      ...MembershipOnWorkerFields
    }
  }
  ${MembershipOnWorkerFields}
`
export const RewardPaidEventFields = gql`
  fragment RewardPaidEventFields on RewardPaidEvent {
    inBlock
    groupId
    amount
    paymentType
    worker {
      ...WorkerFields
    }
  }
  ${WorkerFields}
`
export const MembershipDataFields = gql`
  fragment MembershipDataFields on Membership {
    id
    handle
    rootAccount
    controllerAccount
  }
`
export const ProposalExecutedEventFields = gql`
  fragment ProposalExecutedEventFields on ProposalExecutedEvent {
    inBlock
    executionStatus {
      __typename
      ... on ProposalStatusExecutionFailed {
        errorMessage
      }
    }
    proposal {
      id
      details {
        __typename
        ... on FundingRequestProposalDetails {
          destinationsList {
            destinations {
              amount
              account
            }
          }
        }
      }
    }
  }
`
export const ProposalsDecisionMadeEventsFields = gql`
  fragment ProposalsDecisionMadeEventsFields on ProposalDecisionMadeEvent {
    inBlock
    id
    proposal {
      id
      createdInEvent {
        inBlock
      }
      details {
        __typename
      }
    }
    decisionStatus {
      __typename
    }
  }
`
export const CouncilMembersRewardFields = gql`
  fragment CouncilMembersRewardFields on CouncilMember {
    electedInCouncilId
    accumulatedReward
    unpaidReward
    rewardAccountId
    member {
      id
      handle
    }
  }
`
export const AllWorkerHistoryFields = gql`
  fragment AllWorkerHistoryFields on Worker {
    groupId
    isActive
    isLead
    runtimeId
    rewardAccount
    slashes {
      slashedAmount
      inBlock
    }
    leaderunseteventleader {
      inBlock
    }
    status {
      __typename
      ... on WorkerStatusLeft {
        workerExitedEvent {
          inBlock
        }
      }
      ... on WorkerStatusTerminated {
        terminatedWorkerEvent {
          inBlock
        }
      }
    }
    entry {
      inBlock
    }
    membership {
      handle
      id
    }
  }
`
export const MemberInvitedEventsFields = gql`
  fragment MemberInvitedEventsFields on MemberInvitedEvent {
    inBlock
    newMemberId
    invitingMemberId
  }
`
export const OracleJudgmentSubmittedEventsBetweenBlocksFields = gql`
  fragment OracleJudgmentSubmittedEventsBetweenBlocksFields on OracleJudgmentSubmittedEvent {
    inBlock
    bounty {
      id
      entries {
        stakingAccount
        worker {
          id
          handle
        }
        status {
          ... on BountyEntryStatusWinner {
            reward
          }
        }
      }
      creator {
        id
        handle
      }
      oracle {
        id
        handle
      }
      createdInEvent {
        inBlock
      }
    }
  }
`
export const BountiesCreatedBetweenBlocksFields = gql`
  fragment BountiesCreatedBetweenBlocksFields on BountyCreatedEvent {
    inBlock
    bounty {
      id
      stage
      creator {
        id
        handle
      }
    }
  }
`
export const BountiesFundedBetweenBlocksFields = gql`
  fragment BountiesFundedBetweenBlocksFields on BountyFundedEvent {
    inBlock
    contribution {
      bounty {
        id
        stage
        creator {
          id
          handle
        }
      }
    }
  }
`
export const AllBountiesFields = gql`
  fragment AllBountiesFields on Bounty {
    id
    stage
    entrantWhitelist {
      members {
        ...MembershipOnWorkerFields
      }
    }
    creator {
      ...MembershipOnWorkerFields
    }
    oracle {
      ...MembershipOnWorkerFields
    }
    totalFunding
    isTerminated
    createdInEvent {
      inBlock
    }
    contributions {
      amount
      withdrawnInEvent {
        inBlock
      }
      contributor {
        ...MembershipOnWorkerFields
      }
      bountyFundedEvents {
        inBlock
      }
    }
    maxFundingReachedEvent {
      inBlock
    }
    judgment {
      rationale
    }
    removedInEvent {
      inBlock
    }
  }
  ${MembershipOnWorkerFields}
`
export const StorageBagStorageReplicationFields = gql`
  fragment StorageBagStorageReplicationFields on StorageBag {
    id
    storageBuckets {
      id
    }
  }
`
export const StorageBagDistributionStatusFields = gql`
  fragment StorageBagDistributionStatusFields on StorageBag {
    id
    distributionBuckets {
      familyId
      bucketIndex
      distributing
    }
  }
`
export const StorageBucketsDataFields = gql`
  fragment StorageBucketsDataFields on StorageBucket {
    id
    acceptingNewBags
    dataObjectsSizeLimit
    dataObjectCountLimit
    dataObjectsCount
    dataObjectsSize
    operatorStatus {
      ... on StorageBucketOperatorStatusActive {
        workerId
      }
    }
    operatorMetadata {
      nodeEndpoint
    }
  }
`
export const MemberMetadataFields = gql`
  fragment MemberMetadataFields on MemberMetadata {
    name
    about
  }
`
export const MembershipFields = gql`
  fragment MembershipFields on Membership {
    id
    handle
    metadata {
      ...MemberMetadataFields
    }
  }
  ${MemberMetadataFields}
`
export const StorageNodeInfo = gql`
  fragment StorageNodeInfo on StorageBucket {
    id
    operatorMetadata {
      nodeEndpoint
    }
  }
`
export const DataObjectInfo = gql`
  fragment DataObjectInfo on StorageDataObject {
    id
    size
    deletionPrize
    type {
      __typename
      ... on DataObjectTypeVideoMedia {
        video {
          id
        }
      }
      ... on DataObjectTypeVideoThumbnail {
        video {
          id
        }
      }
      ... on DataObjectTypeChannelAvatar {
        channel {
          id
        }
      }
      ... on DataObjectTypeChannelCoverPhoto {
        channel {
          id
        }
      }
    }
  }
`
export const WorkingGroupOpeningMetadataFields = gql`
  fragment WorkingGroupOpeningMetadataFields on WorkingGroupOpeningMetadata {
    description
    shortDescription
    hiringLimit
    expectedEnding
    applicationDetails
    applicationFormQuestions {
      question
      type
    }
  }
`
export const WorkingGroupOpeningDetails = gql`
  fragment WorkingGroupOpeningDetails on WorkingGroupOpening {
    metadata {
      ...WorkingGroupOpeningMetadataFields
    }
  }
  ${WorkingGroupOpeningMetadataFields}
`
export const WorkingGroupApplicationDetails = gql`
  fragment WorkingGroupApplicationDetails on WorkingGroupApplication {
    answers {
      question {
        question
      }
      answer
    }
  }
`
export const UpcomingWorkingGroupOpeningDetails = gql`
  fragment UpcomingWorkingGroupOpeningDetails on UpcomingWorkingGroupOpening {
    id
    groupId
    expectedStart
    stakeAmount
    rewardPerBlock
    metadata {
      ...WorkingGroupOpeningMetadataFields
    }
  }
  ${WorkingGroupOpeningMetadataFields}
`
export const BudgetUpdatedEventsBetweenDates = gql`
  query BudgetUpdatedEventsBetweenDates($startDate: DateTime!, $endDate: DateTime!) {
    budgetUpdatedEvents(
      limit: 1000
      orderBy: inBlock_ASC
      where: { updatedAt_gte: $startDate, updatedAt_lt: $endDate }
    ) {
      ...BudgetUpdatedEventFields
    }
  }
  ${BudgetUpdatedEventFields}
`
export const BudgetUpdatedEventsBetweenBlocks = gql`
  query BudgetUpdatedEventsBetweenBlocks($startBlock: Int!, $endBlock: Int!) {
    budgetUpdatedEvents(limit: 1000, orderBy: inBlock_ASC, where: { inBlock_gte: $startBlock, inBlock_lt: $endBlock }) {
      ...BudgetUpdatedEventFields
    }
  }
  ${BudgetUpdatedEventFields}
`
export const BudgetRefillEventsBetweenBlocks = gql`
  query BudgetRefillEventsBetweenBlocks($startBlock: Int!, $endBlock: Int!) {
    budgetRefillEvents(limit: 1000, orderBy: inBlock_ASC, where: { inBlock_gte: $startBlock, inBlock_lt: $endBlock }) {
      ...BudgetRefillEventFields
    }
  }
  ${BudgetRefillEventFields}
`
export const RewardPaidEventsBetweenBlocks = gql`
  query RewardPaidEventsBetweenBlocks($startBlock: Int!, $endBlock: Int!) {
    rewardPaidEvents(limit: 1000, orderBy: inBlock_ASC, where: { inBlock_gte: $startBlock, inBlock_lt: $endBlock }) {
      ...RewardPaidEventFields
    }
  }
  ${RewardPaidEventFields}
`
export const ProposalExecutedEventsBetweenBlocks = gql`
  query ProposalExecutedEventsBetweenBlocks($startBlock: Int!, $endBlock: Int!) {
    proposalExecutedEvents(
      limit: 1000
      orderBy: inBlock_ASC
      where: { inBlock_gte: $startBlock, inBlock_lt: $endBlock }
    ) {
      ...ProposalExecutedEventFields
    }
  }
  ${ProposalExecutedEventFields}
`
export const CouncilMembersAtBlock = gql`
  query CouncilMembersAtBlock($endBlock: BigInt!) {
    councilMembers(limit: 1000, where: { lastPaymentBlock_eq: $endBlock }) {
      ...CouncilMembersRewardFields
    }
  }
  ${CouncilMembersRewardFields}
`
export const AllWorkerHistory = gql`
  query AllWorkerHistory {
    workers(limit: 1000000) {
      ...AllWorkerHistoryFields
    }
  }
  ${AllWorkerHistoryFields}
`
export const ProposalsDecisionMadeEventsBetweenBlocks = gql`
  query ProposalsDecisionMadeEventsBetweenBlocks($startBlock: Int!, $endBlock: Int!) {
    proposalDecisionMadeEvents(
      limit: 1000
      orderBy: inBlock_ASC
      where: { inBlock_gte: $startBlock, inBlock_lt: $endBlock }
    ) {
      ...ProposalsDecisionMadeEventsFields
    }
  }
  ${ProposalsDecisionMadeEventsFields}
`
export const MemberInvitedEventsBetweenBlocks = gql`
  query MemberInvitedEventsBetweenBlocks($startBlock: Int!, $endBlock: Int!) {
    memberInvitedEvents(limit: 1000, orderBy: inBlock_ASC, where: { inBlock_gte: $startBlock, inBlock_lt: $endBlock }) {
      ...MemberInvitedEventsFields
    }
  }
  ${MemberInvitedEventsFields}
`
export const AllBounties = gql`
  query AllBounties {
    bounties(limit: 1000000, orderBy: createdAt_ASC) {
      ...AllBountiesFields
    }
  }
  ${AllBountiesFields}
`
export const BountiesFundedBetweenBlocks = gql`
  query BountiesFundedBetweenBlocks($startBlock: Int!, $endBlock: Int!) {
    bountyFundedEvents(
      limit: 1000000
      orderBy: inBlock_ASC
      where: { inBlock_gte: $startBlock, inBlock_lt: $endBlock }
    ) {
      ...BountiesFundedBetweenBlocksFields
    }
  }
  ${BountiesFundedBetweenBlocksFields}
`
export const BountiesCreatedBetweenBlocks = gql`
  query BountiesCreatedBetweenBlocks($startBlock: Int!, $endBlock: Int!) {
    bountyCreatedEvents(
      limit: 1000000
      orderBy: createdAt_DESC
      where: { inBlock_gte: $startBlock, inBlock_lt: $endBlock }
    ) {
      ...BountiesCreatedBetweenBlocksFields
    }
  }
  ${BountiesCreatedBetweenBlocksFields}
`
export const StorageBagStorageReplication = gql`
  query StorageBagStorageReplication {
    storageBags(limit: 1000000, orderBy: createdAt_DESC) {
      ...StorageBagStorageReplicationFields
    }
  }
  ${StorageBagStorageReplicationFields}
`
export const StorageBagDistributionStatus = gql`
  query StorageBagDistributionStatus {
    storageBags(limit: 1000000, orderBy: createdAt_DESC) {
      ...StorageBagDistributionStatusFields
    }
  }
  ${StorageBagDistributionStatusFields}
`
export const StorageBucketsData = gql`
  query StorageBucketsData {
    storageBuckets(limit: 1000000) {
      ...StorageBucketsDataFields
    }
  }
  ${StorageBucketsDataFields}
`
export const MembersByControllerAccounts = gql`
  query MembersByControllerAccounts($controllerAccounts: [String!]) {
    memberships(where: { controllerAccount_in: $controllerAccounts }) {
      ...MembershipDataFields
    }
  }
  ${MembershipDataFields}
`
export const MembersByRootAccounts = gql`
  query MembersByRootAccounts($rootAccounts: [String!]) {
    memberships(where: { rootAccount_in: $rootAccounts }) {
      ...MembershipDataFields
    }
  }
  ${MembershipDataFields}
`
export const OracleJudgmentSubmittedEventsBetweenBlocks = gql`
  query OracleJudgmentSubmittedEventsBetweenBlocks($startBlock: Int!, $endBlock: Int!) {
    oracleJudgmentSubmittedEvents(
      limit: 1000000
      orderBy: inBlock_ASC
      where: { inBlock_gte: $startBlock, inBlock_lt: $endBlock }
    ) {
      ...OracleJudgmentSubmittedEventsBetweenBlocksFields
    }
  }
  ${OracleJudgmentSubmittedEventsBetweenBlocksFields}
`
export const GetMembersByIds = gql`
  query getMembersByIds($ids: [ID!]) {
    memberships(where: { id_in: $ids }) {
      ...MembershipFields
    }
  }
  ${MembershipFields}
`
export const GetStorageNodesInfoByBagId = gql`
  query getStorageNodesInfoByBagId($bagId: ID) {
    storageBuckets(
      where: {
        operatorStatus_json: { isTypeOf_eq: "StorageBucketOperatorStatusActive" }
        bags_some: { id_eq: $bagId }
        operatorMetadata: { nodeEndpoint_contains: "http" }
      }
    ) {
      ...StorageNodeInfo
    }
  }
  ${StorageNodeInfo}
`
export const GetDataObjectsByBagId = gql`
  query getDataObjectsByBagId($bagId: ID) {
    storageDataObjects(where: { storageBag: { id_eq: $bagId } }) {
      ...DataObjectInfo
    }
  }
  ${DataObjectInfo}
`
export const GetDataObjectsByChannelId = gql`
  query getDataObjectsByChannelId($channelId: ID) {
    storageDataObjects(where: { type_json: { channelId_eq: $channelId } }) {
      ...DataObjectInfo
    }
  }
  ${DataObjectInfo}
`
export const GetDataObjectsByVideoId = gql`
  query getDataObjectsByVideoId($videoId: ID) {
    storageDataObjects(where: { type_json: { videoId_eq: $videoId } }) {
      ...DataObjectInfo
    }
  }
  ${DataObjectInfo}
`
export const OpeningDetailsById = gql`
  query openingDetailsById($id: ID!) {
    workingGroupOpeningByUniqueInput(where: { id: $id }) {
      ...WorkingGroupOpeningDetails
    }
  }
  ${WorkingGroupOpeningDetails}
`
export const ApplicationDetailsById = gql`
  query applicationDetailsById($id: ID!) {
    workingGroupApplicationByUniqueInput(where: { id: $id }) {
      ...WorkingGroupApplicationDetails
    }
  }
  ${WorkingGroupApplicationDetails}
`
export const UpcomingWorkingGroupOpeningByEvent = gql`
  query upcomingWorkingGroupOpeningByEvent($blockNumber: Int!, $indexInBlock: Int!) {
    upcomingWorkingGroupOpenings(
      where: { createdInEvent: { inBlock_eq: $blockNumber, indexInBlock_eq: $indexInBlock } }
    ) {
      ...UpcomingWorkingGroupOpeningDetails
    }
  }
  ${UpcomingWorkingGroupOpeningDetails}
`
export const UpcomingWorkingGroupOpeningsByGroup = gql`
  query upcomingWorkingGroupOpeningsByGroup($workingGroupId: ID!) {
    upcomingWorkingGroupOpenings(where: { group: { id_eq: $workingGroupId } }, orderBy: createdAt_DESC) {
      ...UpcomingWorkingGroupOpeningDetails
    }
  }
  ${UpcomingWorkingGroupOpeningDetails}
`
export const UpcomingWorkingGroupOpeningById = gql`
  query upcomingWorkingGroupOpeningById($id: ID!) {
    upcomingWorkingGroupOpeningByUniqueInput(where: { id: $id }) {
      ...UpcomingWorkingGroupOpeningDetails
    }
  }
  ${UpcomingWorkingGroupOpeningDetails}
`
