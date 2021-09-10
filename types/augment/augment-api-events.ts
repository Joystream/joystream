// Auto-generated via `yarn polkadot-types-from-chain`, do not edit
/* eslint-disable */

import type { BTreeMap, BTreeSet, Bytes, Option, Text, Vec, bool, u32, u64, u8 } from '@polkadot/types';
import type { ActorId, ApplicationId, ApplicationIdToWorkerIdMap, ApplyOnOpeningParameters, BalanceKind, BountyActor, BountyCreationParameters, BountyId, BuyMembershipParameters, CategoryId, Channel, ChannelCategory, ChannelCategoryCreationParameters, ChannelCategoryId, ChannelCategoryUpdateParameters, ChannelCreationParameters, ChannelId, ChannelOwnershipTransferRequest, ChannelOwnershipTransferRequestId, ChannelUpdateParameters, ContentActor, ContentId, ContentParameters, CuratorGroupId, CuratorId, DataObjectStorageRelationshipId, DataObjectType, DataObjectTypeId, EntryId, ExecutionStatus, ExtendedPostId, ForumUserId, GeneralProposalParameters, InviteMembershipParameters, IsCensored, MemberId, MemoText, ModeratorId, NewAsset, OpeningId, OpeningType, OptionResult, OracleJudgment, ParticipantId, PersonCreationParameters, PersonId, PersonUpdateParameters, PlaylistCreationParameters, PlaylistId, PlaylistUpdateParameters, PollInput, PostId, PostReactionId, PrivilegedActor, ProposalDecision, ProposalDetailsOf, ProposalId, ProposalStatus, ReplyId, RewardPaymentType, Series, SeriesId, SeriesParameters, StakePolicy, StorageObjectOwner, StorageProviderId, ThreadId, ThreadMode, Title, UpdatedBody, UpdatedTitle, UploadingStatus, VideoCategoryCreationParameters, VideoCategoryId, VideoCategoryUpdateParameters, VideoCreationParameters, VideoId, VideoUpdateParameters, VoteKind, VoucherLimit, WorkerId, WorkingGroup } from './all';
import type { BalanceStatus } from '@polkadot/types/interfaces/balances';
import type { AuthorityId } from '@polkadot/types/interfaces/consensus';
import type { AuthorityList } from '@polkadot/types/interfaces/grandpa';
import type { Kind, OpaqueTimeSlot } from '@polkadot/types/interfaces/offences';
import type { AccountId, Balance, BlockNumber, Hash } from '@polkadot/types/interfaces/runtime';
import type { IdentificationTuple, SessionIndex } from '@polkadot/types/interfaces/session';
import type { ElectionCompute, EraIndex } from '@polkadot/types/interfaces/staking';
import type { DispatchError, DispatchInfo, DispatchResult } from '@polkadot/types/interfaces/system';
import type { ApiTypes } from '@polkadot/api/types';

declare module '@polkadot/api/types/events' {
  export interface AugmentedEvents<ApiType> {
    balances: {
      /**
       * A balance was set by root. \[who, free, reserved\]
       **/
      BalanceSet: AugmentedEvent<ApiType, [AccountId, Balance, Balance]>;
      /**
       * Some amount was deposited (e.g. for transaction fees). \[who, deposit\]
       **/
      Deposit: AugmentedEvent<ApiType, [AccountId, Balance]>;
      /**
       * An account was removed whose balance was non-zero but below ExistentialDeposit,
       * resulting in an outright loss. \[account, balance\]
       **/
      DustLost: AugmentedEvent<ApiType, [AccountId, Balance]>;
      /**
       * An account was created with some free balance. \[account, free_balance\]
       **/
      Endowed: AugmentedEvent<ApiType, [AccountId, Balance]>;
      /**
       * Some balance was reserved (moved from free to reserved). \[who, value\]
       **/
      Reserved: AugmentedEvent<ApiType, [AccountId, Balance]>;
      /**
       * Some balance was moved from the reserve of the first account to the second account.
       * Final argument indicates the destination balance type.
       * \[from, to, balance, destination_status\]
       **/
      ReserveRepatriated: AugmentedEvent<ApiType, [AccountId, AccountId, Balance, BalanceStatus]>;
      /**
       * Transfer succeeded. \[from, to, value\]
       **/
      Transfer: AugmentedEvent<ApiType, [AccountId, AccountId, Balance]>;
      /**
       * Some balance was unreserved (moved from reserved to free). \[who, value\]
       **/
      Unreserved: AugmentedEvent<ApiType, [AccountId, Balance]>;
    };
    blog: {
      /**
       * A reply to a reply was created
       **/
      DirectReplyCreated: AugmentedEvent<ApiType, [ParticipantId, PostId, ReplyId, ReplyId, Text, bool]>;
      /**
       * A post was created
       **/
      PostCreated: AugmentedEvent<ApiType, [PostId, Title, Text]>;
      /**
       * A post was edited
       **/
      PostEdited: AugmentedEvent<ApiType, [PostId, UpdatedTitle, UpdatedBody]>;
      /**
       * A post was locked
       **/
      PostLocked: AugmentedEvent<ApiType, [PostId]>;
      /**
       * A post was unlocked
       **/
      PostUnlocked: AugmentedEvent<ApiType, [PostId]>;
      /**
       * A reply to a post was created
       **/
      ReplyCreated: AugmentedEvent<ApiType, [ParticipantId, PostId, ReplyId, Text, bool]>;
      /**
       * A reply was deleted from storage
       **/
      ReplyDeleted: AugmentedEvent<ApiType, [ParticipantId, PostId, ReplyId, bool]>;
      /**
       * A reply was edited
       **/
      ReplyEdited: AugmentedEvent<ApiType, [ParticipantId, PostId, ReplyId, Text]>;
    };
    bounty: {
      /**
       * A bounty was canceled.
       * Params:
       * - bounty ID
       * - bounty creator
       **/
      BountyCanceled: AugmentedEvent<ApiType, [BountyId, BountyActor]>;
      /**
       * A bounty was created.
       * Params:
       * - bounty ID
       * - creation parameters
       * - bounty metadata
       **/
      BountyCreated: AugmentedEvent<ApiType, [BountyId, BountyCreationParameters, Bytes]>;
      /**
       * A bounty creator has withdrawn the cherry (member or council).
       * Params:
       * - bounty ID
       * - bounty creator
       **/
      BountyCreatorCherryWithdrawal: AugmentedEvent<ApiType, [BountyId, BountyActor]>;
      /**
       * A bounty was funded by a member or a council.
       * Params:
       * - bounty ID
       * - bounty funder
       * - funding amount
       **/
      BountyFunded: AugmentedEvent<ApiType, [BountyId, BountyActor, Balance]>;
      /**
       * A member or a council has withdrawn the funding.
       * Params:
       * - bounty ID
       * - bounty funder
       **/
      BountyFundingWithdrawal: AugmentedEvent<ApiType, [BountyId, BountyActor]>;
      /**
       * A bounty has reached its maximum funding amount.
       * Params:
       * - bounty ID
       **/
      BountyMaxFundingReached: AugmentedEvent<ApiType, [BountyId]>;
      /**
       * A bounty was removed.
       * Params:
       * - bounty ID
       **/
      BountyRemoved: AugmentedEvent<ApiType, [BountyId]>;
      /**
       * A bounty was vetoed.
       * Params:
       * - bounty ID
       **/
      BountyVetoed: AugmentedEvent<ApiType, [BountyId]>;
      /**
       * Submit oracle judgment.
       * Params:
       * - bounty ID
       * - oracle
       * - judgment data
       **/
      OracleJudgmentSubmitted: AugmentedEvent<ApiType, [BountyId, BountyActor, OracleJudgment]>;
      /**
       * Work entry was slashed.
       * Params:
       * - bounty ID
       * - entry ID
       * - entrant member ID
       **/
      WorkEntrantFundsWithdrawn: AugmentedEvent<ApiType, [BountyId, EntryId, MemberId]>;
      /**
       * Work entry was announced.
       * Params:
       * - bounty ID
       * - created entry ID
       * - entrant member ID
       * - staking account ID
       **/
      WorkEntryAnnounced: AugmentedEvent<ApiType, [BountyId, EntryId, MemberId, AccountId]>;
      /**
       * Work entry was slashed.
       * Params:
       * - bounty ID
       * - entry ID
       **/
      WorkEntrySlashed: AugmentedEvent<ApiType, [BountyId, EntryId]>;
      /**
       * Work entry was withdrawn.
       * Params:
       * - bounty ID
       * - entry ID
       * - entrant member ID
       **/
      WorkEntryWithdrawn: AugmentedEvent<ApiType, [BountyId, EntryId, MemberId]>;
      /**
       * Submit work.
       * Params:
       * - bounty ID
       * - created entry ID
       * - entrant member ID
       * - work data (description, URL, BLOB, etc.)
       **/
      WorkSubmitted: AugmentedEvent<ApiType, [BountyId, EntryId, MemberId, Bytes]>;
    };
    constitution: {
      /**
       * Emits on constitution amendment.
       * Parameters:
       * - constitution text hash
       * - constitution text
       **/
      ConstutionAmended: AugmentedEvent<ApiType, [Bytes, Bytes]>;
    };
    content: {
      ChannelAssetsRemoved: AugmentedEvent<ApiType, [ContentActor, ChannelId, Vec<ContentId>]>;
      ChannelCategoryCreated: AugmentedEvent<ApiType, [ChannelCategoryId, ChannelCategory, ChannelCategoryCreationParameters]>;
      ChannelCategoryDeleted: AugmentedEvent<ApiType, [ContentActor, ChannelCategoryId]>;
      ChannelCategoryUpdated: AugmentedEvent<ApiType, [ContentActor, ChannelCategoryId, ChannelCategoryUpdateParameters]>;
      ChannelCensorshipStatusUpdated: AugmentedEvent<ApiType, [ContentActor, ChannelId, IsCensored, Bytes]>;
      ChannelCreated: AugmentedEvent<ApiType, [ContentActor, ChannelId, Channel, ChannelCreationParameters]>;
      ChannelOwnershipTransferred: AugmentedEvent<ApiType, [ContentActor, ChannelOwnershipTransferRequestId]>;
      ChannelOwnershipTransferRequested: AugmentedEvent<ApiType, [ContentActor, ChannelOwnershipTransferRequestId, ChannelOwnershipTransferRequest]>;
      ChannelOwnershipTransferRequestWithdrawn: AugmentedEvent<ApiType, [ContentActor, ChannelOwnershipTransferRequestId]>;
      ChannelUpdated: AugmentedEvent<ApiType, [ContentActor, ChannelId, Channel, ChannelUpdateParameters]>;
      CuratorAdded: AugmentedEvent<ApiType, [CuratorGroupId, CuratorId]>;
      CuratorGroupCreated: AugmentedEvent<ApiType, [CuratorGroupId]>;
      CuratorGroupStatusSet: AugmentedEvent<ApiType, [CuratorGroupId, bool]>;
      CuratorRemoved: AugmentedEvent<ApiType, [CuratorGroupId, CuratorId]>;
      FeaturedVideosSet: AugmentedEvent<ApiType, [ContentActor, Vec<VideoId>]>;
      PersonCreated: AugmentedEvent<ApiType, [ContentActor, PersonId, Vec<NewAsset>, PersonCreationParameters]>;
      PersonDeleted: AugmentedEvent<ApiType, [ContentActor, PersonId]>;
      PersonUpdated: AugmentedEvent<ApiType, [ContentActor, PersonId, Vec<NewAsset>, PersonUpdateParameters]>;
      PlaylistCreated: AugmentedEvent<ApiType, [ContentActor, PlaylistId, PlaylistCreationParameters]>;
      PlaylistDeleted: AugmentedEvent<ApiType, [ContentActor, PlaylistId]>;
      PlaylistUpdated: AugmentedEvent<ApiType, [ContentActor, PlaylistId, PlaylistUpdateParameters]>;
      SeriesCreated: AugmentedEvent<ApiType, [ContentActor, SeriesId, Vec<NewAsset>, SeriesParameters, Series]>;
      SeriesDeleted: AugmentedEvent<ApiType, [ContentActor, SeriesId]>;
      SeriesUpdated: AugmentedEvent<ApiType, [ContentActor, SeriesId, Vec<NewAsset>, SeriesParameters, Series]>;
      VideoCategoryCreated: AugmentedEvent<ApiType, [ContentActor, VideoCategoryId, VideoCategoryCreationParameters]>;
      VideoCategoryDeleted: AugmentedEvent<ApiType, [ContentActor, VideoCategoryId]>;
      VideoCategoryUpdated: AugmentedEvent<ApiType, [ContentActor, VideoCategoryId, VideoCategoryUpdateParameters]>;
      VideoCensorshipStatusUpdated: AugmentedEvent<ApiType, [ContentActor, VideoId, IsCensored, Bytes]>;
      VideoCreated: AugmentedEvent<ApiType, [ContentActor, ChannelId, VideoId, VideoCreationParameters]>;
      VideoDeleted: AugmentedEvent<ApiType, [ContentActor, VideoId]>;
      VideoUpdated: AugmentedEvent<ApiType, [ContentActor, VideoId, VideoUpdateParameters]>;
    };
    contentDirectoryWorkingGroup: {
      /**
       * Emits on withdrawing the application for the regular worker/lead opening.
       * Params:
       * - Job application id
       **/
      ApplicationWithdrawn: AugmentedEvent<ApiType, [ApplicationId]>;
      /**
       * Emits on adding the application for the worker opening.
       * Params:
       * - Opening parameteres
       * - Application id
       **/
      AppliedOnOpening: AugmentedEvent<ApiType, [ApplyOnOpeningParameters, ApplicationId]>;
      /**
       * Emits on setting the budget for the working group.
       * Params:
       * - new budget
       **/
      BudgetSet: AugmentedEvent<ApiType, [Balance]>;
      /**
       * Emits on budget from the working group being spent
       * Params:
       * - Receiver Account Id.
       * - Balance spent.
       * - Rationale.
       **/
      BudgetSpending: AugmentedEvent<ApiType, [AccountId, Balance, Option<Bytes>]>;
      /**
       * Emits on setting the group leader.
       * Params:
       * - Group worker id.
       **/
      LeaderSet: AugmentedEvent<ApiType, [WorkerId]>;
      /**
       * Emits on un-setting the leader.
       **/
      LeaderUnset: AugmentedEvent<ApiType, []>;
      /**
       * Emits on reaching new missed reward.
       * Params:
       * - Worker ID.
       * - Missed reward (optional). None means 'no missed reward'.
       **/
      NewMissedRewardLevelReached: AugmentedEvent<ApiType, [WorkerId, Option<Balance>]>;
      /**
       * Emits on adding new job opening.
       * Params:
       * - Opening id
       * - Description
       * - Opening Type(Lead or Worker)
       * - Stake Policy for the opening
       * - Reward per block
       **/
      OpeningAdded: AugmentedEvent<ApiType, [OpeningId, Bytes, OpeningType, StakePolicy, Option<Balance>]>;
      /**
       * Emits on canceling the job opening.
       * Params:
       * - Opening id
       **/
      OpeningCanceled: AugmentedEvent<ApiType, [OpeningId]>;
      /**
       * Emits on filling the job opening.
       * Params:
       * - Worker opening id
       * - Worker application id to the worker id dictionary
       * - Applicationd ids used to fill the opening
       **/
      OpeningFilled: AugmentedEvent<ApiType, [OpeningId, ApplicationIdToWorkerIdMap, BTreeSet<ApplicationId>]>;
      /**
       * Emits on paying the reward.
       * Params:
       * - Id of the worker.
       * - Receiver Account Id.
       * - Reward
       * - Payment type (missed reward or regular one)
       **/
      RewardPaid: AugmentedEvent<ApiType, [WorkerId, AccountId, Balance, RewardPaymentType]>;
      /**
       * Emits on decreasing the regular worker/lead stake.
       * Params:
       * - regular worker/lead id.
       * - stake delta amount
       **/
      StakeDecreased: AugmentedEvent<ApiType, [WorkerId, Balance]>;
      /**
       * Emits on increasing the regular worker/lead stake.
       * Params:
       * - regular worker/lead id.
       * - stake delta amount
       **/
      StakeIncreased: AugmentedEvent<ApiType, [WorkerId, Balance]>;
      /**
       * Emits on slashing the regular worker/lead stake.
       * Params:
       * - regular worker/lead id.
       * - actual slashed balance.
       * - Requested slashed balance.
       * - Rationale.
       **/
      StakeSlashed: AugmentedEvent<ApiType, [WorkerId, Balance, Balance, Option<Bytes>]>;
      /**
       * Emits on updating the status text of the working group.
       * Params:
       * - status text hash
       * - status text
       **/
      StatusTextChanged: AugmentedEvent<ApiType, [Bytes, Option<Bytes>]>;
      /**
       * Emits on terminating the leader.
       * Params:
       * - leader worker id.
       * - Penalty.
       * - Rationale.
       **/
      TerminatedLeader: AugmentedEvent<ApiType, [WorkerId, Option<Balance>, Option<Bytes>]>;
      /**
       * Emits on terminating the worker.
       * Params:
       * - worker id.
       * - Penalty.
       * - Rationale.
       **/
      TerminatedWorker: AugmentedEvent<ApiType, [WorkerId, Option<Balance>, Option<Bytes>]>;
      /**
       * Emits on exiting the worker.
       * Params:
       * - worker id.
       * - Rationale.
       **/
      WorkerExited: AugmentedEvent<ApiType, [WorkerId]>;
      /**
       * Emits on updating the reward account of the worker.
       * Params:
       * - Id of the worker.
       * - Reward account id of the worker.
       **/
      WorkerRewardAccountUpdated: AugmentedEvent<ApiType, [WorkerId, AccountId]>;
      /**
       * Emits on updating the reward amount of the worker.
       * Params:
       * - Id of the worker.
       * - Reward per block
       **/
      WorkerRewardAmountUpdated: AugmentedEvent<ApiType, [WorkerId, Option<Balance>]>;
      /**
       * Emits on updating the role account of the worker.
       * Params:
       * - Id of the worker.
       * - Role account id of the worker.
       **/
      WorkerRoleAccountUpdated: AugmentedEvent<ApiType, [WorkerId, AccountId]>;
      /**
       * Emits when worker started leaving their role.
       * Params:
       * - Worker id.
       * - Rationale.
       **/
      WorkerStartedLeaving: AugmentedEvent<ApiType, [WorkerId, Option<Bytes>]>;
      /**
       * Emits on updating the worker storage role.
       * Params:
       * - Id of the worker.
       * - Raw storage field.
       **/
      WorkerStorageUpdated: AugmentedEvent<ApiType, [WorkerId, Bytes]>;
    };
    council: {
      /**
       * New council was elected
       **/
      AnnouncingPeriodStarted: AugmentedEvent<ApiType, []>;
      /**
       * Budget balance was changed by the root.
       **/
      BudgetBalanceSet: AugmentedEvent<ApiType, [Balance]>;
      /**
       * Budget increment has been updated.
       **/
      BudgetIncrementUpdated: AugmentedEvent<ApiType, [Balance]>;
      /**
       * Budget balance was increased by automatic refill.
       **/
      BudgetRefill: AugmentedEvent<ApiType, [Balance]>;
      /**
       * The next budget refill was planned.
       **/
      BudgetRefillPlanned: AugmentedEvent<ApiType, [BlockNumber]>;
      /**
       * The candidate has set a new note for their candidacy
       **/
      CandidacyNoteSet: AugmentedEvent<ApiType, [MemberId, Bytes]>;
      /**
       * Candidacy stake that was no longer needed was released
       **/
      CandidacyStakeRelease: AugmentedEvent<ApiType, [MemberId]>;
      /**
       * Candidate has withdrawn his candidacy
       **/
      CandidacyWithdraw: AugmentedEvent<ApiType, [MemberId]>;
      /**
       * Councilor reward has been updated.
       **/
      CouncilorRewardUpdated: AugmentedEvent<ApiType, [Balance]>;
      /**
       * New candidate announced
       **/
      NewCandidate: AugmentedEvent<ApiType, [MemberId, AccountId, AccountId, Balance]>;
      /**
       * New council was elected and appointed
       **/
      NewCouncilElected: AugmentedEvent<ApiType, [Vec<MemberId>]>;
      /**
       * New council was elected and appointed
       **/
      NewCouncilNotElected: AugmentedEvent<ApiType, []>;
      /**
       * Announcing period can't finish because of insufficient candidtate count
       **/
      NotEnoughCandidates: AugmentedEvent<ApiType, []>;
      /**
       * Request has been funded
       **/
      RequestFunded: AugmentedEvent<ApiType, [AccountId, Balance]>;
      /**
       * The whole reward was paid to the council member.
       **/
      RewardPayment: AugmentedEvent<ApiType, [MemberId, AccountId, Balance, Balance]>;
      /**
       * Candidates are announced and voting starts
       **/
      VotingPeriodStarted: AugmentedEvent<ApiType, [u64]>;
    };
    dataDirectory: {
      /**
       * Emits when the storage provider accepts a content.
       * Params:
       * - Id of the relationship.
       * - Id of the storage provider.
       **/
      ContentAccepted: AugmentedEvent<ApiType, [ContentId, StorageProviderId]>;
      /**
       * Emits on adding of the content.
       * Params:
       * - Content parameters representation.
       * - StorageObjectOwner enum.
       **/
      ContentAdded: AugmentedEvent<ApiType, [Vec<ContentParameters>, StorageObjectOwner]>;
      /**
       * Emits when the storage provider rejects a content.
       * Params:
       * - Id of the relationship.
       * - Id of the storage provider.
       **/
      ContentRejected: AugmentedEvent<ApiType, [ContentId, StorageProviderId]>;
      /**
       * Emits on content removal.
       * Params:
       * - Content parameters representation.
       * - StorageObjectOwner enum.
       **/
      ContentRemoved: AugmentedEvent<ApiType, [Vec<ContentId>, StorageObjectOwner]>;
      /**
       * Emits when the content uploading status update performed.
       * Params:
       * - UploadingStatus bool flag.
       **/
      ContentUploadingStatusUpdated: AugmentedEvent<ApiType, [UploadingStatus]>;
      /**
       * Emits when the lead sets a new default voucher
       * Params:
       * - New size limit
       * - New objects limit
       **/
      DefaultVoucherUpdated: AugmentedEvent<ApiType, [u64, u64]>;
      /**
       * Emits when the global voucher objects limit is updated.
       * Params:
       * - New limit
       **/
      GlobalVoucherObjectsLimitUpdated: AugmentedEvent<ApiType, [u64]>;
      /**
       * Emits when the global voucher size limit is updated.
       * Params:
       * - New limit
       **/
      GlobalVoucherSizeLimitUpdated: AugmentedEvent<ApiType, [u64]>;
      /**
       * Emits when the storage object owner voucher objects limit update performed.
       * Params:
       * - StorageObjectOwner enum.
       * - voucher objects limit.
       **/
      StorageObjectOwnerVoucherObjectsLimitUpdated: AugmentedEvent<ApiType, [StorageObjectOwner, VoucherLimit]>;
      /**
       * Emits when the storage object owner voucher size limit update performed.
       * Params:
       * - StorageObjectOwner enum.
       * - voucher size limit.
       **/
      StorageObjectOwnerVoucherSizeLimitUpdated: AugmentedEvent<ApiType, [StorageObjectOwner, VoucherLimit]>;
      /**
       * Emits when the objects limit upper bound is updated.
       * Params:
       * - New Upper bound
       **/
      VoucherObjectsLimitUpperBoundUpdated: AugmentedEvent<ApiType, [u64]>;
      /**
       * Emits when the size limit upper bound is updated.
       * Params:
       * - New Upper bound
       **/
      VoucherSizeLimitUpperBoundUpdated: AugmentedEvent<ApiType, [u64]>;
    };
    dataObjectStorageRegistry: {
      /**
       * Emits on adding of the data object storage relationship.
       * Params:
       * - Id of the relationship.
       * - Id of the content.
       * - Id of the storage provider.
       **/
      DataObjectStorageRelationshipAdded: AugmentedEvent<ApiType, [DataObjectStorageRelationshipId, ContentId, StorageProviderId]>;
      /**
       * Emits on adding of the data object storage relationship.
       * Params:
       * - Id of the storage provider.
       * - Id of the relationship.
       * - Current state of the relationship (True=Active).
       **/
      DataObjectStorageRelationshipReadyUpdated: AugmentedEvent<ApiType, [StorageProviderId, DataObjectStorageRelationshipId, bool]>;
    };
    dataObjectTypeRegistry: {
      /**
       * Emits on the data object type registration.
       * Params:
       * - DataObjectType
       * - Id of the new data object type.
       **/
      DataObjectTypeRegistered: AugmentedEvent<ApiType, [DataObjectType, DataObjectTypeId]>;
      /**
       * Emits on the data object type update.
       * Params:
       * - Id of the updated data object type.
       * - DataObjectType
       **/
      DataObjectTypeUpdated: AugmentedEvent<ApiType, [DataObjectTypeId, DataObjectType]>;
    };
    forum: {
      /**
       * An arhical status of category with given id was updated.
       * The second argument reflects the new archival status of the category.
       **/
      CategoryArchivalStatusUpdated: AugmentedEvent<ApiType, [CategoryId, bool, PrivilegedActor]>;
      /**
       * A category was introduced
       **/
      CategoryCreated: AugmentedEvent<ApiType, [CategoryId, Option<CategoryId>, Bytes, Bytes]>;
      /**
       * A category was deleted
       **/
      CategoryDeleted: AugmentedEvent<ApiType, [CategoryId, PrivilegedActor]>;
      /**
       * A discription of category with given id was updated.
       * The second argument reflects the new description hash of the category.
       **/
      CategoryDescriptionUpdated: AugmentedEvent<ApiType, [CategoryId, Hash, PrivilegedActor]>;
      /**
       * An moderator ability to moderate a category and its subcategories updated
       **/
      CategoryMembershipOfModeratorUpdated: AugmentedEvent<ApiType, [ModeratorId, CategoryId, bool]>;
      /**
       * Sticky thread updated for category
       **/
      CategoryStickyThreadUpdate: AugmentedEvent<ApiType, [CategoryId, Vec<ThreadId>, PrivilegedActor]>;
      /**
       * A title of category with given id was updated.
       * The second argument reflects the new title hash of the category.
       **/
      CategoryTitleUpdated: AugmentedEvent<ApiType, [CategoryId, Hash, PrivilegedActor]>;
      /**
       * Post with given id was created.
       **/
      PostAdded: AugmentedEvent<ApiType, [PostId, ForumUserId, CategoryId, ThreadId, Bytes, bool]>;
      /**
       * Post with givne id was deleted.
       **/
      PostDeleted: AugmentedEvent<ApiType, [Bytes, ForumUserId, BTreeMap<ExtendedPostId, bool>]>;
      /**
       * Post with givne id was moderated.
       **/
      PostModerated: AugmentedEvent<ApiType, [PostId, Bytes, PrivilegedActor, CategoryId, ThreadId]>;
      /**
       * Thumb up post
       **/
      PostReacted: AugmentedEvent<ApiType, [ForumUserId, PostId, PostReactionId, CategoryId, ThreadId]>;
      /**
       * Post with given id had its text updated.
       * The second argument reflects the number of total edits when the text update occurs.
       **/
      PostTextUpdated: AugmentedEvent<ApiType, [PostId, ForumUserId, CategoryId, ThreadId, Bytes]>;
      /**
       * A thread with given id was created.
       * A third argument reflects the initial post id of the thread.
       **/
      ThreadCreated: AugmentedEvent<ApiType, [CategoryId, ThreadId, PostId, ForumUserId, Bytes, Bytes, Option<PollInput>]>;
      /**
       * A thread was deleted.
       **/
      ThreadDeleted: AugmentedEvent<ApiType, [ThreadId, ForumUserId, CategoryId, bool]>;
      /**
       * A thread metadata given id was updated.
       **/
      ThreadMetadataUpdated: AugmentedEvent<ApiType, [ThreadId, ForumUserId, CategoryId, Bytes]>;
      /**
       * A thread with given id was moderated.
       **/
      ThreadModerated: AugmentedEvent<ApiType, [ThreadId, Bytes, PrivilegedActor, CategoryId]>;
      /**
       * A thread was moved to new category
       **/
      ThreadMoved: AugmentedEvent<ApiType, [ThreadId, CategoryId, PrivilegedActor, CategoryId]>;
      /**
       * A thread with given id was updated.
       * The second argument reflects the new archival status of the thread.
       **/
      ThreadUpdated: AugmentedEvent<ApiType, [ThreadId, bool, PrivilegedActor, CategoryId]>;
      /**
       * Vote on poll
       **/
      VoteOnPoll: AugmentedEvent<ApiType, [ThreadId, u32, ForumUserId, CategoryId]>;
    };
    forumWorkingGroup: {
      /**
       * Emits on withdrawing the application for the regular worker/lead opening.
       * Params:
       * - Job application id
       **/
      ApplicationWithdrawn: AugmentedEvent<ApiType, [ApplicationId]>;
      /**
       * Emits on adding the application for the worker opening.
       * Params:
       * - Opening parameteres
       * - Application id
       **/
      AppliedOnOpening: AugmentedEvent<ApiType, [ApplyOnOpeningParameters, ApplicationId]>;
      /**
       * Emits on setting the budget for the working group.
       * Params:
       * - new budget
       **/
      BudgetSet: AugmentedEvent<ApiType, [Balance]>;
      /**
       * Emits on budget from the working group being spent
       * Params:
       * - Receiver Account Id.
       * - Balance spent.
       * - Rationale.
       **/
      BudgetSpending: AugmentedEvent<ApiType, [AccountId, Balance, Option<Bytes>]>;
      /**
       * Emits on setting the group leader.
       * Params:
       * - Group worker id.
       **/
      LeaderSet: AugmentedEvent<ApiType, [WorkerId]>;
      /**
       * Emits on un-setting the leader.
       **/
      LeaderUnset: AugmentedEvent<ApiType, []>;
      /**
       * Emits on reaching new missed reward.
       * Params:
       * - Worker ID.
       * - Missed reward (optional). None means 'no missed reward'.
       **/
      NewMissedRewardLevelReached: AugmentedEvent<ApiType, [WorkerId, Option<Balance>]>;
      /**
       * Emits on adding new job opening.
       * Params:
       * - Opening id
       * - Description
       * - Opening Type(Lead or Worker)
       * - Stake Policy for the opening
       * - Reward per block
       **/
      OpeningAdded: AugmentedEvent<ApiType, [OpeningId, Bytes, OpeningType, StakePolicy, Option<Balance>]>;
      /**
       * Emits on canceling the job opening.
       * Params:
       * - Opening id
       **/
      OpeningCanceled: AugmentedEvent<ApiType, [OpeningId]>;
      /**
       * Emits on filling the job opening.
       * Params:
       * - Worker opening id
       * - Worker application id to the worker id dictionary
       * - Applicationd ids used to fill the opening
       **/
      OpeningFilled: AugmentedEvent<ApiType, [OpeningId, ApplicationIdToWorkerIdMap, BTreeSet<ApplicationId>]>;
      /**
       * Emits on paying the reward.
       * Params:
       * - Id of the worker.
       * - Receiver Account Id.
       * - Reward
       * - Payment type (missed reward or regular one)
       **/
      RewardPaid: AugmentedEvent<ApiType, [WorkerId, AccountId, Balance, RewardPaymentType]>;
      /**
       * Emits on decreasing the regular worker/lead stake.
       * Params:
       * - regular worker/lead id.
       * - stake delta amount
       **/
      StakeDecreased: AugmentedEvent<ApiType, [WorkerId, Balance]>;
      /**
       * Emits on increasing the regular worker/lead stake.
       * Params:
       * - regular worker/lead id.
       * - stake delta amount
       **/
      StakeIncreased: AugmentedEvent<ApiType, [WorkerId, Balance]>;
      /**
       * Emits on slashing the regular worker/lead stake.
       * Params:
       * - regular worker/lead id.
       * - actual slashed balance.
       * - Requested slashed balance.
       * - Rationale.
       **/
      StakeSlashed: AugmentedEvent<ApiType, [WorkerId, Balance, Balance, Option<Bytes>]>;
      /**
       * Emits on updating the status text of the working group.
       * Params:
       * - status text hash
       * - status text
       **/
      StatusTextChanged: AugmentedEvent<ApiType, [Bytes, Option<Bytes>]>;
      /**
       * Emits on terminating the leader.
       * Params:
       * - leader worker id.
       * - Penalty.
       * - Rationale.
       **/
      TerminatedLeader: AugmentedEvent<ApiType, [WorkerId, Option<Balance>, Option<Bytes>]>;
      /**
       * Emits on terminating the worker.
       * Params:
       * - worker id.
       * - Penalty.
       * - Rationale.
       **/
      TerminatedWorker: AugmentedEvent<ApiType, [WorkerId, Option<Balance>, Option<Bytes>]>;
      /**
       * Emits on exiting the worker.
       * Params:
       * - worker id.
       * - Rationale.
       **/
      WorkerExited: AugmentedEvent<ApiType, [WorkerId]>;
      /**
       * Emits on updating the reward account of the worker.
       * Params:
       * - Id of the worker.
       * - Reward account id of the worker.
       **/
      WorkerRewardAccountUpdated: AugmentedEvent<ApiType, [WorkerId, AccountId]>;
      /**
       * Emits on updating the reward amount of the worker.
       * Params:
       * - Id of the worker.
       * - Reward per block
       **/
      WorkerRewardAmountUpdated: AugmentedEvent<ApiType, [WorkerId, Option<Balance>]>;
      /**
       * Emits on updating the role account of the worker.
       * Params:
       * - Id of the worker.
       * - Role account id of the worker.
       **/
      WorkerRoleAccountUpdated: AugmentedEvent<ApiType, [WorkerId, AccountId]>;
      /**
       * Emits when worker started leaving their role.
       * Params:
       * - Worker id.
       * - Rationale.
       **/
      WorkerStartedLeaving: AugmentedEvent<ApiType, [WorkerId, Option<Bytes>]>;
      /**
       * Emits on updating the worker storage role.
       * Params:
       * - Id of the worker.
       * - Raw storage field.
       **/
      WorkerStorageUpdated: AugmentedEvent<ApiType, [WorkerId, Bytes]>;
    };
    gatewayWorkingGroup: {
      /**
       * Emits on withdrawing the application for the regular worker/lead opening.
       * Params:
       * - Job application id
       **/
      ApplicationWithdrawn: AugmentedEvent<ApiType, [ApplicationId]>;
      /**
       * Emits on adding the application for the worker opening.
       * Params:
       * - Opening parameteres
       * - Application id
       **/
      AppliedOnOpening: AugmentedEvent<ApiType, [ApplyOnOpeningParameters, ApplicationId]>;
      /**
       * Emits on setting the budget for the working group.
       * Params:
       * - new budget
       **/
      BudgetSet: AugmentedEvent<ApiType, [Balance]>;
      /**
       * Emits on budget from the working group being spent
       * Params:
       * - Receiver Account Id.
       * - Balance spent.
       * - Rationale.
       **/
      BudgetSpending: AugmentedEvent<ApiType, [AccountId, Balance, Option<Bytes>]>;
      /**
       * Emits on setting the group leader.
       * Params:
       * - Group worker id.
       **/
      LeaderSet: AugmentedEvent<ApiType, [WorkerId]>;
      /**
       * Emits on un-setting the leader.
       **/
      LeaderUnset: AugmentedEvent<ApiType, []>;
      /**
       * Emits on reaching new missed reward.
       * Params:
       * - Worker ID.
       * - Missed reward (optional). None means 'no missed reward'.
       **/
      NewMissedRewardLevelReached: AugmentedEvent<ApiType, [WorkerId, Option<Balance>]>;
      /**
       * Emits on adding new job opening.
       * Params:
       * - Opening id
       * - Description
       * - Opening Type(Lead or Worker)
       * - Stake Policy for the opening
       * - Reward per block
       **/
      OpeningAdded: AugmentedEvent<ApiType, [OpeningId, Bytes, OpeningType, StakePolicy, Option<Balance>]>;
      /**
       * Emits on canceling the job opening.
       * Params:
       * - Opening id
       **/
      OpeningCanceled: AugmentedEvent<ApiType, [OpeningId]>;
      /**
       * Emits on filling the job opening.
       * Params:
       * - Worker opening id
       * - Worker application id to the worker id dictionary
       * - Applicationd ids used to fill the opening
       **/
      OpeningFilled: AugmentedEvent<ApiType, [OpeningId, ApplicationIdToWorkerIdMap, BTreeSet<ApplicationId>]>;
      /**
       * Emits on paying the reward.
       * Params:
       * - Id of the worker.
       * - Receiver Account Id.
       * - Reward
       * - Payment type (missed reward or regular one)
       **/
      RewardPaid: AugmentedEvent<ApiType, [WorkerId, AccountId, Balance, RewardPaymentType]>;
      /**
       * Emits on decreasing the regular worker/lead stake.
       * Params:
       * - regular worker/lead id.
       * - stake delta amount
       **/
      StakeDecreased: AugmentedEvent<ApiType, [WorkerId, Balance]>;
      /**
       * Emits on increasing the regular worker/lead stake.
       * Params:
       * - regular worker/lead id.
       * - stake delta amount
       **/
      StakeIncreased: AugmentedEvent<ApiType, [WorkerId, Balance]>;
      /**
       * Emits on slashing the regular worker/lead stake.
       * Params:
       * - regular worker/lead id.
       * - actual slashed balance.
       * - Requested slashed balance.
       * - Rationale.
       **/
      StakeSlashed: AugmentedEvent<ApiType, [WorkerId, Balance, Balance, Option<Bytes>]>;
      /**
       * Emits on updating the status text of the working group.
       * Params:
       * - status text hash
       * - status text
       **/
      StatusTextChanged: AugmentedEvent<ApiType, [Bytes, Option<Bytes>]>;
      /**
       * Emits on terminating the leader.
       * Params:
       * - leader worker id.
       * - Penalty.
       * - Rationale.
       **/
      TerminatedLeader: AugmentedEvent<ApiType, [WorkerId, Option<Balance>, Option<Bytes>]>;
      /**
       * Emits on terminating the worker.
       * Params:
       * - worker id.
       * - Penalty.
       * - Rationale.
       **/
      TerminatedWorker: AugmentedEvent<ApiType, [WorkerId, Option<Balance>, Option<Bytes>]>;
      /**
       * Emits on exiting the worker.
       * Params:
       * - worker id.
       * - Rationale.
       **/
      WorkerExited: AugmentedEvent<ApiType, [WorkerId]>;
      /**
       * Emits on updating the reward account of the worker.
       * Params:
       * - Id of the worker.
       * - Reward account id of the worker.
       **/
      WorkerRewardAccountUpdated: AugmentedEvent<ApiType, [WorkerId, AccountId]>;
      /**
       * Emits on updating the reward amount of the worker.
       * Params:
       * - Id of the worker.
       * - Reward per block
       **/
      WorkerRewardAmountUpdated: AugmentedEvent<ApiType, [WorkerId, Option<Balance>]>;
      /**
       * Emits on updating the role account of the worker.
       * Params:
       * - Id of the worker.
       * - Role account id of the worker.
       **/
      WorkerRoleAccountUpdated: AugmentedEvent<ApiType, [WorkerId, AccountId]>;
      /**
       * Emits when worker started leaving their role.
       * Params:
       * - Worker id.
       * - Rationale.
       **/
      WorkerStartedLeaving: AugmentedEvent<ApiType, [WorkerId, Option<Bytes>]>;
      /**
       * Emits on updating the worker storage role.
       * Params:
       * - Id of the worker.
       * - Raw storage field.
       **/
      WorkerStorageUpdated: AugmentedEvent<ApiType, [WorkerId, Bytes]>;
    };
    grandpa: {
      /**
       * New authority set has been applied. \[authority_set\]
       **/
      NewAuthorities: AugmentedEvent<ApiType, [AuthorityList]>;
      /**
       * Current authority set has been paused.
       **/
      Paused: AugmentedEvent<ApiType, []>;
      /**
       * Current authority set has been resumed.
       **/
      Resumed: AugmentedEvent<ApiType, []>;
    };
    imOnline: {
      /**
       * At the end of the session, no offence was committed.
       **/
      AllGood: AugmentedEvent<ApiType, []>;
      /**
       * A new heartbeat was received from `AuthorityId` \[authority_id\]
       **/
      HeartbeatReceived: AugmentedEvent<ApiType, [AuthorityId]>;
      /**
       * At the end of the session, at least one validator was found to be \[offline\].
       **/
      SomeOffline: AugmentedEvent<ApiType, [Vec<IdentificationTuple>]>;
    };
    joystreamUtility: {
      /**
       * A runtime upgrade was executed
       * Params:
       * - New code encoded in bytes
       **/
      RuntimeUpgraded: AugmentedEvent<ApiType, [Bytes]>;
      /**
       * A signal proposal was executed
       * Params:
       * - Signal given when creating the corresponding proposal
       **/
      Signaled: AugmentedEvent<ApiType, [Bytes]>;
      /**
       * An account burned tokens
       * Params:
       * - Account Id of the burning tokens
       * - Balance burned from that account
       **/
      TokensBurned: AugmentedEvent<ApiType, [AccountId, Balance]>;
      /**
       * An `Update Working Group Budget` proposal was executed
       * Params:
       * - Working group which budget is being updated
       * - Amount of balance being moved
       * - Enum variant with positive indicating funds moved torwards working group and negative
       * and negative funds moving from the working group
       **/
      UpdatedWorkingGroupBudget: AugmentedEvent<ApiType, [WorkingGroup, Balance, BalanceKind]>;
    };
    members: {
      InitialInvitationBalanceUpdated: AugmentedEvent<ApiType, [Balance]>;
      InitialInvitationCountUpdated: AugmentedEvent<ApiType, [u32]>;
      InvitesTransferred: AugmentedEvent<ApiType, [MemberId, MemberId, u32]>;
      LeaderInvitationQuotaUpdated: AugmentedEvent<ApiType, [u32]>;
      MemberAccountsUpdated: AugmentedEvent<ApiType, [MemberId, Option<AccountId>, Option<AccountId>]>;
      MemberInvited: AugmentedEvent<ApiType, [MemberId, InviteMembershipParameters]>;
      MemberProfileUpdated: AugmentedEvent<ApiType, [MemberId, Option<Bytes>, Option<Bytes>]>;
      MembershipBought: AugmentedEvent<ApiType, [MemberId, BuyMembershipParameters]>;
      MembershipPriceUpdated: AugmentedEvent<ApiType, [Balance]>;
      MemberVerificationStatusUpdated: AugmentedEvent<ApiType, [MemberId, bool, ActorId]>;
      ReferralCutUpdated: AugmentedEvent<ApiType, [u8]>;
      StakingAccountAdded: AugmentedEvent<ApiType, [AccountId, MemberId]>;
      StakingAccountConfirmed: AugmentedEvent<ApiType, [AccountId, MemberId]>;
      StakingAccountRemoved: AugmentedEvent<ApiType, [AccountId, MemberId]>;
    };
    membershipWorkingGroup: {
      /**
       * Emits on withdrawing the application for the regular worker/lead opening.
       * Params:
       * - Job application id
       **/
      ApplicationWithdrawn: AugmentedEvent<ApiType, [ApplicationId]>;
      /**
       * Emits on adding the application for the worker opening.
       * Params:
       * - Opening parameteres
       * - Application id
       **/
      AppliedOnOpening: AugmentedEvent<ApiType, [ApplyOnOpeningParameters, ApplicationId]>;
      /**
       * Emits on setting the budget for the working group.
       * Params:
       * - new budget
       **/
      BudgetSet: AugmentedEvent<ApiType, [Balance]>;
      /**
       * Emits on budget from the working group being spent
       * Params:
       * - Receiver Account Id.
       * - Balance spent.
       * - Rationale.
       **/
      BudgetSpending: AugmentedEvent<ApiType, [AccountId, Balance, Option<Bytes>]>;
      /**
       * Emits on setting the group leader.
       * Params:
       * - Group worker id.
       **/
      LeaderSet: AugmentedEvent<ApiType, [WorkerId]>;
      /**
       * Emits on un-setting the leader.
       **/
      LeaderUnset: AugmentedEvent<ApiType, []>;
      /**
       * Emits on reaching new missed reward.
       * Params:
       * - Worker ID.
       * - Missed reward (optional). None means 'no missed reward'.
       **/
      NewMissedRewardLevelReached: AugmentedEvent<ApiType, [WorkerId, Option<Balance>]>;
      /**
       * Emits on adding new job opening.
       * Params:
       * - Opening id
       * - Description
       * - Opening Type(Lead or Worker)
       * - Stake Policy for the opening
       * - Reward per block
       **/
      OpeningAdded: AugmentedEvent<ApiType, [OpeningId, Bytes, OpeningType, StakePolicy, Option<Balance>]>;
      /**
       * Emits on canceling the job opening.
       * Params:
       * - Opening id
       **/
      OpeningCanceled: AugmentedEvent<ApiType, [OpeningId]>;
      /**
       * Emits on filling the job opening.
       * Params:
       * - Worker opening id
       * - Worker application id to the worker id dictionary
       * - Applicationd ids used to fill the opening
       **/
      OpeningFilled: AugmentedEvent<ApiType, [OpeningId, ApplicationIdToWorkerIdMap, BTreeSet<ApplicationId>]>;
      /**
       * Emits on paying the reward.
       * Params:
       * - Id of the worker.
       * - Receiver Account Id.
       * - Reward
       * - Payment type (missed reward or regular one)
       **/
      RewardPaid: AugmentedEvent<ApiType, [WorkerId, AccountId, Balance, RewardPaymentType]>;
      /**
       * Emits on decreasing the regular worker/lead stake.
       * Params:
       * - regular worker/lead id.
       * - stake delta amount
       **/
      StakeDecreased: AugmentedEvent<ApiType, [WorkerId, Balance]>;
      /**
       * Emits on increasing the regular worker/lead stake.
       * Params:
       * - regular worker/lead id.
       * - stake delta amount
       **/
      StakeIncreased: AugmentedEvent<ApiType, [WorkerId, Balance]>;
      /**
       * Emits on slashing the regular worker/lead stake.
       * Params:
       * - regular worker/lead id.
       * - actual slashed balance.
       * - Requested slashed balance.
       * - Rationale.
       **/
      StakeSlashed: AugmentedEvent<ApiType, [WorkerId, Balance, Balance, Option<Bytes>]>;
      /**
       * Emits on updating the status text of the working group.
       * Params:
       * - status text hash
       * - status text
       **/
      StatusTextChanged: AugmentedEvent<ApiType, [Bytes, Option<Bytes>]>;
      /**
       * Emits on terminating the leader.
       * Params:
       * - leader worker id.
       * - Penalty.
       * - Rationale.
       **/
      TerminatedLeader: AugmentedEvent<ApiType, [WorkerId, Option<Balance>, Option<Bytes>]>;
      /**
       * Emits on terminating the worker.
       * Params:
       * - worker id.
       * - Penalty.
       * - Rationale.
       **/
      TerminatedWorker: AugmentedEvent<ApiType, [WorkerId, Option<Balance>, Option<Bytes>]>;
      /**
       * Emits on exiting the worker.
       * Params:
       * - worker id.
       * - Rationale.
       **/
      WorkerExited: AugmentedEvent<ApiType, [WorkerId]>;
      /**
       * Emits on updating the reward account of the worker.
       * Params:
       * - Id of the worker.
       * - Reward account id of the worker.
       **/
      WorkerRewardAccountUpdated: AugmentedEvent<ApiType, [WorkerId, AccountId]>;
      /**
       * Emits on updating the reward amount of the worker.
       * Params:
       * - Id of the worker.
       * - Reward per block
       **/
      WorkerRewardAmountUpdated: AugmentedEvent<ApiType, [WorkerId, Option<Balance>]>;
      /**
       * Emits on updating the role account of the worker.
       * Params:
       * - Id of the worker.
       * - Role account id of the worker.
       **/
      WorkerRoleAccountUpdated: AugmentedEvent<ApiType, [WorkerId, AccountId]>;
      /**
       * Emits when worker started leaving their role.
       * Params:
       * - Worker id.
       * - Rationale.
       **/
      WorkerStartedLeaving: AugmentedEvent<ApiType, [WorkerId, Option<Bytes>]>;
      /**
       * Emits on updating the worker storage role.
       * Params:
       * - Id of the worker.
       * - Raw storage field.
       **/
      WorkerStorageUpdated: AugmentedEvent<ApiType, [WorkerId, Bytes]>;
    };
    memo: {
      MemoUpdated: AugmentedEvent<ApiType, [AccountId, MemoText]>;
    };
    offences: {
      /**
       * There is an offence reported of the given `kind` happened at the `session_index` and
       * (kind-specific) time slot. This event is not deposited for duplicate slashes. last
       * element indicates of the offence was applied (true) or queued (false)
       * \[kind, timeslot, applied\].
       **/
      Offence: AugmentedEvent<ApiType, [Kind, OpaqueTimeSlot, bool]>;
    };
    operationsWorkingGroup: {
      /**
       * Emits on withdrawing the application for the regular worker/lead opening.
       * Params:
       * - Job application id
       **/
      ApplicationWithdrawn: AugmentedEvent<ApiType, [ApplicationId]>;
      /**
       * Emits on adding the application for the worker opening.
       * Params:
       * - Opening parameteres
       * - Application id
       **/
      AppliedOnOpening: AugmentedEvent<ApiType, [ApplyOnOpeningParameters, ApplicationId]>;
      /**
       * Emits on setting the budget for the working group.
       * Params:
       * - new budget
       **/
      BudgetSet: AugmentedEvent<ApiType, [Balance]>;
      /**
       * Emits on budget from the working group being spent
       * Params:
       * - Receiver Account Id.
       * - Balance spent.
       * - Rationale.
       **/
      BudgetSpending: AugmentedEvent<ApiType, [AccountId, Balance, Option<Bytes>]>;
      /**
       * Emits on setting the group leader.
       * Params:
       * - Group worker id.
       **/
      LeaderSet: AugmentedEvent<ApiType, [WorkerId]>;
      /**
       * Emits on un-setting the leader.
       **/
      LeaderUnset: AugmentedEvent<ApiType, []>;
      /**
       * Emits on reaching new missed reward.
       * Params:
       * - Worker ID.
       * - Missed reward (optional). None means 'no missed reward'.
       **/
      NewMissedRewardLevelReached: AugmentedEvent<ApiType, [WorkerId, Option<Balance>]>;
      /**
       * Emits on adding new job opening.
       * Params:
       * - Opening id
       * - Description
       * - Opening Type(Lead or Worker)
       * - Stake Policy for the opening
       * - Reward per block
       **/
      OpeningAdded: AugmentedEvent<ApiType, [OpeningId, Bytes, OpeningType, StakePolicy, Option<Balance>]>;
      /**
       * Emits on canceling the job opening.
       * Params:
       * - Opening id
       **/
      OpeningCanceled: AugmentedEvent<ApiType, [OpeningId]>;
      /**
       * Emits on filling the job opening.
       * Params:
       * - Worker opening id
       * - Worker application id to the worker id dictionary
       * - Applicationd ids used to fill the opening
       **/
      OpeningFilled: AugmentedEvent<ApiType, [OpeningId, ApplicationIdToWorkerIdMap, BTreeSet<ApplicationId>]>;
      /**
       * Emits on paying the reward.
       * Params:
       * - Id of the worker.
       * - Receiver Account Id.
       * - Reward
       * - Payment type (missed reward or regular one)
       **/
      RewardPaid: AugmentedEvent<ApiType, [WorkerId, AccountId, Balance, RewardPaymentType]>;
      /**
       * Emits on decreasing the regular worker/lead stake.
       * Params:
       * - regular worker/lead id.
       * - stake delta amount
       **/
      StakeDecreased: AugmentedEvent<ApiType, [WorkerId, Balance]>;
      /**
       * Emits on increasing the regular worker/lead stake.
       * Params:
       * - regular worker/lead id.
       * - stake delta amount
       **/
      StakeIncreased: AugmentedEvent<ApiType, [WorkerId, Balance]>;
      /**
       * Emits on slashing the regular worker/lead stake.
       * Params:
       * - regular worker/lead id.
       * - actual slashed balance.
       * - Requested slashed balance.
       * - Rationale.
       **/
      StakeSlashed: AugmentedEvent<ApiType, [WorkerId, Balance, Balance, Option<Bytes>]>;
      /**
       * Emits on updating the status text of the working group.
       * Params:
       * - status text hash
       * - status text
       **/
      StatusTextChanged: AugmentedEvent<ApiType, [Bytes, Option<Bytes>]>;
      /**
       * Emits on terminating the leader.
       * Params:
       * - leader worker id.
       * - Penalty.
       * - Rationale.
       **/
      TerminatedLeader: AugmentedEvent<ApiType, [WorkerId, Option<Balance>, Option<Bytes>]>;
      /**
       * Emits on terminating the worker.
       * Params:
       * - worker id.
       * - Penalty.
       * - Rationale.
       **/
      TerminatedWorker: AugmentedEvent<ApiType, [WorkerId, Option<Balance>, Option<Bytes>]>;
      /**
       * Emits on exiting the worker.
       * Params:
       * - worker id.
       * - Rationale.
       **/
      WorkerExited: AugmentedEvent<ApiType, [WorkerId]>;
      /**
       * Emits on updating the reward account of the worker.
       * Params:
       * - Id of the worker.
       * - Reward account id of the worker.
       **/
      WorkerRewardAccountUpdated: AugmentedEvent<ApiType, [WorkerId, AccountId]>;
      /**
       * Emits on updating the reward amount of the worker.
       * Params:
       * - Id of the worker.
       * - Reward per block
       **/
      WorkerRewardAmountUpdated: AugmentedEvent<ApiType, [WorkerId, Option<Balance>]>;
      /**
       * Emits on updating the role account of the worker.
       * Params:
       * - Id of the worker.
       * - Role account id of the worker.
       **/
      WorkerRoleAccountUpdated: AugmentedEvent<ApiType, [WorkerId, AccountId]>;
      /**
       * Emits when worker started leaving their role.
       * Params:
       * - Worker id.
       * - Rationale.
       **/
      WorkerStartedLeaving: AugmentedEvent<ApiType, [WorkerId, Option<Bytes>]>;
      /**
       * Emits on updating the worker storage role.
       * Params:
       * - Id of the worker.
       * - Raw storage field.
       **/
      WorkerStorageUpdated: AugmentedEvent<ApiType, [WorkerId, Bytes]>;
    };
    proposalsCodex: {
      /**
       * A proposal was created
       * Params:
       * - Id of a newly created proposal after it was saved in storage.
       * - General proposal parameter. Parameters shared by all proposals
       * - Proposal Details. Parameter of proposal with a variant for each kind of proposal
       **/
      ProposalCreated: AugmentedEvent<ApiType, [ProposalId, GeneralProposalParameters, ProposalDetailsOf]>;
    };
    proposalsDiscussion: {
      /**
       * Emits on post creation.
       **/
      PostCreated: AugmentedEvent<ApiType, [PostId, MemberId, ThreadId, Bytes]>;
      /**
       * Emits on post deleted
       **/
      PostDeleted: AugmentedEvent<ApiType, [MemberId, ThreadId, PostId, bool]>;
      /**
       * Emits on post update.
       **/
      PostUpdated: AugmentedEvent<ApiType, [PostId, MemberId, ThreadId, Bytes]>;
      /**
       * Emits on thread creation.
       **/
      ThreadCreated: AugmentedEvent<ApiType, [ThreadId, MemberId]>;
      /**
       * Emits on thread mode change.
       **/
      ThreadModeChanged: AugmentedEvent<ApiType, [ThreadId, ThreadMode, MemberId]>;
    };
    proposalsEngine: {
      /**
       * Emits on a proposal being cancelled
       * Params:
       * - Member Id of the proposer
       * - Id of the proposal
       **/
      ProposalCancelled: AugmentedEvent<ApiType, [MemberId, ProposalId]>;
      /**
       * Emits on getting a proposal status decision.
       * Params:
       * - Id of a proposal.
       * - Proposal decision
       **/
      ProposalDecisionMade: AugmentedEvent<ApiType, [ProposalId, ProposalDecision]>;
      /**
       * Emits on proposal execution.
       * Params:
       * - Id of a updated proposal.
       * - Proposal execution status.
       **/
      ProposalExecuted: AugmentedEvent<ApiType, [ProposalId, ExecutionStatus]>;
      /**
       * Emits on proposal creation.
       * Params:
       * - Id of a proposal.
       * - New proposal status.
       **/
      ProposalStatusUpdated: AugmentedEvent<ApiType, [ProposalId, ProposalStatus]>;
      /**
       * Emits on voting for the proposal
       * Params:
       * - Voter - member id of a voter.
       * - Id of a proposal.
       * - Kind of vote.
       * - Rationale.
       **/
      Voted: AugmentedEvent<ApiType, [MemberId, ProposalId, VoteKind, Bytes]>;
    };
    referendum: {
      /**
       * Referendum ended and winning option was selected
       **/
      ReferendumFinished: AugmentedEvent<ApiType, [Vec<OptionResult>]>;
      /**
       * Referendum started
       **/
      ReferendumStarted: AugmentedEvent<ApiType, [u64]>;
      /**
       * Referendum started
       **/
      ReferendumStartedForcefully: AugmentedEvent<ApiType, [u64]>;
      /**
       * Revealing phase has begun
       **/
      RevealingStageStarted: AugmentedEvent<ApiType, []>;
      /**
       * User released his stake
       **/
      StakeReleased: AugmentedEvent<ApiType, [AccountId]>;
      /**
       * User cast a vote in referendum
       **/
      VoteCast: AugmentedEvent<ApiType, [AccountId, Hash, Balance]>;
      /**
       * User revealed his vote
       **/
      VoteRevealed: AugmentedEvent<ApiType, [AccountId, MemberId, Bytes]>;
    };
    session: {
      /**
       * New session has happened. Note that the argument is the \[session_index\], not the block
       * number as the type might suggest.
       **/
      NewSession: AugmentedEvent<ApiType, [SessionIndex]>;
    };
    staking: {
      /**
       * An account has bonded this amount. \[stash, amount\]
       * 
       * NOTE: This event is only emitted when funds are bonded via a dispatchable. Notably,
       * it will not be emitted for staking rewards when they are added to stake.
       **/
      Bonded: AugmentedEvent<ApiType, [AccountId, Balance]>;
      /**
       * The era payout has been set; the first balance is the validator-payout; the second is
       * the remainder from the maximum amount of reward.
       * \[era_index, validator_payout, remainder\]
       **/
      EraPayout: AugmentedEvent<ApiType, [EraIndex, Balance, Balance]>;
      /**
       * An old slashing report from a prior era was discarded because it could
       * not be processed. \[session_index\]
       **/
      OldSlashingReportDiscarded: AugmentedEvent<ApiType, [SessionIndex]>;
      /**
       * The staker has been rewarded by this amount. \[stash, amount\]
       **/
      Reward: AugmentedEvent<ApiType, [AccountId, Balance]>;
      /**
       * One validator (and its nominators) has been slashed by the given amount.
       * \[validator, amount\]
       **/
      Slash: AugmentedEvent<ApiType, [AccountId, Balance]>;
      /**
       * A new solution for the upcoming election has been stored. \[compute\]
       **/
      SolutionStored: AugmentedEvent<ApiType, [ElectionCompute]>;
      /**
       * A new set of stakers was elected with the given \[compute\].
       **/
      StakingElection: AugmentedEvent<ApiType, [ElectionCompute]>;
      /**
       * An account has unbonded this amount. \[stash, amount\]
       **/
      Unbonded: AugmentedEvent<ApiType, [AccountId, Balance]>;
      /**
       * An account has called `withdraw_unbonded` and removed unbonding chunks worth `Balance`
       * from the unlocking queue. \[stash, amount\]
       **/
      Withdrawn: AugmentedEvent<ApiType, [AccountId, Balance]>;
    };
    storageWorkingGroup: {
      /**
       * Emits on withdrawing the application for the regular worker/lead opening.
       * Params:
       * - Job application id
       **/
      ApplicationWithdrawn: AugmentedEvent<ApiType, [ApplicationId]>;
      /**
       * Emits on adding the application for the worker opening.
       * Params:
       * - Opening parameteres
       * - Application id
       **/
      AppliedOnOpening: AugmentedEvent<ApiType, [ApplyOnOpeningParameters, ApplicationId]>;
      /**
       * Emits on setting the budget for the working group.
       * Params:
       * - new budget
       **/
      BudgetSet: AugmentedEvent<ApiType, [Balance]>;
      /**
       * Emits on budget from the working group being spent
       * Params:
       * - Receiver Account Id.
       * - Balance spent.
       * - Rationale.
       **/
      BudgetSpending: AugmentedEvent<ApiType, [AccountId, Balance, Option<Bytes>]>;
      /**
       * Emits on setting the group leader.
       * Params:
       * - Group worker id.
       **/
      LeaderSet: AugmentedEvent<ApiType, [WorkerId]>;
      /**
       * Emits on un-setting the leader.
       **/
      LeaderUnset: AugmentedEvent<ApiType, []>;
      /**
       * Emits on reaching new missed reward.
       * Params:
       * - Worker ID.
       * - Missed reward (optional). None means 'no missed reward'.
       **/
      NewMissedRewardLevelReached: AugmentedEvent<ApiType, [WorkerId, Option<Balance>]>;
      /**
       * Emits on adding new job opening.
       * Params:
       * - Opening id
       * - Description
       * - Opening Type(Lead or Worker)
       * - Stake Policy for the opening
       * - Reward per block
       **/
      OpeningAdded: AugmentedEvent<ApiType, [OpeningId, Bytes, OpeningType, StakePolicy, Option<Balance>]>;
      /**
       * Emits on canceling the job opening.
       * Params:
       * - Opening id
       **/
      OpeningCanceled: AugmentedEvent<ApiType, [OpeningId]>;
      /**
       * Emits on filling the job opening.
       * Params:
       * - Worker opening id
       * - Worker application id to the worker id dictionary
       * - Applicationd ids used to fill the opening
       **/
      OpeningFilled: AugmentedEvent<ApiType, [OpeningId, ApplicationIdToWorkerIdMap, BTreeSet<ApplicationId>]>;
      /**
       * Emits on paying the reward.
       * Params:
       * - Id of the worker.
       * - Receiver Account Id.
       * - Reward
       * - Payment type (missed reward or regular one)
       **/
      RewardPaid: AugmentedEvent<ApiType, [WorkerId, AccountId, Balance, RewardPaymentType]>;
      /**
       * Emits on decreasing the regular worker/lead stake.
       * Params:
       * - regular worker/lead id.
       * - stake delta amount
       **/
      StakeDecreased: AugmentedEvent<ApiType, [WorkerId, Balance]>;
      /**
       * Emits on increasing the regular worker/lead stake.
       * Params:
       * - regular worker/lead id.
       * - stake delta amount
       **/
      StakeIncreased: AugmentedEvent<ApiType, [WorkerId, Balance]>;
      /**
       * Emits on slashing the regular worker/lead stake.
       * Params:
       * - regular worker/lead id.
       * - actual slashed balance.
       * - Requested slashed balance.
       * - Rationale.
       **/
      StakeSlashed: AugmentedEvent<ApiType, [WorkerId, Balance, Balance, Option<Bytes>]>;
      /**
       * Emits on updating the status text of the working group.
       * Params:
       * - status text hash
       * - status text
       **/
      StatusTextChanged: AugmentedEvent<ApiType, [Bytes, Option<Bytes>]>;
      /**
       * Emits on terminating the leader.
       * Params:
       * - leader worker id.
       * - Penalty.
       * - Rationale.
       **/
      TerminatedLeader: AugmentedEvent<ApiType, [WorkerId, Option<Balance>, Option<Bytes>]>;
      /**
       * Emits on terminating the worker.
       * Params:
       * - worker id.
       * - Penalty.
       * - Rationale.
       **/
      TerminatedWorker: AugmentedEvent<ApiType, [WorkerId, Option<Balance>, Option<Bytes>]>;
      /**
       * Emits on exiting the worker.
       * Params:
       * - worker id.
       * - Rationale.
       **/
      WorkerExited: AugmentedEvent<ApiType, [WorkerId]>;
      /**
       * Emits on updating the reward account of the worker.
       * Params:
       * - Id of the worker.
       * - Reward account id of the worker.
       **/
      WorkerRewardAccountUpdated: AugmentedEvent<ApiType, [WorkerId, AccountId]>;
      /**
       * Emits on updating the reward amount of the worker.
       * Params:
       * - Id of the worker.
       * - Reward per block
       **/
      WorkerRewardAmountUpdated: AugmentedEvent<ApiType, [WorkerId, Option<Balance>]>;
      /**
       * Emits on updating the role account of the worker.
       * Params:
       * - Id of the worker.
       * - Role account id of the worker.
       **/
      WorkerRoleAccountUpdated: AugmentedEvent<ApiType, [WorkerId, AccountId]>;
      /**
       * Emits when worker started leaving their role.
       * Params:
       * - Worker id.
       * - Rationale.
       **/
      WorkerStartedLeaving: AugmentedEvent<ApiType, [WorkerId, Option<Bytes>]>;
      /**
       * Emits on updating the worker storage role.
       * Params:
       * - Id of the worker.
       * - Raw storage field.
       **/
      WorkerStorageUpdated: AugmentedEvent<ApiType, [WorkerId, Bytes]>;
    };
    sudo: {
      /**
       * The \[sudoer\] just switched identity; the old key is supplied.
       **/
      KeyChanged: AugmentedEvent<ApiType, [AccountId]>;
      /**
       * A sudo just took place. \[result\]
       **/
      Sudid: AugmentedEvent<ApiType, [DispatchResult]>;
      /**
       * A sudo just took place. \[result\]
       **/
      SudoAsDone: AugmentedEvent<ApiType, [bool]>;
    };
    system: {
      /**
       * `:code` was updated.
       **/
      CodeUpdated: AugmentedEvent<ApiType, []>;
      /**
       * An extrinsic failed. \[error, info\]
       **/
      ExtrinsicFailed: AugmentedEvent<ApiType, [DispatchError, DispatchInfo]>;
      /**
       * An extrinsic completed successfully. \[info\]
       **/
      ExtrinsicSuccess: AugmentedEvent<ApiType, [DispatchInfo]>;
      /**
       * An \[account\] was reaped.
       **/
      KilledAccount: AugmentedEvent<ApiType, [AccountId]>;
      /**
       * A new \[account\] was created.
       **/
      NewAccount: AugmentedEvent<ApiType, [AccountId]>;
    };
    utility: {
      /**
       * Batch of dispatches completed fully with no error.
       **/
      BatchCompleted: AugmentedEvent<ApiType, []>;
      /**
       * Batch of dispatches did not complete fully. Index of first failing dispatch given, as
       * well as the error. \[index, error\]
       **/
      BatchInterrupted: AugmentedEvent<ApiType, [u32, DispatchError]>;
    };
  }

  export interface DecoratedEvents<ApiType extends ApiTypes> extends AugmentedEvents<ApiType> {
  }
}
