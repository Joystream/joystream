// Auto-generated via `yarn polkadot-types-from-defs`, do not edit
/* eslint-disable */

import { ITuple } from '@polkadot/types/types';
import { BTreeMap, BTreeSet, Enum, Option, Struct, U8aFixed, Vec } from '@polkadot/types/codec';
import { GenericAccountId } from '@polkadot/types/generic';
import { Bytes, Text, bool, i16, i32, i64, u128, u16, u32, u64 } from '@polkadot/types/primitive';
import { AccountId, Balance } from '@polkadot/types/interfaces/runtime';

/** @name AcceptingApplications */
export interface AcceptingApplications extends Struct {
  readonly started_accepting_applicants_at_block: u32;
}

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
  readonly applications_added: Vec<HiringApplicationId>;
  readonly active_application_count: u32;
  readonly unstaking_application_count: u32;
  readonly deactivated_application_count: u32;
}

/** @name ActiveStake */
export interface ActiveStake extends Struct {
  readonly stake_id: u64;
  readonly source_account_id: GenericAccountId;
}

/** @name ActorId */
export interface ActorId extends u64 {}

/** @name AddOpeningParameters */
export interface AddOpeningParameters extends Struct {
  readonly activate_at: ActivateOpeningAt;
  readonly commitment: WorkingGroupOpeningPolicyCommitment;
  readonly human_readable_text: Bytes;
  readonly working_group: WorkingGroup;
}

/** @name Address */
export interface Address extends AccountId {}

/** @name AddSchemaSupportToEntity */
export interface AddSchemaSupportToEntity extends Struct {
  readonly entity_id: ParametrizedEntity;
  readonly schema_id: u16;
  readonly parametrized_property_values: Vec<ParametrizedClassPropertyValue>;
}

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
  readonly opening_id: u64;
  readonly application_index_in_opening: u32;
  readonly add_to_opening_in_block: u32;
  readonly active_role_staking_id: Option<u64>;
  readonly active_application_staking_id: Option<u64>;
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
export interface ApplicationIdSet extends BTreeSet<HiringApplicationId> {}

/** @name ApplicationIdToWorkerIdMap */
export interface ApplicationIdToWorkerIdMap extends BTreeMap<HiringApplicationId, WorkerId> {}

/** @name ApplicationOf */
export interface ApplicationOf extends Struct {
  readonly role_account_id: GenericAccountId;
  readonly opening_id: u64;
  readonly member_id: MemberId;
  readonly application_id: HiringApplicationId;
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

/** @name BalanceOfMint */
export interface BalanceOfMint extends Balance {}

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
  readonly verified: bool;
  readonly handle: Text;
  readonly title: OptionalText;
  readonly description: OptionalText;
  readonly avatar: OptionalText;
  readonly banner: OptionalText;
  readonly content: ChannelContentType;
  readonly owner: MemberId;
  readonly role_account: GenericAccountId;
  readonly publication_status: ChannelPublicationStatus;
  readonly curation_status: ChannelCurationStatus;
  readonly created: u32;
  readonly principal_id: u64;
}

/** @name ChannelContentType */
export interface ChannelContentType extends Enum {
  readonly isVideo: boolean;
  readonly isMusic: boolean;
  readonly isEbook: boolean;
}

/** @name ChannelCurationStatus */
export interface ChannelCurationStatus extends Enum {
  readonly isNormal: boolean;
  readonly isCensored: boolean;
}

/** @name ChannelId */
export interface ChannelId extends u64 {}

/** @name ChannelPublicationStatus */
export interface ChannelPublicationStatus extends Enum {
  readonly isPublic: boolean;
  readonly isUnlisted: boolean;
}

/** @name ChildPositionInParentCategory */
export interface ChildPositionInParentCategory extends Struct {
  readonly parent_id: CategoryId;
  readonly child_nr_in_parent_category: u32;
}

/** @name Class */
export interface Class extends Struct {
  readonly id: u64;
  readonly properties: Vec<Property>;
  readonly schemas: Vec<ClassSchema>;
  readonly name: Text;
  readonly description: Text;
}

/** @name ClassId */
export interface ClassId extends u64 {}

/** @name ClassPermissionsType */
export interface ClassPermissionsType extends Struct {
  readonly entity_permissions: EntityPermissions;
  readonly entities_can_be_created: bool;
  readonly add_schemas: CredentialSet;
  readonly create_entities: CredentialSet;
  readonly reference_constraint: ReferenceConstraint;
  readonly admins: CredentialSet;
  readonly last_permissions_update: u32;
}

/** @name ClassPropertyValue */
export interface ClassPropertyValue extends Struct {
  readonly in_class_index: u16;
  readonly value: PropertyValue;
}

/** @name ClassSchema */
export interface ClassSchema extends Struct {
  readonly properties: Vec<u16>;
}

/** @name ContentId */
export interface ContentId extends U8aFixed {}

/** @name CreateEntity */
export interface CreateEntity extends Struct {
  readonly class_id: u64;
}

/** @name Credential */
export interface Credential extends u64 {}

/** @name CredentialSet */
export interface CredentialSet extends Vec<Credential> {}

/** @name CurationActor */
export interface CurationActor extends Enum {
  readonly isLead: boolean;
  readonly isCurator: boolean;
  readonly asCurator: u64;
}

/** @name Curator */
export interface Curator extends Struct {
  readonly role_account: GenericAccountId;
  readonly reward_relationship: Option<u64>;
  readonly role_stake_profile: Option<CuratorRoleStakeProfile>;
  readonly stage: CuratorRoleStage;
  readonly induction: CuratorInduction;
  readonly principal_id: u64;
}

/** @name CuratorApplication */
export interface CuratorApplication extends Struct {
  readonly role_account: GenericAccountId;
  readonly curator_opening_id: u64;
  readonly member_id: MemberId;
  readonly application_id: HiringApplicationId;
}

/** @name CuratorApplicationId */
export interface CuratorApplicationId extends u64 {}

/** @name CuratorApplicationIdSet */
export interface CuratorApplicationIdSet extends Vec<u64> {}

/** @name CuratorApplicationIdToCuratorIdMap */
export interface CuratorApplicationIdToCuratorIdMap extends BTreeMap<HiringApplicationId, u64> {}

/** @name CuratorExitInitiationOrigin */
export interface CuratorExitInitiationOrigin extends Enum {
  readonly isLead: boolean;
  readonly isCurator: boolean;
}

/** @name CuratorExitSummary */
export interface CuratorExitSummary extends Struct {
  readonly origin: CuratorExitInitiationOrigin;
  readonly initiated_at_block_number: u32;
  readonly rationale_text: Text;
}

/** @name CuratorId */
export interface CuratorId extends u64 {}

/** @name CuratorInduction */
export interface CuratorInduction extends Struct {
  readonly lead: u64;
  readonly curator_application_id: u64;
  readonly at_block: u32;
}

/** @name CuratorOpening */
export interface CuratorOpening extends Struct {
  readonly opening_id: u64;
  readonly curator_applications: Vec<u64>;
  readonly policy_commitment: OpeningPolicyCommitment;
}

/** @name CuratorOpeningId */
export interface CuratorOpeningId extends u64 {}

/** @name CuratorRoleStage */
export interface CuratorRoleStage extends Enum {
  readonly isActive: boolean;
  readonly isUnstaking: boolean;
  readonly asUnstaking: CuratorExitSummary;
  readonly isExited: boolean;
  readonly asExited: CuratorExitSummary;
}

/** @name CuratorRoleStakeProfile */
export interface CuratorRoleStakeProfile extends Struct {
  readonly stake_id: u64;
  readonly termination_unstaking_period: Option<u32>;
  readonly exit_unstaking_period: Option<u32>;
}

/** @name DataObject */
export interface DataObject extends Struct {
  readonly owner: MemberId;
  readonly added_at: BlockAndTime;
  readonly type_id: DataObjectTypeId;
  readonly liaison: StorageProviderId;
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
export interface Entity extends Struct {
  readonly id: u64;
  readonly class_id: u64;
  readonly in_class_schema_indexes: Vec<u16>;
}

/** @name EntityId */
export interface EntityId extends u64 {}

/** @name EntityPermissions */
export interface EntityPermissions extends Struct {
  readonly update: CredentialSet;
  readonly maintainer_has_all_permissions: bool;
}

/** @name EntryMethod */
export interface EntryMethod extends Enum {
  readonly isPaid: boolean;
  readonly asPaid: u64;
  readonly isScreening: boolean;
  readonly asScreening: AccountId;
  readonly isGenesis: boolean;
}

/** @name ExecutionFailed */
export interface ExecutionFailed extends Struct {
  readonly error: Bytes;
}

/** @name ExitedLeadRole */
export interface ExitedLeadRole extends Struct {
  readonly initiated_at_block_number: u32;
}

/** @name FillOpeningParameters */
export interface FillOpeningParameters extends Struct {
  readonly opening_id: u64;
  readonly successful_application_id: HiringApplicationId;
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

/** @name HiringApplicationId */
export interface HiringApplicationId extends u64 {}

/** @name InactiveApplicationStage */
export interface InactiveApplicationStage extends Struct {
  readonly deactivation_initiated: u32;
  readonly deactivated: u32;
  readonly cause: ApplicationDeactivationCause;
}

/** @name InputValidationLengthConstraint */
export interface InputValidationLengthConstraint extends Struct {
  readonly min: u16;
  readonly max_min_diff: u16;
}

/** @name IPNSIdentity */
export interface IPNSIdentity extends Text {}

/** @name Lead */
export interface Lead extends Struct {
  readonly member_id: MemberId;
  readonly role_account: GenericAccountId;
  readonly reward_relationship: Option<u64>;
  readonly inducted: u32;
  readonly stage: LeadRoleState;
}

/** @name LeadId */
export interface LeadId extends u64 {}

/** @name LeadRoleState */
export interface LeadRoleState extends Enum {
  readonly isActive: boolean;
  readonly isExited: boolean;
  readonly asExited: ExitedLeadRole;
}

/** @name LiaisonJudgement */
export interface LiaisonJudgement extends Enum {
  readonly isPending: boolean;
  readonly isAccepted: boolean;
  readonly isRejected: boolean;
}

/** @name LookupSource */
export interface LookupSource extends AccountId {}

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
export interface MintBalanceOf extends Balance {}

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
  readonly hiring_opening_id: u64;
  readonly applications: Vec<HiringApplicationId>;
  readonly policy_commitment: WorkingGroupOpeningPolicyCommitment;
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
  readonly terminate_curator_application_stake_unstaking_period: Option<u32>;
  readonly terminate_curator_role_stake_unstaking_period: Option<u32>;
  readonly exit_curator_role_application_stake_unstaking_period: Option<u32>;
  readonly exit_curator_role_stake_unstaking_period: Option<u32>;
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
export interface Operation extends Struct {
  readonly with_credential: Option<Credential>;
  readonly as_entity_maintainer: bool;
  readonly operation_type: OperationType;
}

/** @name OperationType */
export interface OperationType extends Enum {
  readonly isCreateEntity: boolean;
  readonly asCreateEntity: CreateEntity;
  readonly isUpdatePropertyValues: boolean;
  readonly asUpdatePropertyValues: UpdatePropertyValues;
  readonly isAddSchemaSupportToEntity: boolean;
  readonly asAddSchemaSupportToEntity: AddSchemaSupportToEntity;
}

/** @name OptionalText */
export interface OptionalText extends Option<Text> {}

/** @name PaidMembershipTerms */
export interface PaidMembershipTerms extends Struct {
  readonly fee: u128;
  readonly text: Text;
}

/** @name PaidTermId */
export interface PaidTermId extends u64 {}

/** @name ParametrizedClassPropertyValue */
export interface ParametrizedClassPropertyValue extends Struct {
  readonly in_class_index: u16;
  readonly value: ParametrizedPropertyValue;
}

/** @name ParametrizedEntity */
export interface ParametrizedEntity extends Enum {
  readonly isInternalEntityJustAdded: boolean;
  readonly asInternalEntityJustAdded: u32;
  readonly isExistingEntity: boolean;
  readonly asExistingEntity: u64;
}

/** @name ParametrizedPropertyValue */
export interface ParametrizedPropertyValue extends Enum {
  readonly isPropertyValue: boolean;
  readonly asPropertyValue: PropertyValue;
  readonly isInternalEntityJustAdded: boolean;
  readonly asInternalEntityJustAdded: u32;
  readonly isInternalEntityVec: boolean;
  readonly asInternalEntityVec: Vec<ParametrizedEntity>;
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
export interface Principal extends Enum {
  readonly isLead: boolean;
  readonly isCurator: boolean;
  readonly asCurator: u64;
  readonly isChannelOwner: boolean;
  readonly asChannelOwner: u64;
}

/** @name PrincipalId */
export interface PrincipalId extends u64 {}

/** @name Property */
export interface Property extends Struct {
  readonly prop_type: PropertyType;
  readonly required: bool;
  readonly name: Text;
  readonly description: Text;
}

/** @name PropertyOfClass */
export interface PropertyOfClass extends Struct {
  readonly class_id: u64;
  readonly property_index: u16;
}

/** @name PropertyType */
export interface PropertyType extends Enum {
  readonly isNone: boolean;
  readonly isBool: boolean;
  readonly isUint16: boolean;
  readonly isUint32: boolean;
  readonly isUint64: boolean;
  readonly isInt16: boolean;
  readonly isInt32: boolean;
  readonly isInt64: boolean;
  readonly isText: boolean;
  readonly asText: u16;
  readonly isInternal: boolean;
  readonly asInternal: u64;
  readonly isBoolVec: boolean;
  readonly asBoolVec: u16;
  readonly isUint16Vec: boolean;
  readonly asUint16Vec: u16;
  readonly isUint32Vec: boolean;
  readonly asUint32Vec: u16;
  readonly isUint64Vec: boolean;
  readonly asUint64Vec: u16;
  readonly isInt16Vec: boolean;
  readonly asInt16Vec: u16;
  readonly isInt32Vec: boolean;
  readonly asInt32Vec: u16;
  readonly isInt64Vec: boolean;
  readonly asInt64Vec: u16;
  readonly isTextVec: boolean;
  readonly asTextVec: ITuple<[u16, u16]>;
  readonly isInternalVec: boolean;
  readonly asInternalVec: ITuple<[u16, u64]>;
}

/** @name PropertyValue */
export interface PropertyValue extends Enum {
  readonly isNone: boolean;
  readonly isBool: boolean;
  readonly asBool: bool;
  readonly isUint16: boolean;
  readonly asUint16: u16;
  readonly isUint32: boolean;
  readonly asUint32: u32;
  readonly isUint64: boolean;
  readonly asUint64: u64;
  readonly isInt16: boolean;
  readonly asInt16: i16;
  readonly isInt32: boolean;
  readonly asInt32: i32;
  readonly isInt64: boolean;
  readonly asInt64: i64;
  readonly isText: boolean;
  readonly asText: Text;
  readonly isInternal: boolean;
  readonly asInternal: u64;
  readonly isBoolVec: boolean;
  readonly asBoolVec: Vec<bool>;
  readonly isUint16Vec: boolean;
  readonly asUint16Vec: Vec<u16>;
  readonly isUint32Vec: boolean;
  readonly asUint32Vec: Vec<u32>;
  readonly isUint64Vec: boolean;
  readonly asUint64Vec: Vec<u64>;
  readonly isInt16Vec: boolean;
  readonly asInt16Vec: Vec<i16>;
  readonly isInt32Vec: boolean;
  readonly asInt32Vec: Vec<i32>;
  readonly isInt64Vec: boolean;
  readonly asInt64Vec: Vec<i64>;
  readonly isTextVec: boolean;
  readonly asTextVec: Vec<Text>;
  readonly isInternalVec: boolean;
  readonly asInternalVec: Vec<u64>;
}

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
  readonly asBeginReviewWorkingGroupLeaderApplication: ITuple<[u64, WorkingGroup]>;
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
  readonly asBeginReviewWorkingGroupLeaderApplication: ITuple<[u64, WorkingGroup]>;
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
export interface ReferenceConstraint extends Enum {
  readonly isNoReferencingAllowed: boolean;
  readonly isNoConstraint: boolean;
  readonly isRestricted: boolean;
  readonly asRestricted: Vec<PropertyOfClass>;
}

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
  readonly recipient: u64;
  readonly mint_id: u64;
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
  readonly stake_id: u64;
  readonly termination_unstaking_period: Option<u32>;
  readonly exit_unstaking_period: Option<u32>;
}

/** @name SealedVote */
export interface SealedVote extends Struct {
  readonly voter: GenericAccountId;
  readonly commitment: U8aFixed;
  readonly stake: ElectionStake;
  readonly vote: Option<GenericAccountId>;
}

/** @name Seat */
export interface Seat extends Struct {
  readonly member: GenericAccountId;
  readonly stake: u128;
  readonly backers: Backers;
}

/** @name Seats */
export interface Seats extends Vec<Seat> {}

/** @name ServiceProviderRecord */
export interface ServiceProviderRecord extends Struct {
  readonly identity: IPNSIdentity;
  readonly expires_at: u32;
}

/** @name SetLeadParams */
export interface SetLeadParams extends ITuple<[MemberId, GenericAccountId]> {}

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

/** @name StorageProviderId */
export interface StorageProviderId extends u64 {}

/** @name SubscriptionId */
export interface SubscriptionId extends u64 {}

/** @name TerminateRoleParameters */
export interface TerminateRoleParameters extends Struct {
  readonly worker_id: WorkerId;
  readonly rationale: Bytes;
  readonly slash: bool;
  readonly working_group: WorkingGroup;
}

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

/** @name UpdatePropertyValues */
export interface UpdatePropertyValues extends Struct {
  readonly entity_id: ParametrizedEntity;
  readonly parametrized_property_values: Vec<ParametrizedClassPropertyValue>;
}

/** @name Url */
export interface Url extends Text {}

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
  readonly reward_relationship: Option<u64>;
  readonly role_stake_profile: Option<RoleStakeProfile>;
}

/** @name WorkingGroup */
export interface WorkingGroup extends Enum {
  readonly isStorage: boolean;
}

/** @name WorkingGroupOpeningPolicyCommitment */
export interface WorkingGroupOpeningPolicyCommitment extends Struct {
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

/** @name WorkingGroupUnstaker */
export interface WorkingGroupUnstaker extends Enum {
  readonly isLead: boolean;
  readonly asLead: u64;
  readonly isCurator: boolean;
  readonly asCurator: u64;
}

export type PHANTOM_ALL = 'all';
