// Auto-generated via `yarn polkadot-types-from-defs`, do not edit
/* eslint-disable */

import type { BTreeMap, BTreeSet, Bytes, Enum, GenericAccountId, Null, Option, Struct, Text, Vec, bool, u128, u16, u32, u64 } from '@polkadot/types';
import type { ITuple } from '@polkadot/types/types';
import type { AccountId, Balance, Hash } from '@polkadot/types/interfaces/runtime';
import type { AccountInfoWithRefCount } from '@polkadot/types/interfaces/system';

/** @name AcceptingApplications */
export interface AcceptingApplications extends Struct {
  readonly started_accepting_applicants_at_block: u32;
}

/** @name AccountInfo */
export interface AccountInfo extends AccountInfoWithRefCount {}

/** @name ActivateOpeningAt */
export interface ActivateOpeningAt extends Enum {
  readonly isCurrentBlock: boolean;
  readonly isExactBlock: boolean;
  readonly asExactBlock: u32;
}

/** @name ActiveOpeningStage */
export interface ActiveOpeningStage extends Enum {
  readonly isAcceptingApplications: boolean;
  readonly asAcceptingApplications: AcceptingApplications;
  readonly isReviewPeriod: boolean;
  readonly asReviewPeriod: ReviewPeriod;
  readonly isDeactivated: boolean;
  readonly asDeactivated: Deactivated;
}

/** @name ActiveOpeningStageVariant */
export interface ActiveOpeningStageVariant extends Struct {
  readonly stage: ActiveOpeningStage;
  readonly applications_added: BTreeSet<ApplicationId>;
  readonly active_application_count: u32;
  readonly unstaking_application_count: u32;
  readonly deactivated_application_count: u32;
}

/** @name ActiveStake */
export interface ActiveStake extends Struct {
  readonly stake_id: StakeId;
  readonly source_account_id: GenericAccountId;
}

/** @name Actor */
export interface Actor extends Null {}

/** @name ActorId */
export interface ActorId extends u64 {}

/** @name AddOpeningParameters */
export interface AddOpeningParameters extends Struct {
  readonly activate_at: ActivateOpeningAt;
  readonly commitment: OpeningPolicyCommitment;
  readonly human_readable_text: Bytes;
  readonly working_group: WorkingGroup;
}

/** @name Address */
export interface Address extends AccountId {}

/** @name AddSchemaSupportToEntityOperation */
export interface AddSchemaSupportToEntityOperation extends Null {}

/** @name AdjustCapacityBy */
export interface AdjustCapacityBy extends Enum {
  readonly isSetting: boolean;
  readonly asSetting: u128;
  readonly isAdding: boolean;
  readonly asAdding: u128;
  readonly isReducing: boolean;
  readonly asReducing: u128;
}

/** @name AdjustOnInterval */
export interface AdjustOnInterval extends Struct {
  readonly block_interval: u32;
  readonly adjustment_type: AdjustCapacityBy;
}

/** @name Application */
export interface Application extends Struct {
  readonly opening_id: OpeningId;
  readonly application_index_in_opening: u32;
  readonly add_to_opening_in_block: u32;
  readonly active_role_staking_id: Option<StakeId>;
  readonly active_application_staking_id: Option<StakeId>;
  readonly stage: ApplicationStage;
  readonly human_readable_text: Text;
}

/** @name ApplicationDeactivationCause */
export interface ApplicationDeactivationCause extends Enum {
  readonly isExternal: boolean;
  readonly isHired: boolean;
  readonly isNotHired: boolean;
  readonly isCrowdedOut: boolean;
  readonly isOpeningCancelled: boolean;
  readonly isReviewPeriodExpired: boolean;
  readonly isOpeningFilled: boolean;
}

/** @name ApplicationId */
export interface ApplicationId extends u64 {}

/** @name ApplicationIdSet */
export interface ApplicationIdSet extends BTreeSet<ApplicationId> {}

/** @name ApplicationIdToWorkerIdMap */
export interface ApplicationIdToWorkerIdMap extends BTreeMap<ApplicationId, WorkerId> {}

/** @name ApplicationOf */
export interface ApplicationOf extends Struct {
  readonly role_account_id: GenericAccountId;
  readonly opening_id: OpeningId;
  readonly member_id: MemberId;
  readonly application_id: ApplicationId;
}

/** @name ApplicationRationingPolicy */
export interface ApplicationRationingPolicy extends Struct {
  readonly max_active_applicants: u32;
}

/** @name ApplicationStage */
export interface ApplicationStage extends Enum {
  readonly isActive: boolean;
  readonly isUnstaking: boolean;
  readonly asUnstaking: UnstakingApplicationStage;
  readonly isInactive: boolean;
  readonly asInactive: InactiveApplicationStage;
}

/** @name Approved */
export interface Approved extends Enum {
  readonly isPendingExecution: boolean;
  readonly isExecuted: boolean;
  readonly isExecutionFailed: boolean;
  readonly asExecutionFailed: ExecutionFailed;
}

/** @name Backer */
export interface Backer extends Struct {
  readonly member: GenericAccountId;
  readonly stake: u128;
}

/** @name Backers */
export interface Backers extends Vec<Backer> {}

/** @name Bag */
export interface Bag extends Struct {
  readonly stored_by: BTreeSet<StorageBucketId>;
  readonly distributed_by: BTreeSet<DistributionBucketId>;
  readonly deletion_prize: Option<u128>;
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

/** @name BalanceOfMint */
export interface BalanceOfMint extends u128 {}

/** @name BlockAndTime */
export interface BlockAndTime extends Struct {
  readonly block: u32;
  readonly time: u64;
}

/** @name Category */
export interface Category extends Struct {
  readonly id: CategoryId;
  readonly title: Text;
  readonly description: Text;
  readonly created_at: BlockAndTime;
  readonly deleted: bool;
  readonly archived: bool;
  readonly num_direct_subcategories: u32;
  readonly num_direct_unmoderated_threads: u32;
  readonly num_direct_moderated_threads: u32;
  readonly position_in_parent_category: Option<ChildPositionInParentCategory>;
  readonly moderator_id: GenericAccountId;
}

/** @name CategoryId */
export interface CategoryId extends u64 {}

/** @name Channel */
export interface Channel extends Struct {
  readonly owner: ChannelOwner;
  readonly num_videos: u64;
  readonly is_censored: bool;
  readonly reward_account: Option<GenericAccountId>;
  readonly collaborators: BTreeSet<MemberId>;
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

/** @name ChannelContentType */
export interface ChannelContentType extends Null {}

/** @name ChannelCreationParameters */
export interface ChannelCreationParameters extends Struct {
  readonly assets: Option<StorageAssets>;
  readonly meta: Option<Bytes>;
  readonly reward_account: Option<GenericAccountId>;
  readonly collaborators: BTreeSet<MemberId>;
}

/** @name ChannelCurationStatus */
export interface ChannelCurationStatus extends Null {}

/** @name ChannelId */
export interface ChannelId extends u64 {}

/** @name ChannelOwner */
export interface ChannelOwner extends Enum {
  readonly isMember: boolean;
  readonly asMember: MemberId;
  readonly isCurators: boolean;
  readonly asCurators: CuratorGroupId;
}

/** @name ChannelOwnershipTransferRequest */
export interface ChannelOwnershipTransferRequest extends Struct {
  readonly channel_id: ChannelId;
  readonly new_owner: ChannelOwner;
  readonly payment: u128;
  readonly new_reward_account: Option<GenericAccountId>;
}

/** @name ChannelOwnershipTransferRequestId */
export interface ChannelOwnershipTransferRequestId extends u64 {}

/** @name ChannelPublicationStatus */
export interface ChannelPublicationStatus extends Null {}

/** @name ChannelUpdateParameters */
export interface ChannelUpdateParameters extends Struct {
  readonly assets_to_upload: Option<StorageAssets>;
  readonly new_meta: Option<Bytes>;
  readonly reward_account: Option<Option<GenericAccountId>>;
  readonly assets_to_remove: BTreeSet<DataObjectId>;
  readonly collaborators: Option<BTreeSet<MemberId>>;
}

/** @name ChildPositionInParentCategory */
export interface ChildPositionInParentCategory extends Struct {
  readonly parent_id: CategoryId;
  readonly child_nr_in_parent_category: u32;
}

/** @name Cid */
export interface Cid extends Bytes {}

/** @name Class */
export interface Class extends Null {}

/** @name ClassId */
export interface ClassId extends Null {}

/** @name ClassOf */
export interface ClassOf extends Null {}

/** @name ClassPermissions */
export interface ClassPermissions extends Null {}

/** @name ClassPermissionsType */
export interface ClassPermissionsType extends Null {}

/** @name ClassPropertyValue */
export interface ClassPropertyValue extends Null {}

/** @name ContentActor */
export interface ContentActor extends Enum {
  readonly isCurator: boolean;
  readonly asCurator: ITuple<[CuratorGroupId, CuratorId]>;
  readonly isMember: boolean;
  readonly asMember: MemberId;
  readonly isLead: boolean;
  readonly isCollaborator: boolean;
  readonly asCollaborator: MemberId;
}

/** @name ContentIdSet */
export interface ContentIdSet extends BTreeSet<Cid> {}

/** @name CreateEntityOperation */
export interface CreateEntityOperation extends Null {}

/** @name Credential */
export interface Credential extends Null {}

/** @name CredentialSet */
export interface CredentialSet extends Null {}

/** @name CurationActor */
export interface CurationActor extends Null {}

/** @name Curator */
export interface Curator extends Null {}

/** @name CuratorApplication */
export interface CuratorApplication extends Null {}

/** @name CuratorApplicationId */
export interface CuratorApplicationId extends Null {}

/** @name CuratorApplicationIdSet */
export interface CuratorApplicationIdSet extends Null {}

/** @name CuratorApplicationIdToCuratorIdMap */
export interface CuratorApplicationIdToCuratorIdMap extends Null {}

/** @name CuratorGroup */
export interface CuratorGroup extends Struct {
  readonly curators: BTreeSet<CuratorId>;
  readonly active: bool;
}

/** @name CuratorGroupId */
export interface CuratorGroupId extends u64 {}

/** @name CuratorId */
export interface CuratorId extends u64 {}

/** @name CuratorOpening */
export interface CuratorOpening extends Null {}

/** @name CuratorOpeningId */
export interface CuratorOpeningId extends Null {}

/** @name DataObject */
export interface DataObject extends Struct {
  readonly accepted: bool;
  readonly deletion_prize: u128;
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

/** @name Deactivated */
export interface Deactivated extends Struct {
  readonly cause: OpeningDeactivationCause;
  readonly deactivated_at_block: u32;
  readonly started_accepting_applicants_at_block: u32;
  readonly started_review_period_at_block: Option<u32>;
}

/** @name DiscussionPost */
export interface DiscussionPost extends Struct {
  readonly text: Bytes;
  readonly created_at: u32;
  readonly updated_at: u32;
  readonly author_id: MemberId;
  readonly thread_id: ThreadId;
  readonly edition_number: u32;
}

/** @name DiscussionThread */
export interface DiscussionThread extends Struct {
  readonly title: Bytes;
  readonly created_at: u32;
  readonly author_id: MemberId;
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
  readonly distribution_buckets: BTreeMap<DistributionBucketId, DistributionBucket>;
}

/** @name DistributionBucketFamilyId */
export interface DistributionBucketFamilyId extends u64 {}

/** @name DistributionBucketId */
export interface DistributionBucketId extends u64 {}

/** @name DistributionBucketIdSet */
export interface DistributionBucketIdSet extends BTreeSet<DistributionBucketId> {}

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

/** @name DynamicBagDeletionPrize */
export interface DynamicBagDeletionPrize extends Struct {
  readonly account_id: GenericAccountId;
  readonly prize: u128;
}

/** @name DynamicBagDeletionPrizeRecord */
export interface DynamicBagDeletionPrizeRecord extends Struct {
  readonly account_id: GenericAccountId;
  readonly prize: u128;
}

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

/** @name ElectionParameters */
export interface ElectionParameters extends Struct {
  readonly announcing_period: u32;
  readonly voting_period: u32;
  readonly revealing_period: u32;
  readonly council_size: u32;
  readonly candidacy_limit: u32;
  readonly new_term_duration: u32;
  readonly min_council_stake: u128;
  readonly min_voting_stake: u128;
}

/** @name ElectionStage */
export interface ElectionStage extends Enum {
  readonly isAnnouncing: boolean;
  readonly asAnnouncing: u32;
  readonly isVoting: boolean;
  readonly asVoting: u32;
  readonly isRevealing: boolean;
  readonly asRevealing: u32;
}

/** @name ElectionStake */
export interface ElectionStake extends Struct {
  readonly new: u128;
  readonly transferred: u128;
}

/** @name Entity */
export interface Entity extends Null {}

/** @name EntityController */
export interface EntityController extends Null {}

/** @name EntityCreationVoucher */
export interface EntityCreationVoucher extends Null {}

/** @name EntityId */
export interface EntityId extends Null {}

/** @name EntityOf */
export interface EntityOf extends Null {}

/** @name EntityPermissions */
export interface EntityPermissions extends Null {}

/** @name EntityReferenceCounterSideEffect */
export interface EntityReferenceCounterSideEffect extends Null {}

/** @name EntryMethod */
export interface EntryMethod extends Enum {
  readonly isPaid: boolean;
  readonly asPaid: u64;
  readonly isScreening: boolean;
  readonly asScreening: AccountId;
  readonly isGenesis: boolean;
}

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

/** @name FailedAt */
export interface FailedAt extends Null {}

/** @name FillOpeningParameters */
export interface FillOpeningParameters extends Struct {
  readonly opening_id: OpeningId;
  readonly successful_application_id: ApplicationId;
  readonly reward_policy: Option<RewardPolicy>;
  readonly working_group: WorkingGroup;
}

/** @name Finalized */
export interface Finalized extends Struct {
  readonly proposalStatus: ProposalDecisionStatus;
  readonly finalizedAt: u32;
  readonly encodedUnstakingErrorDueToBrokenRuntime: Option<Bytes>;
  readonly stakeDataAfterUnstakingError: Option<ActiveStake>;
}

/** @name HashedTextMaxLength */
export interface HashedTextMaxLength extends Null {}

/** @name HiringApplicationId */
export interface HiringApplicationId extends u64 {}

/** @name InactiveApplicationStage */
export interface InactiveApplicationStage extends Struct {
  readonly deactivation_initiated: u32;
  readonly deactivated: u32;
  readonly cause: ApplicationDeactivationCause;
}

/** @name InboundReferenceCounter */
export interface InboundReferenceCounter extends Null {}

/** @name InputEntityValuesMap */
export interface InputEntityValuesMap extends Null {}

/** @name InputPropertyValue */
export interface InputPropertyValue extends Null {}

/** @name InputValidationLengthConstraint */
export interface InputValidationLengthConstraint extends Struct {
  readonly min: u16;
  readonly max_min_diff: u16;
}

/** @name InputValue */
export interface InputValue extends Null {}

/** @name IPNSIdentity */
export interface IPNSIdentity extends Null {}

/** @name IsCensored */
export interface IsCensored extends bool {}

/** @name Lead */
export interface Lead extends Null {}

/** @name LeadId */
export interface LeadId extends Null {}

/** @name LookupSource */
export interface LookupSource extends AccountId {}

/** @name MaxNumber */
export interface MaxNumber extends u32 {}

/** @name MemberId */
export interface MemberId extends u64 {}

/** @name Membership */
export interface Membership extends Struct {
  readonly handle: Text;
  readonly avatar_uri: Text;
  readonly about: Text;
  readonly registered_at_block: u32;
  readonly registered_at_time: u64;
  readonly entry: EntryMethod;
  readonly suspended: bool;
  readonly subscription: Option<SubscriptionId>;
  readonly root_account: GenericAccountId;
  readonly controller_account: GenericAccountId;
}

/** @name MemoText */
export interface MemoText extends Text {}

/** @name Mint */
export interface Mint extends Struct {
  readonly capacity: u128;
  readonly next_adjustment: Option<NextAdjustment>;
  readonly created_at: u32;
  readonly total_minted: u128;
}

/** @name MintBalanceOf */
export interface MintBalanceOf extends u128 {}

/** @name MintId */
export interface MintId extends u64 {}

/** @name ModerationAction */
export interface ModerationAction extends Struct {
  readonly moderated_at: BlockAndTime;
  readonly moderator_id: GenericAccountId;
  readonly rationale: Text;
}

/** @name NextAdjustment */
export interface NextAdjustment extends Struct {
  readonly adjustment: AdjustOnInterval;
  readonly at_block: u32;
}

/** @name Nonce */
export interface Nonce extends Null {}

/** @name Opening */
export interface Opening extends Struct {
  readonly created: u32;
  readonly stage: OpeningStage;
  readonly max_review_period_length: u32;
  readonly application_rationing_policy: Option<ApplicationRationingPolicy>;
  readonly application_staking_policy: Option<StakingPolicy>;
  readonly role_staking_policy: Option<StakingPolicy>;
  readonly human_readable_text: Text;
}

/** @name OpeningDeactivationCause */
export interface OpeningDeactivationCause extends Enum {
  readonly isCancelledBeforeActivation: boolean;
  readonly isCancelledAcceptingApplications: boolean;
  readonly isCancelledInReviewPeriod: boolean;
  readonly isReviewPeriodExpired: boolean;
  readonly isFilled: boolean;
}

/** @name OpeningId */
export interface OpeningId extends u64 {}

/** @name OpeningOf */
export interface OpeningOf extends Struct {
  readonly hiring_opening_id: OpeningId;
  readonly applications: BTreeSet<ApplicationId>;
  readonly policy_commitment: OpeningPolicyCommitment;
  readonly opening_type: OpeningType;
}

/** @name OpeningPolicyCommitment */
export interface OpeningPolicyCommitment extends Struct {
  readonly application_rationing_policy: Option<ApplicationRationingPolicy>;
  readonly max_review_period_length: u32;
  readonly application_staking_policy: Option<StakingPolicy>;
  readonly role_staking_policy: Option<StakingPolicy>;
  readonly role_slashing_terms: SlashingTerms;
  readonly fill_opening_successful_applicant_application_stake_unstaking_period: Option<u32>;
  readonly fill_opening_failed_applicant_application_stake_unstaking_period: Option<u32>;
  readonly fill_opening_failed_applicant_role_stake_unstaking_period: Option<u32>;
  readonly terminate_application_stake_unstaking_period: Option<u32>;
  readonly terminate_role_stake_unstaking_period: Option<u32>;
  readonly exit_role_application_stake_unstaking_period: Option<u32>;
  readonly exit_role_stake_unstaking_period: Option<u32>;
}

/** @name OpeningStage */
export interface OpeningStage extends Enum {
  readonly isWaitingToBegin: boolean;
  readonly asWaitingToBegin: WaitingToBeingOpeningStageVariant;
  readonly isActive: boolean;
  readonly asActive: ActiveOpeningStageVariant;
}

/** @name OpeningType */
export interface OpeningType extends Enum {
  readonly isLeader: boolean;
  readonly isWorker: boolean;
}

/** @name Operation */
export interface Operation extends Null {}

/** @name OperationType */
export interface OperationType extends Null {}

/** @name OptionalText */
export interface OptionalText extends Null {}

/** @name PaidMembershipTerms */
export interface PaidMembershipTerms extends Struct {
  readonly fee: u128;
  readonly text: Text;
}

/** @name PaidTermId */
export interface PaidTermId extends u64 {}

/** @name ParameterizedEntity */
export interface ParameterizedEntity extends Null {}

/** @name ParametrizedClassPropertyValue */
export interface ParametrizedClassPropertyValue extends Null {}

/** @name ParametrizedPropertyValue */
export interface ParametrizedPropertyValue extends Null {}

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
  readonly assets: StorageAssets;
  readonly meta: Bytes;
}

/** @name PersonId */
export interface PersonId extends u64 {}

/** @name PersonUpdateParameters */
export interface PersonUpdateParameters extends Struct {
  readonly assets: Option<StorageAssets>;
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

/** @name Post */
export interface Post extends Struct {
  readonly id: PostId;
  readonly thread_id: ThreadId;
  readonly nr_in_thread: u32;
  readonly current_text: Text;
  readonly moderation: Option<ModerationAction>;
  readonly text_change_history: Vec<PostTextChange>;
  readonly created_at: BlockAndTime;
  readonly author_id: GenericAccountId;
}

/** @name PostId */
export interface PostId extends u64 {}

/** @name PostTextChange */
export interface PostTextChange extends Struct {
  readonly expired_at: BlockAndTime;
  readonly text: Text;
}

/** @name Principal */
export interface Principal extends Null {}

/** @name PrincipalId */
export interface PrincipalId extends Null {}

/** @name Property */
export interface Property extends Null {}

/** @name PropertyId */
export interface PropertyId extends Null {}

/** @name PropertyLockingPolicy */
export interface PropertyLockingPolicy extends Null {}

/** @name PropertyType */
export interface PropertyType extends Null {}

/** @name PropertyTypeSingle */
export interface PropertyTypeSingle extends Null {}

/** @name PropertyTypeVector */
export interface PropertyTypeVector extends Null {}

/** @name ProposalDecisionStatus */
export interface ProposalDecisionStatus extends Enum {
  readonly isCanceled: boolean;
  readonly isVetoed: boolean;
  readonly isRejected: boolean;
  readonly isSlashed: boolean;
  readonly isExpired: boolean;
  readonly isApproved: boolean;
  readonly asApproved: Approved;
}

/** @name ProposalDetails */
export interface ProposalDetails extends Enum {
  readonly isText: boolean;
  readonly asText: Text;
  readonly isRuntimeUpgrade: boolean;
  readonly asRuntimeUpgrade: Bytes;
  readonly isSetElectionParameters: boolean;
  readonly asSetElectionParameters: ElectionParameters;
  readonly isSpending: boolean;
  readonly asSpending: ITuple<[Balance, AccountId]>;
  readonly isSetLead: boolean;
  readonly asSetLead: Option<SetLeadParams>;
  readonly isSetContentWorkingGroupMintCapacity: boolean;
  readonly asSetContentWorkingGroupMintCapacity: u128;
  readonly isEvictStorageProvider: boolean;
  readonly asEvictStorageProvider: GenericAccountId;
  readonly isSetValidatorCount: boolean;
  readonly asSetValidatorCount: u32;
  readonly isSetStorageRoleParameters: boolean;
  readonly asSetStorageRoleParameters: RoleParameters;
  readonly isAddWorkingGroupLeaderOpening: boolean;
  readonly asAddWorkingGroupLeaderOpening: AddOpeningParameters;
  readonly isBeginReviewWorkingGroupLeaderApplication: boolean;
  readonly asBeginReviewWorkingGroupLeaderApplication: ITuple<[OpeningId, WorkingGroup]>;
  readonly isFillWorkingGroupLeaderOpening: boolean;
  readonly asFillWorkingGroupLeaderOpening: FillOpeningParameters;
  readonly isSetWorkingGroupMintCapacity: boolean;
  readonly asSetWorkingGroupMintCapacity: ITuple<[Balance, WorkingGroup]>;
  readonly isDecreaseWorkingGroupLeaderStake: boolean;
  readonly asDecreaseWorkingGroupLeaderStake: ITuple<[WorkerId, Balance, WorkingGroup]>;
  readonly isSlashWorkingGroupLeaderStake: boolean;
  readonly asSlashWorkingGroupLeaderStake: ITuple<[WorkerId, Balance, WorkingGroup]>;
  readonly isSetWorkingGroupLeaderReward: boolean;
  readonly asSetWorkingGroupLeaderReward: ITuple<[WorkerId, Balance, WorkingGroup]>;
  readonly isTerminateWorkingGroupLeaderRole: boolean;
  readonly asTerminateWorkingGroupLeaderRole: TerminateRoleParameters;
}

/** @name ProposalDetailsOf */
export interface ProposalDetailsOf extends Enum {
  readonly isText: boolean;
  readonly asText: Text;
  readonly isRuntimeUpgrade: boolean;
  readonly asRuntimeUpgrade: Bytes;
  readonly isSetElectionParameters: boolean;
  readonly asSetElectionParameters: ElectionParameters;
  readonly isSpending: boolean;
  readonly asSpending: ITuple<[Balance, AccountId]>;
  readonly isSetLead: boolean;
  readonly asSetLead: Option<SetLeadParams>;
  readonly isSetContentWorkingGroupMintCapacity: boolean;
  readonly asSetContentWorkingGroupMintCapacity: u128;
  readonly isEvictStorageProvider: boolean;
  readonly asEvictStorageProvider: GenericAccountId;
  readonly isSetValidatorCount: boolean;
  readonly asSetValidatorCount: u32;
  readonly isSetStorageRoleParameters: boolean;
  readonly asSetStorageRoleParameters: RoleParameters;
  readonly isAddWorkingGroupLeaderOpening: boolean;
  readonly asAddWorkingGroupLeaderOpening: AddOpeningParameters;
  readonly isBeginReviewWorkingGroupLeaderApplication: boolean;
  readonly asBeginReviewWorkingGroupLeaderApplication: ITuple<[OpeningId, WorkingGroup]>;
  readonly isFillWorkingGroupLeaderOpening: boolean;
  readonly asFillWorkingGroupLeaderOpening: FillOpeningParameters;
  readonly isSetWorkingGroupMintCapacity: boolean;
  readonly asSetWorkingGroupMintCapacity: ITuple<[Balance, WorkingGroup]>;
  readonly isDecreaseWorkingGroupLeaderStake: boolean;
  readonly asDecreaseWorkingGroupLeaderStake: ITuple<[WorkerId, Balance, WorkingGroup]>;
  readonly isSlashWorkingGroupLeaderStake: boolean;
  readonly asSlashWorkingGroupLeaderStake: ITuple<[WorkerId, Balance, WorkingGroup]>;
  readonly isSetWorkingGroupLeaderReward: boolean;
  readonly asSetWorkingGroupLeaderReward: ITuple<[WorkerId, Balance, WorkingGroup]>;
  readonly isTerminateWorkingGroupLeaderRole: boolean;
  readonly asTerminateWorkingGroupLeaderRole: TerminateRoleParameters;
}

/** @name ProposalId */
export interface ProposalId extends u32 {}

/** @name ProposalOf */
export interface ProposalOf extends Struct {
  readonly parameters: ProposalParameters;
  readonly proposerId: MemberId;
  readonly title: Text;
  readonly description: Text;
  readonly createdAt: u32;
  readonly status: ProposalStatus;
  readonly votingResults: VotingResults;
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
}

/** @name ProposalStatus */
export interface ProposalStatus extends Enum {
  readonly isActive: boolean;
  readonly asActive: Option<ActiveStake>;
  readonly isFinalized: boolean;
  readonly asFinalized: Finalized;
}

/** @name RationaleText */
export interface RationaleText extends Bytes {}

/** @name Recipient */
export interface Recipient extends Struct {
  readonly total_reward_received: u128;
  readonly total_reward_missed: u128;
}

/** @name RecipientId */
export interface RecipientId extends u64 {}

/** @name ReferenceConstraint */
export interface ReferenceConstraint extends Null {}

/** @name ReferenceCounterSideEffects */
export interface ReferenceCounterSideEffects extends Null {}

/** @name Reply */
export interface Reply extends Struct {
  readonly owner: GenericAccountId;
  readonly thread_id: ThreadId;
  readonly text: Text;
  readonly moderation: Option<ModerationAction>;
}

/** @name ReplyId */
export interface ReplyId extends u64 {}

/** @name ReviewPeriod */
export interface ReviewPeriod extends Struct {
  readonly started_accepting_applicants_at_block: u32;
  readonly started_review_period_at_block: u32;
}

/** @name RewardPolicy */
export interface RewardPolicy extends Struct {
  readonly amount_per_payout: u128;
  readonly next_payment_at_block: u32;
  readonly payout_interval: Option<u32>;
}

/** @name RewardRelationship */
export interface RewardRelationship extends Struct {
  readonly recipient: RecipientId;
  readonly mint_id: MintId;
  readonly account: GenericAccountId;
  readonly amount_per_payout: u128;
  readonly next_payment_at_block: Option<u32>;
  readonly payout_interval: Option<u32>;
  readonly total_reward_received: u128;
  readonly total_reward_missed: u128;
}

/** @name RewardRelationshipId */
export interface RewardRelationshipId extends u64 {}

/** @name RoleParameters */
export interface RoleParameters extends Struct {
  readonly min_stake: u128;
  readonly min_actors: u32;
  readonly max_actors: u32;
  readonly reward: u128;
  readonly reward_period: u32;
  readonly bonding_period: u32;
  readonly unbonding_period: u32;
  readonly min_service_period: u32;
  readonly startup_grace_period: u32;
  readonly entry_request_fee: u128;
}

/** @name RoleStakeProfile */
export interface RoleStakeProfile extends Struct {
  readonly stake_id: StakeId;
  readonly termination_unstaking_period: Option<u32>;
  readonly exit_unstaking_period: Option<u32>;
}

/** @name SameController */
export interface SameController extends Null {}

/** @name Schema */
export interface Schema extends Null {}

/** @name SchemaId */
export interface SchemaId extends Null {}

/** @name SealedVote */
export interface SealedVote extends Struct {
  readonly voter: GenericAccountId;
  readonly commitment: Hash;
  readonly stake: ElectionStake;
  readonly vote: Option<GenericAccountId>;
}

/** @name Season */
export interface Season extends Struct {
  readonly episodes: Vec<VideoId>;
}

/** @name SeasonParameters */
export interface SeasonParameters extends Struct {
  readonly assets: Option<StorageAssets>;
  readonly episodes: Option<Vec<Option<EpisodeParemters>>>;
  readonly meta: Option<Bytes>;
}

/** @name Seat */
export interface Seat extends Struct {
  readonly member: GenericAccountId;
  readonly stake: u128;
  readonly backers: Backers;
}

/** @name Seats */
export interface Seats extends Vec<Seat> {}

/** @name Series */
export interface Series extends Struct {
  readonly in_channel: ChannelId;
  readonly seasons: Vec<Season>;
}

/** @name SeriesId */
export interface SeriesId extends u64 {}

/** @name SeriesParameters */
export interface SeriesParameters extends Struct {
  readonly assets: Option<StorageAssets>;
  readonly seasons: Option<Vec<Option<SeasonParameters>>>;
  readonly meta: Option<Bytes>;
}

/** @name ServiceProviderRecord */
export interface ServiceProviderRecord extends Null {}

/** @name SetLeadParams */
export interface SetLeadParams extends ITuple<[MemberId, GenericAccountId]> {}

/** @name SideEffect */
export interface SideEffect extends Null {}

/** @name SideEffects */
export interface SideEffects extends Null {}

/** @name Slash */
export interface Slash extends Struct {
  readonly started_at_block: u32;
  readonly is_active: bool;
  readonly blocks_remaining_in_active_period_for_slashing: u32;
  readonly slash_amount: u128;
}

/** @name SlashableTerms */
export interface SlashableTerms extends Struct {
  readonly max_count: u16;
  readonly max_percent_pts_per_time: u16;
}

/** @name SlashingTerms */
export interface SlashingTerms extends Enum {
  readonly isUnslashable: boolean;
  readonly isSlashable: boolean;
  readonly asSlashable: SlashableTerms;
}

/** @name Stake */
export interface Stake extends Struct {
  readonly created: u32;
  readonly staking_status: StakingStatus;
}

/** @name Staked */
export interface Staked extends Struct {
  readonly staked_amount: u128;
  readonly staked_status: StakedStatus;
  readonly next_slash_id: u64;
  readonly ongoing_slashes: BTreeMap<u64, Slash>;
}

/** @name StakedStatus */
export interface StakedStatus extends Enum {
  readonly isNormal: boolean;
  readonly isUnstaking: boolean;
  readonly asUnstaking: Unstaking;
}

/** @name StakeId */
export interface StakeId extends u64 {}

/** @name StakingAmountLimitMode */
export interface StakingAmountLimitMode extends Enum {
  readonly isAtLeast: boolean;
  readonly isExact: boolean;
}

/** @name StakingPolicy */
export interface StakingPolicy extends Struct {
  readonly amount: u128;
  readonly amount_mode: StakingAmountLimitMode;
  readonly crowded_out_unstaking_period_length: Option<u32>;
  readonly review_period_expired_unstaking_period_length: Option<u32>;
}

/** @name StakingStatus */
export interface StakingStatus extends Enum {
  readonly isNotStaked: boolean;
  readonly isStaked: boolean;
  readonly asStaked: Staked;
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

/** @name Status */
export interface Status extends Null {}

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
  readonly metadata: Bytes;
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
  readonly asStorageWorker: WorkerId;
}

/** @name StorageBucketsPerBagValueConstraint */
export interface StorageBucketsPerBagValueConstraint extends Struct {
  readonly min: u64;
  readonly max_min_diff: u64;
}

/** @name StorageProviderId */
export interface StorageProviderId extends u64 {}

/** @name StoredPropertyValue */
export interface StoredPropertyValue extends Null {}

/** @name StoredValue */
export interface StoredValue extends Null {}

/** @name SubscriptionId */
export interface SubscriptionId extends u64 {}

/** @name TerminateRoleParameters */
export interface TerminateRoleParameters extends Struct {
  readonly worker_id: WorkerId;
  readonly rationale: Bytes;
  readonly slash: bool;
  readonly working_group: WorkingGroup;
}

/** @name TextMaxLength */
export interface TextMaxLength extends Null {}

/** @name Thread */
export interface Thread extends Struct {
  readonly id: ThreadId;
  readonly title: Text;
  readonly category_id: CategoryId;
  readonly nr_in_category: u32;
  readonly moderation: Option<ModerationAction>;
  readonly num_unmoderated_posts: u32;
  readonly num_moderated_posts: u32;
  readonly created_at: BlockAndTime;
  readonly author_id: GenericAccountId;
}

/** @name ThreadCounter */
export interface ThreadCounter extends Struct {
  readonly author_id: MemberId;
  readonly counter: u32;
}

/** @name ThreadId */
export interface ThreadId extends u64 {}

/** @name TransferableStake */
export interface TransferableStake extends Struct {
  readonly seat: u128;
  readonly backing: u128;
}

/** @name Unstaking */
export interface Unstaking extends Struct {
  readonly started_at_block: u32;
  readonly is_active: bool;
  readonly blocks_remaining_in_active_period_for_unstaking: u32;
}

/** @name UnstakingApplicationStage */
export interface UnstakingApplicationStage extends Struct {
  readonly deactivation_initiated: u32;
  readonly cause: ApplicationDeactivationCause;
}

/** @name UpdatePropertyValuesOperation */
export interface UpdatePropertyValuesOperation extends Null {}

/** @name UploadParameters */
export interface UploadParameters extends Struct {
  readonly bagId: BagId;
  readonly objectCreationList: Vec<DataObjectCreationParameters>;
  readonly deletionPrizeSourceAccountId: GenericAccountId;
  readonly expectedDataSizeFee: u128;
}

/** @name Url */
export interface Url extends Text {}

/** @name VecInputValue */
export interface VecInputValue extends Null {}

/** @name VecMaxLength */
export interface VecMaxLength extends Null {}

/** @name VecStoredPropertyValue */
export interface VecStoredPropertyValue extends Null {}

/** @name VecStoredValue */
export interface VecStoredValue extends Null {}

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
  readonly assets: Option<StorageAssets>;
  readonly meta: Option<Bytes>;
}

/** @name VideoId */
export interface VideoId extends u64 {}

/** @name VideoUpdateParameters */
export interface VideoUpdateParameters extends Struct {
  readonly assets_to_upload: Option<StorageAssets>;
  readonly new_meta: Option<Bytes>;
  readonly assets_to_remove: BTreeSet<DataObjectId>;
}

/** @name VoteKind */
export interface VoteKind extends Enum {
  readonly isApprove: boolean;
  readonly isReject: boolean;
  readonly isSlash: boolean;
  readonly isAbstain: boolean;
}

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

/** @name WaitingToBeingOpeningStageVariant */
export interface WaitingToBeingOpeningStageVariant extends Struct {
  readonly begins_at_block: u32;
}

/** @name WorkerId */
export interface WorkerId extends u64 {}

/** @name WorkerOf */
export interface WorkerOf extends Struct {
  readonly member_id: MemberId;
  readonly role_account_id: GenericAccountId;
  readonly reward_relationship: Option<RewardRelationshipId>;
  readonly role_stake_profile: Option<RoleStakeProfile>;
}

/** @name WorkingGroup */
export interface WorkingGroup extends Enum {
  readonly isStorage: boolean;
  readonly isContent: boolean;
  readonly isOperationsAlpha: boolean;
  readonly isGateway: boolean;
  readonly isDistribution: boolean;
  readonly isOperationsBeta: boolean;
  readonly isOperationsGamma: boolean;
}

/** @name WorkingGroupUnstaker */
export interface WorkingGroupUnstaker extends Null {}

export type PHANTOM_ALL = 'all';
