// Auto-generated via `yarn polkadot-types-from-defs`, do not edit
/* eslint-disable */

import type { BTreeMap, BTreeSet, Bytes, Enum, Option, Struct, Text, U8aFixed, Vec, bool, u128, u16, u32, u64, u8 } from '@polkadot/types';
import type { ITuple } from '@polkadot/types/types';
import type { AccountId, Balance, Hash } from '@polkadot/types/interfaces/runtime';

/** @name ActorId */
export interface ActorId extends u64 {}

/** @name Address */
export interface Address extends AccountId {}

/** @name Application */
export interface Application extends Struct {
  readonly role_account_id: AccountId;
  readonly reward_account_id: AccountId;
  readonly staking_account_id: AccountId;
  readonly member_id: MemberId;
  readonly description_hash: Bytes;
  readonly opening_id: OpeningId;
}

/** @name ApplicationId */
export interface ApplicationId extends u64 {}

/** @name ApplicationIdSet */
export interface ApplicationIdSet extends BTreeSet<ApplicationId> {}

/** @name ApplicationIdToWorkerIdMap */
export interface ApplicationIdToWorkerIdMap extends BTreeMap<ApplicationId, WorkerId> {}

/** @name ApplicationInfo */
export interface ApplicationInfo extends Struct {
  readonly application_id: ApplicationId;
  readonly application: Application;
}

/** @name ApplyOnOpeningParameters */
export interface ApplyOnOpeningParameters extends Struct {
  readonly member_id: MemberId;
  readonly opening_id: OpeningId;
  readonly role_account_id: AccountId;
  readonly reward_account_id: AccountId;
  readonly description: Bytes;
  readonly stake_parameters: StakeParameters;
}

/** @name Approved */
export interface Approved extends Enum {
  readonly isPendingExecution: boolean;
  readonly isPendingConstitutionality: boolean;
}

/** @name AssuranceContractType */
export interface AssuranceContractType extends Enum {
  readonly isOpen: boolean;
  readonly isClosed: boolean;
  readonly asClosed: Vec<MemberId>;
}

/** @name BalanceKind */
export interface BalanceKind extends Enum {
  readonly isPositive: boolean;
  readonly isNegative: boolean;
}

/** @name BlockAndTime */
export interface BlockAndTime extends Struct {
  readonly block: u32;
  readonly time: u64;
}

/** @name BountyActor */
export interface BountyActor extends Enum {
  readonly isCouncil: boolean;
  readonly isMember: boolean;
  readonly asMember: MemberId;
}

/** @name BountyCreationParameters */
export interface BountyCreationParameters extends Struct {
  readonly oracle: BountyActor;
  readonly contract_type: AssuranceContractType;
  readonly creator: BountyActor;
  readonly cherry: u128;
  readonly entrant_stake: u128;
  readonly funding_type: FundingType;
  readonly work_period: u32;
  readonly judging_period: u32;
}

/** @name BountyId */
export interface BountyId extends u32 {}

/** @name BuyMembershipParameters */
export interface BuyMembershipParameters extends Struct {
  readonly root_account: AccountId;
  readonly controller_account: AccountId;
  readonly handle: Option<Text>;
  readonly metadata: Bytes;
  readonly referrer_id: Option<MemberId>;
}

/** @name Candidate */
export interface Candidate extends Struct {
  readonly staking_account_id: AccountId;
  readonly reward_account_id: AccountId;
  readonly cycle_id: u64;
  readonly stake: u32;
  readonly vote_power: VotePower;
  readonly note_hash: Option<Hash>;
}

/** @name CastVoteOf */
export interface CastVoteOf extends Struct {
  readonly commitment: Hash;
  readonly cycle_id: u64;
  readonly stake: u128;
  readonly vote_for: Option<MemberId>;
}

/** @name Category */
export interface Category extends Struct {
  readonly title_hash: Hash;
  readonly description_hash: Hash;
  readonly archived: bool;
  readonly num_direct_subcategories: u32;
  readonly num_direct_threads: u32;
  readonly num_direct_moderators: u32;
  readonly parent_category_id: Option<CategoryId>;
  readonly sticky_thread_ids: Vec<ThreadId>;
}

/** @name CategoryId */
export interface CategoryId extends u64 {}

/** @name Channel */
export interface Channel extends Struct {
  readonly owner: ChannelOwner;
  readonly videos: Vec<VideoId>;
  readonly playlists: Vec<PlaylistId>;
  readonly series: Vec<SeriesId>;
  readonly is_censored: bool;
  readonly reward_account: Option<AccountId>;
}

/** @name ChannelCategory */
export interface ChannelCategory extends Struct {}

/** @name ChannelCategoryCreationParameters */
export interface ChannelCategoryCreationParameters extends Struct {
  readonly meta: Bytes;
}

/** @name ChannelCategoryId */
export interface ChannelCategoryId extends u64 {}

/** @name ChannelCategoryUpdateParameters */
export interface ChannelCategoryUpdateParameters extends Struct {
  readonly new_meta: Bytes;
}

/** @name ChannelCreationParameters */
export interface ChannelCreationParameters extends Struct {
  readonly assets: Vec<NewAsset>;
  readonly meta: Bytes;
  readonly reward_account: Option<AccountId>;
}

/** @name ChannelId */
export interface ChannelId extends u64 {}

/** @name ChannelOwner */
export interface ChannelOwner extends Enum {
  readonly isMember: boolean;
  readonly asMember: MemberId;
  readonly isCurators: boolean;
  readonly asCurators: CuratorGroupId;
  readonly isDao: boolean;
  readonly asDao: DAOId;
}

/** @name ChannelOwnershipTransferRequest */
export interface ChannelOwnershipTransferRequest extends Struct {
  readonly channel_id: ChannelId;
  readonly new_owner: ChannelOwner;
  readonly payment: u128;
  readonly new_reward_account: Option<AccountId>;
}

/** @name ChannelOwnershipTransferRequestId */
export interface ChannelOwnershipTransferRequestId extends u64 {}

/** @name ChannelUpdateParameters */
export interface ChannelUpdateParameters extends Struct {
  readonly assets: Option<Vec<NewAsset>>;
  readonly new_meta: Option<Bytes>;
  readonly reward_account: Option<Option<AccountId>>;
}

/** @name ConstitutionInfo */
export interface ConstitutionInfo extends Struct {
  readonly text_hash: Hash;
}

/** @name ContentActor */
export interface ContentActor extends Enum {
  readonly isCurator: boolean;
  readonly asCurator: ITuple<[CuratorGroupId, CuratorId]>;
  readonly isMember: boolean;
  readonly asMember: MemberId;
  readonly isLead: boolean;
}

/** @name ContentId */
export interface ContentId extends U8aFixed {}

/** @name ContentParameters */
export interface ContentParameters extends Struct {
  readonly content_id: ContentId;
  readonly type_id: DataObjectTypeId;
  readonly ipfs_content_id: Bytes;
}

/** @name CouncilMemberOf */
export interface CouncilMemberOf extends Struct {
  readonly staking_account_id: AccountId;
  readonly reward_account_id: AccountId;
  readonly membership_id: MemberId;
  readonly stake: u128;
  readonly last_payment_block: u32;
  readonly unpaid_reward: u128;
}

/** @name CouncilStage */
export interface CouncilStage extends Enum {
  readonly isAnnouncing: boolean;
  readonly asAnnouncing: CouncilStageAnnouncing;
  readonly isElection: boolean;
  readonly asElection: CouncilStageElection;
  readonly isIdle: boolean;
}

/** @name CouncilStageAnnouncing */
export interface CouncilStageAnnouncing extends Struct {
  readonly candidatesCount: u64;
}

/** @name CouncilStageElection */
export interface CouncilStageElection extends Struct {
  readonly candidatesCount: u64;
}

/** @name CouncilStageUpdate */
export interface CouncilStageUpdate extends Struct {
  readonly stage: CouncilStage;
  readonly changed_at: u32;
}

/** @name CreateOpeningParameters */
export interface CreateOpeningParameters extends Struct {
  readonly description: Bytes;
  readonly stake_policy: StakePolicy;
  readonly reward_per_block: Option<u128>;
  readonly working_group: WorkingGroup;
}

/** @name CuratorGroup */
export interface CuratorGroup extends Struct {
  readonly curators: Vec<CuratorId>;
  readonly active: bool;
}

/** @name CuratorGroupId */
export interface CuratorGroupId extends u64 {}

/** @name CuratorId */
export interface CuratorId extends u64 {}

/** @name DAOId */
export interface DAOId extends u64 {}

/** @name DataObject */
export interface DataObject extends Struct {
  readonly owner: StorageObjectOwner;
  readonly added_at: BlockAndTime;
  readonly type_id: DataObjectTypeId;
  readonly liaison: Option<StorageProviderId>;
  readonly liaison_judgement: LiaisonJudgement;
  readonly ipfs_content_id: Text;
}

/** @name DataObjectsMap */
export interface DataObjectsMap extends BTreeMap<ContentId, DataObject> {}

/** @name DataObjectStorageRelationship */
export interface DataObjectStorageRelationship extends Struct {
  readonly content_id: ContentId;
  readonly storage_provider: StorageProviderId;
  readonly ready: bool;
}

/** @name DataObjectStorageRelationshipId */
export interface DataObjectStorageRelationshipId extends u64 {}

/** @name DataObjectType */
export interface DataObjectType extends Struct {
  readonly description: Text;
  readonly active: bool;
}

/** @name DataObjectTypeId */
export interface DataObjectTypeId extends u64 {}

/** @name DiscussionPost */
export interface DiscussionPost extends Struct {
  readonly author_id: u64;
}

/** @name DiscussionThread */
export interface DiscussionThread extends Struct {
  readonly activated_at: u32;
  readonly author_id: u64;
  readonly mode: ThreadMode;
}

/** @name Entry */
export interface Entry extends Struct {
  readonly member_id: MemberId;
  readonly staking_account_id: AccountId;
  readonly submitted_at: u32;
  readonly work_submitted: bool;
  readonly oracle_judgment_result: Option<OracleJudgment>;
}

/** @name EntryId */
export interface EntryId extends u32 {}

/** @name EpisodeParemters */
export interface EpisodeParemters extends Enum {
  readonly isNewVideo: boolean;
  readonly asNewVideo: VideoCreationParameters;
  readonly isExistingVideo: boolean;
  readonly asExistingVideo: VideoId;
}

/** @name ExecutionFailed */
export interface ExecutionFailed extends Struct {
  readonly error: Text;
}

/** @name ExecutionStatus */
export interface ExecutionStatus extends Enum {
  readonly isExecuted: boolean;
  readonly isExecutionFailed: boolean;
  readonly asExecutionFailed: ExecutionFailed;
}

/** @name FillOpeningParameters */
export interface FillOpeningParameters extends Struct {
  readonly opening_id: OpeningId;
  readonly successful_application_id: ApplicationId;
  readonly working_group: WorkingGroup;
}

/** @name ForumUserId */
export interface ForumUserId extends u64 {}

/** @name FundingRequestParameters */
export interface FundingRequestParameters extends Struct {
  readonly account: AccountId;
  readonly amount: u128;
}

/** @name FundingType */
export interface FundingType extends Enum {
  readonly isPerpetual: boolean;
  readonly asPerpetual: FundingType_Perpetual;
  readonly isLimited: boolean;
  readonly asLimited: FundingType_Limited;
}

/** @name FundingType_Limited */
export interface FundingType_Limited extends Struct {
  readonly min_funding_amount: u128;
  readonly max_funding_amount: u128;
  readonly funding_period: u32;
}

/** @name FundingType_Perpetual */
export interface FundingType_Perpetual extends Struct {
  readonly target: u128;
}

/** @name GeneralProposalParameters */
export interface GeneralProposalParameters extends Struct {
  readonly member_id: MemberId;
  readonly title: Text;
  readonly description: Text;
  readonly staking_account_id: Option<AccountId>;
  readonly exact_execution_block: Option<u32>;
}

/** @name InputValidationLengthConstraint */
export interface InputValidationLengthConstraint extends Struct {
  readonly min: u16;
  readonly max_min_diff: u16;
}

/** @name InviteMembershipParameters */
export interface InviteMembershipParameters extends Struct {
  readonly inviting_member_id: MemberId;
  readonly root_account: AccountId;
  readonly controller_account: AccountId;
  readonly handle: Option<Text>;
  readonly metadata: Bytes;
}

/** @name IsCensored */
export interface IsCensored extends bool {}

/** @name LiaisonJudgement */
export interface LiaisonJudgement extends Enum {
  readonly isPending: boolean;
  readonly isAccepted: boolean;
}

/** @name LookupSource */
export interface LookupSource extends AccountId {}

/** @name MaxNumber */
export interface MaxNumber extends u32 {}

/** @name MemberId */
export interface MemberId extends u64 {}

/** @name Membership */
export interface Membership extends Struct {
  readonly handle_hash: Bytes;
  readonly root_account: AccountId;
  readonly controller_account: AccountId;
  readonly verified: bool;
  readonly invites: u32;
}

/** @name MemoText */
export interface MemoText extends Text {}

/** @name ModeratorId */
export interface ModeratorId extends u64 {}

/** @name NewAsset */
export interface NewAsset extends Enum {
  readonly isUpload: boolean;
  readonly asUpload: ContentParameters;
  readonly isUrls: boolean;
  readonly asUrls: Vec<Url>;
}

/** @name ObjectOwner */
export interface ObjectOwner extends Enum {
  readonly isMember: boolean;
  readonly asMember: MemberId;
  readonly isChannel: boolean;
  readonly asChannel: ChannelId;
  readonly isDao: boolean;
  readonly asDao: DAOId;
  readonly isCouncil: boolean;
  readonly isWorkingGroup: boolean;
  readonly asWorkingGroup: WorkingGroup;
}

/** @name Opening */
export interface Opening extends Struct {
  readonly opening_type: OpeningType;
  readonly created: u32;
  readonly description_hash: Bytes;
  readonly stake_policy: StakePolicy;
  readonly reward_per_block: Option<u128>;
}

/** @name OpeningId */
export interface OpeningId extends u64 {}

/** @name OpeningType */
export interface OpeningType extends Enum {
  readonly isLeader: boolean;
  readonly isRegular: boolean;
}

/** @name OptionResult */
export interface OptionResult extends Struct {
  readonly option_id: MemberId;
  readonly vote_power: VotePower;
}

/** @name OracleJudgment */
export interface OracleJudgment extends Enum {
  readonly isWinner: boolean;
  readonly asWinner: OracleJudgment_Winner;
  readonly isRejected: boolean;
}

/** @name OracleJudgment_Winner */
export interface OracleJudgment_Winner extends Struct {
  readonly reward: u128;
}

/** @name ParticipantId */
export interface ParticipantId extends u64 {}

/** @name Penalty */
export interface Penalty extends Struct {
  readonly slashing_text: Text;
  readonly slashing_amount: u128;
}

/** @name Person */
export interface Person extends Struct {
  readonly controlled_by: PersonController;
}

/** @name PersonActor */
export interface PersonActor extends Enum {
  readonly isMember: boolean;
  readonly asMember: MemberId;
  readonly isCurator: boolean;
  readonly asCurator: CuratorId;
}

/** @name PersonController */
export interface PersonController extends Enum {
  readonly isMember: boolean;
  readonly asMember: MemberId;
  readonly isCurators: boolean;
}

/** @name PersonCreationParameters */
export interface PersonCreationParameters extends Struct {
  readonly assets: Vec<NewAsset>;
  readonly meta: Bytes;
}

/** @name PersonId */
export interface PersonId extends u64 {}

/** @name PersonUpdateParameters */
export interface PersonUpdateParameters extends Struct {
  readonly assets: Option<Vec<NewAsset>>;
  readonly meta: Option<Bytes>;
}

/** @name Playlist */
export interface Playlist extends Struct {
  readonly in_channel: ChannelId;
}

/** @name PlaylistCreationParameters */
export interface PlaylistCreationParameters extends Struct {
  readonly meta: Bytes;
}

/** @name PlaylistId */
export interface PlaylistId extends u64 {}

/** @name PlaylistUpdateParameters */
export interface PlaylistUpdateParameters extends Struct {
  readonly new_meta: Bytes;
}

/** @name Poll */
export interface Poll extends Struct {
  readonly description_hash: Hash;
  readonly end_time: u64;
  readonly poll_alternatives: Vec<PollAlternative>;
}

/** @name PollAlternative */
export interface PollAlternative extends Struct {
  readonly alternative_text_hash: Hash;
  readonly vote_count: u32;
}

/** @name Post */
export interface Post extends Struct {
  readonly thread_id: ThreadId;
  readonly text_hash: Hash;
  readonly author_id: ForumUserId;
}

/** @name PostId */
export interface PostId extends u64 {}

/** @name PostReactionId */
export interface PostReactionId extends u64 {}

/** @name PrivilegedActor */
export interface PrivilegedActor extends Enum {
  readonly isLead: boolean;
  readonly isModerator: boolean;
  readonly asModerator: ModeratorId;
}

/** @name ProposalDecision */
export interface ProposalDecision extends Enum {
  readonly isCanceled: boolean;
  readonly isCanceledByRuntime: boolean;
  readonly isVetoed: boolean;
  readonly isRejected: boolean;
  readonly isSlashed: boolean;
  readonly isExpired: boolean;
  readonly isApproved: boolean;
  readonly asApproved: Approved;
}

/** @name ProposalDetails */
export interface ProposalDetails extends Enum {
  readonly isSignal: boolean;
  readonly asSignal: Text;
  readonly isRuntimeUpgrade: boolean;
  readonly asRuntimeUpgrade: Bytes;
  readonly isFundingRequest: boolean;
  readonly asFundingRequest: Vec<FundingRequestParameters>;
  readonly isSetMaxValidatorCount: boolean;
  readonly asSetMaxValidatorCount: u32;
  readonly isCreateWorkingGroupLeadOpening: boolean;
  readonly asCreateWorkingGroupLeadOpening: CreateOpeningParameters;
  readonly isFillWorkingGroupLeadOpening: boolean;
  readonly asFillWorkingGroupLeadOpening: FillOpeningParameters;
  readonly isUpdateWorkingGroupBudget: boolean;
  readonly asUpdateWorkingGroupBudget: ITuple<[Balance, WorkingGroup, BalanceKind]>;
  readonly isDecreaseWorkingGroupLeadStake: boolean;
  readonly asDecreaseWorkingGroupLeadStake: ITuple<[WorkerId, Balance, WorkingGroup]>;
  readonly isSlashWorkingGroupLead: boolean;
  readonly asSlashWorkingGroupLead: ITuple<[WorkerId, Balance, WorkingGroup]>;
  readonly isSetWorkingGroupLeadReward: boolean;
  readonly asSetWorkingGroupLeadReward: ITuple<[WorkerId, Option<Balance>, WorkingGroup]>;
  readonly isTerminateWorkingGroupLead: boolean;
  readonly asTerminateWorkingGroupLead: TerminateRoleParameters;
  readonly isAmendConstitution: boolean;
  readonly asAmendConstitution: Text;
  readonly isCancelWorkingGroupLeadOpening: boolean;
  readonly asCancelWorkingGroupLeadOpening: ITuple<[OpeningId, WorkingGroup]>;
  readonly isSetMembershipPrice: boolean;
  readonly asSetMembershipPrice: u128;
  readonly isSetCouncilBudgetIncrement: boolean;
  readonly asSetCouncilBudgetIncrement: u128;
  readonly isSetCouncilorReward: boolean;
  readonly asSetCouncilorReward: u128;
  readonly isSetInitialInvitationBalance: boolean;
  readonly asSetInitialInvitationBalance: u128;
  readonly isSetInitialInvitationCount: boolean;
  readonly asSetInitialInvitationCount: u32;
  readonly isSetMembershipLeadInvitationQuota: boolean;
  readonly asSetMembershipLeadInvitationQuota: u32;
  readonly isSetReferralCut: boolean;
  readonly asSetReferralCut: u8;
  readonly isCreateBlogPost: boolean;
  readonly asCreateBlogPost: ITuple<[Text, Text]>;
  readonly isEditBlogPost: boolean;
  readonly asEditBlogPost: ITuple<[PostId, Option<Text>, Option<Text>]>;
  readonly isLockBlogPost: boolean;
  readonly asLockBlogPost: PostId;
  readonly isUnlockBlogPost: boolean;
  readonly asUnlockBlogPost: PostId;
  readonly isVetoProposal: boolean;
  readonly asVetoProposal: ProposalId;
}

/** @name ProposalDetailsOf */
export interface ProposalDetailsOf extends Enum {
  readonly isSignal: boolean;
  readonly asSignal: Text;
  readonly isRuntimeUpgrade: boolean;
  readonly asRuntimeUpgrade: Bytes;
  readonly isFundingRequest: boolean;
  readonly asFundingRequest: Vec<FundingRequestParameters>;
  readonly isSetMaxValidatorCount: boolean;
  readonly asSetMaxValidatorCount: u32;
  readonly isCreateWorkingGroupLeadOpening: boolean;
  readonly asCreateWorkingGroupLeadOpening: CreateOpeningParameters;
  readonly isFillWorkingGroupLeadOpening: boolean;
  readonly asFillWorkingGroupLeadOpening: FillOpeningParameters;
  readonly isUpdateWorkingGroupBudget: boolean;
  readonly asUpdateWorkingGroupBudget: ITuple<[Balance, WorkingGroup, BalanceKind]>;
  readonly isDecreaseWorkingGroupLeadStake: boolean;
  readonly asDecreaseWorkingGroupLeadStake: ITuple<[WorkerId, Balance, WorkingGroup]>;
  readonly isSlashWorkingGroupLead: boolean;
  readonly asSlashWorkingGroupLead: ITuple<[WorkerId, Balance, WorkingGroup]>;
  readonly isSetWorkingGroupLeadReward: boolean;
  readonly asSetWorkingGroupLeadReward: ITuple<[WorkerId, Option<Balance>, WorkingGroup]>;
  readonly isTerminateWorkingGroupLead: boolean;
  readonly asTerminateWorkingGroupLead: TerminateRoleParameters;
  readonly isAmendConstitution: boolean;
  readonly asAmendConstitution: Text;
  readonly isCancelWorkingGroupLeadOpening: boolean;
  readonly asCancelWorkingGroupLeadOpening: ITuple<[OpeningId, WorkingGroup]>;
  readonly isSetMembershipPrice: boolean;
  readonly asSetMembershipPrice: u128;
  readonly isSetCouncilBudgetIncrement: boolean;
  readonly asSetCouncilBudgetIncrement: u128;
  readonly isSetCouncilorReward: boolean;
  readonly asSetCouncilorReward: u128;
  readonly isSetInitialInvitationBalance: boolean;
  readonly asSetInitialInvitationBalance: u128;
  readonly isSetInitialInvitationCount: boolean;
  readonly asSetInitialInvitationCount: u32;
  readonly isSetMembershipLeadInvitationQuota: boolean;
  readonly asSetMembershipLeadInvitationQuota: u32;
  readonly isSetReferralCut: boolean;
  readonly asSetReferralCut: u8;
  readonly isCreateBlogPost: boolean;
  readonly asCreateBlogPost: ITuple<[Text, Text]>;
  readonly isEditBlogPost: boolean;
  readonly asEditBlogPost: ITuple<[PostId, Option<Text>, Option<Text>]>;
  readonly isLockBlogPost: boolean;
  readonly asLockBlogPost: PostId;
  readonly isUnlockBlogPost: boolean;
  readonly asUnlockBlogPost: PostId;
  readonly isVetoProposal: boolean;
  readonly asVetoProposal: ProposalId;
}

/** @name ProposalId */
export interface ProposalId extends u32 {}

/** @name ProposalOf */
export interface ProposalOf extends Struct {
  readonly parameters: ProposalParameters;
  readonly proposerId: MemberId;
  readonly activatedAt: u32;
  readonly status: ProposalStatus;
  readonly votingResults: VotingResults;
  readonly exactExecutionBlock: Option<u32>;
  readonly nrOfCouncilConfirmations: u32;
  readonly stakingAccountId: Option<AccountId>;
}

/** @name ProposalParameters */
export interface ProposalParameters extends Struct {
  readonly votingPeriod: u32;
  readonly gracePeriod: u32;
  readonly approvalQuorumPercentage: u32;
  readonly approvalThresholdPercentage: u32;
  readonly slashingQuorumPercentage: u32;
  readonly slashingThresholdPercentage: u32;
  readonly requiredStake: Option<u128>;
  readonly constitutionality: u32;
}

/** @name ProposalStatus */
export interface ProposalStatus extends Enum {
  readonly isActive: boolean;
  readonly isPendingExecution: boolean;
  readonly asPendingExecution: u32;
  readonly isPendingConstitutionality: boolean;
}

/** @name ReferendumStage */
export interface ReferendumStage extends Enum {
  readonly isInactive: boolean;
  readonly isVoting: boolean;
  readonly asVoting: ReferendumStageVoting;
  readonly isRevealing: boolean;
  readonly asRevealing: ReferendumStageRevealing;
}

/** @name ReferendumStageRevealing */
export interface ReferendumStageRevealing extends Struct {
  readonly started: u32;
  readonly winning_target_count: u64;
  readonly intermediate_winners: Vec<OptionResult>;
  readonly current_cycle_id: u64;
}

/** @name ReferendumStageVoting */
export interface ReferendumStageVoting extends Struct {
  readonly started: u32;
  readonly winning_target_count: u64;
  readonly current_cycle_id: u64;
}

/** @name Reply */
export interface Reply extends Struct {
  readonly text_hash: Hash;
  readonly owner: ParticipantId;
  readonly parent_id: PostId;
}

/** @name ReplyId */
export interface ReplyId extends u64 {}

/** @name ReplyToDelete */
export interface ReplyToDelete extends Struct {
  readonly post_id: PostId;
  readonly reply_id: ReplyId;
  readonly hide: bool;
}

/** @name RewardPaymentType */
export interface RewardPaymentType extends Enum {
  readonly isMissedReward: boolean;
  readonly isRegularReward: boolean;
}

/** @name Season */
export interface Season extends Struct {
  readonly episodes: Vec<VideoId>;
}

/** @name SeasonParameters */
export interface SeasonParameters extends Struct {
  readonly assets: Option<Vec<NewAsset>>;
  readonly episodes: Option<Vec<Option<EpisodeParemters>>>;
  readonly meta: Option<Bytes>;
}

/** @name Series */
export interface Series extends Struct {
  readonly in_channel: ChannelId;
  readonly seasons: Vec<Season>;
}

/** @name SeriesId */
export interface SeriesId extends u64 {}

/** @name SeriesParameters */
export interface SeriesParameters extends Struct {
  readonly assets: Option<Vec<NewAsset>>;
  readonly seasons: Option<Vec<Option<SeasonParameters>>>;
  readonly meta: Option<Bytes>;
}

/** @name SetLeadParams */
export interface SetLeadParams extends ITuple<[MemberId, AccountId]> {}

/** @name StakeParameters */
export interface StakeParameters extends Struct {
  readonly stake: u128;
  readonly staking_account_id: AccountId;
}

/** @name StakePolicy */
export interface StakePolicy extends Struct {
  readonly stake_amount: u128;
  readonly leaving_unstaking_period: u32;
}

/** @name StakingAccountMemberBinding */
export interface StakingAccountMemberBinding extends Struct {
  readonly member_id: MemberId;
  readonly confirmed: bool;
}

/** @name StorageObjectOwner */
export interface StorageObjectOwner extends Enum {
  readonly isMember: boolean;
  readonly asMember: MemberId;
  readonly isChannel: boolean;
  readonly asChannel: ChannelId;
  readonly isDao: boolean;
  readonly asDao: DAOId;
  readonly isCouncil: boolean;
  readonly isWorkingGroup: boolean;
  readonly asWorkingGroup: WorkingGroup;
}

/** @name StorageProviderId */
export interface StorageProviderId extends u64 {}

/** @name TerminateRoleParameters */
export interface TerminateRoleParameters extends Struct {
  readonly worker_id: WorkerId;
  readonly slashing_amount: Option<u128>;
  readonly working_group: WorkingGroup;
}

/** @name Thread */
export interface Thread extends Struct {
  readonly title_hash: Hash;
  readonly category_id: CategoryId;
  readonly author_id: ForumUserId;
  readonly archived: bool;
  readonly poll: Option<Poll>;
  readonly num_direct_posts: u32;
}

/** @name ThreadId */
export interface ThreadId extends u64 {}

/** @name ThreadMode */
export interface ThreadMode extends Enum {
  readonly isOpen: boolean;
  readonly isClosed: boolean;
  readonly asClosed: Vec<MemberId>;
}

/** @name ThreadOf */
export interface ThreadOf extends Struct {
  readonly title_hash: Hash;
  readonly category_id: CategoryId;
  readonly author_id: ForumUserId;
  readonly archived: bool;
  readonly poll: Option<Poll>;
  readonly num_direct_posts: u32;
}

/** @name Title */
export interface Title extends Text {}

/** @name UpdatedBody */
export interface UpdatedBody extends Option<Text> {}

/** @name UpdatedTitle */
export interface UpdatedTitle extends Option<Text> {}

/** @name UploadingStatus */
export interface UploadingStatus extends bool {}

/** @name Url */
export interface Url extends Text {}

/** @name Video */
export interface Video extends Struct {
  readonly in_channel: ChannelId;
  readonly in_series: Option<SeriesId>;
  readonly is_censored: bool;
}

/** @name VideoCategory */
export interface VideoCategory extends Struct {}

/** @name VideoCategoryCreationParameters */
export interface VideoCategoryCreationParameters extends Struct {
  readonly meta: Bytes;
}

/** @name VideoCategoryId */
export interface VideoCategoryId extends u64 {}

/** @name VideoCategoryUpdateParameters */
export interface VideoCategoryUpdateParameters extends Struct {
  readonly new_meta: Bytes;
}

/** @name VideoCreationParameters */
export interface VideoCreationParameters extends Struct {
  readonly assets: Vec<NewAsset>;
  readonly meta: Bytes;
}

/** @name VideoId */
export interface VideoId extends u64 {}

/** @name VideoUpdateParameters */
export interface VideoUpdateParameters extends Struct {
  readonly assets: Option<Vec<NewAsset>>;
  readonly new_meta: Option<Bytes>;
}

/** @name VoteKind */
export interface VoteKind extends Enum {
  readonly isApprove: boolean;
  readonly isReject: boolean;
  readonly isSlash: boolean;
  readonly isAbstain: boolean;
}

/** @name VotePower */
export interface VotePower extends u128 {}

/** @name VotingResults */
export interface VotingResults extends Struct {
  readonly abstensions: u32;
  readonly approvals: u32;
  readonly rejections: u32;
  readonly slashes: u32;
}

/** @name Voucher */
export interface Voucher extends Struct {
  readonly size_limit: u64;
  readonly objects_limit: u64;
  readonly size_used: u64;
  readonly objects_used: u64;
}

/** @name VoucherLimit */
export interface VoucherLimit extends u64 {}

/** @name Worker */
export interface Worker extends Struct {
  readonly member_id: MemberId;
  readonly role_account_id: AccountId;
  readonly staking_account_id: AccountId;
  readonly reward_account_id: AccountId;
  readonly started_leaving_at: Option<u32>;
  readonly job_unstaking_period: u32;
  readonly reward_per_block: Option<u128>;
  readonly missed_reward: Option<u128>;
  readonly created_at: u32;
}

/** @name WorkerId */
export interface WorkerId extends u64 {}

/** @name WorkerInfo */
export interface WorkerInfo extends Struct {
  readonly worker_id: WorkerId;
  readonly worker: Worker;
}

/** @name WorkingGroup */
export interface WorkingGroup extends Enum {
  readonly isForum: boolean;
  readonly isStorage: boolean;
  readonly isContent: boolean;
  readonly isMembership: boolean;
  readonly isOperations: boolean;
  readonly isGateway: boolean;
}

export type PHANTOM_ALL = 'all';
