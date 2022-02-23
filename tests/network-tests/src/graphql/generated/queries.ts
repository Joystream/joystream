import * as Types from './schema'

import gql from 'graphql-tag'
type DataObjectTypeFields_DataObjectTypeChannelAvatar_Fragment = {
  __typename: 'DataObjectTypeChannelAvatar'
  channel?: Types.Maybe<{ id: string }>
}

type DataObjectTypeFields_DataObjectTypeChannelCoverPhoto_Fragment = {
  __typename: 'DataObjectTypeChannelCoverPhoto'
  channel?: Types.Maybe<{ id: string }>
}

type DataObjectTypeFields_DataObjectTypeVideoMedia_Fragment = {
  __typename: 'DataObjectTypeVideoMedia'
  video?: Types.Maybe<{ id: string }>
}

type DataObjectTypeFields_DataObjectTypeVideoThumbnail_Fragment = {
  __typename: 'DataObjectTypeVideoThumbnail'
  video?: Types.Maybe<{ id: string }>
}

type DataObjectTypeFields_DataObjectTypeUnknown_Fragment = { __typename: 'DataObjectTypeUnknown' }

export type DataObjectTypeFieldsFragment =
  | DataObjectTypeFields_DataObjectTypeChannelAvatar_Fragment
  | DataObjectTypeFields_DataObjectTypeChannelCoverPhoto_Fragment
  | DataObjectTypeFields_DataObjectTypeVideoMedia_Fragment
  | DataObjectTypeFields_DataObjectTypeVideoThumbnail_Fragment
  | DataObjectTypeFields_DataObjectTypeUnknown_Fragment

export type StorageDataObjectFieldsFragment = {
  id: string
  ipfsHash: string
  isAccepted: boolean
  size: any
  deletionPrize: any
  unsetAt?: Types.Maybe<any>
  storageBagId: string
  type:
    | DataObjectTypeFields_DataObjectTypeChannelAvatar_Fragment
    | DataObjectTypeFields_DataObjectTypeChannelCoverPhoto_Fragment
    | DataObjectTypeFields_DataObjectTypeVideoMedia_Fragment
    | DataObjectTypeFields_DataObjectTypeVideoThumbnail_Fragment
    | DataObjectTypeFields_DataObjectTypeUnknown_Fragment
}

export type ChannelFieldsFragment = {
  id: string
  activeVideosCounter: number
  title?: Types.Maybe<string>
  description?: Types.Maybe<string>
  isPublic?: Types.Maybe<boolean>
  rewardAccount?: Types.Maybe<string>
  isCensored: boolean
  language?: Types.Maybe<{ iso: string }>
  ownerMember?: Types.Maybe<{ id: string }>
  ownerCuratorGroup?: Types.Maybe<{ id: string }>
  category?: Types.Maybe<{ name?: Types.Maybe<string> }>
  avatarPhoto?: Types.Maybe<StorageDataObjectFieldsFragment>
  coverPhoto?: Types.Maybe<StorageDataObjectFieldsFragment>
}

export type ChannelCategoryFieldsFragment = { id: string; activeVideosCounter: number }

export type VideoCategoryFieldsFragment = { id: string; activeVideosCounter: number }

export type OwnedNftFieldsFragment = {
  id: string
  metadata: string
  creatorRoyalty?: Types.Maybe<number>
  video: { id: string }
  ownerMember?: Types.Maybe<{ id: string }>
  transactionalStatus:
    | { __typename: 'TransactionalStatusIdle' }
    | { __typename: 'TransactionalStatusInitiatedOfferToMember' }
    | { __typename: 'TransactionalStatusAuction' }
    | { __typename: 'TransactionalStatusBuyNow' }
}

export type GetChannelByIdQueryVariables = Types.Exact<{
  id: Types.Scalars['ID']
}>

export type GetChannelByIdQuery = { channelByUniqueInput?: Types.Maybe<ChannelFieldsFragment> }

export type GetChannelCategoryByIdQueryVariables = Types.Exact<{
  id: Types.Scalars['ID']
}>

export type GetChannelCategoryByIdQuery = { channelCategoryByUniqueInput?: Types.Maybe<ChannelCategoryFieldsFragment> }

export type GetVideoCategoryByIdQueryVariables = Types.Exact<{
  id: Types.Scalars['ID']
}>

export type GetVideoCategoryByIdQuery = { videoCategoryByUniqueInput?: Types.Maybe<VideoCategoryFieldsFragment> }

export type GetOwnedNftByVideoIdQueryVariables = Types.Exact<{
  videoId: Types.Scalars['ID']
}>

export type GetOwnedNftByVideoIdQuery = { ownedNfts: Array<OwnedNftFieldsFragment> }

export type CouncilMemberFieldsFragment = { id: string; member: { id: string } }

export type ElectedCouncilFieldsFragment = { councilMembers: Array<CouncilMemberFieldsFragment> }

export type CandidateFieldsFragment = { id: string; member: { id: string } }

export type GetCurrentCouncilMembersQueryVariables = Types.Exact<{ [key: string]: never }>

export type GetCurrentCouncilMembersQuery = { electedCouncils: Array<ElectedCouncilFieldsFragment> }

export type GetReferendumIntermediateWinnersQueryVariables = Types.Exact<{
  electionRoundCycleId: Types.Scalars['Int']
  councilSize: Types.Scalars['Int']
}>

export type GetReferendumIntermediateWinnersQuery = { candidates: Array<CandidateFieldsFragment> }

export type ForumCategoryFieldsFragment = {
  id: string
  createdAt: any
  updatedAt?: Types.Maybe<any>
  title: string
  description: string
  parent?: Types.Maybe<{ id: string }>
  threads: Array<{ id: string; isSticky: boolean }>
  moderators: Array<{ id: string }>
  createdInEvent: { id: string }
  status:
    | { __typename: 'CategoryStatusActive' }
    | { __typename: 'CategoryStatusArchived'; categoryArchivalStatusUpdatedEvent?: Types.Maybe<{ id: string }> }
    | { __typename: 'CategoryStatusRemoved'; categoryDeletedEvent?: Types.Maybe<{ id: string }> }
}

export type ForumPostFieldsFragment = {
  id: string
  createdAt: any
  updatedAt?: Types.Maybe<any>
  text: string
  isVisible: boolean
  author: { id: string }
  thread: { id: string }
  repliesTo?: Types.Maybe<{ id: string }>
  status:
    | { __typename: 'PostStatusActive' }
    | { __typename: 'PostStatusLocked'; postDeletedEvent?: Types.Maybe<{ id: string }> }
    | { __typename: 'PostStatusModerated'; postModeratedEvent?: Types.Maybe<{ id: string }> }
    | { __typename: 'PostStatusRemoved'; postDeletedEvent?: Types.Maybe<{ id: string }> }
  origin:
    | { __typename: 'PostOriginThreadInitial'; threadCreatedEvent?: Types.Maybe<{ id: string }> }
    | { __typename: 'PostOriginThreadReply'; postAddedEvent?: Types.Maybe<{ id: string }> }
  edits: Array<{ id: string }>
  reactions: Array<{ id: string; reaction: Types.PostReaction; member: { id: string } }>
}

export type ForumThreadWithInitialPostFragment = {
  id: string
  createdAt: any
  updatedAt?: Types.Maybe<any>
  title: string
  isSticky: boolean
  isVisible: boolean
  author: { id: string }
  category: { id: string }
  initialPost?: Types.Maybe<ForumPostFieldsFragment>
  poll?: Types.Maybe<{
    description: string
    endTime: any
    pollAlternatives: Array<{ index: number; text: string; votes: Array<{ votingMember: { id: string } }> }>
  }>
  createdInEvent: { id: string; title: string; text: string }
  status:
    | { __typename: 'ThreadStatusActive' }
    | { __typename: 'ThreadStatusLocked'; threadDeletedEvent?: Types.Maybe<{ id: string }> }
    | { __typename: 'ThreadStatusModerated'; threadModeratedEvent?: Types.Maybe<{ id: string }> }
    | { __typename: 'ThreadStatusRemoved'; threadDeletedEvent?: Types.Maybe<{ id: string }> }
  metadataUpdates: Array<{ id: string }>
  movedInEvents: Array<{ id: string }>
  tags: Array<{ id: string }>
}

export type GetCategoriesByIdsQueryVariables = Types.Exact<{
  ids?: Types.Maybe<Array<Types.Scalars['ID']> | Types.Scalars['ID']>
}>

export type GetCategoriesByIdsQuery = { forumCategories: Array<ForumCategoryFieldsFragment> }

export type GetThreadsWithInitialPostsByIdsQueryVariables = Types.Exact<{
  ids?: Types.Maybe<Array<Types.Scalars['ID']> | Types.Scalars['ID']>
}>

export type GetThreadsWithInitialPostsByIdsQuery = { forumThreads: Array<ForumThreadWithInitialPostFragment> }

export type GetPostsByIdsQueryVariables = Types.Exact<{
  ids?: Types.Maybe<Array<Types.Scalars['ID']> | Types.Scalars['ID']>
}>

export type GetPostsByIdsQuery = { forumPosts: Array<ForumPostFieldsFragment> }

export type CategoryCreatedEventFieldsFragment = {
  id: string
  createdAt: any
  inBlock: number
  network: Types.Network
  inExtrinsic?: Types.Maybe<string>
  indexInBlock: number
  category: { id: string }
}

export type GetCategoryCreatedEventsByEventIdsQueryVariables = Types.Exact<{
  eventIds?: Types.Maybe<Array<Types.Scalars['ID']> | Types.Scalars['ID']>
}>

export type GetCategoryCreatedEventsByEventIdsQuery = {
  categoryCreatedEvents: Array<CategoryCreatedEventFieldsFragment>
}

export type CategoryArchivalStatusUpdatedEventFieldsFragment = {
  id: string
  createdAt: any
  inBlock: number
  network: Types.Network
  inExtrinsic?: Types.Maybe<string>
  indexInBlock: number
  newArchivalStatus: boolean
  category: { id: string }
  actor: { id: string }
}

export type GetCategoryArchivalStatusUpdatedEventsByEventIdsQueryVariables = Types.Exact<{
  eventIds?: Types.Maybe<Array<Types.Scalars['ID']> | Types.Scalars['ID']>
}>

export type GetCategoryArchivalStatusUpdatedEventsByEventIdsQuery = {
  categoryArchivalStatusUpdatedEvents: Array<CategoryArchivalStatusUpdatedEventFieldsFragment>
}

export type CategoryDeletedEventFieldsFragment = {
  id: string
  createdAt: any
  inBlock: number
  network: Types.Network
  inExtrinsic?: Types.Maybe<string>
  indexInBlock: number
  category: { id: string }
  actor: { id: string }
}

export type GetCategoryDeletedEventsByEventIdsQueryVariables = Types.Exact<{
  eventIds?: Types.Maybe<Array<Types.Scalars['ID']> | Types.Scalars['ID']>
}>

export type GetCategoryDeletedEventsByEventIdsQuery = {
  categoryDeletedEvents: Array<CategoryDeletedEventFieldsFragment>
}

export type ThreadCreatedEventFieldsFragment = {
  id: string
  createdAt: any
  inBlock: number
  network: Types.Network
  inExtrinsic?: Types.Maybe<string>
  indexInBlock: number
  title: string
  text: string
  thread: { id: string }
}

export type GetThreadCreatedEventsByEventIdsQueryVariables = Types.Exact<{
  eventIds?: Types.Maybe<Array<Types.Scalars['ID']> | Types.Scalars['ID']>
}>

export type GetThreadCreatedEventsByEventIdsQuery = { threadCreatedEvents: Array<ThreadCreatedEventFieldsFragment> }

export type ThreadMetadataUpdatedEventFieldsFragment = {
  id: string
  createdAt: any
  inBlock: number
  network: Types.Network
  inExtrinsic?: Types.Maybe<string>
  indexInBlock: number
  newTitle?: Types.Maybe<string>
  thread: { id: string }
}

export type GetThreadMetadataUpdatedEventsByEventIdsQueryVariables = Types.Exact<{
  eventIds?: Types.Maybe<Array<Types.Scalars['ID']> | Types.Scalars['ID']>
}>

export type GetThreadMetadataUpdatedEventsByEventIdsQuery = {
  threadMetadataUpdatedEvents: Array<ThreadMetadataUpdatedEventFieldsFragment>
}

export type VoteOnPollEventFieldsFragment = {
  id: string
  createdAt: any
  inBlock: number
  network: Types.Network
  inExtrinsic?: Types.Maybe<string>
  indexInBlock: number
  pollAlternative: { id: string; index: number; text: string; poll: { thread: { id: string } } }
  votingMember: { id: string }
}

export type GetVoteOnPollEventsByEventIdsQueryVariables = Types.Exact<{
  eventIds?: Types.Maybe<Array<Types.Scalars['ID']> | Types.Scalars['ID']>
}>

export type GetVoteOnPollEventsByEventIdsQuery = { voteOnPollEvents: Array<VoteOnPollEventFieldsFragment> }

export type ThreadDeletedEventFieldsFragment = {
  id: string
  createdAt: any
  inBlock: number
  network: Types.Network
  inExtrinsic?: Types.Maybe<string>
  indexInBlock: number
  thread: { id: string }
}

export type GetThreadDeletedEventsByEventIdsQueryVariables = Types.Exact<{
  eventIds?: Types.Maybe<Array<Types.Scalars['ID']> | Types.Scalars['ID']>
}>

export type GetThreadDeletedEventsByEventIdsQuery = { threadDeletedEvents: Array<ThreadDeletedEventFieldsFragment> }

export type PostAddedEventFieldsFragment = {
  id: string
  createdAt: any
  inBlock: number
  network: Types.Network
  inExtrinsic?: Types.Maybe<string>
  indexInBlock: number
  isEditable?: Types.Maybe<boolean>
  text: string
  post: { id: string }
}

export type GetPostAddedEventsByEventIdsQueryVariables = Types.Exact<{
  eventIds?: Types.Maybe<Array<Types.Scalars['ID']> | Types.Scalars['ID']>
}>

export type GetPostAddedEventsByEventIdsQuery = { postAddedEvents: Array<PostAddedEventFieldsFragment> }

export type ThreadMovedEventFieldsFragment = {
  id: string
  createdAt: any
  inBlock: number
  network: Types.Network
  inExtrinsic?: Types.Maybe<string>
  indexInBlock: number
  thread: { id: string }
  oldCategory: { id: string }
  newCategory: { id: string }
  actor: { id: string }
}

export type GetThreadMovedEventsByEventIdsQueryVariables = Types.Exact<{
  eventIds?: Types.Maybe<Array<Types.Scalars['ID']> | Types.Scalars['ID']>
}>

export type GetThreadMovedEventsByEventIdsQuery = { threadMovedEvents: Array<ThreadMovedEventFieldsFragment> }

export type CategoryStickyThreadUpdateEventFieldsFragment = {
  id: string
  createdAt: any
  inBlock: number
  network: Types.Network
  inExtrinsic?: Types.Maybe<string>
  indexInBlock: number
  category: { id: string }
  newStickyThreads: Array<{ id: string }>
  actor: { id: string }
}

export type GetCategoryStickyThreadUpdateEventsByEventIdsQueryVariables = Types.Exact<{
  eventIds?: Types.Maybe<Array<Types.Scalars['ID']> | Types.Scalars['ID']>
}>

export type GetCategoryStickyThreadUpdateEventsByEventIdsQuery = {
  categoryStickyThreadUpdateEvents: Array<CategoryStickyThreadUpdateEventFieldsFragment>
}

export type CategoryMembershipOfModeratorUpdatedEventFieldsFragment = {
  id: string
  createdAt: any
  inBlock: number
  network: Types.Network
  inExtrinsic?: Types.Maybe<string>
  indexInBlock: number
  newCanModerateValue: boolean
  category: { id: string }
  moderator: { id: string }
}

export type GetCategoryMembershipOfModeratorUpdatedEventsByEventIdsQueryVariables = Types.Exact<{
  eventIds?: Types.Maybe<Array<Types.Scalars['ID']> | Types.Scalars['ID']>
}>

export type GetCategoryMembershipOfModeratorUpdatedEventsByEventIdsQuery = {
  categoryMembershipOfModeratorUpdatedEvents: Array<CategoryMembershipOfModeratorUpdatedEventFieldsFragment>
}

export type ThreadModeratedEventFieldsFragment = {
  id: string
  createdAt: any
  inBlock: number
  network: Types.Network
  inExtrinsic?: Types.Maybe<string>
  indexInBlock: number
  rationale: string
  thread: { id: string }
  actor: { id: string }
}

export type GetThreadModeratedEventsByEventIdsQueryVariables = Types.Exact<{
  eventIds?: Types.Maybe<Array<Types.Scalars['ID']> | Types.Scalars['ID']>
}>

export type GetThreadModeratedEventsByEventIdsQuery = {
  threadModeratedEvents: Array<ThreadModeratedEventFieldsFragment>
}

export type PostModeratedEventFieldsFragment = {
  id: string
  createdAt: any
  inBlock: number
  network: Types.Network
  inExtrinsic?: Types.Maybe<string>
  indexInBlock: number
  rationale: string
  post: { id: string }
  actor: { id: string }
}

export type GetPostModeratedEventsByEventIdsQueryVariables = Types.Exact<{
  eventIds?: Types.Maybe<Array<Types.Scalars['ID']> | Types.Scalars['ID']>
}>

export type GetPostModeratedEventsByEventIdsQuery = { postModeratedEvents: Array<PostModeratedEventFieldsFragment> }

export type PostReactedEventFieldsFragment = {
  id: string
  createdAt: any
  inBlock: number
  network: Types.Network
  inExtrinsic?: Types.Maybe<string>
  indexInBlock: number
  post: { id: string }
  reactionResult:
    | { __typename: 'PostReactionResultCancel' }
    | { __typename: 'PostReactionResultValid'; reaction: Types.PostReaction; reactionId: number }
    | { __typename: 'PostReactionResultInvalid'; reactionId: number }
  reactingMember: { id: string }
}

export type GetPostReactedEventsByEventIdsQueryVariables = Types.Exact<{
  eventIds?: Types.Maybe<Array<Types.Scalars['ID']> | Types.Scalars['ID']>
}>

export type GetPostReactedEventsByEventIdsQuery = { postReactedEvents: Array<PostReactedEventFieldsFragment> }

export type PostTextUpdatedEventFieldsFragment = {
  id: string
  createdAt: any
  inBlock: number
  network: Types.Network
  inExtrinsic?: Types.Maybe<string>
  indexInBlock: number
  newText: string
  post: { id: string }
}

export type GetPostTextUpdatedEventsByEventIdsQueryVariables = Types.Exact<{
  eventIds?: Types.Maybe<Array<Types.Scalars['ID']> | Types.Scalars['ID']>
}>

export type GetPostTextUpdatedEventsByEventIdsQuery = {
  postTextUpdatedEvents: Array<PostTextUpdatedEventFieldsFragment>
}

export type PostDeletedEventFieldsFragment = {
  id: string
  createdAt: any
  inBlock: number
  network: Types.Network
  inExtrinsic?: Types.Maybe<string>
  indexInBlock: number
  rationale: string
  posts: Array<{ id: string }>
  actor: { id: string }
}

export type GetPostDeletedEventsByEventIdsQueryVariables = Types.Exact<{
  eventIds?: Types.Maybe<Array<Types.Scalars['ID']> | Types.Scalars['ID']>
}>

export type GetPostDeletedEventsByEventIdsQuery = { postDeletedEvents: Array<PostDeletedEventFieldsFragment> }

export type MemberMetadataFieldsFragment = { name?: Types.Maybe<string>; about?: Types.Maybe<string> }

export type MembershipFieldsFragment = {
  id: string
  handle: string
  controllerAccount: string
  rootAccount: string
  isVerified: boolean
  inviteCount: number
  boundAccounts: Array<string>
  metadata: MemberMetadataFieldsFragment
  entry:
    | { __typename: 'MembershipEntryPaid'; membershipBoughtEvent?: Types.Maybe<{ id: string }> }
    | { __typename: 'MembershipEntryInvited'; memberInvitedEvent?: Types.Maybe<{ id: string }> }
    | { __typename: 'MembershipEntryGenesis' }
  invitedBy?: Types.Maybe<{ id: string }>
  invitees: Array<{ id: string }>
}

export type GetMemberByIdQueryVariables = Types.Exact<{
  id: Types.Scalars['ID']
}>

export type GetMemberByIdQuery = { membershipByUniqueInput?: Types.Maybe<MembershipFieldsFragment> }

export type GetMembersByIdsQueryVariables = Types.Exact<{
  ids?: Types.Maybe<Array<Types.Scalars['ID']> | Types.Scalars['ID']>
}>

export type GetMembersByIdsQuery = { memberships: Array<MembershipFieldsFragment> }

export type MembershipSystemSnapshotFieldsFragment = {
  createdAt: any
  snapshotBlock: number
  referralCut: number
  invitedInitialBalance: any
  defaultInviteCount: number
  membershipPrice: any
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
  createdAt: any
  inBlock: number
  network: Types.Network
  inExtrinsic?: Types.Maybe<string>
  indexInBlock: number
  rootAccount: string
  controllerAccount: string
  handle: string
  newMember: { id: string }
  metadata: MemberMetadataFieldsFragment
  referrer?: Types.Maybe<{ id: string }>
}

export type GetMembershipBoughtEventsByEventIdsQueryVariables = Types.Exact<{
  eventIds?: Types.Maybe<Array<Types.Scalars['ID']> | Types.Scalars['ID']>
}>

export type GetMembershipBoughtEventsByEventIdsQuery = {
  membershipBoughtEvents: Array<MembershipBoughtEventFieldsFragment>
}

export type MemberProfileUpdatedEventFieldsFragment = {
  id: string
  createdAt: any
  inBlock: number
  network: Types.Network
  inExtrinsic?: Types.Maybe<string>
  indexInBlock: number
  newHandle?: Types.Maybe<string>
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
  createdAt: any
  inBlock: number
  network: Types.Network
  inExtrinsic?: Types.Maybe<string>
  indexInBlock: number
  newRootAccount?: Types.Maybe<string>
  newControllerAccount?: Types.Maybe<string>
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
  createdAt: any
  inBlock: number
  network: Types.Network
  inExtrinsic?: Types.Maybe<string>
  indexInBlock: number
  rootAccount: string
  controllerAccount: string
  handle: string
  invitingMember: { id: string }
  newMember: { id: string }
  metadata: MemberMetadataFieldsFragment
}

export type GetMemberInvitedEventsByEventIdsQueryVariables = Types.Exact<{
  eventIds?: Types.Maybe<Array<Types.Scalars['ID']> | Types.Scalars['ID']>
}>

export type GetMemberInvitedEventsByEventIdsQuery = { memberInvitedEvents: Array<MemberInvitedEventFieldsFragment> }

export type InvitesTransferredEventFieldsFragment = {
  id: string
  createdAt: any
  inBlock: number
  network: Types.Network
  inExtrinsic?: Types.Maybe<string>
  indexInBlock: number
  numberOfInvites: number
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
  createdAt: any
  inBlock: number
  network: Types.Network
  inExtrinsic?: Types.Maybe<string>
  indexInBlock: number
  account: string
  member: { id: string }
}

export type GetStakingAccountAddedEventsByEventIdsQueryVariables = Types.Exact<{
  ids?: Types.Maybe<Array<Types.Scalars['ID']> | Types.Scalars['ID']>
}>

export type GetStakingAccountAddedEventsByEventIdsQuery = {
  stakingAccountAddedEvents: Array<StakingAccountAddedEventFieldsFragment>
}

export type StakingAccountConfirmedEventFieldsFragment = {
  id: string
  createdAt: any
  inBlock: number
  network: Types.Network
  inExtrinsic?: Types.Maybe<string>
  indexInBlock: number
  account: string
  member: { id: string }
}

export type GetStakingAccountConfirmedEventsByEventIdsQueryVariables = Types.Exact<{
  ids?: Types.Maybe<Array<Types.Scalars['ID']> | Types.Scalars['ID']>
}>

export type GetStakingAccountConfirmedEventsByEventIdsQuery = {
  stakingAccountConfirmedEvents: Array<StakingAccountConfirmedEventFieldsFragment>
}

export type StakingAccountRemovedEventFieldsFragment = {
  id: string
  createdAt: any
  inBlock: number
  network: Types.Network
  inExtrinsic?: Types.Maybe<string>
  indexInBlock: number
  account: string
  member: { id: string }
}

export type GetStakingAccountRemovedEventsByMemberIdQueryVariables = Types.Exact<{
  memberId: Types.Scalars['ID']
}>

export type GetStakingAccountRemovedEventsByMemberIdQuery = {
  stakingAccountRemovedEvents: Array<StakingAccountRemovedEventFieldsFragment>
}

export type ReferralCutUpdatedEventFieldsFragment = {
  id: string
  createdAt: any
  inBlock: number
  network: Types.Network
  inExtrinsic?: Types.Maybe<string>
  indexInBlock: number
  newValue: number
}

export type GetReferralCutUpdatedEventsByEventIdQueryVariables = Types.Exact<{
  eventId: Types.Scalars['ID']
}>

export type GetReferralCutUpdatedEventsByEventIdQuery = {
  referralCutUpdatedEvents: Array<ReferralCutUpdatedEventFieldsFragment>
}

export type MembershipPriceUpdatedEventFieldsFragment = {
  id: string
  createdAt: any
  inBlock: number
  network: Types.Network
  inExtrinsic?: Types.Maybe<string>
  indexInBlock: number
  newPrice: any
}

export type GetMembershipPriceUpdatedEventsByEventIdQueryVariables = Types.Exact<{
  eventId: Types.Scalars['ID']
}>

export type GetMembershipPriceUpdatedEventsByEventIdQuery = {
  membershipPriceUpdatedEvents: Array<MembershipPriceUpdatedEventFieldsFragment>
}

export type InitialInvitationBalanceUpdatedEventFieldsFragment = {
  id: string
  createdAt: any
  inBlock: number
  network: Types.Network
  inExtrinsic?: Types.Maybe<string>
  indexInBlock: number
  newInitialBalance: any
}

export type GetInitialInvitationBalanceUpdatedEventsByEventIdQueryVariables = Types.Exact<{
  eventId: Types.Scalars['ID']
}>

export type GetInitialInvitationBalanceUpdatedEventsByEventIdQuery = {
  initialInvitationBalanceUpdatedEvents: Array<InitialInvitationBalanceUpdatedEventFieldsFragment>
}

export type InitialInvitationCountUpdatedEventFieldsFragment = {
  id: string
  createdAt: any
  inBlock: number
  network: Types.Network
  inExtrinsic?: Types.Maybe<string>
  indexInBlock: number
  newInitialInvitationCount: number
}

export type GetInitialInvitationCountUpdatedEventsByEventIdQueryVariables = Types.Exact<{
  eventId: Types.Scalars['ID']
}>

export type GetInitialInvitationCountUpdatedEventsByEventIdQuery = {
  initialInvitationCountUpdatedEvents: Array<InitialInvitationCountUpdatedEventFieldsFragment>
}

type ProposalStatusFields_ProposalStatusDeciding_Fragment = {
  __typename: 'ProposalStatusDeciding'
  proposalStatusUpdatedEvent?: Types.Maybe<{
    id: string
    newStatus:
      | { __typename: 'ProposalStatusDeciding' }
      | { __typename: 'ProposalStatusGracing' }
      | { __typename: 'ProposalStatusDormant' }
  }>
}

type ProposalStatusFields_ProposalStatusGracing_Fragment = {
  __typename: 'ProposalStatusGracing'
  proposalStatusUpdatedEvent?: Types.Maybe<{
    id: string
    newStatus:
      | { __typename: 'ProposalStatusDeciding' }
      | { __typename: 'ProposalStatusGracing' }
      | { __typename: 'ProposalStatusDormant' }
  }>
}

type ProposalStatusFields_ProposalStatusDormant_Fragment = {
  __typename: 'ProposalStatusDormant'
  proposalStatusUpdatedEvent?: Types.Maybe<{
    id: string
    newStatus:
      | { __typename: 'ProposalStatusDeciding' }
      | { __typename: 'ProposalStatusGracing' }
      | { __typename: 'ProposalStatusDormant' }
  }>
}

type ProposalStatusFields_ProposalStatusVetoed_Fragment = {
  __typename: 'ProposalStatusVetoed'
  proposalDecisionMadeEvent?: Types.Maybe<{
    id: string
    decisionStatus:
      | { __typename: 'ProposalStatusDormant' }
      | { __typename: 'ProposalStatusGracing' }
      | { __typename: 'ProposalStatusVetoed' }
      | { __typename: 'ProposalStatusSlashed' }
      | { __typename: 'ProposalStatusRejected' }
      | { __typename: 'ProposalStatusExpired' }
      | { __typename: 'ProposalStatusCancelled' }
      | { __typename: 'ProposalStatusCanceledByRuntime' }
  }>
}

type ProposalStatusFields_ProposalStatusExecuted_Fragment = {
  __typename: 'ProposalStatusExecuted'
  proposalExecutedEvent?: Types.Maybe<{
    id: string
    executionStatus: { __typename: 'ProposalStatusExecuted' } | { __typename: 'ProposalStatusExecutionFailed' }
  }>
}

type ProposalStatusFields_ProposalStatusExecutionFailed_Fragment = {
  __typename: 'ProposalStatusExecutionFailed'
  errorMessage: string
  proposalExecutedEvent?: Types.Maybe<{
    id: string
    executionStatus: { __typename: 'ProposalStatusExecuted' } | { __typename: 'ProposalStatusExecutionFailed' }
  }>
}

type ProposalStatusFields_ProposalStatusSlashed_Fragment = {
  __typename: 'ProposalStatusSlashed'
  proposalDecisionMadeEvent?: Types.Maybe<{
    id: string
    decisionStatus:
      | { __typename: 'ProposalStatusDormant' }
      | { __typename: 'ProposalStatusGracing' }
      | { __typename: 'ProposalStatusVetoed' }
      | { __typename: 'ProposalStatusSlashed' }
      | { __typename: 'ProposalStatusRejected' }
      | { __typename: 'ProposalStatusExpired' }
      | { __typename: 'ProposalStatusCancelled' }
      | { __typename: 'ProposalStatusCanceledByRuntime' }
  }>
}

type ProposalStatusFields_ProposalStatusRejected_Fragment = {
  __typename: 'ProposalStatusRejected'
  proposalDecisionMadeEvent?: Types.Maybe<{
    id: string
    decisionStatus:
      | { __typename: 'ProposalStatusDormant' }
      | { __typename: 'ProposalStatusGracing' }
      | { __typename: 'ProposalStatusVetoed' }
      | { __typename: 'ProposalStatusSlashed' }
      | { __typename: 'ProposalStatusRejected' }
      | { __typename: 'ProposalStatusExpired' }
      | { __typename: 'ProposalStatusCancelled' }
      | { __typename: 'ProposalStatusCanceledByRuntime' }
  }>
}

type ProposalStatusFields_ProposalStatusExpired_Fragment = {
  __typename: 'ProposalStatusExpired'
  proposalDecisionMadeEvent?: Types.Maybe<{
    id: string
    decisionStatus:
      | { __typename: 'ProposalStatusDormant' }
      | { __typename: 'ProposalStatusGracing' }
      | { __typename: 'ProposalStatusVetoed' }
      | { __typename: 'ProposalStatusSlashed' }
      | { __typename: 'ProposalStatusRejected' }
      | { __typename: 'ProposalStatusExpired' }
      | { __typename: 'ProposalStatusCancelled' }
      | { __typename: 'ProposalStatusCanceledByRuntime' }
  }>
}

type ProposalStatusFields_ProposalStatusCancelled_Fragment = {
  __typename: 'ProposalStatusCancelled'
  cancelledInEvent?: Types.Maybe<{ id: string }>
}

type ProposalStatusFields_ProposalStatusCanceledByRuntime_Fragment = {
  __typename: 'ProposalStatusCanceledByRuntime'
  proposalDecisionMadeEvent?: Types.Maybe<{
    id: string
    decisionStatus:
      | { __typename: 'ProposalStatusDormant' }
      | { __typename: 'ProposalStatusGracing' }
      | { __typename: 'ProposalStatusVetoed' }
      | { __typename: 'ProposalStatusSlashed' }
      | { __typename: 'ProposalStatusRejected' }
      | { __typename: 'ProposalStatusExpired' }
      | { __typename: 'ProposalStatusCancelled' }
      | { __typename: 'ProposalStatusCanceledByRuntime' }
  }>
}

export type ProposalStatusFieldsFragment =
  | ProposalStatusFields_ProposalStatusDeciding_Fragment
  | ProposalStatusFields_ProposalStatusGracing_Fragment
  | ProposalStatusFields_ProposalStatusDormant_Fragment
  | ProposalStatusFields_ProposalStatusVetoed_Fragment
  | ProposalStatusFields_ProposalStatusExecuted_Fragment
  | ProposalStatusFields_ProposalStatusExecutionFailed_Fragment
  | ProposalStatusFields_ProposalStatusSlashed_Fragment
  | ProposalStatusFields_ProposalStatusRejected_Fragment
  | ProposalStatusFields_ProposalStatusExpired_Fragment
  | ProposalStatusFields_ProposalStatusCancelled_Fragment
  | ProposalStatusFields_ProposalStatusCanceledByRuntime_Fragment

type ProposalDetailsFields_SignalProposalDetails_Fragment = { __typename: 'SignalProposalDetails'; text: string }

type ProposalDetailsFields_RuntimeUpgradeProposalDetails_Fragment = {
  __typename: 'RuntimeUpgradeProposalDetails'
  newRuntimeBytecode?: Types.Maybe<{ id: string; bytecode: any }>
}

type ProposalDetailsFields_FundingRequestProposalDetails_Fragment = {
  __typename: 'FundingRequestProposalDetails'
  destinationsList?: Types.Maybe<{ destinations: Array<{ amount: any; account: string }> }>
}

type ProposalDetailsFields_SetMaxValidatorCountProposalDetails_Fragment = {
  __typename: 'SetMaxValidatorCountProposalDetails'
  newMaxValidatorCount: number
}

type ProposalDetailsFields_CreateWorkingGroupLeadOpeningProposalDetails_Fragment = {
  __typename: 'CreateWorkingGroupLeadOpeningProposalDetails'
  stakeAmount: number
  unstakingPeriod: number
  rewardPerBlock: number
  metadata?: Types.Maybe<OpeningMetadataFieldsFragment>
  group?: Types.Maybe<{ id: string }>
}

type ProposalDetailsFields_FillWorkingGroupLeadOpeningProposalDetails_Fragment = {
  __typename: 'FillWorkingGroupLeadOpeningProposalDetails'
  opening?: Types.Maybe<{ id: string }>
  application?: Types.Maybe<{ id: string }>
}

type ProposalDetailsFields_UpdateWorkingGroupBudgetProposalDetails_Fragment = {
  __typename: 'UpdateWorkingGroupBudgetProposalDetails'
  amount: number
  group?: Types.Maybe<{ id: string }>
}

type ProposalDetailsFields_DecreaseWorkingGroupLeadStakeProposalDetails_Fragment = {
  __typename: 'DecreaseWorkingGroupLeadStakeProposalDetails'
  amount: number
  lead?: Types.Maybe<{ id: string }>
}

type ProposalDetailsFields_SlashWorkingGroupLeadProposalDetails_Fragment = {
  __typename: 'SlashWorkingGroupLeadProposalDetails'
  amount: number
  lead?: Types.Maybe<{ id: string }>
}

type ProposalDetailsFields_SetWorkingGroupLeadRewardProposalDetails_Fragment = {
  __typename: 'SetWorkingGroupLeadRewardProposalDetails'
  newRewardPerBlock: number
  lead?: Types.Maybe<{ id: string }>
}

type ProposalDetailsFields_TerminateWorkingGroupLeadProposalDetails_Fragment = {
  __typename: 'TerminateWorkingGroupLeadProposalDetails'
  slashingAmount?: Types.Maybe<number>
  lead?: Types.Maybe<{ id: string }>
}

type ProposalDetailsFields_AmendConstitutionProposalDetails_Fragment = {
  __typename: 'AmendConstitutionProposalDetails'
  text: string
}

type ProposalDetailsFields_CancelWorkingGroupLeadOpeningProposalDetails_Fragment = {
  __typename: 'CancelWorkingGroupLeadOpeningProposalDetails'
  opening?: Types.Maybe<{ id: string }>
}

type ProposalDetailsFields_SetMembershipPriceProposalDetails_Fragment = {
  __typename: 'SetMembershipPriceProposalDetails'
  newPrice: number
}

type ProposalDetailsFields_SetCouncilBudgetIncrementProposalDetails_Fragment = {
  __typename: 'SetCouncilBudgetIncrementProposalDetails'
  newAmount: number
}

type ProposalDetailsFields_SetCouncilorRewardProposalDetails_Fragment = {
  __typename: 'SetCouncilorRewardProposalDetails'
  newRewardPerBlock: number
}

type ProposalDetailsFields_SetInitialInvitationBalanceProposalDetails_Fragment = {
  __typename: 'SetInitialInvitationBalanceProposalDetails'
  newInitialInvitationBalance: number
}

type ProposalDetailsFields_SetInitialInvitationCountProposalDetails_Fragment = {
  __typename: 'SetInitialInvitationCountProposalDetails'
  newInitialInvitationsCount: number
}

type ProposalDetailsFields_SetMembershipLeadInvitationQuotaProposalDetails_Fragment = {
  __typename: 'SetMembershipLeadInvitationQuotaProposalDetails'
  newLeadInvitationQuota: number
}

type ProposalDetailsFields_SetReferralCutProposalDetails_Fragment = {
  __typename: 'SetReferralCutProposalDetails'
  newReferralCut: number
}

type ProposalDetailsFields_CreateBlogPostProposalDetails_Fragment = {
  __typename: 'CreateBlogPostProposalDetails'
  title: string
  body: string
}

type ProposalDetailsFields_EditBlogPostProposalDetails_Fragment = {
  __typename: 'EditBlogPostProposalDetails'
  blogPost: string
  newTitle?: Types.Maybe<string>
  newBody?: Types.Maybe<string>
}

type ProposalDetailsFields_LockBlogPostProposalDetails_Fragment = {
  __typename: 'LockBlogPostProposalDetails'
  blogPost: string
}

type ProposalDetailsFields_UnlockBlogPostProposalDetails_Fragment = {
  __typename: 'UnlockBlogPostProposalDetails'
  blogPost: string
}

type ProposalDetailsFields_VetoProposalDetails_Fragment = {
  __typename: 'VetoProposalDetails'
  proposal?: Types.Maybe<{ id: string }>
}

export type ProposalDetailsFieldsFragment =
  | ProposalDetailsFields_SignalProposalDetails_Fragment
  | ProposalDetailsFields_RuntimeUpgradeProposalDetails_Fragment
  | ProposalDetailsFields_FundingRequestProposalDetails_Fragment
  | ProposalDetailsFields_SetMaxValidatorCountProposalDetails_Fragment
  | ProposalDetailsFields_CreateWorkingGroupLeadOpeningProposalDetails_Fragment
  | ProposalDetailsFields_FillWorkingGroupLeadOpeningProposalDetails_Fragment
  | ProposalDetailsFields_UpdateWorkingGroupBudgetProposalDetails_Fragment
  | ProposalDetailsFields_DecreaseWorkingGroupLeadStakeProposalDetails_Fragment
  | ProposalDetailsFields_SlashWorkingGroupLeadProposalDetails_Fragment
  | ProposalDetailsFields_SetWorkingGroupLeadRewardProposalDetails_Fragment
  | ProposalDetailsFields_TerminateWorkingGroupLeadProposalDetails_Fragment
  | ProposalDetailsFields_AmendConstitutionProposalDetails_Fragment
  | ProposalDetailsFields_CancelWorkingGroupLeadOpeningProposalDetails_Fragment
  | ProposalDetailsFields_SetMembershipPriceProposalDetails_Fragment
  | ProposalDetailsFields_SetCouncilBudgetIncrementProposalDetails_Fragment
  | ProposalDetailsFields_SetCouncilorRewardProposalDetails_Fragment
  | ProposalDetailsFields_SetInitialInvitationBalanceProposalDetails_Fragment
  | ProposalDetailsFields_SetInitialInvitationCountProposalDetails_Fragment
  | ProposalDetailsFields_SetMembershipLeadInvitationQuotaProposalDetails_Fragment
  | ProposalDetailsFields_SetReferralCutProposalDetails_Fragment
  | ProposalDetailsFields_CreateBlogPostProposalDetails_Fragment
  | ProposalDetailsFields_EditBlogPostProposalDetails_Fragment
  | ProposalDetailsFields_LockBlogPostProposalDetails_Fragment
  | ProposalDetailsFields_UnlockBlogPostProposalDetails_Fragment
  | ProposalDetailsFields_VetoProposalDetails_Fragment

export type ProposalFieldsFragment = {
  id: string
  title: string
  description: string
  stakingAccount?: Types.Maybe<string>
  exactExecutionBlock?: Types.Maybe<number>
  councilApprovals: number
  statusSetAtBlock: number
  statusSetAtTime: any
  isFinalized?: Types.Maybe<boolean>
  details:
    | ProposalDetailsFields_SignalProposalDetails_Fragment
    | ProposalDetailsFields_RuntimeUpgradeProposalDetails_Fragment
    | ProposalDetailsFields_FundingRequestProposalDetails_Fragment
    | ProposalDetailsFields_SetMaxValidatorCountProposalDetails_Fragment
    | ProposalDetailsFields_CreateWorkingGroupLeadOpeningProposalDetails_Fragment
    | ProposalDetailsFields_FillWorkingGroupLeadOpeningProposalDetails_Fragment
    | ProposalDetailsFields_UpdateWorkingGroupBudgetProposalDetails_Fragment
    | ProposalDetailsFields_DecreaseWorkingGroupLeadStakeProposalDetails_Fragment
    | ProposalDetailsFields_SlashWorkingGroupLeadProposalDetails_Fragment
    | ProposalDetailsFields_SetWorkingGroupLeadRewardProposalDetails_Fragment
    | ProposalDetailsFields_TerminateWorkingGroupLeadProposalDetails_Fragment
    | ProposalDetailsFields_AmendConstitutionProposalDetails_Fragment
    | ProposalDetailsFields_CancelWorkingGroupLeadOpeningProposalDetails_Fragment
    | ProposalDetailsFields_SetMembershipPriceProposalDetails_Fragment
    | ProposalDetailsFields_SetCouncilBudgetIncrementProposalDetails_Fragment
    | ProposalDetailsFields_SetCouncilorRewardProposalDetails_Fragment
    | ProposalDetailsFields_SetInitialInvitationBalanceProposalDetails_Fragment
    | ProposalDetailsFields_SetInitialInvitationCountProposalDetails_Fragment
    | ProposalDetailsFields_SetMembershipLeadInvitationQuotaProposalDetails_Fragment
    | ProposalDetailsFields_SetReferralCutProposalDetails_Fragment
    | ProposalDetailsFields_CreateBlogPostProposalDetails_Fragment
    | ProposalDetailsFields_EditBlogPostProposalDetails_Fragment
    | ProposalDetailsFields_LockBlogPostProposalDetails_Fragment
    | ProposalDetailsFields_UnlockBlogPostProposalDetails_Fragment
    | ProposalDetailsFields_VetoProposalDetails_Fragment
  creator: { id: string }
  proposalStatusUpdates: Array<{
    id: string
    inBlock: number
    newStatus:
      | { __typename: 'ProposalStatusDeciding' }
      | { __typename: 'ProposalStatusGracing' }
      | { __typename: 'ProposalStatusDormant' }
  }>
  votes: Array<{ id: string }>
  status:
    | ProposalStatusFields_ProposalStatusDeciding_Fragment
    | ProposalStatusFields_ProposalStatusGracing_Fragment
    | ProposalStatusFields_ProposalStatusDormant_Fragment
    | ProposalStatusFields_ProposalStatusVetoed_Fragment
    | ProposalStatusFields_ProposalStatusExecuted_Fragment
    | ProposalStatusFields_ProposalStatusExecutionFailed_Fragment
    | ProposalStatusFields_ProposalStatusSlashed_Fragment
    | ProposalStatusFields_ProposalStatusRejected_Fragment
    | ProposalStatusFields_ProposalStatusExpired_Fragment
    | ProposalStatusFields_ProposalStatusCancelled_Fragment
    | ProposalStatusFields_ProposalStatusCanceledByRuntime_Fragment
  createdInEvent: { id: string; inBlock: number; inExtrinsic?: Types.Maybe<string> }
  discussionThread: {
    id: string
    mode:
      | ProposalDiscussionThreadModeFields_ProposalDiscussionThreadModeOpen_Fragment
      | ProposalDiscussionThreadModeFields_ProposalDiscussionThreadModeClosed_Fragment
  }
}

export type GetProposalsByIdsQueryVariables = Types.Exact<{
  ids?: Types.Maybe<Array<Types.Scalars['ID']> | Types.Scalars['ID']>
}>

export type GetProposalsByIdsQuery = { proposals: Array<ProposalFieldsFragment> }

type ProposalDiscussionThreadModeFields_ProposalDiscussionThreadModeOpen_Fragment = {
  __typename: 'ProposalDiscussionThreadModeOpen'
}

type ProposalDiscussionThreadModeFields_ProposalDiscussionThreadModeClosed_Fragment = {
  __typename: 'ProposalDiscussionThreadModeClosed'
  whitelist?: Types.Maybe<{ members: Array<{ id: string }> }>
}

export type ProposalDiscussionThreadModeFieldsFragment =
  | ProposalDiscussionThreadModeFields_ProposalDiscussionThreadModeOpen_Fragment
  | ProposalDiscussionThreadModeFields_ProposalDiscussionThreadModeClosed_Fragment

type ProposalDiscussionPostStatusFields_ProposalDiscussionPostStatusActive_Fragment = {
  __typename: 'ProposalDiscussionPostStatusActive'
}

type ProposalDiscussionPostStatusFields_ProposalDiscussionPostStatusLocked_Fragment = {
  __typename: 'ProposalDiscussionPostStatusLocked'
  deletedInEvent?: Types.Maybe<{ id: string }>
}

type ProposalDiscussionPostStatusFields_ProposalDiscussionPostStatusRemoved_Fragment = {
  __typename: 'ProposalDiscussionPostStatusRemoved'
  deletedInEvent?: Types.Maybe<{ id: string }>
}

export type ProposalDiscussionPostStatusFieldsFragment =
  | ProposalDiscussionPostStatusFields_ProposalDiscussionPostStatusActive_Fragment
  | ProposalDiscussionPostStatusFields_ProposalDiscussionPostStatusLocked_Fragment
  | ProposalDiscussionPostStatusFields_ProposalDiscussionPostStatusRemoved_Fragment

export type ProposalDiscussionThreadFieldsFragment = {
  id: string
  proposal: { id: string }
  posts: Array<{ id: string }>
  mode:
    | ProposalDiscussionThreadModeFields_ProposalDiscussionThreadModeOpen_Fragment
    | ProposalDiscussionThreadModeFields_ProposalDiscussionThreadModeClosed_Fragment
  modeChanges: Array<{ id: string }>
}

export type GetProposalDiscussionThreadsByIdsQueryVariables = Types.Exact<{
  ids?: Types.Maybe<Array<Types.Scalars['ID']> | Types.Scalars['ID']>
}>

export type GetProposalDiscussionThreadsByIdsQuery = {
  proposalDiscussionThreads: Array<ProposalDiscussionThreadFieldsFragment>
}

export type ProposalDiscussionPostFieldsFragment = {
  id: string
  isVisible: boolean
  text: string
  discussionThread: { id: string }
  author: { id: string }
  status:
    | ProposalDiscussionPostStatusFields_ProposalDiscussionPostStatusActive_Fragment
    | ProposalDiscussionPostStatusFields_ProposalDiscussionPostStatusLocked_Fragment
    | ProposalDiscussionPostStatusFields_ProposalDiscussionPostStatusRemoved_Fragment
  repliesTo?: Types.Maybe<{ id: string }>
  updates: Array<{ id: string }>
  createdInEvent: { id: string }
}

export type GetProposalDiscussionPostsByIdsQueryVariables = Types.Exact<{
  ids?: Types.Maybe<Array<Types.Scalars['ID']> | Types.Scalars['ID']>
}>

export type GetProposalDiscussionPostsByIdsQuery = {
  proposalDiscussionPosts: Array<ProposalDiscussionPostFieldsFragment>
}

export type ProposalDiscussionPostCreatedEventFieldsFragment = {
  id: string
  createdAt: any
  inExtrinsic?: Types.Maybe<string>
  inBlock: number
  network: Types.Network
  indexInBlock: number
  text: string
  post: { id: string }
}

export type GetProposalDiscussionPostCreatedEventsQueryVariables = Types.Exact<{
  eventIds?: Types.Maybe<Array<Types.Scalars['ID']> | Types.Scalars['ID']>
}>

export type GetProposalDiscussionPostCreatedEventsQuery = {
  proposalDiscussionPostCreatedEvents: Array<ProposalDiscussionPostCreatedEventFieldsFragment>
}

export type ProposalDiscussionPostUpdatedEventFieldsFragment = {
  id: string
  createdAt: any
  inExtrinsic?: Types.Maybe<string>
  inBlock: number
  network: Types.Network
  indexInBlock: number
  text: string
  post: { id: string }
}

export type GetProposalDiscussionPostUpdatedEventsQueryVariables = Types.Exact<{
  eventIds?: Types.Maybe<Array<Types.Scalars['ID']> | Types.Scalars['ID']>
}>

export type GetProposalDiscussionPostUpdatedEventsQuery = {
  proposalDiscussionPostUpdatedEvents: Array<ProposalDiscussionPostUpdatedEventFieldsFragment>
}

export type ProposalDiscussionThreadModeChangedEventFieldsFragment = {
  id: string
  createdAt: any
  inExtrinsic?: Types.Maybe<string>
  inBlock: number
  network: Types.Network
  indexInBlock: number
  thread: { id: string }
  newMode:
    | ProposalDiscussionThreadModeFields_ProposalDiscussionThreadModeOpen_Fragment
    | ProposalDiscussionThreadModeFields_ProposalDiscussionThreadModeClosed_Fragment
  actor: { id: string }
}

export type GetProposalDiscussionThreadModeChangedEventsQueryVariables = Types.Exact<{
  eventIds?: Types.Maybe<Array<Types.Scalars['ID']> | Types.Scalars['ID']>
}>

export type GetProposalDiscussionThreadModeChangedEventsQuery = {
  proposalDiscussionThreadModeChangedEvents: Array<ProposalDiscussionThreadModeChangedEventFieldsFragment>
}

export type ProposalDiscussionPostDeletedEventFieldsFragment = {
  id: string
  createdAt: any
  inExtrinsic?: Types.Maybe<string>
  inBlock: number
  network: Types.Network
  indexInBlock: number
  post: { id: string }
  actor: { id: string }
}

export type GetProposalDiscussionPostDeletedEventsQueryVariables = Types.Exact<{
  eventIds?: Types.Maybe<Array<Types.Scalars['ID']> | Types.Scalars['ID']>
}>

export type GetProposalDiscussionPostDeletedEventsQuery = {
  proposalDiscussionPostDeletedEvents: Array<ProposalDiscussionPostDeletedEventFieldsFragment>
}

export type ProposalCreatedEventFieldsFragment = {
  id: string
  createdAt: any
  inBlock: number
  network: Types.Network
  inExtrinsic?: Types.Maybe<string>
  indexInBlock: number
  proposal: { id: string }
}

export type GetProposalCreatedEventsByEventIdsQueryVariables = Types.Exact<{
  eventIds?: Types.Maybe<Array<Types.Scalars['ID']> | Types.Scalars['ID']>
}>

export type GetProposalCreatedEventsByEventIdsQuery = {
  proposalCreatedEvents: Array<ProposalCreatedEventFieldsFragment>
}

export type ProposalStatusUpdatedEventFieldsFragment = {
  id: string
  createdAt: any
  inBlock: number
  network: Types.Network
  inExtrinsic?: Types.Maybe<string>
  indexInBlock: number
  proposal: { id: string }
  newStatus:
    | { __typename: 'ProposalStatusDeciding' }
    | { __typename: 'ProposalStatusGracing' }
    | { __typename: 'ProposalStatusDormant' }
}

export type GetProposalStatusUpdatedEventsByEventIdsQueryVariables = Types.Exact<{
  eventIds?: Types.Maybe<Array<Types.Scalars['ID']> | Types.Scalars['ID']>
}>

export type GetProposalStatusUpdatedEventsByEventIdsQuery = {
  proposalStatusUpdatedEvents: Array<ProposalStatusUpdatedEventFieldsFragment>
}

export type ProposalDecisionMadeEventFieldsFragment = {
  id: string
  createdAt: any
  inBlock: number
  network: Types.Network
  inExtrinsic?: Types.Maybe<string>
  indexInBlock: number
  proposal: { id: string }
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

export type GetProposalDecisionMadeEventsByEventIdsQueryVariables = Types.Exact<{
  eventIds?: Types.Maybe<Array<Types.Scalars['ID']> | Types.Scalars['ID']>
}>

export type GetProposalDecisionMadeEventsByEventIdsQuery = {
  proposalDecisionMadeEvents: Array<ProposalDecisionMadeEventFieldsFragment>
}

export type ProposalExecutedEventFieldsFragment = {
  id: string
  createdAt: any
  inBlock: number
  network: Types.Network
  inExtrinsic?: Types.Maybe<string>
  indexInBlock: number
  proposal: { id: string }
  executionStatus: { errorMessage: string }
}

export type GetProposalExecutedEventsByEventIdsQueryVariables = Types.Exact<{
  eventIds?: Types.Maybe<Array<Types.Scalars['ID']> | Types.Scalars['ID']>
}>

export type GetProposalExecutedEventsByEventIdsQuery = {
  proposalExecutedEvents: Array<ProposalExecutedEventFieldsFragment>
}

export type ProposalVotedEventFieldsFragment = {
  id: string
  createdAt: any
  inBlock: number
  network: Types.Network
  inExtrinsic?: Types.Maybe<string>
  indexInBlock: number
  voteKind: Types.ProposalVoteKind
  rationale: string
  votingRound: number
  voter: { id: string }
  proposal: { id: string }
}

export type GetProposalVotedEventsByEventIdsQueryVariables = Types.Exact<{
  eventIds?: Types.Maybe<Array<Types.Scalars['ID']> | Types.Scalars['ID']>
}>

export type GetProposalVotedEventsByEventIdsQuery = { proposalVotedEvents: Array<ProposalVotedEventFieldsFragment> }

export type ProposalCancelledEventFieldsFragment = {
  id: string
  createdAt: any
  inBlock: number
  network: Types.Network
  inExtrinsic?: Types.Maybe<string>
  indexInBlock: number
  proposal: { id: string }
}

export type GetProposalCancelledEventsByEventIdsQueryVariables = Types.Exact<{
  eventIds?: Types.Maybe<Array<Types.Scalars['ID']> | Types.Scalars['ID']>
}>

export type GetProposalCancelledEventsByEventIdsQuery = {
  proposalCancelledEvents: Array<ProposalCancelledEventFieldsFragment>
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
  storage?: Types.Maybe<string>
  rewardPerBlock: any
  missingRewardAmount?: Types.Maybe<any>
  group: { name: string }
  membership: { id: string }
  status:
    | { __typename: 'WorkerStatusActive' }
    | { __typename: 'WorkerStatusLeaving'; workerStartedLeavingEvent?: Types.Maybe<{ id: string }> }
    | {
        __typename: 'WorkerStatusLeft'
        workerStartedLeavingEvent?: Types.Maybe<{ id: string }>
        workerExitedEvent?: Types.Maybe<{ id: string }>
      }
    | { __typename: 'WorkerStatusTerminated'; terminatedWorkerEvent?: Types.Maybe<{ id: string }> }
  payouts: Array<{ id: string }>
  slashes: Array<{ id: string }>
  entry: { id: string }
  application: ApplicationBasicFieldsFragment
}

export type WorkingGroupMetadataFieldsFragment = {
  id: string
  status?: Types.Maybe<string>
  statusMessage?: Types.Maybe<string>
  about?: Types.Maybe<string>
  description?: Types.Maybe<string>
  setInEvent: { id: string }
}

export type OpeningFieldsFragment = {
  id: string
  runtimeId: number
  type: Types.WorkingGroupOpeningType
  stakeAmount: any
  unstakingPeriod: number
  rewardPerBlock: any
  group: { name: string }
  applications: Array<ApplicationBasicFieldsFragment>
  status:
    | OpeningStatusFields_OpeningStatusOpen_Fragment
    | OpeningStatusFields_OpeningStatusFilled_Fragment
    | OpeningStatusFields_OpeningStatusCancelled_Fragment
  metadata: OpeningMetadataFieldsFragment
  createdInEvent: { id: string }
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
  roleAccount: string
  rewardAccount: string
  stakingAccount: string
  stake: any
  createdInEvent: { id: string }
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
  createdAt: any
  inBlock: number
  network: Types.Network
  inExtrinsic?: Types.Maybe<string>
  indexInBlock: number
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
  createdAt: any
  inBlock: number
  network: Types.Network
  inExtrinsic?: Types.Maybe<string>
  indexInBlock: number
  group: { name: string }
  opening: { id: string; runtimeId: number }
}

export type GetOpeningAddedEventsByEventIdsQueryVariables = Types.Exact<{
  eventIds?: Types.Maybe<Array<Types.Scalars['ID']> | Types.Scalars['ID']>
}>

export type GetOpeningAddedEventsByEventIdsQuery = { openingAddedEvents: Array<OpeningAddedEventFieldsFragment> }

export type LeaderSetEventFieldsFragment = {
  id: string
  createdAt: any
  inBlock: number
  network: Types.Network
  inExtrinsic?: Types.Maybe<string>
  indexInBlock: number
  group: { name: string }
  worker?: Types.Maybe<{ id: string; runtimeId: number }>
}

export type GetLeaderSetEventsByEventIdsQueryVariables = Types.Exact<{
  eventIds?: Types.Maybe<Array<Types.Scalars['ID']> | Types.Scalars['ID']>
}>

export type GetLeaderSetEventsByEventIdsQuery = { leaderSetEvents: Array<LeaderSetEventFieldsFragment> }

export type OpeningFilledEventFieldsFragment = {
  id: string
  createdAt: any
  inBlock: number
  network: Types.Network
  inExtrinsic?: Types.Maybe<string>
  indexInBlock: number
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
  createdAt: any
  inBlock: number
  network: Types.Network
  inExtrinsic?: Types.Maybe<string>
  indexInBlock: number
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
  createdAt: any
  inBlock: number
  network: Types.Network
  inExtrinsic?: Types.Maybe<string>
  indexInBlock: number
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
  createdAt: any
  inBlock: number
  network: Types.Network
  inExtrinsic?: Types.Maybe<string>
  indexInBlock: number
  metadata?: Types.Maybe<string>
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
  createdAt: any
  inBlock: number
  network: Types.Network
  inExtrinsic?: Types.Maybe<string>
  indexInBlock: number
  newRoleAccount: string
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
  createdAt: any
  inBlock: number
  network: Types.Network
  inExtrinsic?: Types.Maybe<string>
  indexInBlock: number
  newRewardAccount: string
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
  createdAt: any
  inBlock: number
  network: Types.Network
  inExtrinsic?: Types.Maybe<string>
  indexInBlock: number
  amount: any
  group: { name: string }
  worker: { id: string; runtimeId: number }
}

export type GetStakeIncreasedEventsByEventIdsQueryVariables = Types.Exact<{
  eventIds?: Types.Maybe<Array<Types.Scalars['ID']> | Types.Scalars['ID']>
}>

export type GetStakeIncreasedEventsByEventIdsQuery = { stakeIncreasedEvents: Array<StakeIncreasedEventFieldsFragment> }

export type WorkerStartedLeavingEventFieldsFragment = {
  id: string
  createdAt: any
  inBlock: number
  network: Types.Network
  inExtrinsic?: Types.Maybe<string>
  indexInBlock: number
  rationale?: Types.Maybe<string>
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
  createdAt: any
  inBlock: number
  network: Types.Network
  inExtrinsic?: Types.Maybe<string>
  indexInBlock: number
  newRewardPerBlock: any
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
  createdAt: any
  inBlock: number
  network: Types.Network
  inExtrinsic?: Types.Maybe<string>
  indexInBlock: number
  requestedAmount: any
  slashedAmount: any
  rationale?: Types.Maybe<string>
  group: { name: string }
  worker: { id: string; runtimeId: number }
}

export type GetStakeSlashedEventsByEventIdsQueryVariables = Types.Exact<{
  eventIds?: Types.Maybe<Array<Types.Scalars['ID']> | Types.Scalars['ID']>
}>

export type GetStakeSlashedEventsByEventIdsQuery = { stakeSlashedEvents: Array<StakeSlashedEventFieldsFragment> }

export type StakeDecreasedEventFieldsFragment = {
  id: string
  createdAt: any
  inBlock: number
  network: Types.Network
  inExtrinsic?: Types.Maybe<string>
  indexInBlock: number
  amount: any
  group: { name: string }
  worker: { id: string; runtimeId: number }
}

export type GetStakeDecreasedEventsByEventIdsQueryVariables = Types.Exact<{
  eventIds?: Types.Maybe<Array<Types.Scalars['ID']> | Types.Scalars['ID']>
}>

export type GetStakeDecreasedEventsByEventIdsQuery = { stakeDecreasedEvents: Array<StakeDecreasedEventFieldsFragment> }

export type TerminatedWorkerEventFieldsFragment = {
  id: string
  createdAt: any
  inBlock: number
  network: Types.Network
  inExtrinsic?: Types.Maybe<string>
  indexInBlock: number
  penalty?: Types.Maybe<any>
  rationale?: Types.Maybe<string>
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
  createdAt: any
  inBlock: number
  network: Types.Network
  inExtrinsic?: Types.Maybe<string>
  indexInBlock: number
  penalty?: Types.Maybe<any>
  rationale?: Types.Maybe<string>
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
  createdAt: any
  inBlock: number
  network: Types.Network
  inExtrinsic?: Types.Maybe<string>
  indexInBlock: number
  group: { name: string }
  leader: { id: string; runtimeId: number }
}

export type GetLeaderUnsetEventsByEventIdsQueryVariables = Types.Exact<{
  eventIds?: Types.Maybe<Array<Types.Scalars['ID']> | Types.Scalars['ID']>
}>

export type GetLeaderUnsetEventsByEventIdsQuery = { leaderUnsetEvents: Array<LeaderUnsetEventFieldsFragment> }

export type BudgetSetEventFieldsFragment = {
  id: string
  createdAt: any
  inBlock: number
  network: Types.Network
  inExtrinsic?: Types.Maybe<string>
  indexInBlock: number
  newBudget: any
  group: { name: string }
}

export type GetBudgetSetEventsByEventIdsQueryVariables = Types.Exact<{
  eventIds?: Types.Maybe<Array<Types.Scalars['ID']> | Types.Scalars['ID']>
}>

export type GetBudgetSetEventsByEventIdsQuery = { budgetSetEvents: Array<BudgetSetEventFieldsFragment> }

export type BudgetSpendingEventFieldsFragment = {
  id: string
  createdAt: any
  inBlock: number
  network: Types.Network
  inExtrinsic?: Types.Maybe<string>
  indexInBlock: number
  reciever: string
  amount: any
  rationale?: Types.Maybe<string>
  group: { name: string }
}

export type GetBudgetSpendingEventsByEventIdsQueryVariables = Types.Exact<{
  eventIds?: Types.Maybe<Array<Types.Scalars['ID']> | Types.Scalars['ID']>
}>

export type GetBudgetSpendingEventsByEventIdsQuery = { budgetSpendingEvents: Array<BudgetSpendingEventFieldsFragment> }

export const DataObjectTypeFields = gql`
  fragment DataObjectTypeFields on DataObjectType {
    __typename
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
    ... on DataObjectTypeVideoThumbnail {
      video {
        id
      }
    }
    ... on DataObjectTypeVideoMedia {
      video {
        id
      }
    }
  }
`
export const StorageDataObjectFields = gql`
  fragment StorageDataObjectFields on StorageDataObject {
    id
    ipfsHash
    isAccepted
    size
    type {
      ...DataObjectTypeFields
    }
    deletionPrize
    unsetAt
    storageBagId
  }
  ${DataObjectTypeFields}
`
export const ChannelFields = gql`
  fragment ChannelFields on Channel {
    id
    activeVideosCounter
    title
    description
    isPublic
    language {
      iso
    }
    rewardAccount
    isCensored
    ownerMember {
      id
    }
    ownerCuratorGroup {
      id
    }
    category {
      name
    }
    avatarPhoto {
      ...StorageDataObjectFields
    }
    coverPhoto {
      ...StorageDataObjectFields
    }
  }
  ${StorageDataObjectFields}
`
export const ChannelCategoryFields = gql`
  fragment ChannelCategoryFields on ChannelCategory {
    id
    activeVideosCounter
  }
`
export const VideoCategoryFields = gql`
  fragment VideoCategoryFields on VideoCategory {
    id
    activeVideosCounter
  }
`
export const OwnedNftFields = gql`
  fragment OwnedNftFields on OwnedNft {
    id
    video {
      id
    }
    ownerMember {
      id
    }
    metadata
    transactionalStatus {
      __typename
    }
    creatorRoyalty
  }
`
export const CouncilMemberFields = gql`
  fragment CouncilMemberFields on CouncilMember {
    id
    member {
      id
    }
  }
`
export const ElectedCouncilFields = gql`
  fragment ElectedCouncilFields on ElectedCouncil {
    councilMembers {
      ...CouncilMemberFields
    }
  }
  ${CouncilMemberFields}
`
export const CandidateFields = gql`
  fragment CandidateFields on Candidate {
    id
    member {
      id
    }
  }
`
export const ForumCategoryFields = gql`
  fragment ForumCategoryFields on ForumCategory {
    id
    createdAt
    updatedAt
    parent {
      id
    }
    title
    description
    threads {
      id
      isSticky
    }
    moderators {
      id
    }
    createdInEvent {
      id
    }
    status {
      __typename
      ... on CategoryStatusArchived {
        categoryArchivalStatusUpdatedEvent {
          id
        }
      }
      ... on CategoryStatusRemoved {
        categoryDeletedEvent {
          id
        }
      }
    }
  }
`
export const ForumPostFields = gql`
  fragment ForumPostFields on ForumPost {
    id
    createdAt
    updatedAt
    text
    author {
      id
    }
    thread {
      id
    }
    repliesTo {
      id
    }
    text
    status {
      __typename
      ... on PostStatusLocked {
        postDeletedEvent {
          id
        }
      }
      ... on PostStatusModerated {
        postModeratedEvent {
          id
        }
      }
      ... on PostStatusRemoved {
        postDeletedEvent {
          id
        }
      }
    }
    isVisible
    origin {
      __typename
      ... on PostOriginThreadInitial {
        threadCreatedEvent {
          id
        }
      }
      ... on PostOriginThreadReply {
        postAddedEvent {
          id
        }
      }
    }
    edits {
      id
    }
    reactions {
      id
      member {
        id
      }
      reaction
    }
  }
`
export const ForumThreadWithInitialPost = gql`
  fragment ForumThreadWithInitialPost on ForumThread {
    id
    createdAt
    updatedAt
    author {
      id
    }
    category {
      id
    }
    title
    initialPost {
      ...ForumPostFields
    }
    poll {
      description
      endTime
      pollAlternatives {
        index
        text
        votes {
          votingMember {
            id
          }
        }
      }
    }
    isSticky
    createdInEvent {
      id
      title
      text
    }
    status {
      __typename
      ... on ThreadStatusLocked {
        threadDeletedEvent {
          id
        }
      }
      ... on ThreadStatusModerated {
        threadModeratedEvent {
          id
        }
      }
      ... on ThreadStatusRemoved {
        threadDeletedEvent {
          id
        }
      }
    }
    isVisible
    metadataUpdates {
      id
    }
    movedInEvents {
      id
    }
    tags {
      id
    }
  }
  ${ForumPostFields}
`
export const CategoryCreatedEventFields = gql`
  fragment CategoryCreatedEventFields on CategoryCreatedEvent {
    id
    createdAt
    inBlock
    network
    inExtrinsic
    indexInBlock
    category {
      id
    }
  }
`
export const CategoryArchivalStatusUpdatedEventFields = gql`
  fragment CategoryArchivalStatusUpdatedEventFields on CategoryArchivalStatusUpdatedEvent {
    id
    createdAt
    inBlock
    network
    inExtrinsic
    indexInBlock
    category {
      id
    }
    newArchivalStatus
    actor {
      id
    }
  }
`
export const CategoryDeletedEventFields = gql`
  fragment CategoryDeletedEventFields on CategoryDeletedEvent {
    id
    createdAt
    inBlock
    network
    inExtrinsic
    indexInBlock
    category {
      id
    }
    actor {
      id
    }
  }
`
export const ThreadCreatedEventFields = gql`
  fragment ThreadCreatedEventFields on ThreadCreatedEvent {
    id
    createdAt
    inBlock
    network
    inExtrinsic
    indexInBlock
    title
    text
    thread {
      id
    }
  }
`
export const ThreadMetadataUpdatedEventFields = gql`
  fragment ThreadMetadataUpdatedEventFields on ThreadMetadataUpdatedEvent {
    id
    createdAt
    inBlock
    network
    inExtrinsic
    indexInBlock
    thread {
      id
    }
    newTitle
  }
`
export const VoteOnPollEventFields = gql`
  fragment VoteOnPollEventFields on VoteOnPollEvent {
    id
    createdAt
    inBlock
    network
    inExtrinsic
    indexInBlock
    pollAlternative {
      id
      index
      text
      poll {
        thread {
          id
        }
      }
    }
    votingMember {
      id
    }
  }
`
export const ThreadDeletedEventFields = gql`
  fragment ThreadDeletedEventFields on ThreadDeletedEvent {
    id
    createdAt
    inBlock
    network
    inExtrinsic
    indexInBlock
    thread {
      id
    }
  }
`
export const PostAddedEventFields = gql`
  fragment PostAddedEventFields on PostAddedEvent {
    id
    createdAt
    inBlock
    network
    inExtrinsic
    indexInBlock
    post {
      id
    }
    isEditable
    text
  }
`
export const ThreadMovedEventFields = gql`
  fragment ThreadMovedEventFields on ThreadMovedEvent {
    id
    createdAt
    inBlock
    network
    inExtrinsic
    indexInBlock
    thread {
      id
    }
    oldCategory {
      id
    }
    newCategory {
      id
    }
    actor {
      id
    }
  }
`
export const CategoryStickyThreadUpdateEventFields = gql`
  fragment CategoryStickyThreadUpdateEventFields on CategoryStickyThreadUpdateEvent {
    id
    createdAt
    inBlock
    network
    inExtrinsic
    indexInBlock
    category {
      id
    }
    newStickyThreads {
      id
    }
    actor {
      id
    }
  }
`
export const CategoryMembershipOfModeratorUpdatedEventFields = gql`
  fragment CategoryMembershipOfModeratorUpdatedEventFields on CategoryMembershipOfModeratorUpdatedEvent {
    id
    createdAt
    inBlock
    network
    inExtrinsic
    indexInBlock
    category {
      id
    }
    moderator {
      id
    }
    newCanModerateValue
  }
`
export const ThreadModeratedEventFields = gql`
  fragment ThreadModeratedEventFields on ThreadModeratedEvent {
    id
    createdAt
    inBlock
    network
    inExtrinsic
    indexInBlock
    thread {
      id
    }
    rationale
    actor {
      id
    }
  }
`
export const PostModeratedEventFields = gql`
  fragment PostModeratedEventFields on PostModeratedEvent {
    id
    createdAt
    inBlock
    network
    inExtrinsic
    indexInBlock
    post {
      id
    }
    rationale
    actor {
      id
    }
  }
`
export const PostReactedEventFields = gql`
  fragment PostReactedEventFields on PostReactedEvent {
    id
    createdAt
    inBlock
    network
    inExtrinsic
    indexInBlock
    post {
      id
    }
    reactionResult {
      __typename
      ... on PostReactionResultValid {
        reaction
        reactionId
      }
      ... on PostReactionResultInvalid {
        reactionId
      }
    }
    reactingMember {
      id
    }
  }
`
export const PostTextUpdatedEventFields = gql`
  fragment PostTextUpdatedEventFields on PostTextUpdatedEvent {
    id
    createdAt
    inBlock
    network
    inExtrinsic
    indexInBlock
    post {
      id
    }
    newText
  }
`
export const PostDeletedEventFields = gql`
  fragment PostDeletedEventFields on PostDeletedEvent {
    id
    createdAt
    inBlock
    network
    inExtrinsic
    indexInBlock
    posts {
      id
    }
    actor {
      id
    }
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
    controllerAccount
    rootAccount
    entry {
      __typename
      ... on MembershipEntryPaid {
        membershipBoughtEvent {
          id
        }
      }
      ... on MembershipEntryInvited {
        memberInvitedEvent {
          id
        }
      }
    }
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
`
export const MembershipSystemSnapshotFields = gql`
  fragment MembershipSystemSnapshotFields on MembershipSystemSnapshot {
    createdAt
    snapshotBlock
    referralCut
    invitedInitialBalance
    defaultInviteCount
    membershipPrice
  }
`
export const MembershipBoughtEventFields = gql`
  fragment MembershipBoughtEventFields on MembershipBoughtEvent {
    id
    createdAt
    inBlock
    network
    inExtrinsic
    indexInBlock
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
  ${MemberMetadataFields}
`
export const MemberProfileUpdatedEventFields = gql`
  fragment MemberProfileUpdatedEventFields on MemberProfileUpdatedEvent {
    id
    createdAt
    inBlock
    network
    inExtrinsic
    indexInBlock
    member {
      id
    }
    newHandle
    newMetadata {
      name
      about
    }
  }
`
export const MemberAccountsUpdatedEventFields = gql`
  fragment MemberAccountsUpdatedEventFields on MemberAccountsUpdatedEvent {
    id
    createdAt
    inBlock
    network
    inExtrinsic
    indexInBlock
    member {
      id
    }
    newRootAccount
    newControllerAccount
  }
`
export const MemberInvitedEventFields = gql`
  fragment MemberInvitedEventFields on MemberInvitedEvent {
    id
    createdAt
    inBlock
    network
    inExtrinsic
    indexInBlock
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
  ${MemberMetadataFields}
`
export const InvitesTransferredEventFields = gql`
  fragment InvitesTransferredEventFields on InvitesTransferredEvent {
    id
    createdAt
    inBlock
    network
    inExtrinsic
    indexInBlock
    sourceMember {
      id
    }
    targetMember {
      id
    }
    numberOfInvites
  }
`
export const StakingAccountAddedEventFields = gql`
  fragment StakingAccountAddedEventFields on StakingAccountAddedEvent {
    id
    createdAt
    inBlock
    network
    inExtrinsic
    indexInBlock
    member {
      id
    }
    account
  }
`
export const StakingAccountConfirmedEventFields = gql`
  fragment StakingAccountConfirmedEventFields on StakingAccountConfirmedEvent {
    id
    createdAt
    inBlock
    network
    inExtrinsic
    indexInBlock
    member {
      id
    }
    account
  }
`
export const StakingAccountRemovedEventFields = gql`
  fragment StakingAccountRemovedEventFields on StakingAccountRemovedEvent {
    id
    createdAt
    inBlock
    network
    inExtrinsic
    indexInBlock
    member {
      id
    }
    account
  }
`
export const ReferralCutUpdatedEventFields = gql`
  fragment ReferralCutUpdatedEventFields on ReferralCutUpdatedEvent {
    id
    createdAt
    inBlock
    network
    inExtrinsic
    indexInBlock
    newValue
  }
`
export const MembershipPriceUpdatedEventFields = gql`
  fragment MembershipPriceUpdatedEventFields on MembershipPriceUpdatedEvent {
    id
    createdAt
    inBlock
    network
    inExtrinsic
    indexInBlock
    newPrice
  }
`
export const InitialInvitationBalanceUpdatedEventFields = gql`
  fragment InitialInvitationBalanceUpdatedEventFields on InitialInvitationBalanceUpdatedEvent {
    id
    createdAt
    inBlock
    network
    inExtrinsic
    indexInBlock
    newInitialBalance
  }
`
export const InitialInvitationCountUpdatedEventFields = gql`
  fragment InitialInvitationCountUpdatedEventFields on InitialInvitationCountUpdatedEvent {
    id
    createdAt
    inBlock
    network
    inExtrinsic
    indexInBlock
    newInitialInvitationCount
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
export const ProposalDetailsFields = gql`
  fragment ProposalDetailsFields on ProposalDetails {
    __typename
    ... on SignalProposalDetails {
      text
    }
    ... on RuntimeUpgradeProposalDetails {
      newRuntimeBytecode {
        id
        bytecode
      }
    }
    ... on FundingRequestProposalDetails {
      destinationsList {
        destinations {
          amount
          account
        }
      }
    }
    ... on SetMaxValidatorCountProposalDetails {
      newMaxValidatorCount
    }
    ... on CreateWorkingGroupLeadOpeningProposalDetails {
      metadata {
        ...OpeningMetadataFields
      }
      stakeAmount
      unstakingPeriod
      rewardPerBlock
      group {
        id
      }
    }
    ... on FillWorkingGroupLeadOpeningProposalDetails {
      opening {
        id
      }
      application {
        id
      }
    }
    ... on UpdateWorkingGroupBudgetProposalDetails {
      amount
      group {
        id
      }
    }
    ... on DecreaseWorkingGroupLeadStakeProposalDetails {
      lead {
        id
      }
      amount
    }
    ... on SlashWorkingGroupLeadProposalDetails {
      lead {
        id
      }
      amount
    }
    ... on SetWorkingGroupLeadRewardProposalDetails {
      lead {
        id
      }
      newRewardPerBlock
    }
    ... on TerminateWorkingGroupLeadProposalDetails {
      lead {
        id
      }
      slashingAmount
    }
    ... on AmendConstitutionProposalDetails {
      text
    }
    ... on CancelWorkingGroupLeadOpeningProposalDetails {
      opening {
        id
      }
    }
    ... on SetMembershipPriceProposalDetails {
      newPrice
    }
    ... on SetCouncilBudgetIncrementProposalDetails {
      newAmount
    }
    ... on SetCouncilorRewardProposalDetails {
      newRewardPerBlock
    }
    ... on SetInitialInvitationBalanceProposalDetails {
      newInitialInvitationBalance
    }
    ... on SetInitialInvitationCountProposalDetails {
      newInitialInvitationsCount
    }
    ... on SetMembershipLeadInvitationQuotaProposalDetails {
      newLeadInvitationQuota
    }
    ... on SetReferralCutProposalDetails {
      newReferralCut
    }
    ... on SetReferralCutProposalDetails {
      newReferralCut
    }
    ... on CreateBlogPostProposalDetails {
      title
      body
    }
    ... on EditBlogPostProposalDetails {
      blogPost
      newTitle
      newBody
    }
    ... on LockBlogPostProposalDetails {
      blogPost
    }
    ... on UnlockBlogPostProposalDetails {
      blogPost
    }
    ... on VetoProposalDetails {
      proposal {
        id
      }
    }
  }
  ${OpeningMetadataFields}
`
export const ProposalStatusFields = gql`
  fragment ProposalStatusFields on ProposalStatus {
    __typename
    ... on ProposalStatusDeciding {
      proposalStatusUpdatedEvent {
        id
        newStatus {
          __typename
        }
      }
    }
    ... on ProposalStatusGracing {
      proposalStatusUpdatedEvent {
        id
        newStatus {
          __typename
        }
      }
    }
    ... on ProposalStatusDormant {
      proposalStatusUpdatedEvent {
        id
        newStatus {
          __typename
        }
      }
    }
    ... on ProposalStatusVetoed {
      proposalDecisionMadeEvent {
        id
        decisionStatus {
          __typename
        }
      }
    }
    ... on ProposalStatusExecuted {
      proposalExecutedEvent {
        id
        executionStatus {
          __typename
        }
      }
    }
    ... on ProposalStatusExecutionFailed {
      proposalExecutedEvent {
        id
        executionStatus {
          __typename
        }
      }
      errorMessage
    }
    ... on ProposalStatusSlashed {
      proposalDecisionMadeEvent {
        id
        decisionStatus {
          __typename
        }
      }
    }
    ... on ProposalStatusRejected {
      proposalDecisionMadeEvent {
        id
        decisionStatus {
          __typename
        }
      }
    }
    ... on ProposalStatusExpired {
      proposalDecisionMadeEvent {
        id
        decisionStatus {
          __typename
        }
      }
    }
    ... on ProposalStatusCancelled {
      cancelledInEvent {
        id
      }
    }
    ... on ProposalStatusCanceledByRuntime {
      proposalDecisionMadeEvent {
        id
        decisionStatus {
          __typename
        }
      }
    }
  }
`
export const ProposalDiscussionThreadModeFields = gql`
  fragment ProposalDiscussionThreadModeFields on ProposalDiscussionThreadMode {
    __typename
    ... on ProposalDiscussionThreadModeClosed {
      whitelist {
        members {
          id
        }
      }
    }
  }
`
export const ProposalFields = gql`
  fragment ProposalFields on Proposal {
    id
    title
    description
    details {
      ...ProposalDetailsFields
    }
    stakingAccount
    creator {
      id
    }
    exactExecutionBlock
    councilApprovals
    proposalStatusUpdates {
      id
      inBlock
      newStatus {
        __typename
      }
    }
    votes {
      id
    }
    status {
      ...ProposalStatusFields
    }
    statusSetAtBlock
    statusSetAtTime
    isFinalized
    createdInEvent {
      id
      inBlock
      inExtrinsic
    }
    discussionThread {
      id
      mode {
        ...ProposalDiscussionThreadModeFields
      }
    }
  }
  ${ProposalDetailsFields}
  ${ProposalStatusFields}
  ${ProposalDiscussionThreadModeFields}
`
export const ProposalDiscussionThreadFields = gql`
  fragment ProposalDiscussionThreadFields on ProposalDiscussionThread {
    id
    proposal {
      id
    }
    posts {
      id
    }
    mode {
      ...ProposalDiscussionThreadModeFields
    }
    modeChanges {
      id
    }
  }
  ${ProposalDiscussionThreadModeFields}
`
export const ProposalDiscussionPostStatusFields = gql`
  fragment ProposalDiscussionPostStatusFields on ProposalDiscussionPostStatus {
    __typename
    ... on ProposalDiscussionPostStatusLocked {
      deletedInEvent {
        id
      }
    }
    ... on ProposalDiscussionPostStatusRemoved {
      deletedInEvent {
        id
      }
    }
  }
`
export const ProposalDiscussionPostFields = gql`
  fragment ProposalDiscussionPostFields on ProposalDiscussionPost {
    id
    discussionThread {
      id
    }
    author {
      id
    }
    status {
      ...ProposalDiscussionPostStatusFields
    }
    isVisible
    text
    repliesTo {
      id
    }
    updates {
      id
    }
    createdInEvent {
      id
    }
  }
  ${ProposalDiscussionPostStatusFields}
`
export const ProposalDiscussionPostCreatedEventFields = gql`
  fragment ProposalDiscussionPostCreatedEventFields on ProposalDiscussionPostCreatedEvent {
    id
    createdAt
    inExtrinsic
    inBlock
    network
    indexInBlock
    post {
      id
    }
    text
  }
`
export const ProposalDiscussionPostUpdatedEventFields = gql`
  fragment ProposalDiscussionPostUpdatedEventFields on ProposalDiscussionPostUpdatedEvent {
    id
    createdAt
    inExtrinsic
    inBlock
    network
    indexInBlock
    post {
      id
    }
    text
  }
`
export const ProposalDiscussionThreadModeChangedEventFields = gql`
  fragment ProposalDiscussionThreadModeChangedEventFields on ProposalDiscussionThreadModeChangedEvent {
    id
    createdAt
    inExtrinsic
    inBlock
    network
    indexInBlock
    thread {
      id
    }
    newMode {
      ...ProposalDiscussionThreadModeFields
    }
    actor {
      id
    }
  }
  ${ProposalDiscussionThreadModeFields}
`
export const ProposalDiscussionPostDeletedEventFields = gql`
  fragment ProposalDiscussionPostDeletedEventFields on ProposalDiscussionPostDeletedEvent {
    id
    createdAt
    inExtrinsic
    inBlock
    network
    indexInBlock
    post {
      id
    }
    actor {
      id
    }
  }
`
export const ProposalCreatedEventFields = gql`
  fragment ProposalCreatedEventFields on ProposalCreatedEvent {
    id
    createdAt
    inBlock
    network
    inExtrinsic
    indexInBlock
    proposal {
      id
    }
  }
`
export const ProposalStatusUpdatedEventFields = gql`
  fragment ProposalStatusUpdatedEventFields on ProposalStatusUpdatedEvent {
    id
    createdAt
    inBlock
    network
    inExtrinsic
    indexInBlock
    proposal {
      id
    }
    newStatus {
      __typename
    }
  }
`
export const ProposalDecisionMadeEventFields = gql`
  fragment ProposalDecisionMadeEventFields on ProposalDecisionMadeEvent {
    id
    createdAt
    inBlock
    network
    inExtrinsic
    indexInBlock
    proposal {
      id
    }
    decisionStatus {
      __typename
    }
  }
`
export const ProposalExecutedEventFields = gql`
  fragment ProposalExecutedEventFields on ProposalExecutedEvent {
    id
    createdAt
    inBlock
    network
    inExtrinsic
    indexInBlock
    proposal {
      id
    }
    executionStatus {
      ... on ProposalStatusExecutionFailed {
        errorMessage
      }
    }
  }
`
export const ProposalVotedEventFields = gql`
  fragment ProposalVotedEventFields on ProposalVotedEvent {
    id
    createdAt
    inBlock
    network
    inExtrinsic
    indexInBlock
    voter {
      id
    }
    voteKind
    proposal {
      id
    }
    rationale
    votingRound
  }
`
export const ProposalCancelledEventFields = gql`
  fragment ProposalCancelledEventFields on ProposalCancelledEvent {
    id
    createdAt
    inBlock
    network
    inExtrinsic
    indexInBlock
    proposal {
      id
    }
  }
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
    createdInEvent {
      id
    }
  }
  ${ApplicationBasicFields}
  ${OpeningStatusFields}
  ${OpeningMetadataFields}
`
export const ApplicationFields = gql`
  fragment ApplicationFields on WorkingGroupApplication {
    ...ApplicationBasicFields
    createdInEvent {
      id
    }
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
`
export const WorkingGroupMetadataFields = gql`
  fragment WorkingGroupMetadataFields on WorkingGroupMetadata {
    id
    status
    statusMessage
    about
    description
    setInEvent {
      id
    }
  }
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
    createdInEvent {
      id
    }
    createdAt
  }
  ${OpeningMetadataFields}
`
export const AppliedOnOpeningEventFields = gql`
  fragment AppliedOnOpeningEventFields on AppliedOnOpeningEvent {
    id
    createdAt
    inBlock
    network
    inExtrinsic
    indexInBlock
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
`
export const OpeningAddedEventFields = gql`
  fragment OpeningAddedEventFields on OpeningAddedEvent {
    id
    createdAt
    inBlock
    network
    inExtrinsic
    indexInBlock
    group {
      name
    }
    opening {
      id
      runtimeId
    }
  }
`
export const LeaderSetEventFields = gql`
  fragment LeaderSetEventFields on LeaderSetEvent {
    id
    createdAt
    inBlock
    network
    inExtrinsic
    indexInBlock
    group {
      name
    }
    worker {
      id
      runtimeId
    }
  }
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
      ... on WorkerStatusLeaving {
        workerStartedLeavingEvent {
          id
        }
      }
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
    entry {
      id
    }
    application {
      ...ApplicationBasicFields
    }
    storage
    rewardPerBlock
    missingRewardAmount
  }
  ${ApplicationBasicFields}
`
export const OpeningFilledEventFields = gql`
  fragment OpeningFilledEventFields on OpeningFilledEvent {
    id
    createdAt
    inBlock
    network
    inExtrinsic
    indexInBlock
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
  ${WorkerFields}
`
export const ApplicationWithdrawnEventFields = gql`
  fragment ApplicationWithdrawnEventFields on ApplicationWithdrawnEvent {
    id
    createdAt
    inBlock
    network
    inExtrinsic
    indexInBlock
    group {
      name
    }
    application {
      id
      runtimeId
    }
  }
`
export const OpeningCanceledEventFields = gql`
  fragment OpeningCanceledEventFields on OpeningCanceledEvent {
    id
    createdAt
    inBlock
    network
    inExtrinsic
    indexInBlock
    group {
      name
    }
    opening {
      id
      runtimeId
    }
  }
`
export const StatusTextChangedEventFields = gql`
  fragment StatusTextChangedEventFields on StatusTextChangedEvent {
    id
    createdAt
    inBlock
    network
    inExtrinsic
    indexInBlock
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
`
export const WorkerRoleAccountUpdatedEventFields = gql`
  fragment WorkerRoleAccountUpdatedEventFields on WorkerRoleAccountUpdatedEvent {
    id
    createdAt
    inBlock
    network
    inExtrinsic
    indexInBlock
    group {
      name
    }
    worker {
      id
      runtimeId
    }
    newRoleAccount
  }
`
export const WorkerRewardAccountUpdatedEventFields = gql`
  fragment WorkerRewardAccountUpdatedEventFields on WorkerRewardAccountUpdatedEvent {
    id
    createdAt
    inBlock
    network
    inExtrinsic
    indexInBlock
    group {
      name
    }
    worker {
      id
      runtimeId
    }
    newRewardAccount
  }
`
export const StakeIncreasedEventFields = gql`
  fragment StakeIncreasedEventFields on StakeIncreasedEvent {
    id
    createdAt
    inBlock
    network
    inExtrinsic
    indexInBlock
    group {
      name
    }
    worker {
      id
      runtimeId
    }
    amount
  }
`
export const WorkerStartedLeavingEventFields = gql`
  fragment WorkerStartedLeavingEventFields on WorkerStartedLeavingEvent {
    id
    createdAt
    inBlock
    network
    inExtrinsic
    indexInBlock
    group {
      name
    }
    worker {
      id
      runtimeId
    }
    rationale
  }
`
export const WorkerRewardAmountUpdatedEventFields = gql`
  fragment WorkerRewardAmountUpdatedEventFields on WorkerRewardAmountUpdatedEvent {
    id
    createdAt
    inBlock
    network
    inExtrinsic
    indexInBlock
    group {
      name
    }
    worker {
      id
      runtimeId
    }
    newRewardPerBlock
  }
`
export const StakeSlashedEventFields = gql`
  fragment StakeSlashedEventFields on StakeSlashedEvent {
    id
    createdAt
    inBlock
    network
    inExtrinsic
    indexInBlock
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
`
export const StakeDecreasedEventFields = gql`
  fragment StakeDecreasedEventFields on StakeDecreasedEvent {
    id
    createdAt
    inBlock
    network
    inExtrinsic
    indexInBlock
    group {
      name
    }
    worker {
      id
      runtimeId
    }
    amount
  }
`
export const TerminatedWorkerEventFields = gql`
  fragment TerminatedWorkerEventFields on TerminatedWorkerEvent {
    id
    createdAt
    inBlock
    network
    inExtrinsic
    indexInBlock
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
`
export const TerminatedLeaderEventFields = gql`
  fragment TerminatedLeaderEventFields on TerminatedLeaderEvent {
    id
    createdAt
    inBlock
    network
    inExtrinsic
    indexInBlock
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
`
export const LeaderUnsetEventFields = gql`
  fragment LeaderUnsetEventFields on LeaderUnsetEvent {
    id
    createdAt
    inBlock
    network
    inExtrinsic
    indexInBlock
    group {
      name
    }
    leader {
      id
      runtimeId
    }
  }
`
export const BudgetSetEventFields = gql`
  fragment BudgetSetEventFields on BudgetSetEvent {
    id
    createdAt
    inBlock
    network
    inExtrinsic
    indexInBlock
    group {
      name
    }
    newBudget
  }
`
export const BudgetSpendingEventFields = gql`
  fragment BudgetSpendingEventFields on BudgetSpendingEvent {
    id
    createdAt
    inBlock
    network
    inExtrinsic
    indexInBlock
    group {
      name
    }
    reciever
    amount
    rationale
  }
`
export const GetChannelById = gql`
  query getChannelById($id: ID!) {
    channelByUniqueInput(where: { id: $id }) {
      ...ChannelFields
    }
  }
  ${ChannelFields}
`
export const GetChannelCategoryById = gql`
  query getChannelCategoryById($id: ID!) {
    channelCategoryByUniqueInput(where: { id: $id }) {
      ...ChannelCategoryFields
    }
  }
  ${ChannelCategoryFields}
`
export const GetVideoCategoryById = gql`
  query getVideoCategoryById($id: ID!) {
    videoCategoryByUniqueInput(where: { id: $id }) {
      ...VideoCategoryFields
    }
  }
  ${VideoCategoryFields}
`
export const GetOwnedNftByVideoId = gql`
  query getOwnedNftByVideoId($videoId: ID!) {
    ownedNfts(where: { video: { id_eq: $videoId } }) {
      ...OwnedNftFields
    }
  }
  ${OwnedNftFields}
`
export const GetCurrentCouncilMembers = gql`
  query getCurrentCouncilMembers {
    electedCouncils(where: { endedAtBlock_eq: null }) {
      ...ElectedCouncilFields
    }
  }
  ${ElectedCouncilFields}
`
export const GetReferendumIntermediateWinners = gql`
  query getReferendumIntermediateWinners($electionRoundCycleId: Int!, $councilSize: Int!) {
    candidates(
      where: { electionRound: { cycleId_eq: $electionRoundCycleId }, votePower_gt: 0 }
      orderBy: [votePower_DESC, lastVoteReceivedAtBlock_ASC, lastVoteReceivedAtEventNumber_ASC]
      limit: $councilSize
    ) {
      ...CandidateFields
    }
  }
  ${CandidateFields}
`
export const GetCategoriesByIds = gql`
  query getCategoriesByIds($ids: [ID!]) {
    forumCategories(where: { id_in: $ids }) {
      ...ForumCategoryFields
    }
  }
  ${ForumCategoryFields}
`
export const GetThreadsWithInitialPostsByIds = gql`
  query getThreadsWithInitialPostsByIds($ids: [ID!]) {
    forumThreads(where: { id_in: $ids }) {
      ...ForumThreadWithInitialPost
    }
  }
  ${ForumThreadWithInitialPost}
`
export const GetPostsByIds = gql`
  query getPostsByIds($ids: [ID!]) {
    forumPosts(where: { id_in: $ids }) {
      ...ForumPostFields
    }
  }
  ${ForumPostFields}
`
export const GetCategoryCreatedEventsByEventIds = gql`
  query getCategoryCreatedEventsByEventIds($eventIds: [ID!]) {
    categoryCreatedEvents(where: { id_in: $eventIds }) {
      ...CategoryCreatedEventFields
    }
  }
  ${CategoryCreatedEventFields}
`
export const GetCategoryArchivalStatusUpdatedEventsByEventIds = gql`
  query getCategoryArchivalStatusUpdatedEventsByEventIds($eventIds: [ID!]) {
    categoryArchivalStatusUpdatedEvents(where: { id_in: $eventIds }) {
      ...CategoryArchivalStatusUpdatedEventFields
    }
  }
  ${CategoryArchivalStatusUpdatedEventFields}
`
export const GetCategoryDeletedEventsByEventIds = gql`
  query getCategoryDeletedEventsByEventIds($eventIds: [ID!]) {
    categoryDeletedEvents(where: { id_in: $eventIds }) {
      ...CategoryDeletedEventFields
    }
  }
  ${CategoryDeletedEventFields}
`
export const GetThreadCreatedEventsByEventIds = gql`
  query getThreadCreatedEventsByEventIds($eventIds: [ID!]) {
    threadCreatedEvents(where: { id_in: $eventIds }) {
      ...ThreadCreatedEventFields
    }
  }
  ${ThreadCreatedEventFields}
`
export const GetThreadMetadataUpdatedEventsByEventIds = gql`
  query getThreadMetadataUpdatedEventsByEventIds($eventIds: [ID!]) {
    threadMetadataUpdatedEvents(where: { id_in: $eventIds }) {
      ...ThreadMetadataUpdatedEventFields
    }
  }
  ${ThreadMetadataUpdatedEventFields}
`
export const GetVoteOnPollEventsByEventIds = gql`
  query getVoteOnPollEventsByEventIds($eventIds: [ID!]) {
    voteOnPollEvents(where: { id_in: $eventIds }) {
      ...VoteOnPollEventFields
    }
  }
  ${VoteOnPollEventFields}
`
export const GetThreadDeletedEventsByEventIds = gql`
  query getThreadDeletedEventsByEventIds($eventIds: [ID!]) {
    threadDeletedEvents(where: { id_in: $eventIds }) {
      ...ThreadDeletedEventFields
    }
  }
  ${ThreadDeletedEventFields}
`
export const GetPostAddedEventsByEventIds = gql`
  query getPostAddedEventsByEventIds($eventIds: [ID!]) {
    postAddedEvents(where: { id_in: $eventIds }) {
      ...PostAddedEventFields
    }
  }
  ${PostAddedEventFields}
`
export const GetThreadMovedEventsByEventIds = gql`
  query getThreadMovedEventsByEventIds($eventIds: [ID!]) {
    threadMovedEvents(where: { id_in: $eventIds }) {
      ...ThreadMovedEventFields
    }
  }
  ${ThreadMovedEventFields}
`
export const GetCategoryStickyThreadUpdateEventsByEventIds = gql`
  query getCategoryStickyThreadUpdateEventsByEventIds($eventIds: [ID!]) {
    categoryStickyThreadUpdateEvents(where: { id_in: $eventIds }) {
      ...CategoryStickyThreadUpdateEventFields
    }
  }
  ${CategoryStickyThreadUpdateEventFields}
`
export const GetCategoryMembershipOfModeratorUpdatedEventsByEventIds = gql`
  query getCategoryMembershipOfModeratorUpdatedEventsByEventIds($eventIds: [ID!]) {
    categoryMembershipOfModeratorUpdatedEvents(where: { id_in: $eventIds }) {
      ...CategoryMembershipOfModeratorUpdatedEventFields
    }
  }
  ${CategoryMembershipOfModeratorUpdatedEventFields}
`
export const GetThreadModeratedEventsByEventIds = gql`
  query getThreadModeratedEventsByEventIds($eventIds: [ID!]) {
    threadModeratedEvents(where: { id_in: $eventIds }) {
      ...ThreadModeratedEventFields
    }
  }
  ${ThreadModeratedEventFields}
`
export const GetPostModeratedEventsByEventIds = gql`
  query getPostModeratedEventsByEventIds($eventIds: [ID!]) {
    postModeratedEvents(where: { id_in: $eventIds }) {
      ...PostModeratedEventFields
    }
  }
  ${PostModeratedEventFields}
`
export const GetPostReactedEventsByEventIds = gql`
  query getPostReactedEventsByEventIds($eventIds: [ID!]) {
    postReactedEvents(where: { id_in: $eventIds }) {
      ...PostReactedEventFields
    }
  }
  ${PostReactedEventFields}
`
export const GetPostTextUpdatedEventsByEventIds = gql`
  query getPostTextUpdatedEventsByEventIds($eventIds: [ID!]) {
    postTextUpdatedEvents(where: { id_in: $eventIds }) {
      ...PostTextUpdatedEventFields
    }
  }
  ${PostTextUpdatedEventFields}
`
export const GetPostDeletedEventsByEventIds = gql`
  query getPostDeletedEventsByEventIds($eventIds: [ID!]) {
    postDeletedEvents(where: { id_in: $eventIds }) {
      ...PostDeletedEventFields
    }
  }
  ${PostDeletedEventFields}
`
export const GetMemberById = gql`
  query getMemberById($id: ID!) {
    membershipByUniqueInput(where: { id: $id }) {
      ...MembershipFields
    }
  }
  ${MembershipFields}
`
export const GetMembersByIds = gql`
  query getMembersByIds($ids: [ID!]) {
    memberships(where: { id_in: $ids }) {
      ...MembershipFields
    }
  }
  ${MembershipFields}
`
export const GetMembershipSystemSnapshotAt = gql`
  query getMembershipSystemSnapshotAt($time: DateTime!) {
    membershipSystemSnapshots(where: { createdAt_eq: $time }, orderBy: createdAt_DESC, limit: 1) {
      ...MembershipSystemSnapshotFields
    }
  }
  ${MembershipSystemSnapshotFields}
`
export const GetMembershipSystemSnapshotBefore = gql`
  query getMembershipSystemSnapshotBefore($time: DateTime!) {
    membershipSystemSnapshots(where: { createdAt_lt: $time }, orderBy: createdAt_DESC, limit: 1) {
      ...MembershipSystemSnapshotFields
    }
  }
  ${MembershipSystemSnapshotFields}
`
export const GetMembershipBoughtEventsByEventIds = gql`
  query getMembershipBoughtEventsByEventIds($eventIds: [ID!]) {
    membershipBoughtEvents(where: { id_in: $eventIds }) {
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
export const GetMemberInvitedEventsByEventIds = gql`
  query getMemberInvitedEventsByEventIds($eventIds: [ID!]) {
    memberInvitedEvents(where: { id_in: $eventIds }) {
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
export const GetStakingAccountAddedEventsByEventIds = gql`
  query getStakingAccountAddedEventsByEventIds($ids: [ID!]) {
    stakingAccountAddedEvents(where: { id_in: $ids }) {
      ...StakingAccountAddedEventFields
    }
  }
  ${StakingAccountAddedEventFields}
`
export const GetStakingAccountConfirmedEventsByEventIds = gql`
  query getStakingAccountConfirmedEventsByEventIds($ids: [ID!]) {
    stakingAccountConfirmedEvents(where: { id_in: $ids }) {
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
    referralCutUpdatedEvents(where: { id_eq: $eventId }) {
      ...ReferralCutUpdatedEventFields
    }
  }
  ${ReferralCutUpdatedEventFields}
`
export const GetMembershipPriceUpdatedEventsByEventId = gql`
  query getMembershipPriceUpdatedEventsByEventId($eventId: ID!) {
    membershipPriceUpdatedEvents(where: { id_eq: $eventId }) {
      ...MembershipPriceUpdatedEventFields
    }
  }
  ${MembershipPriceUpdatedEventFields}
`
export const GetInitialInvitationBalanceUpdatedEventsByEventId = gql`
  query getInitialInvitationBalanceUpdatedEventsByEventId($eventId: ID!) {
    initialInvitationBalanceUpdatedEvents(where: { id_eq: $eventId }) {
      ...InitialInvitationBalanceUpdatedEventFields
    }
  }
  ${InitialInvitationBalanceUpdatedEventFields}
`
export const GetInitialInvitationCountUpdatedEventsByEventId = gql`
  query getInitialInvitationCountUpdatedEventsByEventId($eventId: ID!) {
    initialInvitationCountUpdatedEvents(where: { id_eq: $eventId }) {
      ...InitialInvitationCountUpdatedEventFields
    }
  }
  ${InitialInvitationCountUpdatedEventFields}
`
export const GetProposalsByIds = gql`
  query getProposalsByIds($ids: [ID!]) {
    proposals(where: { id_in: $ids }) {
      ...ProposalFields
    }
  }
  ${ProposalFields}
`
export const GetProposalDiscussionThreadsByIds = gql`
  query getProposalDiscussionThreadsByIds($ids: [ID!]) {
    proposalDiscussionThreads(where: { id_in: $ids }) {
      ...ProposalDiscussionThreadFields
    }
  }
  ${ProposalDiscussionThreadFields}
`
export const GetProposalDiscussionPostsByIds = gql`
  query getProposalDiscussionPostsByIds($ids: [ID!]) {
    proposalDiscussionPosts(where: { id_in: $ids }) {
      ...ProposalDiscussionPostFields
    }
  }
  ${ProposalDiscussionPostFields}
`
export const GetProposalDiscussionPostCreatedEvents = gql`
  query getProposalDiscussionPostCreatedEvents($eventIds: [ID!]) {
    proposalDiscussionPostCreatedEvents(where: { id_in: $eventIds }) {
      ...ProposalDiscussionPostCreatedEventFields
    }
  }
  ${ProposalDiscussionPostCreatedEventFields}
`
export const GetProposalDiscussionPostUpdatedEvents = gql`
  query getProposalDiscussionPostUpdatedEvents($eventIds: [ID!]) {
    proposalDiscussionPostUpdatedEvents(where: { id_in: $eventIds }) {
      ...ProposalDiscussionPostUpdatedEventFields
    }
  }
  ${ProposalDiscussionPostUpdatedEventFields}
`
export const GetProposalDiscussionThreadModeChangedEvents = gql`
  query getProposalDiscussionThreadModeChangedEvents($eventIds: [ID!]) {
    proposalDiscussionThreadModeChangedEvents(where: { id_in: $eventIds }) {
      ...ProposalDiscussionThreadModeChangedEventFields
    }
  }
  ${ProposalDiscussionThreadModeChangedEventFields}
`
export const GetProposalDiscussionPostDeletedEvents = gql`
  query getProposalDiscussionPostDeletedEvents($eventIds: [ID!]) {
    proposalDiscussionPostDeletedEvents(where: { id_in: $eventIds }) {
      ...ProposalDiscussionPostDeletedEventFields
    }
  }
  ${ProposalDiscussionPostDeletedEventFields}
`
export const GetProposalCreatedEventsByEventIds = gql`
  query getProposalCreatedEventsByEventIds($eventIds: [ID!]) {
    proposalCreatedEvents(where: { id_in: $eventIds }) {
      ...ProposalCreatedEventFields
    }
  }
  ${ProposalCreatedEventFields}
`
export const GetProposalStatusUpdatedEventsByEventIds = gql`
  query getProposalStatusUpdatedEventsByEventIds($eventIds: [ID!]) {
    proposalStatusUpdatedEvents(where: { id_in: $eventIds }) {
      ...ProposalStatusUpdatedEventFields
    }
  }
  ${ProposalStatusUpdatedEventFields}
`
export const GetProposalDecisionMadeEventsByEventIds = gql`
  query getProposalDecisionMadeEventsByEventIds($eventIds: [ID!]) {
    proposalDecisionMadeEvents(where: { id_in: $eventIds }) {
      ...ProposalDecisionMadeEventFields
    }
  }
  ${ProposalDecisionMadeEventFields}
`
export const GetProposalExecutedEventsByEventIds = gql`
  query getProposalExecutedEventsByEventIds($eventIds: [ID!]) {
    proposalExecutedEvents(where: { id_in: $eventIds }) {
      ...ProposalExecutedEventFields
    }
  }
  ${ProposalExecutedEventFields}
`
export const GetProposalVotedEventsByEventIds = gql`
  query getProposalVotedEventsByEventIds($eventIds: [ID!]) {
    proposalVotedEvents(where: { id_in: $eventIds }) {
      ...ProposalVotedEventFields
    }
  }
  ${ProposalVotedEventFields}
`
export const GetProposalCancelledEventsByEventIds = gql`
  query getProposalCancelledEventsByEventIds($eventIds: [ID!]) {
    proposalCancelledEvents(where: { id_in: $eventIds }) {
      ...ProposalCancelledEventFields
    }
  }
  ${ProposalCancelledEventFields}
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
    appliedOnOpeningEvents(where: { id_in: $eventIds }) {
      ...AppliedOnOpeningEventFields
    }
  }
  ${AppliedOnOpeningEventFields}
`
export const GetOpeningAddedEventsByEventIds = gql`
  query getOpeningAddedEventsByEventIds($eventIds: [ID!]) {
    openingAddedEvents(where: { id_in: $eventIds }) {
      ...OpeningAddedEventFields
    }
  }
  ${OpeningAddedEventFields}
`
export const GetLeaderSetEventsByEventIds = gql`
  query getLeaderSetEventsByEventIds($eventIds: [ID!]) {
    leaderSetEvents(where: { id_in: $eventIds }) {
      ...LeaderSetEventFields
    }
  }
  ${LeaderSetEventFields}
`
export const GetOpeningFilledEventsByEventIds = gql`
  query getOpeningFilledEventsByEventIds($eventIds: [ID!]) {
    openingFilledEvents(where: { id_in: $eventIds }) {
      ...OpeningFilledEventFields
    }
  }
  ${OpeningFilledEventFields}
`
export const GetApplicationWithdrawnEventsByEventIds = gql`
  query getApplicationWithdrawnEventsByEventIds($eventIds: [ID!]) {
    applicationWithdrawnEvents(where: { id_in: $eventIds }) {
      ...ApplicationWithdrawnEventFields
    }
  }
  ${ApplicationWithdrawnEventFields}
`
export const GetOpeningCancelledEventsByEventIds = gql`
  query getOpeningCancelledEventsByEventIds($eventIds: [ID!]) {
    openingCanceledEvents(where: { id_in: $eventIds }) {
      ...OpeningCanceledEventFields
    }
  }
  ${OpeningCanceledEventFields}
`
export const GetStatusTextChangedEventsByEventIds = gql`
  query getStatusTextChangedEventsByEventIds($eventIds: [ID!]) {
    statusTextChangedEvents(where: { id_in: $eventIds }) {
      ...StatusTextChangedEventFields
    }
  }
  ${StatusTextChangedEventFields}
`
export const GetWorkerRoleAccountUpdatedEventsByEventIds = gql`
  query getWorkerRoleAccountUpdatedEventsByEventIds($eventIds: [ID!]) {
    workerRoleAccountUpdatedEvents(where: { id_in: $eventIds }) {
      ...WorkerRoleAccountUpdatedEventFields
    }
  }
  ${WorkerRoleAccountUpdatedEventFields}
`
export const GetWorkerRewardAccountUpdatedEventsByEventIds = gql`
  query getWorkerRewardAccountUpdatedEventsByEventIds($eventIds: [ID!]) {
    workerRewardAccountUpdatedEvents(where: { id_in: $eventIds }) {
      ...WorkerRewardAccountUpdatedEventFields
    }
  }
  ${WorkerRewardAccountUpdatedEventFields}
`
export const GetStakeIncreasedEventsByEventIds = gql`
  query getStakeIncreasedEventsByEventIds($eventIds: [ID!]) {
    stakeIncreasedEvents(where: { id_in: $eventIds }) {
      ...StakeIncreasedEventFields
    }
  }
  ${StakeIncreasedEventFields}
`
export const GetWorkerStartedLeavingEventsByEventIds = gql`
  query getWorkerStartedLeavingEventsByEventIds($eventIds: [ID!]) {
    workerStartedLeavingEvents(where: { id_in: $eventIds }) {
      ...WorkerStartedLeavingEventFields
    }
  }
  ${WorkerStartedLeavingEventFields}
`
export const GetWorkerRewardAmountUpdatedEventsByEventIds = gql`
  query getWorkerRewardAmountUpdatedEventsByEventIds($eventIds: [ID!]) {
    workerRewardAmountUpdatedEvents(where: { id_in: $eventIds }) {
      ...WorkerRewardAmountUpdatedEventFields
    }
  }
  ${WorkerRewardAmountUpdatedEventFields}
`
export const GetStakeSlashedEventsByEventIds = gql`
  query getStakeSlashedEventsByEventIds($eventIds: [ID!]) {
    stakeSlashedEvents(where: { id_in: $eventIds }) {
      ...StakeSlashedEventFields
    }
  }
  ${StakeSlashedEventFields}
`
export const GetStakeDecreasedEventsByEventIds = gql`
  query getStakeDecreasedEventsByEventIds($eventIds: [ID!]) {
    stakeDecreasedEvents(where: { id_in: $eventIds }) {
      ...StakeDecreasedEventFields
    }
  }
  ${StakeDecreasedEventFields}
`
export const GetTerminatedWorkerEventsByEventIds = gql`
  query getTerminatedWorkerEventsByEventIds($eventIds: [ID!]) {
    terminatedWorkerEvents(where: { id_in: $eventIds }) {
      ...TerminatedWorkerEventFields
    }
  }
  ${TerminatedWorkerEventFields}
`
export const GetTerminatedLeaderEventsByEventIds = gql`
  query getTerminatedLeaderEventsByEventIds($eventIds: [ID!]) {
    terminatedLeaderEvents(where: { id_in: $eventIds }) {
      ...TerminatedLeaderEventFields
    }
  }
  ${TerminatedLeaderEventFields}
`
export const GetLeaderUnsetEventsByEventIds = gql`
  query getLeaderUnsetEventsByEventIds($eventIds: [ID!]) {
    leaderUnsetEvents(where: { id_in: $eventIds }) {
      ...LeaderUnsetEventFields
    }
  }
  ${LeaderUnsetEventFields}
`
export const GetBudgetSetEventsByEventIds = gql`
  query getBudgetSetEventsByEventIds($eventIds: [ID!]) {
    budgetSetEvents(where: { id_in: $eventIds }) {
      ...BudgetSetEventFields
    }
  }
  ${BudgetSetEventFields}
`
export const GetBudgetSpendingEventsByEventIds = gql`
  query getBudgetSpendingEventsByEventIds($eventIds: [ID!]) {
    budgetSpendingEvents(where: { id_in: $eventIds }) {
      ...BudgetSpendingEventFields
    }
  }
  ${BudgetSpendingEventFields}
`
