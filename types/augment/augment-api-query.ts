// Auto-generated via `yarn polkadot-types-from-chain`, do not edit
/* eslint-disable */

import type { Bytes, Option, Vec, bool, u16, u32, u64, u8 } from '@polkadot/types';
import type { AnyNumber, ITuple, Observable } from '@polkadot/types/types';
import type { Application, ApplicationId, BountyActor, BountyId, Candidate, CastVoteOf, Category, CategoryId, Channel, ChannelCategory, ChannelCategoryId, ChannelId, ChannelOwnershipTransferRequest, ChannelOwnershipTransferRequestId, ConstitutionInfo, ContentId, CouncilMemberOf, CouncilStageUpdate, CuratorGroup, CuratorGroupId, DataObject, DataObjectStorageRelationship, DataObjectStorageRelationshipId, DataObjectType, DataObjectTypeId, DiscussionPost, DiscussionThread, Entry, EntryId, ForumUserId, MemberId, Membership, MemoText, ModeratorId, ObjectOwner, Opening, OpeningId, Person, PersonId, Playlist, PlaylistId, Post, PostId, ProposalId, ProposalOf, ReferendumStage, Reply, ReplyId, Series, SeriesId, StakingAccountMemberBinding, ThreadId, ThreadOf, Video, VideoCategory, VideoCategoryId, VideoId, VoteKind, Voucher, Worker, WorkerId } from './all';
import type { UncleEntryItem } from '@polkadot/types/interfaces/authorship';
import type { BabeAuthorityWeight, MaybeRandomness, NextConfigDescriptor, Randomness } from '@polkadot/types/interfaces/babe';
import type { AccountData, BalanceLock } from '@polkadot/types/interfaces/balances';
import type { AuthorityId } from '@polkadot/types/interfaces/consensus';
import type { SetId, StoredPendingChange, StoredState } from '@polkadot/types/interfaces/grandpa';
import type { AuthIndex } from '@polkadot/types/interfaces/imOnline';
import type { DeferredOffenceOf, Kind, OffenceDetails, OpaqueTimeSlot, ReportIdOf } from '@polkadot/types/interfaces/offences';
import type { AccountId, Balance, BalanceOf, BlockNumber, ExtrinsicsWeight, Hash, KeyTypeId, Moment, Perbill, Releases, ValidatorId } from '@polkadot/types/interfaces/runtime';
import type { Keys, SessionIndex } from '@polkadot/types/interfaces/session';
import type { ActiveEraInfo, ElectionResult, ElectionScore, ElectionStatus, EraIndex, EraRewardPoints, Exposure, Forcing, Nominations, RewardDestination, SlashingSpans, SpanIndex, SpanRecord, StakingLedger, UnappliedSlash, ValidatorPrefs } from '@polkadot/types/interfaces/staking';
import type { AccountInfo, DigestOf, EventIndex, EventRecord, LastRuntimeUpgradeInfo, Phase } from '@polkadot/types/interfaces/system';
import type { Bounty } from '@polkadot/types/interfaces/treasury';
import type { Multiplier } from '@polkadot/types/interfaces/txpayment';
import type { ApiTypes } from '@polkadot/api/types';

declare module '@polkadot/api/types/storage' {
  export interface AugmentedQueries<ApiType> {
    authorship: {
      /**
       * Author of current block.
       **/
      author: AugmentedQuery<ApiType, () => Observable<Option<AccountId>>, []>;
      /**
       * Whether uncles were already set in this block.
       **/
      didSetUncles: AugmentedQuery<ApiType, () => Observable<bool>, []>;
      /**
       * Uncles
       **/
      uncles: AugmentedQuery<ApiType, () => Observable<Vec<UncleEntryItem>>, []>;
    };
    babe: {
      /**
       * Current epoch authorities.
       **/
      authorities: AugmentedQuery<ApiType, () => Observable<Vec<ITuple<[AuthorityId, BabeAuthorityWeight]>>>, []>;
      /**
       * Current slot number.
       **/
      currentSlot: AugmentedQuery<ApiType, () => Observable<u64>, []>;
      /**
       * Current epoch index.
       **/
      epochIndex: AugmentedQuery<ApiType, () => Observable<u64>, []>;
      /**
       * The slot at which the first epoch actually started. This is 0
       * until the first block of the chain.
       **/
      genesisSlot: AugmentedQuery<ApiType, () => Observable<u64>, []>;
      /**
       * Temporary value (cleared at block finalization) which is `Some`
       * if per-block initialization has already been called for current block.
       **/
      initialized: AugmentedQuery<ApiType, () => Observable<Option<MaybeRandomness>>, []>;
      /**
       * How late the current block is compared to its parent.
       * 
       * This entry is populated as part of block execution and is cleaned up
       * on block finalization. Querying this storage entry outside of block
       * execution context should always yield zero.
       **/
      lateness: AugmentedQuery<ApiType, () => Observable<BlockNumber>, []>;
      /**
       * Next epoch configuration, if changed.
       **/
      nextEpochConfig: AugmentedQuery<ApiType, () => Observable<Option<NextConfigDescriptor>>, []>;
      /**
       * Next epoch randomness.
       **/
      nextRandomness: AugmentedQuery<ApiType, () => Observable<Randomness>, []>;
      /**
       * The epoch randomness for the *current* epoch.
       * 
       * # Security
       * 
       * This MUST NOT be used for gambling, as it can be influenced by a
       * malicious validator in the short term. It MAY be used in many
       * cryptographic protocols, however, so long as one remembers that this
       * (like everything else on-chain) it is public. For example, it can be
       * used where a number is needed that cannot have been chosen by an
       * adversary, for purposes such as public-coin zero-knowledge proofs.
       **/
      randomness: AugmentedQuery<ApiType, () => Observable<Randomness>, []>;
      /**
       * Randomness under construction.
       * 
       * We make a tradeoff between storage accesses and list length.
       * We store the under-construction randomness in segments of up to
       * `UNDER_CONSTRUCTION_SEGMENT_LENGTH`.
       * 
       * Once a segment reaches this length, we begin the next one.
       * We reset all segments and return to `0` at the beginning of every
       * epoch.
       **/
      segmentIndex: AugmentedQuery<ApiType, () => Observable<u32>, []>;
      /**
       * TWOX-NOTE: `SegmentIndex` is an increasing integer, so this is okay.
       **/
      underConstruction: AugmentedQuery<ApiType, (arg: u32 | AnyNumber | Uint8Array) => Observable<Vec<Randomness>>, [u32]>;
    };
    balances: {
      /**
       * The balance of an account.
       * 
       * NOTE: This is only used in the case that this module is used to store balances.
       **/
      account: AugmentedQuery<ApiType, (arg: AccountId | string | Uint8Array) => Observable<AccountData>, [AccountId]>;
      /**
       * Any liquidity locks on some account balances.
       * NOTE: Should only be accessed when setting, changing and freeing a lock.
       **/
      locks: AugmentedQuery<ApiType, (arg: AccountId | string | Uint8Array) => Observable<Vec<BalanceLock>>, [AccountId]>;
      /**
       * Storage version of the pallet.
       * 
       * This is set to v2.0.0 for new networks.
       **/
      storageVersion: AugmentedQuery<ApiType, () => Observable<Releases>, []>;
      /**
       * The total units issued in the system.
       **/
      totalIssuance: AugmentedQuery<ApiType, () => Observable<Balance>, []>;
    };
    blog: {
      /**
       * Post by unique blog and post identificators
       **/
      postById: AugmentedQuery<ApiType, (arg: PostId | AnyNumber | Uint8Array) => Observable<Post>, [PostId]>;
      /**
       * Maps, representing id => item relationship for blogs, posts and replies related structures
       * Post count
       **/
      postCount: AugmentedQuery<ApiType, () => Observable<PostId>, []>;
      /**
       * Reply by unique blog, post and reply identificators
       **/
      replyById: AugmentedQuery<ApiType, (arg1: PostId | AnyNumber | Uint8Array, arg2: ReplyId | AnyNumber | Uint8Array) => Observable<Reply>, [PostId, ReplyId]>;
    };
    bounty: {
      /**
       * Bounty storage.
       **/
      bounties: AugmentedQuery<ApiType, (arg: BountyId | AnyNumber | Uint8Array) => Observable<Bounty>, [BountyId]>;
      /**
       * Double map for bounty funding. It stores a member or council funding for bounties.
       **/
      bountyContributions: AugmentedQuery<ApiType, (arg1: BountyId | AnyNumber | Uint8Array, arg2: BountyActor | { Council: any } | { Member: any } | string | Uint8Array) => Observable<BalanceOf>, [BountyId, BountyActor]>;
      /**
       * Count of all bounties that have been created.
       **/
      bountyCount: AugmentedQuery<ApiType, () => Observable<u32>, []>;
      /**
       * Work entry storage map.
       **/
      entries: AugmentedQuery<ApiType, (arg: EntryId | AnyNumber | Uint8Array) => Observable<Entry>, [EntryId]>;
      /**
       * Count of all work entries that have been created.
       **/
      entryCount: AugmentedQuery<ApiType, () => Observable<u32>, []>;
    };
    constitution: {
      constitution: AugmentedQuery<ApiType, () => Observable<ConstitutionInfo>, []>;
    };
    content: {
      channelById: AugmentedQuery<ApiType, (arg: ChannelId | AnyNumber | Uint8Array) => Observable<Channel>, [ChannelId]>;
      channelCategoryById: AugmentedQuery<ApiType, (arg: ChannelCategoryId | AnyNumber | Uint8Array) => Observable<ChannelCategory>, [ChannelCategoryId]>;
      channelOwnershipTransferRequestById: AugmentedQuery<ApiType, (arg: ChannelOwnershipTransferRequestId | AnyNumber | Uint8Array) => Observable<ChannelOwnershipTransferRequest>, [ChannelOwnershipTransferRequestId]>;
      /**
       * Map, representing  CuratorGroupId -> CuratorGroup relation
       **/
      curatorGroupById: AugmentedQuery<ApiType, (arg: CuratorGroupId | AnyNumber | Uint8Array) => Observable<CuratorGroup>, [CuratorGroupId]>;
      nextChannelCategoryId: AugmentedQuery<ApiType, () => Observable<ChannelCategoryId>, []>;
      nextChannelId: AugmentedQuery<ApiType, () => Observable<ChannelId>, []>;
      nextChannelOwnershipTransferRequestId: AugmentedQuery<ApiType, () => Observable<ChannelOwnershipTransferRequestId>, []>;
      nextCuratorGroupId: AugmentedQuery<ApiType, () => Observable<CuratorGroupId>, []>;
      nextPersonId: AugmentedQuery<ApiType, () => Observable<PersonId>, []>;
      nextPlaylistId: AugmentedQuery<ApiType, () => Observable<PlaylistId>, []>;
      nextSeriesId: AugmentedQuery<ApiType, () => Observable<SeriesId>, []>;
      nextVideoCategoryId: AugmentedQuery<ApiType, () => Observable<VideoCategoryId>, []>;
      nextVideoId: AugmentedQuery<ApiType, () => Observable<VideoId>, []>;
      personById: AugmentedQuery<ApiType, (arg: PersonId | AnyNumber | Uint8Array) => Observable<Person>, [PersonId]>;
      playlistById: AugmentedQuery<ApiType, (arg: PlaylistId | AnyNumber | Uint8Array) => Observable<Playlist>, [PlaylistId]>;
      seriesById: AugmentedQuery<ApiType, (arg: SeriesId | AnyNumber | Uint8Array) => Observable<Series>, [SeriesId]>;
      videoById: AugmentedQuery<ApiType, (arg: VideoId | AnyNumber | Uint8Array) => Observable<Video>, [VideoId]>;
      videoCategoryById: AugmentedQuery<ApiType, (arg: VideoCategoryId | AnyNumber | Uint8Array) => Observable<VideoCategory>, [VideoCategoryId]>;
    };
    contentDirectoryWorkingGroup: {
      /**
       * Count of active workers.
       **/
      activeWorkerCount: AugmentedQuery<ApiType, () => Observable<u32>, []>;
      /**
       * Maps identifier to worker application on opening.
       **/
      applicationById: AugmentedQuery<ApiType, (arg: ApplicationId | AnyNumber | Uint8Array) => Observable<Application>, [ApplicationId]>;
      /**
       * Budget for the working group.
       **/
      budget: AugmentedQuery<ApiType, () => Observable<BalanceOf>, []>;
      /**
       * Current group lead.
       **/
      currentLead: AugmentedQuery<ApiType, () => Observable<Option<WorkerId>>, []>;
      /**
       * Next identifier value for new worker application.
       **/
      nextApplicationId: AugmentedQuery<ApiType, () => Observable<ApplicationId>, []>;
      /**
       * Next identifier value for new job opening.
       **/
      nextOpeningId: AugmentedQuery<ApiType, () => Observable<OpeningId>, []>;
      /**
       * Next identifier for a new worker.
       **/
      nextWorkerId: AugmentedQuery<ApiType, () => Observable<WorkerId>, []>;
      /**
       * Maps identifier to job opening.
       **/
      openingById: AugmentedQuery<ApiType, (arg: OpeningId | AnyNumber | Uint8Array) => Observable<Opening>, [OpeningId]>;
      /**
       * Status text hash.
       **/
      statusTextHash: AugmentedQuery<ApiType, () => Observable<Bytes>, []>;
      /**
       * Maps identifier to corresponding worker.
       **/
      workerById: AugmentedQuery<ApiType, (arg: WorkerId | AnyNumber | Uint8Array) => Observable<Worker>, [WorkerId]>;
      /**
       * Maps identifier to corresponding worker storage.
       **/
      workerStorage: AugmentedQuery<ApiType, (arg: WorkerId | AnyNumber | Uint8Array) => Observable<Bytes>, [WorkerId]>;
      /**
       * Worker storage size upper bound.
       **/
      workerStorageSize: AugmentedQuery<ApiType, () => Observable<u16>, []>;
    };
    council: {
      /**
       * Index of the current candidacy period. It is incremented everytime announcement period
       * starts.
       **/
      announcementPeriodNr: AugmentedQuery<ApiType, () => Observable<u64>, []>;
      /**
       * Budget for the council's elected members rewards.
       **/
      budget: AugmentedQuery<ApiType, () => Observable<Balance>, []>;
      /**
       * Amount of balance to be refilled every budget period
       **/
      budgetIncrement: AugmentedQuery<ApiType, () => Observable<Balance>, []>;
      /**
       * Map of all candidates that ever candidated and haven't unstake yet.
       **/
      candidates: AugmentedQuery<ApiType, (arg: MemberId | AnyNumber | Uint8Array) => Observable<Candidate>, [MemberId]>;
      /**
       * Current council members
       **/
      councilMembers: AugmentedQuery<ApiType, () => Observable<Vec<CouncilMemberOf>>, []>;
      /**
       * Councilor reward per block
       **/
      councilorReward: AugmentedQuery<ApiType, () => Observable<Balance>, []>;
      /**
       * The next block in which the budget will be increased.
       **/
      nextBudgetRefill: AugmentedQuery<ApiType, () => Observable<BlockNumber>, []>;
      /**
       * The next block in which the elected council member rewards will be payed.
       **/
      nextRewardPayments: AugmentedQuery<ApiType, () => Observable<BlockNumber>, []>;
      /**
       * Current council voting stage
       **/
      stage: AugmentedQuery<ApiType, () => Observable<CouncilStageUpdate>, []>;
    };
    dataDirectory: {
      /**
       * Maps data objects by their content id.
       **/
      dataByContentId: AugmentedQuery<ApiType, (arg: ContentId | string | Uint8Array) => Observable<DataObject>, [ContentId]>;
      /**
       * Default content voucher for all actors.
       **/
      defaultVoucher: AugmentedQuery<ApiType, () => Observable<Voucher>, []>;
      /**
       * Global voucher.
       **/
      globalVoucher: AugmentedQuery<ApiType, () => Observable<Voucher>, []>;
      /**
       * If all new uploads blocked
       **/
      uploadingBlocked: AugmentedQuery<ApiType, () => Observable<bool>, []>;
      /**
       * Upper bound for the Voucher objects number limit.
       **/
      voucherObjectsLimitUpperBound: AugmentedQuery<ApiType, () => Observable<u64>, []>;
      /**
       * Maps storage owner to it`s voucher. Created when the first upload by the new actor occured.
       **/
      vouchers: AugmentedQuery<ApiType, (arg: ObjectOwner | { Member: any } | { Channel: any } | { DAO: any } | { Council: any } | { WorkingGroup: any } | string | Uint8Array) => Observable<Voucher>, [ObjectOwner]>;
      /**
       * Upper bound for the Voucher size limit.
       **/
      voucherSizeLimitUpperBound: AugmentedQuery<ApiType, () => Observable<u64>, []>;
    };
    dataObjectStorageRegistry: {
      /**
       * Defines first relationship id.
       **/
      firstRelationshipId: AugmentedQuery<ApiType, () => Observable<DataObjectStorageRelationshipId>, []>;
      /**
       * Defines next relationship id.
       **/
      nextRelationshipId: AugmentedQuery<ApiType, () => Observable<DataObjectStorageRelationshipId>, []>;
      /**
       * Mapping of Data object types
       **/
      relationships: AugmentedQuery<ApiType, (arg: DataObjectStorageRelationshipId | AnyNumber | Uint8Array) => Observable<Option<DataObjectStorageRelationship>>, [DataObjectStorageRelationshipId]>;
      /**
       * Keeps a list of storage relationships per content id.
       **/
      relationshipsByContentId: AugmentedQuery<ApiType, (arg: ContentId | string | Uint8Array) => Observable<Vec<DataObjectStorageRelationshipId>>, [ContentId]>;
    };
    dataObjectTypeRegistry: {
      /**
       * Mapping of Data object types.
       **/
      dataObjectTypes: AugmentedQuery<ApiType, (arg: DataObjectTypeId | AnyNumber | Uint8Array) => Observable<Option<DataObjectType>>, [DataObjectTypeId]>;
      /**
       * Data object type ids should start at this value.
       **/
      firstDataObjectTypeId: AugmentedQuery<ApiType, () => Observable<DataObjectTypeId>, []>;
      /**
       * Provides id counter for the data object types.
       **/
      nextDataObjectTypeId: AugmentedQuery<ApiType, () => Observable<DataObjectTypeId>, []>;
    };
    forum: {
      /**
       * Map category identifier to corresponding category.
       **/
      categoryById: AugmentedQuery<ApiType, (arg: CategoryId | AnyNumber | Uint8Array) => Observable<Category>, [CategoryId]>;
      /**
       * Moderator set for each Category
       **/
      categoryByModerator: AugmentedQuery<ApiType, (arg1: CategoryId | AnyNumber | Uint8Array, arg2: ModeratorId | AnyNumber | Uint8Array) => Observable<ITuple<[]>>, [CategoryId, ModeratorId]>;
      /**
       * Counter for all existing categories.
       **/
      categoryCounter: AugmentedQuery<ApiType, () => Observable<CategoryId>, []>;
      /**
       * If data migration is done, set as configible for unit test purpose
       **/
      dataMigrationDone: AugmentedQuery<ApiType, () => Observable<bool>, []>;
      /**
       * Category identifier value to be used for the next Category created.
       **/
      nextCategoryId: AugmentedQuery<ApiType, () => Observable<CategoryId>, []>;
      /**
       * Post identifier value to be used for for next post created.
       **/
      nextPostId: AugmentedQuery<ApiType, () => Observable<PostId>, []>;
      /**
       * Thread identifier value to be used for next Thread in threadById.
       **/
      nextThreadId: AugmentedQuery<ApiType, () => Observable<ThreadId>, []>;
      /**
       * Unique thread poll voters. This private double map prevents double voting.
       **/
      pollVotes: AugmentedQuery<ApiType, (arg1: ThreadId | AnyNumber | Uint8Array, arg2: ForumUserId | AnyNumber | Uint8Array) => Observable<bool>, [ThreadId, ForumUserId]>;
      /**
       * Map post identifier to corresponding post.
       **/
      postById: AugmentedQuery<ApiType, (arg1: ThreadId | AnyNumber | Uint8Array, arg2: PostId | AnyNumber | Uint8Array) => Observable<Post>, [ThreadId, PostId]>;
      /**
       * Map thread identifier to corresponding thread.
       **/
      threadById: AugmentedQuery<ApiType, (arg1: CategoryId | AnyNumber | Uint8Array, arg2: ThreadId | AnyNumber | Uint8Array) => Observable<ThreadOf>, [CategoryId, ThreadId]>;
    };
    forumWorkingGroup: {
      /**
       * Count of active workers.
       **/
      activeWorkerCount: AugmentedQuery<ApiType, () => Observable<u32>, []>;
      /**
       * Maps identifier to worker application on opening.
       **/
      applicationById: AugmentedQuery<ApiType, (arg: ApplicationId | AnyNumber | Uint8Array) => Observable<Application>, [ApplicationId]>;
      /**
       * Budget for the working group.
       **/
      budget: AugmentedQuery<ApiType, () => Observable<BalanceOf>, []>;
      /**
       * Current group lead.
       **/
      currentLead: AugmentedQuery<ApiType, () => Observable<Option<WorkerId>>, []>;
      /**
       * Next identifier value for new worker application.
       **/
      nextApplicationId: AugmentedQuery<ApiType, () => Observable<ApplicationId>, []>;
      /**
       * Next identifier value for new job opening.
       **/
      nextOpeningId: AugmentedQuery<ApiType, () => Observable<OpeningId>, []>;
      /**
       * Next identifier for a new worker.
       **/
      nextWorkerId: AugmentedQuery<ApiType, () => Observable<WorkerId>, []>;
      /**
       * Maps identifier to job opening.
       **/
      openingById: AugmentedQuery<ApiType, (arg: OpeningId | AnyNumber | Uint8Array) => Observable<Opening>, [OpeningId]>;
      /**
       * Status text hash.
       **/
      statusTextHash: AugmentedQuery<ApiType, () => Observable<Bytes>, []>;
      /**
       * Maps identifier to corresponding worker.
       **/
      workerById: AugmentedQuery<ApiType, (arg: WorkerId | AnyNumber | Uint8Array) => Observable<Worker>, [WorkerId]>;
      /**
       * Maps identifier to corresponding worker storage.
       **/
      workerStorage: AugmentedQuery<ApiType, (arg: WorkerId | AnyNumber | Uint8Array) => Observable<Bytes>, [WorkerId]>;
      /**
       * Worker storage size upper bound.
       **/
      workerStorageSize: AugmentedQuery<ApiType, () => Observable<u16>, []>;
    };
    gatewayWorkingGroup: {
      /**
       * Count of active workers.
       **/
      activeWorkerCount: AugmentedQuery<ApiType, () => Observable<u32>, []>;
      /**
       * Maps identifier to worker application on opening.
       **/
      applicationById: AugmentedQuery<ApiType, (arg: ApplicationId | AnyNumber | Uint8Array) => Observable<Application>, [ApplicationId]>;
      /**
       * Budget for the working group.
       **/
      budget: AugmentedQuery<ApiType, () => Observable<BalanceOf>, []>;
      /**
       * Current group lead.
       **/
      currentLead: AugmentedQuery<ApiType, () => Observable<Option<WorkerId>>, []>;
      /**
       * Next identifier value for new worker application.
       **/
      nextApplicationId: AugmentedQuery<ApiType, () => Observable<ApplicationId>, []>;
      /**
       * Next identifier value for new job opening.
       **/
      nextOpeningId: AugmentedQuery<ApiType, () => Observable<OpeningId>, []>;
      /**
       * Next identifier for a new worker.
       **/
      nextWorkerId: AugmentedQuery<ApiType, () => Observable<WorkerId>, []>;
      /**
       * Maps identifier to job opening.
       **/
      openingById: AugmentedQuery<ApiType, (arg: OpeningId | AnyNumber | Uint8Array) => Observable<Opening>, [OpeningId]>;
      /**
       * Status text hash.
       **/
      statusTextHash: AugmentedQuery<ApiType, () => Observable<Bytes>, []>;
      /**
       * Maps identifier to corresponding worker.
       **/
      workerById: AugmentedQuery<ApiType, (arg: WorkerId | AnyNumber | Uint8Array) => Observable<Worker>, [WorkerId]>;
      /**
       * Maps identifier to corresponding worker storage.
       **/
      workerStorage: AugmentedQuery<ApiType, (arg: WorkerId | AnyNumber | Uint8Array) => Observable<Bytes>, [WorkerId]>;
      /**
       * Worker storage size upper bound.
       **/
      workerStorageSize: AugmentedQuery<ApiType, () => Observable<u16>, []>;
    };
    grandpa: {
      /**
       * The number of changes (both in terms of keys and underlying economic responsibilities)
       * in the "set" of Grandpa validators from genesis.
       **/
      currentSetId: AugmentedQuery<ApiType, () => Observable<SetId>, []>;
      /**
       * next block number where we can force a change.
       **/
      nextForced: AugmentedQuery<ApiType, () => Observable<Option<BlockNumber>>, []>;
      /**
       * Pending change: (signaled at, scheduled change).
       **/
      pendingChange: AugmentedQuery<ApiType, () => Observable<Option<StoredPendingChange>>, []>;
      /**
       * A mapping from grandpa set ID to the index of the *most recent* session for which its
       * members were responsible.
       * 
       * TWOX-NOTE: `SetId` is not under user control.
       **/
      setIdSession: AugmentedQuery<ApiType, (arg: SetId | AnyNumber | Uint8Array) => Observable<Option<SessionIndex>>, [SetId]>;
      /**
       * `true` if we are currently stalled.
       **/
      stalled: AugmentedQuery<ApiType, () => Observable<Option<ITuple<[BlockNumber, BlockNumber]>>>, []>;
      /**
       * State of the current authority set.
       **/
      state: AugmentedQuery<ApiType, () => Observable<StoredState>, []>;
    };
    imOnline: {
      /**
       * For each session index, we keep a mapping of `T::ValidatorId` to the
       * number of blocks authored by the given authority.
       **/
      authoredBlocks: AugmentedQuery<ApiType, (arg1: SessionIndex | AnyNumber | Uint8Array, arg2: ValidatorId | string | Uint8Array) => Observable<u32>, [SessionIndex, ValidatorId]>;
      /**
       * The block number after which it's ok to send heartbeats in current session.
       * 
       * At the beginning of each session we set this to a value that should
       * fall roughly in the middle of the session duration.
       * The idea is to first wait for the validators to produce a block
       * in the current session, so that the heartbeat later on will not be necessary.
       **/
      heartbeatAfter: AugmentedQuery<ApiType, () => Observable<BlockNumber>, []>;
      /**
       * The current set of keys that may issue a heartbeat.
       **/
      keys: AugmentedQuery<ApiType, () => Observable<Vec<AuthorityId>>, []>;
      /**
       * For each session index, we keep a mapping of `AuthIndex` to
       * `offchain::OpaqueNetworkState`.
       **/
      receivedHeartbeats: AugmentedQuery<ApiType, (arg1: SessionIndex | AnyNumber | Uint8Array, arg2: AuthIndex | AnyNumber | Uint8Array) => Observable<Option<Bytes>>, [SessionIndex, AuthIndex]>;
    };
    members: {
      /**
       * Initial invitation balance for the invited member.
       **/
      initialInvitationBalance: AugmentedQuery<ApiType, () => Observable<BalanceOf>, []>;
      /**
       * Initial invitation count for the newly bought membership.
       **/
      initialInvitationCount: AugmentedQuery<ApiType, () => Observable<u32>, []>;
      /**
       * Registered unique handles hash and their mapping to their owner.
       **/
      memberIdByHandleHash: AugmentedQuery<ApiType, (arg: Bytes | string | Uint8Array) => Observable<MemberId>, [Bytes]>;
      /**
       * Mapping of member's id to their membership profile.
       **/
      membershipById: AugmentedQuery<ApiType, (arg: MemberId | AnyNumber | Uint8Array) => Observable<Membership>, [MemberId]>;
      /**
       * Current membership price.
       **/
      membershipPrice: AugmentedQuery<ApiType, () => Observable<BalanceOf>, []>;
      /**
       * MemberId to assign to next member that is added to the registry, and is also the
       * total number of members created. MemberIds start at Zero.
       **/
      nextMemberId: AugmentedQuery<ApiType, () => Observable<MemberId>, []>;
      /**
       * Referral cut percent of the membership fee to receive on buying the membership.
       **/
      referralCut: AugmentedQuery<ApiType, () => Observable<u8>, []>;
      /**
       * Double of a staking account id and member id to the confirmation status.
       **/
      stakingAccountIdMemberStatus: AugmentedQuery<ApiType, (arg: AccountId | string | Uint8Array) => Observable<StakingAccountMemberBinding>, [AccountId]>;
    };
    membershipWorkingGroup: {
      /**
       * Count of active workers.
       **/
      activeWorkerCount: AugmentedQuery<ApiType, () => Observable<u32>, []>;
      /**
       * Maps identifier to worker application on opening.
       **/
      applicationById: AugmentedQuery<ApiType, (arg: ApplicationId | AnyNumber | Uint8Array) => Observable<Application>, [ApplicationId]>;
      /**
       * Budget for the working group.
       **/
      budget: AugmentedQuery<ApiType, () => Observable<BalanceOf>, []>;
      /**
       * Current group lead.
       **/
      currentLead: AugmentedQuery<ApiType, () => Observable<Option<WorkerId>>, []>;
      /**
       * Next identifier value for new worker application.
       **/
      nextApplicationId: AugmentedQuery<ApiType, () => Observable<ApplicationId>, []>;
      /**
       * Next identifier value for new job opening.
       **/
      nextOpeningId: AugmentedQuery<ApiType, () => Observable<OpeningId>, []>;
      /**
       * Next identifier for a new worker.
       **/
      nextWorkerId: AugmentedQuery<ApiType, () => Observable<WorkerId>, []>;
      /**
       * Maps identifier to job opening.
       **/
      openingById: AugmentedQuery<ApiType, (arg: OpeningId | AnyNumber | Uint8Array) => Observable<Opening>, [OpeningId]>;
      /**
       * Status text hash.
       **/
      statusTextHash: AugmentedQuery<ApiType, () => Observable<Bytes>, []>;
      /**
       * Maps identifier to corresponding worker.
       **/
      workerById: AugmentedQuery<ApiType, (arg: WorkerId | AnyNumber | Uint8Array) => Observable<Worker>, [WorkerId]>;
      /**
       * Maps identifier to corresponding worker storage.
       **/
      workerStorage: AugmentedQuery<ApiType, (arg: WorkerId | AnyNumber | Uint8Array) => Observable<Bytes>, [WorkerId]>;
      /**
       * Worker storage size upper bound.
       **/
      workerStorageSize: AugmentedQuery<ApiType, () => Observable<u16>, []>;
    };
    memo: {
      maxMemoLength: AugmentedQuery<ApiType, () => Observable<u32>, []>;
      memo: AugmentedQuery<ApiType, (arg: AccountId | string | Uint8Array) => Observable<MemoText>, [AccountId]>;
    };
    offences: {
      /**
       * A vector of reports of the same kind that happened at the same time slot.
       **/
      concurrentReportsIndex: AugmentedQuery<ApiType, (arg1: Kind | string | Uint8Array, arg2: OpaqueTimeSlot | string | Uint8Array) => Observable<Vec<ReportIdOf>>, [Kind, OpaqueTimeSlot]>;
      /**
       * Deferred reports that have been rejected by the offence handler and need to be submitted
       * at a later time.
       **/
      deferredOffences: AugmentedQuery<ApiType, () => Observable<Vec<DeferredOffenceOf>>, []>;
      /**
       * The primary structure that holds all offence records keyed by report identifiers.
       **/
      reports: AugmentedQuery<ApiType, (arg: ReportIdOf | string | Uint8Array) => Observable<Option<OffenceDetails>>, [ReportIdOf]>;
      /**
       * Enumerates all reports of a kind along with the time they happened.
       * 
       * All reports are sorted by the time of offence.
       * 
       * Note that the actual type of this mapping is `Vec<u8>`, this is because values of
       * different types are not supported at the moment so we are doing the manual serialization.
       **/
      reportsByKindIndex: AugmentedQuery<ApiType, (arg: Kind | string | Uint8Array) => Observable<Bytes>, [Kind]>;
    };
    operationsWorkingGroup: {
      /**
       * Count of active workers.
       **/
      activeWorkerCount: AugmentedQuery<ApiType, () => Observable<u32>, []>;
      /**
       * Maps identifier to worker application on opening.
       **/
      applicationById: AugmentedQuery<ApiType, (arg: ApplicationId | AnyNumber | Uint8Array) => Observable<Application>, [ApplicationId]>;
      /**
       * Budget for the working group.
       **/
      budget: AugmentedQuery<ApiType, () => Observable<BalanceOf>, []>;
      /**
       * Current group lead.
       **/
      currentLead: AugmentedQuery<ApiType, () => Observable<Option<WorkerId>>, []>;
      /**
       * Next identifier value for new worker application.
       **/
      nextApplicationId: AugmentedQuery<ApiType, () => Observable<ApplicationId>, []>;
      /**
       * Next identifier value for new job opening.
       **/
      nextOpeningId: AugmentedQuery<ApiType, () => Observable<OpeningId>, []>;
      /**
       * Next identifier for a new worker.
       **/
      nextWorkerId: AugmentedQuery<ApiType, () => Observable<WorkerId>, []>;
      /**
       * Maps identifier to job opening.
       **/
      openingById: AugmentedQuery<ApiType, (arg: OpeningId | AnyNumber | Uint8Array) => Observable<Opening>, [OpeningId]>;
      /**
       * Status text hash.
       **/
      statusTextHash: AugmentedQuery<ApiType, () => Observable<Bytes>, []>;
      /**
       * Maps identifier to corresponding worker.
       **/
      workerById: AugmentedQuery<ApiType, (arg: WorkerId | AnyNumber | Uint8Array) => Observable<Worker>, [WorkerId]>;
      /**
       * Maps identifier to corresponding worker storage.
       **/
      workerStorage: AugmentedQuery<ApiType, (arg: WorkerId | AnyNumber | Uint8Array) => Observable<Bytes>, [WorkerId]>;
      /**
       * Worker storage size upper bound.
       **/
      workerStorageSize: AugmentedQuery<ApiType, () => Observable<u16>, []>;
    };
    proposalsCodex: {
      /**
       * Map proposal id to its discussion thread id
       **/
      threadIdByProposalId: AugmentedQuery<ApiType, (arg: ProposalId | AnyNumber | Uint8Array) => Observable<ThreadId>, [ProposalId]>;
    };
    proposalsDiscussion: {
      /**
       * Count of all posts that have been created.
       **/
      postCount: AugmentedQuery<ApiType, () => Observable<u64>, []>;
      /**
       * Map thread id and post id to corresponding post.
       **/
      postThreadIdByPostId: AugmentedQuery<ApiType, (arg1: ThreadId | AnyNumber | Uint8Array, arg2: PostId | AnyNumber | Uint8Array) => Observable<DiscussionPost>, [ThreadId, PostId]>;
      /**
       * Map thread identifier to corresponding thread.
       **/
      threadById: AugmentedQuery<ApiType, (arg: ThreadId | AnyNumber | Uint8Array) => Observable<DiscussionThread>, [ThreadId]>;
      /**
       * Count of all threads that have been created.
       **/
      threadCount: AugmentedQuery<ApiType, () => Observable<u64>, []>;
    };
    proposalsEngine: {
      /**
       * Count of active proposals.
       **/
      activeProposalCount: AugmentedQuery<ApiType, () => Observable<u32>, []>;
      /**
       * Map proposal executable code by proposal id.
       **/
      dispatchableCallCode: AugmentedQuery<ApiType, (arg: ProposalId | AnyNumber | Uint8Array) => Observable<Bytes>, [ProposalId]>;
      /**
       * Count of all proposals that have been created.
       **/
      proposalCount: AugmentedQuery<ApiType, () => Observable<u32>, []>;
      /**
       * Map proposal by its id.
       **/
      proposals: AugmentedQuery<ApiType, (arg: ProposalId | AnyNumber | Uint8Array) => Observable<ProposalOf>, [ProposalId]>;
      /**
       * Double map for preventing duplicate votes. Should be cleaned after usage.
       **/
      voteExistsByProposalByVoter: AugmentedQuery<ApiType, (arg1: ProposalId | AnyNumber | Uint8Array, arg2: MemberId | AnyNumber | Uint8Array) => Observable<VoteKind>, [ProposalId, MemberId]>;
    };
    randomnessCollectiveFlip: {
      /**
       * Series of block headers from the last 81 blocks that acts as random seed material. This
       * is arranged as a ring buffer with `block_number % 81` being the index into the `Vec` of
       * the oldest hash.
       **/
      randomMaterial: AugmentedQuery<ApiType, () => Observable<Vec<Hash>>, []>;
    };
    referendum: {
      /**
       * Current referendum stage.
       **/
      stage: AugmentedQuery<ApiType, () => Observable<ReferendumStage>, []>;
      /**
       * Votes cast in the referendum. A new record is added to this map when a user casts a
       * sealed vote.
       * It is modified when a user reveals the vote's commitment proof.
       * A record is finally removed when the user unstakes, which can happen during a voting
       * stage or after the current cycle ends.
       * A stake for a vote can be reused in future referendum cycles.
       **/
      votes: AugmentedQuery<ApiType, (arg: AccountId | string | Uint8Array) => Observable<CastVoteOf>, [AccountId]>;
    };
    session: {
      /**
       * Current index of the session.
       **/
      currentIndex: AugmentedQuery<ApiType, () => Observable<SessionIndex>, []>;
      /**
       * Indices of disabled validators.
       * 
       * The set is cleared when `on_session_ending` returns a new set of identities.
       **/
      disabledValidators: AugmentedQuery<ApiType, () => Observable<Vec<u32>>, []>;
      /**
       * The owner of a key. The key is the `KeyTypeId` + the encoded key.
       **/
      keyOwner: AugmentedQuery<ApiType, (arg: ITuple<[KeyTypeId, Bytes]> | [KeyTypeId | AnyNumber | Uint8Array, Bytes | string | Uint8Array]) => Observable<Option<ValidatorId>>, [ITuple<[KeyTypeId, Bytes]>]>;
      /**
       * The next session keys for a validator.
       **/
      nextKeys: AugmentedQuery<ApiType, (arg: ValidatorId | string | Uint8Array) => Observable<Option<Keys>>, [ValidatorId]>;
      /**
       * True if the underlying economic identities or weighting behind the validators
       * has changed in the queued validator set.
       **/
      queuedChanged: AugmentedQuery<ApiType, () => Observable<bool>, []>;
      /**
       * The queued keys for the next session. When the next session begins, these keys
       * will be used to determine the validator's session keys.
       **/
      queuedKeys: AugmentedQuery<ApiType, () => Observable<Vec<ITuple<[ValidatorId, Keys]>>>, []>;
      /**
       * The current set of validators.
       **/
      validators: AugmentedQuery<ApiType, () => Observable<Vec<ValidatorId>>, []>;
    };
    staking: {
      /**
       * The active era information, it holds index and start.
       * 
       * The active era is the era currently rewarded.
       * Validator set of this era must be equal to `SessionInterface::validators`.
       **/
      activeEra: AugmentedQuery<ApiType, () => Observable<Option<ActiveEraInfo>>, []>;
      /**
       * Map from all locked "stash" accounts to the controller account.
       **/
      bonded: AugmentedQuery<ApiType, (arg: AccountId | string | Uint8Array) => Observable<Option<AccountId>>, [AccountId]>;
      /**
       * A mapping from still-bonded eras to the first session index of that era.
       * 
       * Must contains information for eras for the range:
       * `[active_era - bounding_duration; active_era]`
       **/
      bondedEras: AugmentedQuery<ApiType, () => Observable<Vec<ITuple<[EraIndex, SessionIndex]>>>, []>;
      /**
       * The amount of currency given to reporters of a slash event which was
       * canceled by extraordinary circumstances (e.g. governance).
       **/
      canceledSlashPayout: AugmentedQuery<ApiType, () => Observable<BalanceOf>, []>;
      /**
       * The current era index.
       * 
       * This is the latest planned era, depending on how the Session pallet queues the validator
       * set, it might be active or not.
       **/
      currentEra: AugmentedQuery<ApiType, () => Observable<Option<EraIndex>>, []>;
      /**
       * The earliest era for which we have a pending, unapplied slash.
       **/
      earliestUnappliedSlash: AugmentedQuery<ApiType, () => Observable<Option<EraIndex>>, []>;
      /**
       * Flag to control the execution of the offchain election. When `Open(_)`, we accept
       * solutions to be submitted.
       **/
      eraElectionStatus: AugmentedQuery<ApiType, () => Observable<ElectionStatus>, []>;
      /**
       * Rewards for the last `HISTORY_DEPTH` eras.
       * If reward hasn't been set or has been removed then 0 reward is returned.
       **/
      erasRewardPoints: AugmentedQuery<ApiType, (arg: EraIndex | AnyNumber | Uint8Array) => Observable<EraRewardPoints>, [EraIndex]>;
      /**
       * Exposure of validator at era.
       * 
       * This is keyed first by the era index to allow bulk deletion and then the stash account.
       * 
       * Is it removed after `HISTORY_DEPTH` eras.
       * If stakers hasn't been set or has been removed then empty exposure is returned.
       **/
      erasStakers: AugmentedQuery<ApiType, (arg1: EraIndex | AnyNumber | Uint8Array, arg2: AccountId | string | Uint8Array) => Observable<Exposure>, [EraIndex, AccountId]>;
      /**
       * Clipped Exposure of validator at era.
       * 
       * This is similar to [`ErasStakers`] but number of nominators exposed is reduced to the
       * `T::MaxNominatorRewardedPerValidator` biggest stakers.
       * (Note: the field `total` and `own` of the exposure remains unchanged).
       * This is used to limit the i/o cost for the nominator payout.
       * 
       * This is keyed fist by the era index to allow bulk deletion and then the stash account.
       * 
       * Is it removed after `HISTORY_DEPTH` eras.
       * If stakers hasn't been set or has been removed then empty exposure is returned.
       **/
      erasStakersClipped: AugmentedQuery<ApiType, (arg1: EraIndex | AnyNumber | Uint8Array, arg2: AccountId | string | Uint8Array) => Observable<Exposure>, [EraIndex, AccountId]>;
      /**
       * The session index at which the era start for the last `HISTORY_DEPTH` eras.
       **/
      erasStartSessionIndex: AugmentedQuery<ApiType, (arg: EraIndex | AnyNumber | Uint8Array) => Observable<Option<SessionIndex>>, [EraIndex]>;
      /**
       * The total amount staked for the last `HISTORY_DEPTH` eras.
       * If total hasn't been set or has been removed then 0 stake is returned.
       **/
      erasTotalStake: AugmentedQuery<ApiType, (arg: EraIndex | AnyNumber | Uint8Array) => Observable<BalanceOf>, [EraIndex]>;
      /**
       * Similar to `ErasStakers`, this holds the preferences of validators.
       * 
       * This is keyed first by the era index to allow bulk deletion and then the stash account.
       * 
       * Is it removed after `HISTORY_DEPTH` eras.
       **/
      erasValidatorPrefs: AugmentedQuery<ApiType, (arg1: EraIndex | AnyNumber | Uint8Array, arg2: AccountId | string | Uint8Array) => Observable<ValidatorPrefs>, [EraIndex, AccountId]>;
      /**
       * The total validator era payout for the last `HISTORY_DEPTH` eras.
       * 
       * Eras that haven't finished yet or has been removed doesn't have reward.
       **/
      erasValidatorReward: AugmentedQuery<ApiType, (arg: EraIndex | AnyNumber | Uint8Array) => Observable<Option<BalanceOf>>, [EraIndex]>;
      /**
       * Mode of era forcing.
       **/
      forceEra: AugmentedQuery<ApiType, () => Observable<Forcing>, []>;
      /**
       * Number of eras to keep in history.
       * 
       * Information is kept for eras in `[current_era - history_depth; current_era]`.
       * 
       * Must be more than the number of eras delayed by session otherwise. I.e. active era must
       * always be in history. I.e. `active_era > current_era - history_depth` must be
       * guaranteed.
       **/
      historyDepth: AugmentedQuery<ApiType, () => Observable<u32>, []>;
      /**
       * Any validators that may never be slashed or forcibly kicked. It's a Vec since they're
       * easy to initialize and the performance hit is minimal (we expect no more than four
       * invulnerables) and restricted to testnets.
       **/
      invulnerables: AugmentedQuery<ApiType, () => Observable<Vec<AccountId>>, []>;
      /**
       * True if the current **planned** session is final. Note that this does not take era
       * forcing into account.
       **/
      isCurrentSessionFinal: AugmentedQuery<ApiType, () => Observable<bool>, []>;
      /**
       * Map from all (unlocked) "controller" accounts to the info regarding the staking.
       **/
      ledger: AugmentedQuery<ApiType, (arg: AccountId | string | Uint8Array) => Observable<Option<StakingLedger>>, [AccountId]>;
      /**
       * Minimum number of staking participants before emergency conditions are imposed.
       **/
      minimumValidatorCount: AugmentedQuery<ApiType, () => Observable<u32>, []>;
      /**
       * The map from nominator stash key to the set of stash keys of all validators to nominate.
       **/
      nominators: AugmentedQuery<ApiType, (arg: AccountId | string | Uint8Array) => Observable<Option<Nominations>>, [AccountId]>;
      /**
       * All slashing events on nominators, mapped by era to the highest slash value of the era.
       **/
      nominatorSlashInEra: AugmentedQuery<ApiType, (arg1: EraIndex | AnyNumber | Uint8Array, arg2: AccountId | string | Uint8Array) => Observable<Option<BalanceOf>>, [EraIndex, AccountId]>;
      /**
       * Where the reward payment should be made. Keyed by stash.
       **/
      payee: AugmentedQuery<ApiType, (arg: AccountId | string | Uint8Array) => Observable<RewardDestination>, [AccountId]>;
      /**
       * The next validator set. At the end of an era, if this is available (potentially from the
       * result of an offchain worker), it is immediately used. Otherwise, the on-chain election
       * is executed.
       **/
      queuedElected: AugmentedQuery<ApiType, () => Observable<Option<ElectionResult>>, []>;
      /**
       * The score of the current [`QueuedElected`].
       **/
      queuedScore: AugmentedQuery<ApiType, () => Observable<Option<ElectionScore>>, []>;
      /**
       * Slashing spans for stash accounts.
       **/
      slashingSpans: AugmentedQuery<ApiType, (arg: AccountId | string | Uint8Array) => Observable<Option<SlashingSpans>>, [AccountId]>;
      /**
       * The percentage of the slash that is distributed to reporters.
       * 
       * The rest of the slashed value is handled by the `Slash`.
       **/
      slashRewardFraction: AugmentedQuery<ApiType, () => Observable<Perbill>, []>;
      /**
       * Snapshot of nominators at the beginning of the current election window. This should only
       * have a value when [`EraElectionStatus`] == `ElectionStatus::Open(_)`.
       **/
      snapshotNominators: AugmentedQuery<ApiType, () => Observable<Option<Vec<AccountId>>>, []>;
      /**
       * Snapshot of validators at the beginning of the current election window. This should only
       * have a value when [`EraElectionStatus`] == `ElectionStatus::Open(_)`.
       **/
      snapshotValidators: AugmentedQuery<ApiType, () => Observable<Option<Vec<AccountId>>>, []>;
      /**
       * Records information about the maximum slash of a stash within a slashing span,
       * as well as how much reward has been paid out.
       **/
      spanSlash: AugmentedQuery<ApiType, (arg: ITuple<[AccountId, SpanIndex]> | [AccountId | string | Uint8Array, SpanIndex | AnyNumber | Uint8Array]) => Observable<SpanRecord>, [ITuple<[AccountId, SpanIndex]>]>;
      /**
       * True if network has been upgraded to this version.
       * Storage version of the pallet.
       * 
       * This is set to v3.0.0 for new networks.
       **/
      storageVersion: AugmentedQuery<ApiType, () => Observable<Releases>, []>;
      /**
       * All unapplied slashes that are queued for later.
       **/
      unappliedSlashes: AugmentedQuery<ApiType, (arg: EraIndex | AnyNumber | Uint8Array) => Observable<Vec<UnappliedSlash>>, [EraIndex]>;
      /**
       * The ideal number of staking participants.
       **/
      validatorCount: AugmentedQuery<ApiType, () => Observable<u32>, []>;
      /**
       * The map from (wannabe) validator stash key to the preferences of that validator.
       **/
      validators: AugmentedQuery<ApiType, (arg: AccountId | string | Uint8Array) => Observable<ValidatorPrefs>, [AccountId]>;
      /**
       * All slashing events on validators, mapped by era to the highest slash proportion
       * and slash value of the era.
       **/
      validatorSlashInEra: AugmentedQuery<ApiType, (arg1: EraIndex | AnyNumber | Uint8Array, arg2: AccountId | string | Uint8Array) => Observable<Option<ITuple<[Perbill, BalanceOf]>>>, [EraIndex, AccountId]>;
    };
    storageWorkingGroup: {
      /**
       * Count of active workers.
       **/
      activeWorkerCount: AugmentedQuery<ApiType, () => Observable<u32>, []>;
      /**
       * Maps identifier to worker application on opening.
       **/
      applicationById: AugmentedQuery<ApiType, (arg: ApplicationId | AnyNumber | Uint8Array) => Observable<Application>, [ApplicationId]>;
      /**
       * Budget for the working group.
       **/
      budget: AugmentedQuery<ApiType, () => Observable<BalanceOf>, []>;
      /**
       * Current group lead.
       **/
      currentLead: AugmentedQuery<ApiType, () => Observable<Option<WorkerId>>, []>;
      /**
       * Next identifier value for new worker application.
       **/
      nextApplicationId: AugmentedQuery<ApiType, () => Observable<ApplicationId>, []>;
      /**
       * Next identifier value for new job opening.
       **/
      nextOpeningId: AugmentedQuery<ApiType, () => Observable<OpeningId>, []>;
      /**
       * Next identifier for a new worker.
       **/
      nextWorkerId: AugmentedQuery<ApiType, () => Observable<WorkerId>, []>;
      /**
       * Maps identifier to job opening.
       **/
      openingById: AugmentedQuery<ApiType, (arg: OpeningId | AnyNumber | Uint8Array) => Observable<Opening>, [OpeningId]>;
      /**
       * Status text hash.
       **/
      statusTextHash: AugmentedQuery<ApiType, () => Observable<Bytes>, []>;
      /**
       * Maps identifier to corresponding worker.
       **/
      workerById: AugmentedQuery<ApiType, (arg: WorkerId | AnyNumber | Uint8Array) => Observable<Worker>, [WorkerId]>;
      /**
       * Maps identifier to corresponding worker storage.
       **/
      workerStorage: AugmentedQuery<ApiType, (arg: WorkerId | AnyNumber | Uint8Array) => Observable<Bytes>, [WorkerId]>;
      /**
       * Worker storage size upper bound.
       **/
      workerStorageSize: AugmentedQuery<ApiType, () => Observable<u16>, []>;
    };
    sudo: {
      /**
       * The `AccountId` of the sudo key.
       **/
      key: AugmentedQuery<ApiType, () => Observable<AccountId>, []>;
    };
    system: {
      /**
       * The full account information for a particular account ID.
       **/
      account: AugmentedQuery<ApiType, (arg: AccountId | string | Uint8Array) => Observable<AccountInfo>, [AccountId]>;
      /**
       * Total length (in bytes) for all extrinsics put together, for the current block.
       **/
      allExtrinsicsLen: AugmentedQuery<ApiType, () => Observable<Option<u32>>, []>;
      /**
       * Map of block numbers to block hashes.
       **/
      blockHash: AugmentedQuery<ApiType, (arg: BlockNumber | AnyNumber | Uint8Array) => Observable<Hash>, [BlockNumber]>;
      /**
       * The current weight for the block.
       **/
      blockWeight: AugmentedQuery<ApiType, () => Observable<ExtrinsicsWeight>, []>;
      /**
       * Digest of the current block, also part of the block header.
       **/
      digest: AugmentedQuery<ApiType, () => Observable<DigestOf>, []>;
      /**
       * The number of events in the `Events<T>` list.
       **/
      eventCount: AugmentedQuery<ApiType, () => Observable<EventIndex>, []>;
      /**
       * Events deposited for the current block.
       **/
      events: AugmentedQuery<ApiType, () => Observable<Vec<EventRecord>>, []>;
      /**
       * Mapping between a topic (represented by T::Hash) and a vector of indexes
       * of events in the `<Events<T>>` list.
       * 
       * All topic vectors have deterministic storage locations depending on the topic. This
       * allows light-clients to leverage the changes trie storage tracking mechanism and
       * in case of changes fetch the list of events of interest.
       * 
       * The value has the type `(T::BlockNumber, EventIndex)` because if we used only just
       * the `EventIndex` then in case if the topic has the same contents on the next block
       * no notification will be triggered thus the event might be lost.
       **/
      eventTopics: AugmentedQuery<ApiType, (arg: Hash | string | Uint8Array) => Observable<Vec<ITuple<[BlockNumber, EventIndex]>>>, [Hash]>;
      /**
       * The execution phase of the block.
       **/
      executionPhase: AugmentedQuery<ApiType, () => Observable<Option<Phase>>, []>;
      /**
       * Total extrinsics count for the current block.
       **/
      extrinsicCount: AugmentedQuery<ApiType, () => Observable<Option<u32>>, []>;
      /**
       * Extrinsics data for the current block (maps an extrinsic's index to its data).
       **/
      extrinsicData: AugmentedQuery<ApiType, (arg: u32 | AnyNumber | Uint8Array) => Observable<Bytes>, [u32]>;
      /**
       * Extrinsics root of the current block, also part of the block header.
       **/
      extrinsicsRoot: AugmentedQuery<ApiType, () => Observable<Hash>, []>;
      /**
       * Stores the `spec_version` and `spec_name` of when the last runtime upgrade happened.
       **/
      lastRuntimeUpgrade: AugmentedQuery<ApiType, () => Observable<Option<LastRuntimeUpgradeInfo>>, []>;
      /**
       * The current block number being processed. Set by `execute_block`.
       **/
      number: AugmentedQuery<ApiType, () => Observable<BlockNumber>, []>;
      /**
       * Hash of the previous block.
       **/
      parentHash: AugmentedQuery<ApiType, () => Observable<Hash>, []>;
      /**
       * True if we have upgraded so that `type RefCount` is `u32`. False (default) if not.
       **/
      upgradedToU32RefCount: AugmentedQuery<ApiType, () => Observable<bool>, []>;
    };
    timestamp: {
      /**
       * Did the timestamp get updated in this block?
       **/
      didUpdate: AugmentedQuery<ApiType, () => Observable<bool>, []>;
      /**
       * Current time for the current block.
       **/
      now: AugmentedQuery<ApiType, () => Observable<Moment>, []>;
    };
    transactionPayment: {
      nextFeeMultiplier: AugmentedQuery<ApiType, () => Observable<Multiplier>, []>;
      storageVersion: AugmentedQuery<ApiType, () => Observable<Releases>, []>;
    };
  }

  export interface QueryableStorage<ApiType extends ApiTypes> extends AugmentedQueries<ApiType> {
  }
}
