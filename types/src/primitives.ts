import { u8, u32, u64 } from '@polkadot/types'

// Forum
export type ForumCategoryId = u64
export type ForumThreadId = u64
export type ForumPostId = u64

// Proposals
export type ProposalId = u32
export type ProposalDiscussionThreadId = u64
export type ProposalDiscussionPostId = u64

// Storage
export type DataObjectTypeId = u64
export type DataObjectId = u64
export type StorageBucketId = u64
export type DistributionBucketFamilyId = u64
export type DistributionBucketOperatorId = u64
export type DistributionBucketIndex = u64

// Membership
export type MemberId = u64

// Content
export type ChannelId = u64
export type VideoId = u64
export type OpenAuctionId = u64
export type CuratorId = u64
export type CuratorGroupId = u64
export type CreatorTokenId = u64
export type CreatorTokenSaleId = u32
export type CreatorTokenRevenueSplitId = u32
export type ChannelPrivilegeLevel = u8

// Working groups
export type WorkerId = u64
export type ActorId = u64
export type OpeningId = u64
export type ApplicationId = u64
