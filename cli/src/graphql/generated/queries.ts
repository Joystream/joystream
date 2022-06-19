import * as Types from './schema'

import gql from 'graphql-tag'
export type AllVideosFieldsFragment = {
  id: string
  isCensored: boolean
  createdAt: any
  updatedAt?: Types.Maybe<any>
  updatedById?: Types.Maybe<string>
  nftId?: Types.Maybe<string>
  createdInBlock: number
  category?: Types.Maybe<{ id: string; name?: Types.Maybe<string> }>
  thumbnailPhoto?: Types.Maybe<{ id: string; size: any; isAccepted: boolean }>
  media?: Types.Maybe<{ id: string; size: any; isAccepted: boolean }>
}

export type AllChannelsFieldsFragment = {
  id: string
  isCensored: boolean
  createdAt: any
  updatedAt?: Types.Maybe<any>
  updatedById?: Types.Maybe<string>
  createdInBlock: number
  category?: Types.Maybe<{ id: string; name?: Types.Maybe<string> }>
  coverPhoto?: Types.Maybe<{ id: string; size: any; isAccepted: boolean }>
  avatarPhoto?: Types.Maybe<{ id: string; size: any; isAccepted: boolean }>
}

export type AllVideosQueryVariables = Types.Exact<{ [key: string]: never }>

export type AllVideosQuery = { videos: Array<AllVideosFieldsFragment> }

export type AllChannelsQueryVariables = Types.Exact<{ [key: string]: never }>

export type AllChannelsQuery = { channels: Array<AllChannelsFieldsFragment> }

export type ChannelsCreatedBetweenBlocksQueryVariables = Types.Exact<{
  startBlock: Types.Scalars['Int']
  endBlock: Types.Scalars['Int']
}>

export type ChannelsCreatedBetweenBlocksQuery = { channels: Array<AllChannelsFieldsFragment> }

export type VideosCreatedBetweenBlocksQueryVariables = Types.Exact<{
  startBlock: Types.Scalars['Int']
  endBlock: Types.Scalars['Int']
}>

export type VideosCreatedBetweenBlocksQuery = { videos: Array<AllVideosFieldsFragment> }

export type NftBoughtEventsBetweenBlocksFieldsFragment = {
  inBlock: number
  videoId: string
  price: any
  ownerMemberId?: Types.Maybe<string>
}

export type NftBoughtEventsBetweenBlocksQueryVariables = Types.Exact<{
  startBlock: Types.Scalars['Int']
  endBlock: Types.Scalars['Int']
}>

export type NftBoughtEventsBetweenBlocksQuery = { nftBoughtEvents: Array<NftBoughtEventsBetweenBlocksFieldsFragment> }

export type NftIssuedEventsBetweenBlocksFieldsFragment = {
  inBlock: number
  videoId: string
  royalty?: Types.Maybe<number>
  ownerMemberId?: Types.Maybe<string>
}

export type NftIssuedEventsBetweenBlocksQueryVariables = Types.Exact<{
  startBlock: Types.Scalars['Int']
  endBlock: Types.Scalars['Int']
}>

export type NftIssuedEventsBetweenBlocksQuery = { nftIssuedEvents: Array<NftIssuedEventsBetweenBlocksFieldsFragment> }

export type DistributionBucketsDataFieldsFragment = {
  id: string
  bucketIndex: number
  familyId: string
  acceptingNewBags: boolean
  distributing: boolean
  bags: Array<{ id: string }>
  operators: Array<{ workerId: number; metadata?: Types.Maybe<{ nodeEndpoint?: Types.Maybe<string> }> }>
}

export type DistributionBucketFamilyDataFieldsFragment = {
  id: string
  buckets: Array<DistributionBucketsDataFieldsFragment>
}

export type DistributionBucketsDataQueryVariables = Types.Exact<{ [key: string]: never }>

export type DistributionBucketsDataQuery = { distributionBuckets: Array<DistributionBucketsDataFieldsFragment> }

export type DistributionBucketFamilyDataQueryVariables = Types.Exact<{ [key: string]: never }>

export type DistributionBucketFamilyDataQuery = {
  distributionBucketFamilies: Array<DistributionBucketFamilyDataFieldsFragment>
}

export type AllForumPostsFieldsFragment = {
  id: string
  deletedInEventId?: Types.Maybe<string>
  forumthreadinitialPost?: Types.Maybe<Array<{ categoryId: string }>>
  postaddedeventpost?: Types.Maybe<Array<{ inBlock: number; isEditable?: Types.Maybe<boolean> }>>
  deletedInEvent?: Types.Maybe<{ inBlock: number; rationale: string; actorId: string }>
  postmoderatedeventpost?: Types.Maybe<Array<{ inBlock: number; rationale: string; actorId: string }>>
}

export type AllForumCategoriesFieldsFragment = {
  id: string
  updatedAt?: Types.Maybe<any>
  title: string
  description: string
  createdInEvent: { inBlock: number }
  categorydeletedeventcategory?: Types.Maybe<Array<{ inBlock: number }>>
}

export type AllForumThreadsFieldsFragment = {
  id: string
  category: { title: string; id: string }
  createdInEvent: { inBlock: number }
  status:
    | { __typename: 'ThreadStatusActive' }
    | {
        __typename: 'ThreadStatusLocked'
        threadDeletedEvent?: Types.Maybe<{ inBlock: number; thread: { id: string } }>
      }
    | {
        __typename: 'ThreadStatusModerated'
        threadModeratedEvent?: Types.Maybe<{ inBlock: number; rationale: string; actorId: string }>
      }
    | { __typename: 'ThreadStatusRemoved'; threadDeletedEvent?: Types.Maybe<{ inBlock: number }> }
}

export type AllForumPostsQueryVariables = Types.Exact<{ [key: string]: never }>

export type AllForumPostsQuery = { forumPosts: Array<AllForumPostsFieldsFragment> }

export type AllForumCategoriesQueryVariables = Types.Exact<{ [key: string]: never }>

export type AllForumCategoriesQuery = { forumCategories: Array<AllForumCategoriesFieldsFragment> }

export type AllForumThreadsQueryVariables = Types.Exact<{ [key: string]: never }>

export type AllForumThreadsQuery = { forumThreads: Array<AllForumThreadsFieldsFragment> }

export type PostAddedEventsBetweenBlocksFieldsFragment = {
  inBlock: number
  id: string
  isEditable?: Types.Maybe<boolean>
  post: {
    authorId: string
    isVisible: boolean
    origin: { __typename: 'PostOriginThreadInitial' } | { __typename: 'PostOriginThreadReply' }
    thread: { id: string; categoryId: string }
    edits: Array<{ inBlock: number }>
    status:
      | { __typename: 'PostStatusActive' }
      | { __typename: 'PostStatusLocked' }
      | { __typename: 'PostStatusModerated' }
      | { __typename: 'PostStatusRemoved' }
  }
}

export type PostAddedEventsBetweenBlocksQueryVariables = Types.Exact<{
  startBlock: Types.Scalars['Int']
  endBlock: Types.Scalars['Int']
}>

export type PostAddedEventsBetweenBlocksQuery = { postAddedEvents: Array<PostAddedEventsBetweenBlocksFieldsFragment> }

export type PostDeletedEventsBetweenBlocksFieldsFragment = {
  inBlock: number
  actorId: string
  rationale: string
  posts: Array<{ id: string; threadId: string }>
}

export type PostDeletedEventsBetweenBlocksQueryVariables = Types.Exact<{
  startBlock: Types.Scalars['Int']
  endBlock: Types.Scalars['Int']
}>

export type PostDeletedEventsBetweenBlocksQuery = {
  postDeletedEvents: Array<PostDeletedEventsBetweenBlocksFieldsFragment>
}

export type PostModeratedEventsBetweenBlocksFieldsFragment = {
  inBlock: number
  postId: string
  actorId: string
  rationale: string
}

export type PostModeratedEventsBetweenBlocksQueryVariables = Types.Exact<{
  startBlock: Types.Scalars['Int']
  endBlock: Types.Scalars['Int']
}>

export type PostModeratedEventsBetweenBlocksQuery = {
  postModeratedEvents: Array<PostModeratedEventsBetweenBlocksFieldsFragment>
}

export type PostReactedEventsBetweenBlocksFieldsFragment = {
  inBlock: number
  postId: string
  reactingMemberId: string
  reactionResult:
    | { __typename: 'PostReactionResultCancel' }
    | { __typename: 'PostReactionResultValid' }
    | { __typename: 'PostReactionResultInvalid' }
}

export type PostReactedEventsBetweenBlocksQueryVariables = Types.Exact<{
  startBlock: Types.Scalars['Int']
  endBlock: Types.Scalars['Int']
}>

export type PostReactedEventsBetweenBlocksQuery = {
  postReactedEvents: Array<PostReactedEventsBetweenBlocksFieldsFragment>
}

export type ThreadCreatedEventsBetweenBlocksFieldsFragment = {
  inBlock: number
  id: string
  thread: {
    authorId: string
    isVisible: boolean
    id: string
    categoryId: string
    status:
      | { __typename: 'ThreadStatusActive' }
      | { __typename: 'ThreadStatusLocked' }
      | { __typename: 'ThreadStatusModerated' }
      | { __typename: 'ThreadStatusRemoved' }
  }
}

export type ThreadCreatedEventsBetweenBlocksQueryVariables = Types.Exact<{
  startBlock: Types.Scalars['Int']
  endBlock: Types.Scalars['Int']
}>

export type ThreadCreatedEventsBetweenBlocksQuery = {
  threadCreatedEvents: Array<ThreadCreatedEventsBetweenBlocksFieldsFragment>
}

export type ThreadMetadataUpdatedEventsBetweenBlocksFieldsFragment = {
  inBlock: number
  threadId: string
  updatedById?: Types.Maybe<string>
  newTitle?: Types.Maybe<string>
}

export type ThreadMetadataUpdatedEventsBetweenBlocksQueryVariables = Types.Exact<{
  startBlock: Types.Scalars['Int']
  endBlock: Types.Scalars['Int']
}>

export type ThreadMetadataUpdatedEventsBetweenBlocksQuery = {
  threadMetadataUpdatedEvents: Array<ThreadMetadataUpdatedEventsBetweenBlocksFieldsFragment>
}

export type ThreadMovedEventsBetweenBlocksFieldsFragment = {
  inBlock: number
  threadId: string
  actorId: string
  oldCategoryId: string
  newCategoryId: string
}

export type ThreadMovedEventsBetweenBlocksQueryVariables = Types.Exact<{
  startBlock: Types.Scalars['Int']
  endBlock: Types.Scalars['Int']
}>

export type ThreadMovedEventsBetweenBlocksQuery = {
  threadMovedEvents: Array<ThreadMovedEventsBetweenBlocksFieldsFragment>
}

export type ThreadDeletedEventsBetweenBlocksFieldsFragment = { inBlock: number; threadId: string }

export type ThreadDeletedEventsBetweenBlocksQueryVariables = Types.Exact<{
  startBlock: Types.Scalars['Int']
  endBlock: Types.Scalars['Int']
}>

export type ThreadDeletedEventsBetweenBlocksQuery = {
  threadDeletedEvents: Array<ThreadDeletedEventsBetweenBlocksFieldsFragment>
}

export type ThreadModeratedEventsBetweenBlocksFieldsFragment = {
  inBlock: number
  threadId: string
  actorId: string
  rationale: string
}

export type ThreadModeratedEventsBetweenBlocksQueryVariables = Types.Exact<{
  startBlock: Types.Scalars['Int']
  endBlock: Types.Scalars['Int']
}>

export type ThreadModeratedEventsBetweenBlocksQuery = {
  threadModeratedEvents: Array<ThreadModeratedEventsBetweenBlocksFieldsFragment>
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

export type AllBountiesQueryVariables = Types.Exact<{ [key: string]: never }>

export type AllBountiesQuery = { bounties: Array<AllBountiesFieldsFragment> }

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
    | { __typename: 'WorkerStatusLeaving'; workerStartedLeavingEvent?: Types.Maybe<{ inBlock: number }> }
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

export type OpeningAddedEventsBetweenBlocksFieldsFragment = {
  inBlock: number
  groupId: string
  openingId: string
  opening: {
    status:
      | { __typename: 'OpeningStatusOpen' }
      | { __typename: 'OpeningStatusFilled' }
      | { __typename: 'OpeningStatusCancelled' }
    metadata: {
      originallyValid: boolean
      title?: Types.Maybe<string>
      shortDescription?: Types.Maybe<string>
      description?: Types.Maybe<string>
      hiringLimit?: Types.Maybe<number>
      expectedEnding?: Types.Maybe<any>
      applicationDetails?: Types.Maybe<string>
      applicationFormQuestions: Array<{ question?: Types.Maybe<string> }>
    }
  }
}

export type WorkingGroupOpeningsFieldsFragment = {
  groupId: string
  runtimeId: number
  type: Types.WorkingGroupOpeningType
  createdInEvent: { inBlock: number; groupId: string }
  applications: Array<{
    runtimeId: number
    createdInEvent: { inBlock: number }
    applicant: { id: string; handle: string }
  }>
  status:
    | { __typename: 'OpeningStatusOpen'; phantom?: Types.Maybe<number> }
    | {
        __typename: 'OpeningStatusFilled'
        openingFilledEvent?: Types.Maybe<{
          inBlock: number
          workersHired: Array<{ applicationId: string; runtimeId: number; membership: { handle: string; id: string } }>
        }>
      }
    | { __typename: 'OpeningStatusCancelled'; openingCanceledEvent?: Types.Maybe<{ inBlock: number }> }
  metadata: {
    originallyValid: boolean
    title?: Types.Maybe<string>
    shortDescription?: Types.Maybe<string>
    description?: Types.Maybe<string>
    hiringLimit?: Types.Maybe<number>
    expectedEnding?: Types.Maybe<any>
    applicationDetails?: Types.Maybe<string>
    applicationFormQuestions: Array<{ question?: Types.Maybe<string> }>
  }
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

export type OpeningAddedEventsBetweenBlocksQueryVariables = Types.Exact<{
  startBlock: Types.Scalars['Int']
  endBlock: Types.Scalars['Int']
}>

export type OpeningAddedEventsBetweenBlocksQuery = {
  openingAddedEvents: Array<OpeningAddedEventsBetweenBlocksFieldsFragment>
}

export type WorkingGroupOpeningsQueryVariables = Types.Exact<{ [key: string]: never }>

export type WorkingGroupOpeningsQuery = { workingGroupOpenings: Array<WorkingGroupOpeningsFieldsFragment> }

export type BudgetSpendingEventFieldsFragment = {
  inBlock: number
  groupId: string
  reciever: string
  amount: any
  rationale?: Types.Maybe<string>
}

export type BudgetSpendingEventQueryVariables = Types.Exact<{ [key: string]: never }>

export type BudgetSpendingEventQuery = { budgetSpendingEvents: Array<BudgetSpendingEventFieldsFragment> }

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

export type StorageBagStorageReplicationFieldsFragment = {
  id: string
  createdAt: any
  updatedAt?: Types.Maybe<any>
  storageBuckets: Array<{ id: string; acceptingNewBags: boolean }>
}

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
  operatorStatus:
    | { phantom?: Types.Maybe<number> }
    | { workerId: number }
    | { workerId: number; transactorAccountId: string }
  operatorMetadata?: Types.Maybe<{ nodeEndpoint?: Types.Maybe<string> }>
}

export type FailedUploadsBetweenTimestampsFieldsFragment = {
  id: string
  isAccepted: boolean
  size: any
  ipfsHash: string
  createdAt: any
  updatedAt?: Types.Maybe<any>
  storageBag: { id: string; storageBuckets: Array<{ id: string }> }
}

export type StorageBagStorageReplicationQueryVariables = Types.Exact<{ [key: string]: never }>

export type StorageBagStorageReplicationQuery = { storageBags: Array<StorageBagStorageReplicationFieldsFragment> }

export type StorageBagDistributionStatusQueryVariables = Types.Exact<{ [key: string]: never }>

export type StorageBagDistributionStatusQuery = { storageBags: Array<StorageBagDistributionStatusFieldsFragment> }

export type FailedUploadsBetweenTimestampsQueryVariables = Types.Exact<{
  startDate: Types.Scalars['DateTime']
  endDate: Types.Scalars['DateTime']
}>

export type FailedUploadsBetweenTimestampsQuery = {
  storageDataObjects: Array<FailedUploadsBetweenTimestampsFieldsFragment>
}

export type StorageBucketsDataQueryVariables = Types.Exact<{ [key: string]: never }>

export type StorageBucketsDataQuery = { storageBuckets: Array<StorageBucketsDataFieldsFragment> }

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

export const AllVideosFields = gql`
  fragment AllVideosFields on Video {
    id
    isCensored
    createdAt
    updatedAt
    updatedById
    nftId
    category {
      id
      name
    }
    createdInBlock
    thumbnailPhoto {
      id
      size
      isAccepted
    }
    media {
      id
      size
      isAccepted
    }
  }
`
export const AllChannelsFields = gql`
  fragment AllChannelsFields on Channel {
    id
    isCensored
    createdAt
    updatedAt
    updatedById
    category {
      id
      name
    }
    createdInBlock
    coverPhoto {
      id
      size
      isAccepted
    }
    avatarPhoto {
      id
      size
      isAccepted
    }
  }
`
export const NftBoughtEventsBetweenBlocksFields = gql`
  fragment NftBoughtEventsBetweenBlocksFields on NftBoughtEvent {
    inBlock
    videoId
    price
    ownerMemberId
  }
`
export const NftIssuedEventsBetweenBlocksFields = gql`
  fragment NftIssuedEventsBetweenBlocksFields on NftIssuedEvent {
    inBlock
    videoId
    royalty
    ownerMemberId
  }
`
export const DistributionBucketsDataFields = gql`
  fragment DistributionBucketsDataFields on DistributionBucket {
    id
    bucketIndex
    familyId
    acceptingNewBags
    distributing
    bags {
      id
    }
    operators {
      workerId
      metadata {
        nodeEndpoint
      }
    }
  }
`
export const DistributionBucketFamilyDataFields = gql`
  fragment DistributionBucketFamilyDataFields on DistributionBucketFamily {
    id
    buckets {
      ...DistributionBucketsDataFields
    }
  }
  ${DistributionBucketsDataFields}
`
export const AllForumPostsFields = gql`
  fragment AllForumPostsFields on ForumPost {
    id
    deletedInEventId
    forumthreadinitialPost {
      categoryId
    }
    postaddedeventpost {
      inBlock
      isEditable
    }
    deletedInEvent {
      inBlock
      rationale
      actorId
    }
    postmoderatedeventpost {
      inBlock
      rationale
      actorId
    }
  }
`
export const AllForumCategoriesFields = gql`
  fragment AllForumCategoriesFields on ForumCategory {
    id
    updatedAt
    title
    description
    createdInEvent {
      inBlock
    }
    categorydeletedeventcategory {
      inBlock
    }
  }
`
export const AllForumThreadsFields = gql`
  fragment AllForumThreadsFields on ForumThread {
    id
    category {
      title
      id
    }
    createdInEvent {
      inBlock
    }
    status {
      __typename
      ... on ThreadStatusLocked {
        threadDeletedEvent {
          inBlock
          thread {
            id
          }
        }
      }
      ... on ThreadStatusModerated {
        threadModeratedEvent {
          inBlock
          rationale
          actorId
        }
      }
      ... on ThreadStatusRemoved {
        threadDeletedEvent {
          inBlock
        }
      }
    }
  }
`
export const PostAddedEventsBetweenBlocksFields = gql`
  fragment PostAddedEventsBetweenBlocksFields on PostAddedEvent {
    inBlock
    id
    isEditable
    post {
      authorId
      isVisible
      origin {
        __typename
      }
      thread {
        id
        categoryId
      }
      edits {
        inBlock
      }
      status {
        __typename
      }
    }
  }
`
export const PostDeletedEventsBetweenBlocksFields = gql`
  fragment PostDeletedEventsBetweenBlocksFields on PostDeletedEvent {
    inBlock
    posts {
      id
      threadId
    }
    actorId
    rationale
  }
`
export const PostModeratedEventsBetweenBlocksFields = gql`
  fragment PostModeratedEventsBetweenBlocksFields on PostModeratedEvent {
    inBlock
    postId
    actorId
    rationale
  }
`
export const PostReactedEventsBetweenBlocksFields = gql`
  fragment PostReactedEventsBetweenBlocksFields on PostReactedEvent {
    inBlock
    postId
    reactingMemberId
    reactionResult {
      __typename
    }
  }
`
export const ThreadCreatedEventsBetweenBlocksFields = gql`
  fragment ThreadCreatedEventsBetweenBlocksFields on ThreadCreatedEvent {
    inBlock
    id
    thread {
      authorId
      isVisible
      id
      categoryId
      status {
        __typename
      }
    }
  }
`
export const ThreadMetadataUpdatedEventsBetweenBlocksFields = gql`
  fragment ThreadMetadataUpdatedEventsBetweenBlocksFields on ThreadMetadataUpdatedEvent {
    inBlock
    threadId
    updatedById
    newTitle
  }
`
export const ThreadMovedEventsBetweenBlocksFields = gql`
  fragment ThreadMovedEventsBetweenBlocksFields on ThreadMovedEvent {
    inBlock
    threadId
    actorId
    oldCategoryId
    newCategoryId
  }
`
export const ThreadDeletedEventsBetweenBlocksFields = gql`
  fragment ThreadDeletedEventsBetweenBlocksFields on ThreadDeletedEvent {
    inBlock
    threadId
  }
`
export const ThreadModeratedEventsBetweenBlocksFields = gql`
  fragment ThreadModeratedEventsBetweenBlocksFields on ThreadModeratedEvent {
    inBlock
    threadId
    actorId
    rationale
  }
`
export const MembershipOnWorkerFields = gql`
  fragment MembershipOnWorkerFields on Membership {
    id
    handle
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
      ... on WorkerStatusLeaving {
        workerStartedLeavingEvent {
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
export const OpeningAddedEventsBetweenBlocksFields = gql`
  fragment OpeningAddedEventsBetweenBlocksFields on OpeningAddedEvent {
    inBlock
    groupId
    openingId
    opening {
      status {
        __typename
      }
      metadata {
        originallyValid
        title
        shortDescription
        description
        hiringLimit
        expectedEnding
        applicationDetails
        applicationFormQuestions {
          question
        }
      }
    }
  }
`
export const WorkingGroupOpeningsFields = gql`
  fragment WorkingGroupOpeningsFields on WorkingGroupOpening {
    groupId
    runtimeId
    type
    createdInEvent {
      inBlock
      groupId
    }
    applications {
      createdInEvent {
        inBlock
      }
      runtimeId
      applicant {
        id
        handle
      }
    }
    status {
      __typename
      ... on OpeningStatusOpen {
        phantom
      }
      ... on OpeningStatusFilled {
        openingFilledEvent {
          inBlock
          workersHired {
            applicationId
            runtimeId
            membership {
              handle
              id
            }
          }
        }
      }
      ... on OpeningStatusCancelled {
        openingCanceledEvent {
          inBlock
        }
      }
    }
    metadata {
      originallyValid
      title
      shortDescription
      description
      hiringLimit
      expectedEnding
      applicationDetails
      applicationFormQuestions {
        question
      }
    }
  }
`
export const BudgetSpendingEventFields = gql`
  fragment BudgetSpendingEventFields on BudgetSpendingEvent {
    inBlock
    groupId
    reciever
    amount
    rationale
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
export const StorageBagStorageReplicationFields = gql`
  fragment StorageBagStorageReplicationFields on StorageBag {
    id
    createdAt
    updatedAt
    storageBuckets {
      id
      acceptingNewBags
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
        transactorAccountId
      }
      ... on StorageBucketOperatorStatusInvited {
        workerId
      }
      ... on StorageBucketOperatorStatusMissing {
        phantom
      }
    }
    operatorMetadata {
      nodeEndpoint
    }
  }
`
export const FailedUploadsBetweenTimestampsFields = gql`
  fragment FailedUploadsBetweenTimestampsFields on StorageDataObject {
    id
    isAccepted
    size
    ipfsHash
    createdAt
    updatedAt
    storageBag {
      id
      storageBuckets {
        id
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
export const AllVideos = gql`
  query AllVideos {
    videos(limit: 1000000, orderBy: createdAt_DESC) {
      ...AllVideosFields
    }
  }
  ${AllVideosFields}
`
export const AllChannels = gql`
  query AllChannels {
    channels(limit: 1000000, orderBy: createdAt_DESC) {
      ...AllChannelsFields
    }
  }
  ${AllChannelsFields}
`
export const ChannelsCreatedBetweenBlocks = gql`
  query ChannelsCreatedBetweenBlocks($startBlock: Int!, $endBlock: Int!) {
    channels(
      limit: 1000000
      orderBy: createdInBlock_ASC
      where: { createdInBlock_gt: $startBlock, createdInBlock_lte: $endBlock }
    ) {
      ...AllChannelsFields
    }
  }
  ${AllChannelsFields}
`
export const VideosCreatedBetweenBlocks = gql`
  query VideosCreatedBetweenBlocks($startBlock: Int!, $endBlock: Int!) {
    videos(limit: 1000000, where: { createdInBlock_gt: $startBlock, createdInBlock_lte: $endBlock }) {
      ...AllVideosFields
    }
  }
  ${AllVideosFields}
`
export const NftBoughtEventsBetweenBlocks = gql`
  query NftBoughtEventsBetweenBlocks($startBlock: Int!, $endBlock: Int!) {
    nftBoughtEvents(limit: 1000000, orderBy: inBlock_ASC, where: { inBlock_gt: $startBlock, inBlock_lte: $endBlock }) {
      ...NftBoughtEventsBetweenBlocksFields
    }
  }
  ${NftBoughtEventsBetweenBlocksFields}
`
export const NftIssuedEventsBetweenBlocks = gql`
  query NftIssuedEventsBetweenBlocks($startBlock: Int!, $endBlock: Int!) {
    nftIssuedEvents(limit: 1000000, orderBy: inBlock_ASC, where: { inBlock_gt: $startBlock, inBlock_lte: $endBlock }) {
      ...NftIssuedEventsBetweenBlocksFields
    }
  }
  ${NftIssuedEventsBetweenBlocksFields}
`
export const DistributionBucketsData = gql`
  query DistributionBucketsData {
    distributionBuckets(limit: 1000000) {
      ...DistributionBucketsDataFields
    }
  }
  ${DistributionBucketsDataFields}
`
export const DistributionBucketFamilyData = gql`
  query DistributionBucketFamilyData {
    distributionBucketFamilies(limit: 1000000) {
      ...DistributionBucketFamilyDataFields
    }
  }
  ${DistributionBucketFamilyDataFields}
`
export const AllForumPosts = gql`
  query AllForumPosts {
    forumPosts(limit: 1000000, orderBy: createdAt_DESC) {
      ...AllForumPostsFields
    }
  }
  ${AllForumPostsFields}
`
export const AllForumCategories = gql`
  query AllForumCategories {
    forumCategories(limit: 1000000) {
      ...AllForumCategoriesFields
    }
  }
  ${AllForumCategoriesFields}
`
export const AllForumThreads = gql`
  query AllForumThreads {
    forumThreads(limit: 1000000, orderBy: createdAt_DESC) {
      ...AllForumThreadsFields
    }
  }
  ${AllForumThreadsFields}
`
export const PostAddedEventsBetweenBlocks = gql`
  query PostAddedEventsBetweenBlocks($startBlock: Int!, $endBlock: Int!) {
    postAddedEvents(limit: 1000000, orderBy: inBlock_ASC, where: { inBlock_gt: $startBlock, inBlock_lte: $endBlock }) {
      ...PostAddedEventsBetweenBlocksFields
    }
  }
  ${PostAddedEventsBetweenBlocksFields}
`
export const PostDeletedEventsBetweenBlocks = gql`
  query PostDeletedEventsBetweenBlocks($startBlock: Int!, $endBlock: Int!) {
    postDeletedEvents(
      limit: 1000000
      orderBy: inBlock_ASC
      where: { inBlock_gt: $startBlock, inBlock_lte: $endBlock }
    ) {
      ...PostDeletedEventsBetweenBlocksFields
    }
  }
  ${PostDeletedEventsBetweenBlocksFields}
`
export const PostModeratedEventsBetweenBlocks = gql`
  query PostModeratedEventsBetweenBlocks($startBlock: Int!, $endBlock: Int!) {
    postModeratedEvents(
      limit: 1000000
      orderBy: inBlock_ASC
      where: { inBlock_gt: $startBlock, inBlock_lte: $endBlock }
    ) {
      ...PostModeratedEventsBetweenBlocksFields
    }
  }
  ${PostModeratedEventsBetweenBlocksFields}
`
export const PostReactedEventsBetweenBlocks = gql`
  query PostReactedEventsBetweenBlocks($startBlock: Int!, $endBlock: Int!) {
    postReactedEvents(
      limit: 1000000
      orderBy: inBlock_ASC
      where: { inBlock_gt: $startBlock, inBlock_lte: $endBlock }
    ) {
      ...PostReactedEventsBetweenBlocksFields
    }
  }
  ${PostReactedEventsBetweenBlocksFields}
`
export const ThreadCreatedEventsBetweenBlocks = gql`
  query ThreadCreatedEventsBetweenBlocks($startBlock: Int!, $endBlock: Int!) {
    threadCreatedEvents(
      limit: 1000000
      orderBy: inBlock_ASC
      where: { inBlock_gt: $startBlock, inBlock_lte: $endBlock }
    ) {
      ...ThreadCreatedEventsBetweenBlocksFields
    }
  }
  ${ThreadCreatedEventsBetweenBlocksFields}
`
export const ThreadMetadataUpdatedEventsBetweenBlocks = gql`
  query ThreadMetadataUpdatedEventsBetweenBlocks($startBlock: Int!, $endBlock: Int!) {
    threadMetadataUpdatedEvents(
      limit: 1000000
      orderBy: inBlock_ASC
      where: { inBlock_gt: $startBlock, inBlock_lte: $endBlock }
    ) {
      ...ThreadMetadataUpdatedEventsBetweenBlocksFields
    }
  }
  ${ThreadMetadataUpdatedEventsBetweenBlocksFields}
`
export const ThreadMovedEventsBetweenBlocks = gql`
  query ThreadMovedEventsBetweenBlocks($startBlock: Int!, $endBlock: Int!) {
    threadMovedEvents(
      limit: 1000000
      orderBy: inBlock_ASC
      where: { inBlock_gt: $startBlock, inBlock_lte: $endBlock }
    ) {
      ...ThreadMovedEventsBetweenBlocksFields
    }
  }
  ${ThreadMovedEventsBetweenBlocksFields}
`
export const ThreadDeletedEventsBetweenBlocks = gql`
  query ThreadDeletedEventsBetweenBlocks($startBlock: Int!, $endBlock: Int!) {
    threadDeletedEvents(
      limit: 1000000
      orderBy: inBlock_ASC
      where: { inBlock_gt: $startBlock, inBlock_lte: $endBlock }
    ) {
      ...ThreadDeletedEventsBetweenBlocksFields
    }
  }
  ${ThreadDeletedEventsBetweenBlocksFields}
`
export const ThreadModeratedEventsBetweenBlocks = gql`
  query ThreadModeratedEventsBetweenBlocks($startBlock: Int!, $endBlock: Int!) {
    threadModeratedEvents(
      limit: 1000000
      orderBy: inBlock_ASC
      where: { inBlock_gt: $startBlock, inBlock_lte: $endBlock }
    ) {
      ...ThreadModeratedEventsBetweenBlocksFields
    }
  }
  ${ThreadModeratedEventsBetweenBlocksFields}
`
export const AllBounties = gql`
  query AllBounties {
    bounties(limit: 1000000, orderBy: createdAt_ASC) {
      ...AllBountiesFields
    }
  }
  ${AllBountiesFields}
`
export const BudgetUpdatedEventsBetweenDates = gql`
  query BudgetUpdatedEventsBetweenDates($startDate: DateTime!, $endDate: DateTime!) {
    budgetUpdatedEvents(
      limit: 1000
      orderBy: inBlock_ASC
      where: { updatedAt_gt: $startDate, updatedAt_lte: $endDate }
    ) {
      ...BudgetUpdatedEventFields
    }
  }
  ${BudgetUpdatedEventFields}
`
export const BudgetUpdatedEventsBetweenBlocks = gql`
  query BudgetUpdatedEventsBetweenBlocks($startBlock: Int!, $endBlock: Int!) {
    budgetUpdatedEvents(limit: 1000, orderBy: inBlock_ASC, where: { inBlock_gt: $startBlock, inBlock_lte: $endBlock }) {
      ...BudgetUpdatedEventFields
    }
  }
  ${BudgetUpdatedEventFields}
`
export const BudgetRefillEventsBetweenBlocks = gql`
  query BudgetRefillEventsBetweenBlocks($startBlock: Int!, $endBlock: Int!) {
    budgetRefillEvents(limit: 1000, orderBy: inBlock_ASC, where: { inBlock_gt: $startBlock, inBlock_lte: $endBlock }) {
      ...BudgetRefillEventFields
    }
  }
  ${BudgetRefillEventFields}
`
export const RewardPaidEventsBetweenBlocks = gql`
  query RewardPaidEventsBetweenBlocks($startBlock: Int!, $endBlock: Int!) {
    rewardPaidEvents(limit: 1000, orderBy: inBlock_ASC, where: { inBlock_gt: $startBlock, inBlock_lte: $endBlock }) {
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
      where: { inBlock_gt: $startBlock, inBlock_lte: $endBlock }
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
      where: { inBlock_gt: $startBlock, inBlock_lte: $endBlock }
    ) {
      ...ProposalsDecisionMadeEventsFields
    }
  }
  ${ProposalsDecisionMadeEventsFields}
`
export const MemberInvitedEventsBetweenBlocks = gql`
  query MemberInvitedEventsBetweenBlocks($startBlock: Int!, $endBlock: Int!) {
    memberInvitedEvents(limit: 1000, orderBy: inBlock_ASC, where: { inBlock_gt: $startBlock, inBlock_lte: $endBlock }) {
      ...MemberInvitedEventsFields
    }
  }
  ${MemberInvitedEventsFields}
`
export const BountiesFundedBetweenBlocks = gql`
  query BountiesFundedBetweenBlocks($startBlock: Int!, $endBlock: Int!) {
    bountyFundedEvents(
      limit: 1000000
      orderBy: inBlock_ASC
      where: { inBlock_gt: $startBlock, inBlock_lte: $endBlock }
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
      where: { inBlock_gt: $startBlock, inBlock_lte: $endBlock }
    ) {
      ...BountiesCreatedBetweenBlocksFields
    }
  }
  ${BountiesCreatedBetweenBlocksFields}
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
      where: { inBlock_gt: $startBlock, inBlock_lte: $endBlock }
    ) {
      ...OracleJudgmentSubmittedEventsBetweenBlocksFields
    }
  }
  ${OracleJudgmentSubmittedEventsBetweenBlocksFields}
`
export const OpeningAddedEventsBetweenBlocks = gql`
  query OpeningAddedEventsBetweenBlocks($startBlock: Int!, $endBlock: Int!) {
    openingAddedEvents(
      limit: 1000000
      orderBy: createdAt_DESC
      where: { inBlock_gt: $startBlock, inBlock_lte: $endBlock }
    ) {
      ...OpeningAddedEventsBetweenBlocksFields
    }
  }
  ${OpeningAddedEventsBetweenBlocksFields}
`
export const WorkingGroupOpenings = gql`
  query WorkingGroupOpenings {
    workingGroupOpenings(limit: 1000000, orderBy: createdAt_DESC) {
      ...WorkingGroupOpeningsFields
    }
  }
  ${WorkingGroupOpeningsFields}
`
export const BudgetSpendingEvent = gql`
  query BudgetSpendingEvent {
    budgetSpendingEvents(limit: 1000000, orderBy: createdAt_DESC) {
      ...BudgetSpendingEventFields
    }
  }
  ${BudgetSpendingEventFields}
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
export const FailedUploadsBetweenTimestamps = gql`
  query FailedUploadsBetweenTimestamps($startDate: DateTime!, $endDate: DateTime!) {
    storageDataObjects(limit: 1000000, where: { createdAt_gte: $startDate, createdAt_lt: $endDate }) {
      ...FailedUploadsBetweenTimestampsFields
    }
  }
  ${FailedUploadsBetweenTimestampsFields}
`
export const StorageBucketsData = gql`
  query StorageBucketsData {
    storageBuckets(limit: 1000000) {
      ...StorageBucketsDataFields
    }
  }
  ${StorageBucketsDataFields}
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
