// Auto-generated via `yarn polkadot-types-from-defs`, do not edit
/* eslint-disable */

import type { BTreeMap, BTreeSet, Bytes, Enum, GenericAccountId, Option, Struct, Text, U8aFixed, Vec, bool, u128, u32, u64, u8 } from '@polkadot/types';
import type { ITuple } from '@polkadot/types/types';
import type { AccountId, Balance, Hash, Perbill, Permill, Perquintill } from '@polkadot/types/interfaces/runtime';
import type { ValidatorPrefsWithCommission } from '@polkadot/types/interfaces/staking';
import type { AccountInfoWithRefCount } from '@polkadot/types/interfaces/system';

/** @name AccountInfo */
export interface AccountInfo extends AccountInfoWithRefCount {}

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
  readonly asClosed: AssuranceContractType_Closed;
}

/** @name AssuranceContractType_Closed */
export interface AssuranceContractType_Closed extends BTreeSet<MemberId> {}

/** @name Bag */
export interface Bag extends Struct {
  readonly stored_by: BTreeSet<StorageBucketId>;
  readonly distributed_by: BTreeSet<DistributionBucketId>;
  readonly objects_total_size: u64;
  readonly objects_number: u64;
}

/** @name BagId */
export interface BagId extends Enum {
  readonly isStatic: boolean;
  readonly asStatic: Static;
  readonly isDynamic: boolean;
  readonly asDynamic: Dynamic;
}

/** @name BagIdType */
export interface BagIdType extends Enum {
  readonly isStatic: boolean;
  readonly asStatic: Static;
  readonly isDynamic: boolean;
  readonly asDynamic: Dynamic;
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

/** @name BlockRate */
export interface BlockRate extends Perquintill {}

/** @name Bounty */
export interface Bounty extends Struct {
  readonly creation_params: BountyCreationParameters;
  readonly total_funding: u128;
  readonly milestone: BountyMilestone;
  readonly active_work_entry_count: u32;
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
export interface BountyId extends u64 {}

/** @name BountyMilestone */
export interface BountyMilestone extends Enum {
  readonly isCreated: boolean;
  readonly asCreated: BountyMilestone_Created;
  readonly isBountyMaxFundingReached: boolean;
  readonly asBountyMaxFundingReached: BountyMilestone_BountyMaxFundingReached;
  readonly isWorkSubmitted: boolean;
  readonly asWorkSubmitted: BountyMilestone_WorkSubmitted;
  readonly isJudgmentSubmitted: boolean;
  readonly asJudgmentSubmitted: BountyMilestone_JudgmentSubmitted;
}

/** @name BountyMilestone_BountyMaxFundingReached */
export interface BountyMilestone_BountyMaxFundingReached extends Struct {
  readonly max_funding_reached_at: u32;
}

/** @name BountyMilestone_Created */
export interface BountyMilestone_Created extends Struct {
  readonly created_at: u32;
  readonly has_contributions: bool;
}

/** @name BountyMilestone_JudgmentSubmitted */
export interface BountyMilestone_JudgmentSubmitted extends Struct {
  readonly successful_bounty: bool;
}

/** @name BountyMilestone_WorkSubmitted */
export interface BountyMilestone_WorkSubmitted extends Struct {
  readonly work_period_started_at: u32;
}

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
  readonly num_videos: u64;
  readonly collaborators: BTreeMap<MemberId, ChannelAgentPermissions>;
  readonly cumulative_reward_claimed: u128;
  readonly privilege_level: ChannelPrivilegeLevel;
  readonly paused_features: BTreeSet<PausableChannelFeature>;
  readonly transfer_status: ChannelTransferStatus;
  readonly data_objects: BTreeSet<DataObjectId>;
  readonly daily_nft_limit: LimitPerPeriod;
  readonly weekly_nft_limit: LimitPerPeriod;
  readonly daily_nft_counter: NftCounter;
  readonly weekly_nft_counter: NftCounter;
  readonly creator_token_id: Option<u64>;
}

/** @name ChannelActionPermission */
export interface ChannelActionPermission extends Enum {
  readonly isUpdateChannelMetadata: boolean;
  readonly isManageNonVideoChannelAssets: boolean;
  readonly isManageChannelCollaborators: boolean;
  readonly isUpdateVideoMetadata: boolean;
  readonly isAddVideo: boolean;
  readonly isManageVideoAssets: boolean;
  readonly isDeleteChannel: boolean;
  readonly isDeleteVideo: boolean;
  readonly isManageVideoNfts: boolean;
  readonly isAgentRemark: boolean;
  readonly isTransferChannel: boolean;
  readonly isClaimChannelReward: boolean;
  readonly isWithdrawFromChannelBalance: boolean;
  readonly isIssueCreatorToken: boolean;
  readonly isClaimCreatorTokenPatronage: boolean;
  readonly isInitAndManageCreatorTokenSale: boolean;
  readonly isCreatorTokenIssuerTransfer: boolean;
  readonly isMakeCreatorTokenPermissionless: boolean;
  readonly isReduceCreatorTokenPatronageRate: boolean;
  readonly isManageRevenueSplits: boolean;
  readonly isDeissueCreatorToken: boolean;
}

/** @name ChannelAgentPermissions */
export interface ChannelAgentPermissions extends BTreeSet<ChannelActionPermission> {}

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
  readonly assets: Option<StorageAssets>;
  readonly meta: Option<Bytes>;
  readonly collaborators: BTreeMap<MemberId, ChannelAgentPermissions>;
  readonly storage_buckets: BTreeSet<u64>;
  readonly distribution_Bucket: BTreeSet<u64>;
  readonly expected_data_object_state_bloat_bond: u128;
}

/** @name ChannelId */
export interface ChannelId extends u64 {}

/** @name ChannelOwner */
export interface ChannelOwner extends Enum {
  readonly isMember: boolean;
  readonly asMember: MemberId;
  readonly isCurators: boolean;
  readonly asCurators: CuratorGroupId;
}

/** @name ChannelPayoutsPayloadParameters */
export interface ChannelPayoutsPayloadParameters extends Struct {
  readonly uploader_account: AccountId;
  readonly object_creation_params: DataObjectCreationParameters;
  readonly expected_data_size_fee: u128;
}

/** @name ChannelPrivilegeLevel */
export interface ChannelPrivilegeLevel extends u8 {}

/** @name ChannelTransferStatus */
export interface ChannelTransferStatus extends Enum {
  readonly isNoActiveTransfer: boolean;
  readonly isPendingTransfer: boolean;
  readonly asPendingTransfer: ChannelTransferStatus_PendingTransfer;
}

/** @name ChannelTransferStatus_PendingTransfer */
export interface ChannelTransferStatus_PendingTransfer extends Struct {
  readonly new_owner: ChannelOwner;
  readonly transfer_params: TransferParameters;
}

/** @name ChannelUpdateParameters */
export interface ChannelUpdateParameters extends Struct {
  readonly assets_to_upload: Option<StorageAssets>;
  readonly new_meta: Option<Bytes>;
  readonly assets_to_remove: BTreeSet<DataObjectId>;
  readonly collaborators: Option<BTreeMap<MemberId, ChannelAgentPermissions>>;
  readonly expected_data_object_state_bloat_bond: u128;
}

/** @name Cid */
export interface Cid extends Bytes {}

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

/** @name ContentIdSet */
export interface ContentIdSet extends BTreeSet<Cid> {}

/** @name ContentModerationAction */
export interface ContentModerationAction extends Enum {
  readonly isHideVideo: boolean;
  readonly isHideChannel: boolean;
  readonly isChangeChannelFeatureStatus: boolean;
  readonly asChangeChannelFeatureStatus: PausableChannelFeature;
  readonly isDeleteVideo: boolean;
  readonly isDeleteChannel: boolean;
  readonly isDeleteVideoAssets: boolean;
  readonly asDeleteVideoAssets: bool;
  readonly isDeleteNonVideoChannelAssets: boolean;
  readonly isUpdateChannelNftLimits: boolean;
}

/** @name ContentModerationActionsSet */
export interface ContentModerationActionsSet extends BTreeSet<ContentModerationAction> {}

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
  readonly curators: BTreeMap<CuratorId, ChannelAgentPermissions>;
  readonly active: bool;
  readonly permissions_by_level: ModerationPermissionsByLevel;
}

/** @name CuratorGroupId */
export interface CuratorGroupId extends u64 {}

/** @name CuratorId */
export interface CuratorId extends u64 {}

/** @name DataObject */
export interface DataObject extends Struct {
  readonly accepted: bool;
  readonly state_bloat_bond: u128;
  readonly ipfsContentId: Bytes;
}

/** @name DataObjectCreationParameters */
export interface DataObjectCreationParameters extends Struct {
  readonly ipfsContentId: Bytes;
}

/** @name DataObjectId */
export interface DataObjectId extends u64 {}

/** @name DataObjectIdMap */
export interface DataObjectIdMap extends BTreeMap<DataObjectId, DataObject> {}

/** @name DataObjectIdSet */
export interface DataObjectIdSet extends BTreeSet<DataObjectId> {}

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

/** @name DistributionBucket */
export interface DistributionBucket extends Struct {
  readonly accepting_new_bags: bool;
  readonly distributing: bool;
  readonly pending_invitations: BTreeSet<WorkerId>;
  readonly operators: BTreeSet<WorkerId>;
  readonly assigned_bags: u64;
}

/** @name DistributionBucketFamily */
export interface DistributionBucketFamily extends Struct {
  readonly next_distribution_bucket_index: DistributionBucketIndex;
}

/** @name DistributionBucketFamilyId */
export interface DistributionBucketFamilyId extends u64 {}

/** @name DistributionBucketId */
export interface DistributionBucketId extends Struct {
  readonly distribution_bucket_family_id: DistributionBucketFamilyId;
  readonly distribution_bucket_index: DistributionBucketIndex;
}

/** @name DistributionBucketIndex */
export interface DistributionBucketIndex extends u64 {}

/** @name DistributionBucketIndexSet */
export interface DistributionBucketIndexSet extends BTreeSet<DistributionBucketIndex> {}

/** @name DistributionBucketsPerBagValueConstraint */
export interface DistributionBucketsPerBagValueConstraint extends Struct {
  readonly min: u64;
  readonly max_min_diff: u64;
}

/** @name Dynamic */
export interface Dynamic extends Enum {
  readonly isMember: boolean;
  readonly asMember: MemberId;
  readonly isChannel: boolean;
  readonly asChannel: u64;
}

/** @name DynamicBagCreationPolicy */
export interface DynamicBagCreationPolicy extends Struct {
  readonly numberOfStorageBuckets: u64;
  readonly families: BTreeMap<DistributionBucketFamilyId, u32>;
}

/** @name DynamicBagCreationPolicyDistributorFamiliesMap */
export interface DynamicBagCreationPolicyDistributorFamiliesMap extends BTreeMap<DistributionBucketFamilyId, u32> {}

/** @name DynamicBagId */
export interface DynamicBagId extends Enum {
  readonly isMember: boolean;
  readonly asMember: MemberId;
  readonly isChannel: boolean;
  readonly asChannel: u64;
}

/** @name DynamicBagType */
export interface DynamicBagType extends Enum {
  readonly isMember: boolean;
  readonly isChannel: boolean;
}

/** @name DynBagCreationParameters */
export interface DynBagCreationParameters extends Struct {
  readonly bagId: DynamicBagId;
  readonly objectCreationList: Vec<DataObjectCreationParameters>;
  readonly stateBloatBondSourceAccountId: GenericAccountId;
  readonly expectedDataSizeFee: u128;
}

/** @name EnglishAuction */
export interface EnglishAuction extends Struct {
  readonly starting_price: u128;
  readonly buy_now_price: Option<u128>;
  readonly whitelist: BTreeSet<MemberId>;
  readonly end: u32;
  readonly start: u32;
  readonly extension_period: u32;
  readonly min_bid_step: u128;
  readonly top_bid: Option<EnglishAuctionBid>;
}

/** @name EnglishAuctionBid */
export interface EnglishAuctionBid extends Struct {
  readonly amount: u128;
  readonly bidder_id: MemberId;
}

/** @name EnglishAuctionParams */
export interface EnglishAuctionParams extends Struct {
  readonly starting_price: u128;
  readonly buy_now_price: Option<u128>;
  readonly whitelist: BTreeSet<MemberId>;
  readonly starts_at: Option<u32>;
  readonly duration: u32;
  readonly extension_period: u32;
  readonly min_bid_step: u128;
}

/** @name Entry */
export interface Entry extends Struct {
  readonly member_id: MemberId;
  readonly staking_account_id: AccountId;
  readonly submitted_at: u32;
  readonly work_submitted: bool;
  readonly oracle_judgment_result: Option<OracleWorkEntryJudgment>;
}

/** @name EntryId */
export interface EntryId extends u64 {}

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

/** @name ExtendedPostId */
export interface ExtendedPostId extends Struct {
  readonly category_id: CategoryId;
  readonly thread_id: ThreadId;
  readonly post_id: PostId;
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

/** @name InitTransactionalStatus */
export interface InitTransactionalStatus extends Enum {
  readonly isIdle: boolean;
  readonly isBuyNow: boolean;
  readonly asBuyNow: u128;
  readonly isInitiatedOfferToMember: boolean;
  readonly asInitiatedOfferToMember: ITuple<[MemberId, Option<u128>]>;
  readonly isEnglishAuction: boolean;
  readonly asEnglishAuction: EnglishAuctionParams;
  readonly isOpenAuction: boolean;
  readonly asOpenAuction: OpenAuctionParams;
}

/** @name InputValidationLengthConstraintU64 */
export interface InputValidationLengthConstraintU64 extends Struct {
  readonly min: u64;
  readonly max_min_diff: u64;
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

/** @name JoyBalance */
export interface JoyBalance extends u128 {}

/** @name LimitPerPeriod */
export interface LimitPerPeriod extends Struct {
  readonly limit: u64;
  readonly block_number_period: u32;
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

/** @name MerkleProof */
export interface MerkleProof extends Vec<ITuple<[U8aFixed, MerkleSide]>> {}

/** @name MerkleSide */
export interface MerkleSide extends Enum {
  readonly isRight: boolean;
  readonly isLeft: boolean;
}

/** @name ModerationPermissionsByLevel */
export interface ModerationPermissionsByLevel extends BTreeMap<ChannelPrivilegeLevel, ContentModerationActionsSet> {}

/** @name ModeratorId */
export interface ModeratorId extends u64 {}

/** @name NftCounter */
export interface NftCounter extends Struct {
  readonly counter: u64;
  readonly last_updated: u32;
}

/** @name NftIssuanceParameters */
export interface NftIssuanceParameters extends Struct {
  readonly royalty: Option<Royalty>;
  readonly nft_metadata: Bytes;
  readonly non_channel_owner: Option<MemberId>;
  readonly init_transactional_status: InitTransactionalStatus;
}

/** @name NftLimitId */
export interface NftLimitId extends Enum {
  readonly isGlobalDaily: boolean;
  readonly isGlobalWeekly: boolean;
  readonly isChannelDaily: boolean;
  readonly asChannelDaily: ChannelId;
  readonly isChannelWeekly: boolean;
  readonly asChannelWeekly: ChannelId;
}

/** @name NftLimitPeriod */
export interface NftLimitPeriod extends Enum {
  readonly isDaily: boolean;
  readonly isWeekly: boolean;
}

/** @name NftMetadata */
export interface NftMetadata extends Bytes {}

/** @name NftOwner */
export interface NftOwner extends Enum {
  readonly isChannelOwner: boolean;
  readonly isMember: boolean;
  readonly asMember: MemberId;
}

/** @name OfferingState */
export interface OfferingState extends Enum {
  readonly isIdle: boolean;
  readonly isUpcomingSale: boolean;
  readonly asUpcomingSale: TokenSale;
  readonly isSale: boolean;
  readonly asSale: TokenSale;
  readonly isBondingCurve: boolean;
}

/** @name OpenAuction */
export interface OpenAuction extends Struct {
  readonly starting_price: u128;
  readonly buy_now_price: Option<u128>;
  readonly whitelist: BTreeSet<MemberId>;
  readonly bid_lock_duration: u32;
  readonly auction_id: OpenAuctionId;
  readonly start: u32;
}

/** @name OpenAuctionBid */
export interface OpenAuctionBid extends Struct {
  readonly amount: u128;
  readonly made_at_block: u32;
  readonly auction_id: OpenAuctionId;
}

/** @name OpenAuctionId */
export interface OpenAuctionId extends u64 {}

/** @name OpenAuctionParams */
export interface OpenAuctionParams extends Struct {
  readonly starting_price: u128;
  readonly buy_now_price: Option<u128>;
  readonly starts_at: Option<u32>;
  readonly whitelist: BTreeSet<MemberId>;
  readonly bid_lock_duration: u32;
}

/** @name Opening */
export interface Opening extends Struct {
  readonly opening_type: OpeningType;
  readonly created: u32;
  readonly description_hash: Bytes;
  readonly stake_policy: StakePolicy;
  readonly reward_per_block: Option<u128>;
  readonly creation_stake: u128;
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
export interface OracleJudgment extends BTreeMap<EntryId, OracleWorkEntryJudgment> {}

/** @name OracleWorkEntryJudgment */
export interface OracleWorkEntryJudgment extends Enum {
  readonly isWinner: boolean;
  readonly asWinner: OracleWorkEntryJudgment_Winner;
  readonly isRejected: boolean;
}

/** @name OracleWorkEntryJudgment_Winner */
export interface OracleWorkEntryJudgment_Winner extends Struct {
  readonly reward: u128;
}

/** @name OwnedNft */
export interface OwnedNft extends Struct {
  readonly owner: NftOwner;
  readonly transactional_status: TransactionalStatus;
  readonly creator_royalty: Option<Royalty>;
  readonly open_auctions_nonce: OpenAuctionId;
}

/** @name ParticipantId */
export interface ParticipantId extends u64 {}

/** @name PausableChannelFeature */
export interface PausableChannelFeature extends Enum {
  readonly isChannelFundsTransfer: boolean;
  readonly isCreatorCashout: boolean;
  readonly isVideoNftIssuance: boolean;
  readonly isVideoCreation: boolean;
  readonly isVideoUpdate: boolean;
  readonly isChannelUpdate: boolean;
  readonly isCreatorTokenIssuance: boolean;
}

/** @name Payment */
export interface Payment extends Struct {
  readonly remark: Bytes;
  readonly amount: u128;
}

/** @name PaymentWithVesting */
export interface PaymentWithVesting extends Struct {
  readonly remark: Bytes;
  readonly amount: u128;
  readonly vesting_schedule: Option<VestingScheduleParams>;
}

/** @name Penalty */
export interface Penalty extends Struct {
  readonly slashing_text: Text;
  readonly slashing_amount: u128;
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

/** @name PollInput */
export interface PollInput extends Struct {
  readonly description: Bytes;
  readonly end_time: u64;
  readonly poll_alternatives: Vec<Bytes>;
}

/** @name Post */
export interface Post extends Struct {
  readonly thread_id: ThreadId;
  readonly text_hash: Hash;
  readonly author_id: ForumUserId;
  readonly cleanup_pay_off: u128;
  readonly last_edited: u32;
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

/** @name ProofElement */
export interface ProofElement extends Struct {
  readonly side: Side;
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
  readonly isUpdateGlobalNftLimit: boolean;
  readonly asUpdateGlobalNftLimit: ITuple<[NftLimitPeriod, u64]>;
  readonly isUpdateChannelPayouts: boolean;
  readonly asUpdateChannelPayouts: UpdateChannelPayoutsParameters;
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
  readonly isUpdateGlobalNftLimit: boolean;
  readonly asUpdateGlobalNftLimit: ITuple<[NftLimitPeriod, u64]>;
  readonly isUpdateChannelPayouts: boolean;
  readonly asUpdateChannelPayouts: UpdateChannelPayoutsParameters;
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

/** @name PullPayment */
export interface PullPayment extends Struct {
  readonly channel_id: ChannelId;
  readonly cumulative_reward_earned: u128;
  readonly reason: Hash;
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

/** @name Royalty */
export interface Royalty extends Perbill {}

/** @name SetLeadParams */
export interface SetLeadParams extends ITuple<[MemberId, AccountId]> {}

/** @name Side */
export interface Side extends Enum {
  readonly isLeft: boolean;
  readonly isRight: boolean;
}

/** @name SingleDataObjectUploadParams */
export interface SingleDataObjectUploadParams extends Struct {
  readonly object_creation_params: DataObjectCreationParameters;
  readonly expeted_data_size_fee: JoyBalance;
  readonly expected_data_object_state_bloat_bond: JoyBalance;
}

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

/** @name Static */
export interface Static extends Enum {
  readonly isCouncil: boolean;
  readonly isWorkingGroup: boolean;
  readonly asWorkingGroup: WorkingGroup;
}

/** @name StaticBagId */
export interface StaticBagId extends Enum {
  readonly isCouncil: boolean;
  readonly isWorkingGroup: boolean;
  readonly asWorkingGroup: WorkingGroup;
}

/** @name StorageAssets */
export interface StorageAssets extends Struct {
  readonly object_creation_list: Vec<DataObjectCreationParameters>;
  readonly expected_data_size_fee: u128;
}

/** @name StorageBucket */
export interface StorageBucket extends Struct {
  readonly operator_status: StorageBucketOperatorStatus;
  readonly accepting_new_bags: bool;
  readonly voucher: Voucher;
  readonly assigned_bags: u64;
}

/** @name StorageBucketId */
export interface StorageBucketId extends u64 {}

/** @name StorageBucketIdSet */
export interface StorageBucketIdSet extends BTreeSet<StorageBucketId> {}

/** @name StorageBucketOperatorStatus */
export interface StorageBucketOperatorStatus extends Enum {
  readonly isMissing: boolean;
  readonly isInvitedStorageWorker: boolean;
  readonly asInvitedStorageWorker: WorkerId;
  readonly isStorageWorker: boolean;
  readonly asStorageWorker: ITuple<[WorkerId, GenericAccountId]>;
}

/** @name StorageBucketsPerBagValueConstraint */
export interface StorageBucketsPerBagValueConstraint extends Struct {
  readonly min: u64;
  readonly max_min_diff: u64;
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
  readonly category_id: CategoryId;
  readonly author_id: ForumUserId;
  readonly poll: Option<Poll>;
  readonly cleanup_pay_off: u128;
  readonly number_of_posts: u64;
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
  readonly category_id: CategoryId;
  readonly author_id: ForumUserId;
  readonly poll: Option<Poll>;
  readonly cleanup_pay_off: u128;
  readonly number_of_posts: u64;
}

/** @name Title */
export interface Title extends Text {}

/** @name TokenAllocation */
export interface TokenAllocation extends Struct {
  readonly amount: u128;
  readonly vesting_schedule_params: Option<VestingScheduleParams>;
}

/** @name TokenId */
export interface TokenId extends u64 {}

/** @name TokenIssuanceParams */
export interface TokenIssuanceParams extends Struct {
  readonly initial_allocation: BTreeMap<MemberId, TokenAllocation>;
  readonly symbol: Hash;
  readonly transfer_policy: TransferPolicyParams;
  readonly patronage_rate: YearlyRate;
}

/** @name TokenSale */
export interface TokenSale extends Struct {
  readonly unit_price: JoyBalance;
  readonly quantity_left: u128;
  readonly funds_collected: JoyBalance;
  readonly token_source: MemberId;
  readonly earnings_destination: Option<AccountId>;
  readonly start_block: u32;
  readonly vesting_schedule_params: Option<VestingScheduleParams>;
  readonly cap_per_member: Option<u128>;
  readonly auto_finalize: bool;
}

/** @name TokenSaleId */
export interface TokenSaleId extends u32 {}

/** @name TokenSaleParams */
export interface TokenSaleParams extends Struct {
  readonly unit_price: JoyBalance;
  readonly upper_bound_quantity: u128;
  readonly starts_at: Option<u32>;
  readonly duration: u32;
  readonly vesting_schedule_params: Option<VestingScheduleParams>;
  readonly cap_per_member: Option<u128>;
  readonly metadata: Option<Bytes>;
}

/** @name TransactionalStatus */
export interface TransactionalStatus extends Enum {
  readonly isIdle: boolean;
  readonly isInitiatedOfferToMember: boolean;
  readonly asInitiatedOfferToMember: ITuple<[MemberId, Option<u128>]>;
  readonly isEnglishAuction: boolean;
  readonly asEnglishAuction: EnglishAuction;
  readonly isOpenAuction: boolean;
  readonly asOpenAuction: OpenAuction;
  readonly isBuyNow: boolean;
  readonly asBuyNow: u128;
}

/** @name TransferParameters */
export interface TransferParameters extends Struct {
  readonly new_collaborators: BTreeMap<MemberId, ChannelAgentPermissions>;
  readonly price: u128;
}

/** @name TransferPolicy */
export interface TransferPolicy extends Enum {
  readonly isPermissionless: boolean;
  readonly isPermissioned: boolean;
  readonly asPermissioned: Hash;
}

/** @name TransferPolicyParams */
export interface TransferPolicyParams extends Enum {
  readonly isPermissionless: boolean;
  readonly isPermissioned: boolean;
  readonly asPermissioned: WhitelistParams;
}

/** @name UpdateChannelPayoutsParameters */
export interface UpdateChannelPayoutsParameters extends Struct {
  readonly commitment: Option<Hash>;
  readonly payload: Option<ChannelPayoutsPayloadParameters>;
  readonly min_cashout_allowed: Option<u128>;
  readonly max_cashout_allowed: Option<u128>;
  readonly channel_cashouts_enabled: Option<bool>;
}

/** @name UpdatedBody */
export interface UpdatedBody extends Option<Text> {}

/** @name UpdatedTitle */
export interface UpdatedTitle extends Option<Text> {}

/** @name UploadContent */
export interface UploadContent extends Struct {
  readonly upload_account: AccountId;
  readonly bag_id: BagId;
}

/** @name UploadParameters */
export interface UploadParameters extends Struct {
  readonly bagId: BagId;
  readonly objectCreationList: Vec<DataObjectCreationParameters>;
  readonly stateBloatBondSourceAccountId: GenericAccountId;
  readonly expectedDataSizeFee: u128;
  readonly expectedDataObjectStateBloatBond: u128;
  readonly storageBuckets: BTreeSet<StorageBucketId>;
  readonly distributionBuckets: BTreeSet<DistributionBucketId>;
}

/** @name Url */
export interface Url extends Text {}

/** @name ValidatedPayment */
export interface ValidatedPayment extends Struct {
  readonly payment: PaymentWithVesting;
  readonly vesting_cleanup_candidate: Option<VestingSource>;
}

/** @name ValidatorPrefs */
export interface ValidatorPrefs extends ValidatorPrefsWithCommission {}

/** @name VestingSchedule */
export interface VestingSchedule extends Struct {
  readonly linear_vesting_start_block: u32;
  readonly linear_vesting_duration: u32;
  readonly cliff_amount: u128;
  readonly post_cliff_total_amount: u128;
  readonly burned_amount: u128;
}

/** @name VestingScheduleParams */
export interface VestingScheduleParams extends Struct {
  readonly linear_vesting_starting_block: u32;
  readonly linear_vesting_duration: u32;
  readonly cliff_amount: u128;
  readonly burned_amount: u128;
}

/** @name VestingSource */
export interface VestingSource extends Enum {
  readonly isInitialIssuance: boolean;
  readonly isSalet: boolean;
  readonly asSalet: TokenSaleId;
  readonly isIssuerTransfer: boolean;
  readonly asIssuerTransfer: u64;
}

/** @name Video */
export interface Video extends Struct {
  readonly in_channel: ChannelId;
  readonly nft_status: Option<OwnedNft>;
  readonly data_objects: BTreeSet<DataObjectId>;
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
  readonly assets: Option<StorageAssets>;
  readonly meta: Option<Bytes>;
  readonly auto_issue_nft: Option<NftIssuanceParameters>;
  readonly expected_data_object_state_bloat_bond: u128;
}

/** @name VideoId */
export interface VideoId extends u64 {}

/** @name VideoUpdateParameters */
export interface VideoUpdateParameters extends Struct {
  readonly assets_to_upload: Option<StorageAssets>;
  readonly new_meta: Option<Bytes>;
  readonly assets_to_remove: BTreeSet<DataObjectId>;
  readonly auto_issue_nft: Option<NftIssuanceParameters>;
  readonly expected_data_object_state_bloat_bond: u128;
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
  readonly sizeLimit: u64;
  readonly objectsLimit: u64;
  readonly sizeUsed: u64;
  readonly objectsUsed: u64;
}

/** @name WhitelistParams */
export interface WhitelistParams extends Struct {
  readonly commitment: Hash;
  readonly payload: Option<SingleDataObjectUploadParams>;
}

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
  readonly isOperationsAlpha: boolean;
  readonly isGateway: boolean;
  readonly isDistribution: boolean;
  readonly isOperationsBeta: boolean;
  readonly isOperationsGamma: boolean;
  readonly isMembership: boolean;
}

/** @name YearlyRate */
export interface YearlyRate extends Permill {}

export type PHANTOM_ALL = 'all';
