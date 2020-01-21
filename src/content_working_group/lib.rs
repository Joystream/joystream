// Ensure we're `no_std` when compiling for Wasm.
#![cfg_attr(not(feature = "std"), no_std)]

//#[cfg(feature = "std")]
//use serde::{Deserialize, Serialize};

use codec::{Decode, Encode}; // Codec
                             //use rstd::collections::btree_map::BTreeMap;
use crate::membership::{members, role_types};
use hiring;
use minting;
use recurringrewards;
use rstd::collections::btree_set::BTreeSet;
use rstd::convert::From;
use rstd::prelude::*;
use runtime_primitives::traits::{One, Zero}; // Member, SimpleArithmetic, MaybeSerialize
use srml_support::traits::{Currency, ExistenceRequirement, WithdrawReasons};
use srml_support::{
    decl_event,
    decl_module,
    decl_storage,
    dispatch, // , StorageMap, , Parameter
    ensure,
};
use stake;
use system::{self, ensure_root, ensure_signed};
use versioned_store_permissions;

/// DIRTY IMPORT BECAUSE
/// InputValidationLengthConstraint has not been factored out yet!!!
use forum::InputValidationLengthConstraint;

/// Module configuration trait for this Substrate module.
pub trait Trait:
    system::Trait
    + minting::Trait
    + recurringrewards::Trait
    + stake::Trait
    + hiring::Trait
    + versioned_store_permissions::Trait
    + members::Trait
{
    // + Sized

    /// The event type.
    type Event: From<Event<Self>> + Into<<Self as system::Trait>::Event>;
}

/// Type constraint for identifer used for actors in members module in this runtime.
pub type ActorIdInMembersModule<T> = <T as members::Trait>::ActorId;

/// Type for identifier for channels.
/// The ChannelId must be capable of behaving like an actor id for membership module,
/// since publishers are identified by their channel id.
pub type ChannelId<T> = ActorIdInMembersModule<T>;

/// Type identifier for lead role, which must be same as membership actor identifeir
pub type LeadId<T> = ActorIdInMembersModule<T>;

/// Type identifier for curator role, which must be same as membership actor identifeir
pub type CuratorId<T> = ActorIdInMembersModule<T>;

/// Type for the identifer for an opening for a curator.
pub type CuratorOpeningId<T> = <T as hiring::Trait>::OpeningId;

/// Tyoe for the indentifier for an application as a curator.
pub type CuratorApplicationId<T> = <T as hiring::Trait>::ApplicationId;

/// Balance type of runtime
pub type BalanceOf<T> =
    <<T as stake::Trait>::Currency as Currency<<T as system::Trait>::AccountId>>::Balance;

/// Balance type of runtime
pub type CurrencyOf<T> = <T as stake::Trait>::Currency;

/// Negative imbalance of runtime.
pub type NegativeImbalance<T> =
    <<T as stake::Trait>::Currency as Currency<<T as system::Trait>::AccountId>>::NegativeImbalance;

/// Type of mintin reward relationship identifiers
pub type RewardRelationshipId<T> = <T as recurringrewards::Trait>::RewardRelationshipId;

/// Stake identifier in staking module
pub type StakeId<T> = <T as stake::Trait>::StakeId;

/// Type of permissions module prinicipal identifiers
pub type PrincipalId<T> = <T as versioned_store_permissions::Trait>::PrincipalId;

/*
 * MOVE ALL OF THESE OUT TO COMMON LATER
 */

static MSG_CHANNEL_CREATION_DISABLED: &str = "Channel creation currently disabled";
static MSG_CHANNEL_HANDLE_ALREADY_TAKEN: &str = "Channel handle is already taken";
static MSG_CHANNEL_HANDLE_TOO_SHORT: &str = "Channel handle too short";
static MSG_CHANNEL_HANDLE_TOO_LONG: &str = "Channel handle too long";
static MSG_CHANNEL_TITLE_TOO_SHORT: &str = "Channel title too short";
static MSG_CHANNEL_TITLE_TOO_LONG: &str = "Channel title too long";
static MSG_CHANNEL_DESCRIPTION_TOO_SHORT: &str = "Channel description too short";
static MSG_CHANNEL_DESCRIPTION_TOO_LONG: &str = "Channel description too long";
static MSG_CHANNEL_AVATAR_TOO_SHORT: &str = "Channel avatar URL too short";
static MSG_CHANNEL_AVATAR_TOO_LONG: &str = "Channel avatar URL too long";
static MSG_CHANNEL_BANNER_TOO_SHORT: &str = "Channel banner URL too short";
static MSG_CHANNEL_BANNER_TOO_LONG: &str = "Channel banner URL too long";

//static MSG_MEMBER_CANNOT_BECOME_PUBLISHER: &str =
//    "Member cannot become a publisher";
static MSG_CHANNEL_ID_INVALID: &str = "Channel id invalid";
static MSG_ORIGIN_DOES_NOT_MATCH_CHANNEL_ROLE_ACCOUNT: &str =
    "Origin does not match channel role account";
static MSG_CURRENT_LEAD_ALREADY_SET: &str = "Current lead is already set";
static MSG_CURRENT_LEAD_NOT_SET: &str = "Current lead is not set";
//static MSG_MEMBER_CANNOT_BECOME_CURATOR_LEAD: &str =
//    "The member cannot become curator lead";
//static MSG_LEAD_IS_NOT_SET: &str =
//    "Lead is not set";
static MSG_ORIGIN_IS_NOT_LEAD: &str = "Origin is not lead";
static MSG_ORIGIN_IS_NOT_APPLICANT: &str = "Origin is not applicant";
//static MSG_OPENING_CANNOT_ACTIVATE_IN_THE_PAST: &str =
//    "Opening cannot activate in the past";
static MSG_CURATOR_OPENING_DOES_NOT_EXIST: &str = "Curator opening does not exist";
static MSG_CURATOR_APPLICATION_DOES_NOT_EXIST: &str = "Curator application does not exist";
//static MSG_INSUFFICIENT_BALANCE_TO_COVER_ROLE_STAKE: &str =
//    "Insufficient balance to cover role stake";
//static MSG_INSUFFICIENT_BALANCE_TO_COVER_APPLICATION_STAKE: &str =
//    "Insufficient balance to cover application stake";
static MSG_INSUFFICIENT_BALANCE_TO_APPLY: &str = "Insufficient balance to apply";
static MSG_SUCCESSFUL_CURATOR_APPLICATION_DOES_NOT_EXIST: &str =
    "Successful curatora pplication does not exist";
static MSG_MEMBER_NO_LONGER_REGISTRABLE_AS_CURATOR: &str =
    "Member no longer registrable as curator";
static MSG_CURATOR_DOES_NOT_EXIST: &str = "Curator does not exist";
static MSG_CURATOR_IS_NOT_ACTIVE: &str = "Curator is not active";
static MSG_CURATOR_EXIT_RATIONALE_TEXT_TOO_LONG: &str = "Curator exit rationale text is too long";
static MSG_CURATOR_EXIT_RATIONALE_TEXT_TOO_SHORT: &str = "Curator exit rationale text is too short";
static MSG_CURATOR_APPLICATION_TEXT_TOO_LONG: &str = "Curator application text too long";
static MSG_CURATOR_APPLICATION_TEXT_TOO_SHORT: &str = "Curator application text too short";
static MSG_SIGNER_IS_NOT_CURATOR_ROLE_ACCOUNT: &str = "Signer is not curator role account";
static MSG_UNSTAKER_DOES_NOT_EXIST: &str = "Unstaker does not exist";
static MSG_CURATOR_HAS_NO_REWARD: &str = "Curator has no recurring reward";
static MSG_CURATOR_NOT_CONTROLLED_BY_MEMBER: &str = "Curator not controlled by member";

/// The exit stage of a lead involvement in the working group.
#[derive(Encode, Decode, Debug, Clone)]
pub struct ExitedLeadRole<BlockNumber> {
    /// When exit was initiated.
    pub initiated_at_block_number: BlockNumber,
}

/// The stage of the involvement of a lead in the working group.
#[derive(Encode, Decode, Debug, Clone)]
pub enum LeadRoleState<BlockNumber> {
    /// Currently active.
    Active,

    /// No longer active, for some reason
    Exited(ExitedLeadRole<BlockNumber>),
}

/// Must be default constructible because it indirectly is a value in a storage map.
/// ***SHOULD NEVER ACTUALLY GET CALLED, IS REQUIRED TO DUE BAD STORAGE MODEL IN SUBSTRATE***
impl<BlockNumber> Default for LeadRoleState<BlockNumber> {
    fn default() -> Self {
        LeadRoleState::Active
    }
}

/// Working group lead: curator lead
/// For now this role is not staked or inducted through an structured process, like the hiring module,
/// hence information about this is missing. Recurring rewards is included, somewhat arbitrarily!
#[derive(Encode, Decode, Default, Debug, Clone)]
pub struct Lead<AccountId, RewardRelationshipId, BlockNumber> {
    /// Account used to authenticate in this role,
    pub role_account: AccountId,

    /// Whether the role has recurring reward, and if so an identifier for this.
    pub reward_relationship: Option<RewardRelationshipId>,

    /// When was inducted
    /// TODO: Add richer information about circumstances of induction, like referencing a council proposal?
    pub inducted: BlockNumber,

    /// The stage of the involvement of this lead in the working group.
    pub stage: LeadRoleState<BlockNumber>,
}

/// Origin of exit initiation on behalf of a curator.'
#[derive(Encode, Decode, Debug, Clone)]
pub enum CuratorExitInitiationOrigin {
    /// Lead is origin.
    Lead,

    /// The curator exiting is the origin.
    Curator,
}

/// The exit stage of a curators involvement in the working group.
#[derive(Encode, Decode, Debug, Clone)]
pub struct CuratorExitSummary<BlockNumber> {
    /// Origin for exit.
    pub origin: CuratorExitInitiationOrigin,

    /// When exit was initiated.
    pub initiated_at_block_number: BlockNumber,

    /// Explainer for why exit was initited.
    pub rationale_text: Vec<u8>,
}

impl<BlockNumber: Clone> CuratorExitSummary<BlockNumber> {
    pub fn new(
        origin: &CuratorExitInitiationOrigin,
        initiated_at_block_number: &BlockNumber,
        rationale_text: &Vec<u8>,
    ) -> Self {
        CuratorExitSummary {
            origin: (*origin).clone(),
            initiated_at_block_number: (*initiated_at_block_number).clone(),
            rationale_text: (*rationale_text).clone(),
        }
    }
}

/// The stage of the involvement of a curator in the working group.
#[derive(Encode, Decode, Debug, Clone)]
pub enum CuratorRoleStage<BlockNumber> {
    /// Currently active.
    Active,

    /// Currently unstaking
    Unstaking(CuratorExitSummary<BlockNumber>),

    /// No longer active and unstaked
    Exited(CuratorExitSummary<BlockNumber>),
}

/// Must be default constructible because it indirectly is a value in a storage map.
/// ***SHOULD NEVER ACTUALLY GET CALLED, IS REQUIRED TO DUE BAD STORAGE MODEL IN SUBSTRATE***
impl<BlockNumber> Default for CuratorRoleStage<BlockNumber> {
    fn default() -> Self {
        CuratorRoleStage::Active
    }
}

/// The induction of a curator in the working group.
#[derive(Encode, Decode, Default, Debug, Clone)]
pub struct CuratorInduction<LeadId, CuratorApplicationId, BlockNumber> {
    /// Lead responsible for inducting curator
    pub lead: LeadId,

    /// Application through which curator was inducted
    pub curator_application_id: CuratorApplicationId,

    /// When induction occurred
    pub at_block: BlockNumber,
}

impl<LeadId: Clone, CuratorApplicationId: Clone, BlockNumber: Clone>
    CuratorInduction<LeadId, CuratorApplicationId, BlockNumber>
{
    pub fn new(
        lead: &LeadId,
        curator_application_id: &CuratorApplicationId,
        at_block: &BlockNumber,
    ) -> Self {
        CuratorInduction {
            lead: (*lead).clone(),
            curator_application_id: (*curator_application_id).clone(),
            at_block: (*at_block).clone(),
        }
    }
}

/// Role stake information for a curator.
#[derive(Encode, Decode, Default, Debug, Clone)]
pub struct CuratorRoleStakeProfile<StakeId, BlockNumber> {
    /// Whether participant is staked, and if so, the identifier for this staking in the staking module.
    pub stake_id: StakeId,

    /// Unstaking period when terminated.
    pub termination_unstaking_period: Option<BlockNumber>,

    /// Unstaking period when exiting.
    pub exit_unstaking_period: Option<BlockNumber>,
}

impl<StakeId: Clone, BlockNumber: Clone> CuratorRoleStakeProfile<StakeId, BlockNumber> {
    pub fn new(
        stake_id: &StakeId,
        termination_unstaking_period: &Option<BlockNumber>,
        exit_unstaking_period: &Option<BlockNumber>,
    ) -> Self {
        Self {
            stake_id: (*stake_id).clone(),
            termination_unstaking_period: (*termination_unstaking_period).clone(),
            exit_unstaking_period: (*exit_unstaking_period).clone(),
        }
    }
}

/// Working group participant: curator
/// This role can be staked, have reward and be inducted through the hiring module.
#[derive(Encode, Decode, Default, Debug, Clone)]
pub struct Curator<
    AccountId,
    RewardRelationshipId,
    StakeId,
    BlockNumber,
    LeadId,
    CuratorApplicationId,
    PrincipalId,
> {
    /// Account used to authenticate in this role,
    pub role_account: AccountId,

    /// Whether the role has recurring reward, and if so an identifier for this.
    pub reward_relationship: Option<RewardRelationshipId>,

    /// When set, describes role stake of curator.
    pub role_stake_profile: Option<CuratorRoleStakeProfile<StakeId, BlockNumber>>,

    /// The stage of this curator in the working group.
    pub stage: CuratorRoleStage<BlockNumber>,

    /// How the curator was inducted into the working group.
    pub induction: CuratorInduction<LeadId, CuratorApplicationId, BlockNumber>,

    /// Whether this curator can unilaterally alter the curation status of a channel.
    //pub can_update_channel_curation_status: bool,

    /// Permissions module principal id
    pub principal_id: PrincipalId,
}

impl<
        AccountId: Clone,
        RewardRelationshipId: Clone,
        StakeId: Clone,
        BlockNumber: Clone,
        LeadId: Clone,
        ApplicationId: Clone,
        PrincipalId: Clone,
    >
    Curator<
        AccountId,
        RewardRelationshipId,
        StakeId,
        BlockNumber,
        LeadId,
        ApplicationId,
        PrincipalId,
    >
{
    pub fn new(
        role_account: &AccountId,
        reward_relationship: &Option<RewardRelationshipId>,
        role_stake_profile: &Option<CuratorRoleStakeProfile<StakeId, BlockNumber>>,
        stage: &CuratorRoleStage<BlockNumber>,
        induction: &CuratorInduction<LeadId, ApplicationId, BlockNumber>,
        //can_update_channel_curation_status: bool,
        principal_id: &PrincipalId,
    ) -> Self {
        Curator {
            role_account: (*role_account).clone(),
            reward_relationship: (*reward_relationship).clone(),
            role_stake_profile: (*role_stake_profile).clone(),
            stage: (*stage).clone(),
            induction: (*induction).clone(),
            //can_update_channel_curation_status: can_update_channel_curation_status,
            principal_id: (*principal_id).clone(),
        }
    }
}

/// An opening for a curator role.
#[derive(Encode, Decode, Default, Debug, Clone)]
pub struct CuratorOpening<OpeningId, BlockNumber, Balance, CuratorApplicationId: core::cmp::Ord> {
    /// Identifer for underlying opening in the hiring module.
    pub opening_id: OpeningId,

    /// Set of identifiers for all curator applications ever added
    pub curator_applications: BTreeSet<CuratorApplicationId>,

    /// Commitment to policies in opening.
    pub policy_commitment: OpeningPolicyCommitment<BlockNumber, Balance>, /*
                                                                           * Add other stuff here in the future?
                                                                           * Like default payment terms, privilidges etc.?
                                                                           * Not obvious that it serves much of a purpose, they are mutable
                                                                           * after all, they need to be.
                                                                           * Revisit.
                                                                           */
}

/// An application for the curator role.
#[derive(Encode, Decode, Default, Debug, Clone)]
pub struct CuratorApplication<AccountId, CuratorOpeningId, MemberId, ApplicationId> {
    /// Account used to authenticate in this role,
    pub role_account: AccountId,

    /// Opening on which this application applies
    pub curator_opening_id: CuratorOpeningId,

    /// Member applying
    pub member_id: MemberId,

    /// Underlying application in hiring module
    pub application_id: ApplicationId,
}

impl<AccountId: Clone, CuratorOpeningId: Clone, MemberId: Clone, ApplicationId: Clone>
    CuratorApplication<AccountId, CuratorOpeningId, MemberId, ApplicationId>
{
    pub fn new(
        role_account: &AccountId,
        curator_opening_id: &CuratorOpeningId,
        member_id: &MemberId,
        application_id: &ApplicationId,
    ) -> Self {
        CuratorApplication {
            role_account: (*role_account).clone(),
            curator_opening_id: (*curator_opening_id).clone(),
            member_id: (*member_id).clone(),
            application_id: (*application_id).clone(),
        }
    }
}

/// Type of .... .
#[derive(Encode, Decode, Debug, Clone, PartialEq, Eq)]
pub enum CurationActor<CuratorId> {
    Lead,
    Curator(CuratorId),
}

/*
 * BEGIN: =========================================================
 * Channel stuff
 */

/// Type of channel content.
#[derive(Encode, Decode, Debug, Clone, PartialEq)]
pub enum ChannelContentType {
    Video,
    Music,
    Ebook,
}

/// Must be default constructible because it indirectly is a value in a storage map.
/// ***SHOULD NEVER ACTUALLY GET CALLED, IS REQUIRED TO DUE BAD STORAGE MODEL IN SUBSTRATE***
impl Default for ChannelContentType {
    fn default() -> Self {
        ChannelContentType::Video
    }
}

/// Status of channel, as set by the owner.
/// Is only meant to affect visibility, mutation of channel and child content
/// is unaffected on runtime.
#[derive(Encode, Decode, Debug, Clone, PartialEq)]
pub enum ChannelPublishingStatus {
    /// Compliant UIs should render.
    Published,

    /// Compliant UIs should not render it or any child content.
    NotPublished,
}

/// Must be default constructible because it indirectly is a value in a storage map.
/// ***SHOULD NEVER ACTUALLY GET CALLED, IS REQUIRED TO DUE BAD STORAGE MODEL IN SUBSTRATE***
impl Default for ChannelPublishingStatus {
    fn default() -> Self {
        ChannelPublishingStatus::Published
    }
}

/// Status of channel, as set by curators.
/// Is only meant to affect visibility currently, but in the future
/// it will also gate publication of new child content,
/// editing properties, revenue flows, etc.
#[derive(Encode, Decode, Debug, Clone, Copy, PartialEq, Eq)]
pub enum ChannelCurationStatus {
    Normal,
    Censored,
}

/// Must be default constructible because it indirectly is a value in a storage map.
/// ***SHOULD NEVER ACTUALLY GET CALLED, IS REQUIRED TO DUE BAD STORAGE MODEL IN SUBSTRATE***
impl Default for ChannelCurationStatus {
    fn default() -> Self {
        ChannelCurationStatus::Normal
    }
}

type OptionalText = Option<Vec<u8>>;

/// A channel for publishing content.
#[derive(Encode, Decode, Default, Debug, Clone, PartialEq)]
pub struct Channel<MemberId, AccountId, BlockNumber, PrincipalId> {

    /// Whether channel has been verified, in the normal Web2.0 platform sense of being authenticated.
    pub verified: bool,

    /// Unique channel handle that could be used in channel URL.
    pub handle: Vec<u8>,

    /// Human readable title of channel. Not required to be unique.
    pub title: OptionalText,

    /// Human readable description of channel purpose and scope.
    pub description: OptionalText,

    /// URL of a small avatar (logo) image of this channel.
    pub avatar: OptionalText,

    /// URL of a big background image of this channel.
    pub banner: OptionalText,

    /// The type of channel.
    pub content: ChannelContentType,

    /// Member who owns channel.
    pub owner: MemberId,

    /// Account used to authenticate as owner.
    /// Can be updated through membership role key.
    pub role_account: AccountId,

    /// Publication status of channel.
    pub publishing_status: ChannelPublishingStatus,

    /// Curation status of channel.
    pub curation_status: ChannelCurationStatus,

    /// When channel was established.
    pub created: BlockNumber,

    /// Permissions module principal id
    pub principal_id: PrincipalId,
}

/*
 * END: =========================================================
 * Channel stuff
 */

/// Permissions module principal
#[derive(Encode, Decode, Debug, Clone)]
pub enum Principal<CuratorId, ChannelId> {
    /// Its sloppy to have this here, less safe,
    /// but its not worth the ffort to solve.
    Lead,

    Curator(CuratorId),

    ChannelOwner(ChannelId),
}

/// Must be default constructible because it indirectly is a value in a storage map.
/// ***SHOULD NEVER ACTUALLY GET CALLED, IS REQUIRED TO DUE BAD STORAGE MODEL IN SUBSTRATE***
impl<CuratorId, ChannelId> Default for Principal<CuratorId, ChannelId> {
    fn default() -> Self {
        Principal::Lead
    }
}

/// Terms for slashings applied to a given role
#[derive(Encode, Decode, Debug, Clone, PartialEq, Eq)]
pub struct SlashableTerms {
    /// Maximum number of slashes.
    pub max_count: u16,

    /// Maximum percentage points of remaining stake which may be slashed in a single slash.
    pub max_percent_pts_per_time: u16,
}

/// Terms for what slashing can be applied in some context
#[derive(Encode, Decode, Debug, Clone, PartialEq, Eq)]
pub enum SlashingTerms {
    Unslashable,
    Slashable(SlashableTerms),
}

/// Must be default constructible because it indirectly is a value in a storage map.
/// ***SHOULD NEVER ACTUALLY GET CALLED, IS REQUIRED TO DUE BAD STORAGE MODEL IN SUBSTRATE***
impl Default for SlashingTerms {
    fn default() -> Self {
        Self::Unslashable
    }
}

/// A commitment to the set of policy variables relevant to an opening.
/// An applicant can observe this commitment and be secure that the terms
/// of the application process cannot be changed ex-post.
#[derive(Encode, Decode, Debug, Clone, Default, PartialEq, Eq)]
pub struct OpeningPolicyCommitment<BlockNumber, Balance> {
    /// Rationing to be used
    pub application_rationing_policy: Option<hiring::ApplicationRationingPolicy>,

    /// Maximum length of review period of applications
    pub max_review_period_length: BlockNumber,

    /// Staking policy for application
    pub application_staking_policy: Option<hiring::StakingPolicy<Balance, BlockNumber>>,

    /// Staking policy for role itself
    pub role_staking_policy: Option<hiring::StakingPolicy<Balance, BlockNumber>>,

    // Slashing terms during application
    // pub application_slashing_terms: SlashingTerms,

    // Slashing terms during role, NOT application itself!
    pub role_slashing_terms: SlashingTerms,

    /// When filling an opening: Unstaking period for application stake of successful applicants
    pub fill_opening_successful_applicant_application_stake_unstaking_period: Option<BlockNumber>,

    /// When filling an opening:
    pub fill_opening_failed_applicant_application_stake_unstaking_period: Option<BlockNumber>,

    /// When filling an opening:
    pub fill_opening_failed_applicant_role_stake_unstaking_period: Option<BlockNumber>,

    /// When terminating a curator:
    pub terminate_curator_application_stake_unstaking_period: Option<BlockNumber>,

    /// When terminating a curator:
    pub terminate_curator_role_stake_unstaking_period: Option<BlockNumber>,

    /// When a curator exists: ..
    pub exit_curator_role_application_stake_unstaking_period: Option<BlockNumber>,

    /// When a curator exists: ..
    pub exit_curator_role_stake_unstaking_period: Option<BlockNumber>,
}

/// Represents a possible unstaker in working group.
#[derive(Encode, Decode, Debug, Eq, PartialEq, Clone, PartialOrd)]
pub enum WorkingGroupUnstaker<LeadId, CuratorId> {
    ///
    Lead(LeadId),

    ///
    Curator(CuratorId),
}

/// Must be default constructible because it indirectly is a value in a storage map.
/// ***SHOULD NEVER ACTUALLY GET CALLED, IS REQUIRED TO DUE BAD STORAGE MODEL IN SUBSTRATE***
impl<LeadId: Default, CuratorId> Default for WorkingGroupUnstaker<LeadId, CuratorId> {
    fn default() -> Self {
        Self::Lead(LeadId::default())
    }
}

/*
pub enum ChannelActor<T: Trait> {

    ///
    WorkingGroupActor(WorkingGroupActor<T>),

    ///
    Owner
}
*/

// ======================================================================== //
// Move this out in its own file later //
// ======================================================================== //

/*
struct WrappedBeginAcceptingApplicationsError { // can this be made generic, or does that undermine the whole orhpan rule spirit?
    pub error: hiring::BeginAcceptingApplicationsError
}
*/

pub(super) struct WrappedError<E> {
    // can this be made generic, or does that undermine the whole orhpan rule spirit?
    pub error: E,
}

/// ....
macro_rules! ensure_on_wrapped_error {
    ($call:expr) => {{
        { $call }.map_err(|err| WrappedError { error: err })
    }};
}

// Add macro here to make this
//derive_from_impl(hiring::BeginAcceptingApplicationsError)
//derive_from_impl(hiring::BeginAcceptingApplicationsError)

impl rstd::convert::From<WrappedError<hiring::BeginAcceptingApplicationsError>> for &str {
    fn from(wrapper: WrappedError<hiring::BeginAcceptingApplicationsError>) -> Self {
        match wrapper.error {
            hiring::BeginAcceptingApplicationsError::OpeningDoesNotExist => {
                "Opening does not exist"
            }
            hiring::BeginAcceptingApplicationsError::OpeningIsNotInWaitingToBeginStage => {
                "Opening Is Not in Waiting"
            }
        }
    }
}

impl rstd::convert::From<WrappedError<hiring::AddOpeningError>> for &str {
    fn from(wrapper: WrappedError<hiring::AddOpeningError>) -> Self {
        match wrapper.error {
            hiring::AddOpeningError::OpeningMustActivateInTheFuture => {
                "Opening must activate in the future"
            }
            hiring::AddOpeningError::StakeAmountLessThanMinimumCurrencyBalance(purpose) => {
                match purpose {
                    hiring::StakePurpose::Role => {
                        "Role stake amount less than minimum currency balance"
                    }
                    hiring::StakePurpose::Application => {
                        "Application stake amount less than minimum currency balance"
                    }
                }
            }
            hiring::AddOpeningError::ApplicationRationingZeroMaxApplicants => {
                "Application rationing policy: maximum active applicant number must be greater than zero"
            }
        }
    }
}

impl rstd::convert::From<WrappedError<hiring::BeginReviewError>> for &str {
    fn from(wrapper: WrappedError<hiring::BeginReviewError>) -> Self {
        match wrapper.error {
            hiring::BeginReviewError::OpeningDoesNotExist => "Opening does not exist",
            hiring::BeginReviewError::OpeningNotInAcceptingApplicationsStage => {
                "Opening not in accepting applications stage"
            }
        }
    }
}

impl<T: hiring::Trait> rstd::convert::From<WrappedError<hiring::FillOpeningError<T>>> for &str {
    fn from(wrapper: WrappedError<hiring::FillOpeningError<T>>) -> Self {
        match wrapper.error {
            hiring::FillOpeningError::<T>::OpeningDoesNotExist => "OpeningDoesNotExist",
            hiring::FillOpeningError::<T>::OpeningNotInReviewPeriodStage => {
                "OpeningNotInReviewPeriodStage"
            }
            hiring::FillOpeningError::<T>::UnstakingPeriodTooShort(
                stake_purpose,
                outcome_in_filled_opening,
            ) => match stake_purpose {
                hiring::StakePurpose::Application => match outcome_in_filled_opening {
                    hiring::ApplicationOutcomeInFilledOpening::Success => {
                        "Application stake unstaking period for successful applicants too short"
                    }
                    hiring::ApplicationOutcomeInFilledOpening::Failure => {
                        "Application stake unstaking period for failed applicants too short"
                    }
                },
                hiring::StakePurpose::Role => match outcome_in_filled_opening {
                    hiring::ApplicationOutcomeInFilledOpening::Success => {
                        "Role stake unstaking period for successful applicants too short"
                    }
                    hiring::ApplicationOutcomeInFilledOpening::Failure => {
                        "Role stake unstaking period for failed applicants too short"
                    }
                },
            },
            hiring::FillOpeningError::<T>::RedundantUnstakingPeriodProvided(
                stake_purpose,
                outcome_in_filled_opening,
            ) => match stake_purpose {
                hiring::StakePurpose::Application => match outcome_in_filled_opening {
                    hiring::ApplicationOutcomeInFilledOpening::Success => {
                        "Application stake unstaking period for successful applicants redundant"
                    }
                    hiring::ApplicationOutcomeInFilledOpening::Failure => {
                        "Application stake unstaking period for failed applicants redundant"
                    }
                },
                hiring::StakePurpose::Role => match outcome_in_filled_opening {
                    hiring::ApplicationOutcomeInFilledOpening::Success => {
                        "Role stake unstaking period for successful applicants redundant"
                    }
                    hiring::ApplicationOutcomeInFilledOpening::Failure => {
                        "Role stake unstaking period for failed applicants redundant"
                    }
                },
            },
            hiring::FillOpeningError::<T>::ApplicationDoesNotExist(_application_id) => {
                "ApplicationDoesNotExist"
            }
            hiring::FillOpeningError::<T>::ApplicationNotInActiveStage(_application_id) => {
                "ApplicationNotInActiveStage"
            }
        }
    }
}

impl rstd::convert::From<WrappedError<hiring::DeactivateApplicationError>> for &str {
    fn from(wrapper: WrappedError<hiring::DeactivateApplicationError>) -> Self {
        match wrapper.error {
            hiring::DeactivateApplicationError::ApplicationDoesNotExist => {
                "ApplicationDoesNotExist"
            }
            hiring::DeactivateApplicationError::ApplicationNotActive => "ApplicationNotActive",
            hiring::DeactivateApplicationError::OpeningNotAcceptingApplications => {
                "OpeningNotAcceptingApplications"
            }
            hiring::DeactivateApplicationError::UnstakingPeriodTooShort(_stake_purpose) => {
                "UnstakingPeriodTooShort ..."
            }
            hiring::DeactivateApplicationError::RedundantUnstakingPeriodProvided(
                _stake_purpose,
            ) => "RedundantUnstakingPeriodProvided ...",
        }
    }
}

impl rstd::convert::From<WrappedError<members::ControllerAccountForMemberCheckFailed>> for &str {
    fn from(wrapper: WrappedError<members::ControllerAccountForMemberCheckFailed>) -> Self {
        match wrapper.error {
            members::ControllerAccountForMemberCheckFailed::NotMember => "Is not a member",
            members::ControllerAccountForMemberCheckFailed::NotControllerAccount => {
                "Account is not controller account of member"
            }
        }
    }
}

impl rstd::convert::From<WrappedError<hiring::AddApplicationError>> for &str {
    fn from(wrapper: WrappedError<hiring::AddApplicationError>) -> Self {
        match wrapper.error {
            hiring::AddApplicationError::OpeningDoesNotExist => "OpeningDoesNotExist",
            hiring::AddApplicationError::StakeProvidedWhenRedundant(_stake_purpose) => {
                "StakeProvidedWhenRedundant ..."
            }
            hiring::AddApplicationError::StakeMissingWhenRequired(_stake_purpose) => {
                "StakeMissingWhenRequired ..."
            }
            hiring::AddApplicationError::StakeAmountTooLow(_stake_purpose) => {
                "StakeAmountTooLow ..."
            }
            hiring::AddApplicationError::OpeningNotInAcceptingApplicationsStage => {
                "OpeningNotInAcceptingApplicationsStage"
            }
            hiring::AddApplicationError::NewApplicationWasCrowdedOut => {
                "NewApplicationWasCrowdedOut"
            }
        }
    }
}

impl rstd::convert::From<WrappedError<members::MemberControllerAccountDidNotSign>> for &str {
    fn from(wrapper: WrappedError<members::MemberControllerAccountDidNotSign>) -> Self {
        match wrapper.error {
            members::MemberControllerAccountDidNotSign::UnsignedOrigin => "Unsigned origin",
            members::MemberControllerAccountDidNotSign::MemberIdInvalid => "Member id is invalid",
            members::MemberControllerAccountDidNotSign::SignerControllerAccountMismatch => {
                "Signer does not match controller account"
            }
        }
    }
}

// ======================================================================== //

decl_storage! {
    trait Store for Module<T: Trait> as ContentWorkingGroup {

        /// The mint currently funding the rewards for this module.
        pub Mint get(mint) config(): <T as minting::Trait>::MintId;

        /// The current lead.
        pub CurrentLeadId get(current_lead_id) config(): Option<LeadId<T>>;

        /// Maps identifier to corresponding lead.
        pub LeadById get(lead_by_id) config(): linked_map LeadId<T> => Lead<T::AccountId, T::RewardRelationshipId, T::BlockNumber>;

        /// Next identifier for new current lead.
        pub NextLeadId get(next_lead_id) config(): LeadId<T>;

        /// Maps identifeir to curator opening.
        pub CuratorOpeningById get(curator_opening_by_id) config(): linked_map CuratorOpeningId<T> => CuratorOpening<T::OpeningId, T::BlockNumber, BalanceOf<T>, CuratorApplicationId<T>>;

        /// Next identifier valuefor new curator opening.
        pub NextCuratorOpeningId get(next_curator_opening_id) config(): CuratorOpeningId<T>;

        /// Maps identifier to curator application on opening.
        pub CuratorApplicationById get(curator_application_by_id) config(): linked_map CuratorApplicationId<T> => CuratorApplication<T::AccountId, CuratorOpeningId<T>, T::MemberId, T::ApplicationId>;

        /// Next identifier value for new curator application.
        pub NextCuratorApplicationId get(next_curator_application_id) config(): CuratorApplicationId<T>;

        /// Maps identifier to corresponding channel.
        pub ChannelById get(channel_by_id) config(): linked_map ChannelId<T> => Channel<T::MemberId, T::AccountId, T::BlockNumber, PrincipalId<T>>;

        /// Identifier to be used by the next channel introduced.
        pub NextChannelId get(next_channel_id) config(): ChannelId<T>;

        /// Maps (unique) channel handle to the corresponding identifier for the channel.
        /// Mapping is required to allow efficient (O(log N)) on-chain verification that a proposed handle is indeed unique
        /// at the time it is being proposed.
        pub ChannelIdByHandle get(channel_id_by_handle) config(): linked_map Vec<u8> => ChannelId<T>;

        /// Maps identifier to corresponding curator.
        pub CuratorById get(curator_by_id) config(): linked_map CuratorId<T> => Curator<T::AccountId, T::RewardRelationshipId, T::StakeId, T::BlockNumber, LeadId<T>, CuratorApplicationId<T>, PrincipalId<T>>;

        /// Next identifier for new curator.
        pub NextCuratorId get(next_curator_id) config(): CuratorId<T>;

        /// Maps identifier to principal.
        pub PrincipalById get(principal_by_id) config(): linked_map PrincipalId<T> => Principal<CuratorId<T>, ChannelId<T>>;

        /// Next identifier for
        pub NextPrincipalId get(next_principal_id) config(): PrincipalId<T>;

        /// Whether it is currently possible to create a channel via `create_channel` extrinsic.
        pub ChannelCreationEnabled get(channel_creation_enabled) config(): bool;

        /// Recover curator by the role stake which is currently unstaking.
        pub UnstakerByStakeId get(unstaker_by_stake_id) config(): linked_map StakeId<T> => WorkingGroupUnstaker<LeadId<T>, CuratorId<T>>;

        // Limits

        /// Limits the total number of curators which can be active.
        //pub MaxSimultanouslyActiveCurators get(max_simultanously_active_curators) config(): Option<u16>;

        // Limits the total number of openings which are not yet deactivated.
        // pub MaxSimultaneouslyActiveOpenings get(max_simultaneously_active_openings) config(): Option<u16>,

        // Vector length input guards

        pub ChannelHandleConstraint get(channel_handle_constraint) config(): InputValidationLengthConstraint;
        pub ChannelTitleConstraint get(channel_title_constraint) config(): InputValidationLengthConstraint;
        pub ChannelDescriptionConstraint get(channel_description_constraint) config(): InputValidationLengthConstraint;
        pub ChannelAvatarConstraint get(channel_avatar_constraint) config(): InputValidationLengthConstraint;
        pub ChannelBannerConstraint get(channel_banner_constraint) config(): InputValidationLengthConstraint;
        pub OpeningHumanReadableText get(opening_human_readable_text) config(): InputValidationLengthConstraint;
        pub CuratorApplicationHumanReadableText get(curator_application_human_readable_text) config(): InputValidationLengthConstraint;
        pub CuratorExitRationaleText get(curator_exit_rationale_text) config(): InputValidationLengthConstraint;
    }
}

decl_event! {
    pub enum Event<T> where
        ChannelId = ChannelId<T>,
        LeadId = LeadId<T>,
        CuratorOpeningId = CuratorOpeningId<T>,
        CuratorApplicationId = CuratorApplicationId<T>,
        CuratorId = CuratorId<T>,
        <T as system::Trait>::AccountId,
    {
        ChannelCreated(ChannelId),
        ChannelOwnershipTransferred(ChannelId),
        LeadSet(LeadId),
        LeadUnset(LeadId),
        CuratorOpeningAdded(CuratorOpeningId),
        //LeadRewardUpdated
        //LeadRoleAccountUpdated
        //LeadRewardAccountUpdated
        //PermissionGroupAdded
        //PermissionGroupUpdated
        AcceptedCuratorApplications(CuratorOpeningId),
        BeganCuratorApplicationReview(CuratorOpeningId),
        CuratorOpeningFilled(CuratorOpeningId, BTreeSet<CuratorApplicationId>),
        //CuratorSlashed
        TerminatedCurator(CuratorId),
        AppliedOnCuratorOpening(CuratorOpeningId, CuratorApplicationId),
        //CuratorRewardUpdated
        //CuratorRoleAccountUpdated
        //CuratorRewardAccountUpdated
        CuratorExited(CuratorId),
        CuratorUnstaking(CuratorId),
        CuratorApplicationTerminated(CuratorApplicationId),
        CuratorApplicationWithdrawn(CuratorApplicationId),
        CuratorRoleAccountUpdated(CuratorId, AccountId),
        CuratorRewardAccountUpdated(CuratorId, AccountId),
        ChannelUpdatedByCurationActor(ChannelId),
    }
}

decl_module! {
    pub struct Module<T: Trait> for enum Call where origin: T::Origin {

        fn deposit_event() = default;

        /*
         * Channel management
         */

        /// Create a new channel.
        pub fn create_channel(
            origin,
            owner: T::MemberId,
            role_account: T::AccountId,
            handle: Vec<u8>,
            title: OptionalText,
            description: OptionalText,
            avatar: OptionalText,
            banner: OptionalText,
            content: ChannelContentType
        ) {

            // Ensure that it is signed
            let signer_account = ensure_signed(origin)?;

            // Ensure that owner member can authenticate with signer account
            ensure_on_wrapped_error!(
                members::Module::<T>::ensure_is_controller_account_for_member(&owner, &signer_account)
            )?;

            // Ensure it is currently possible to create channels (ChannelCreationEnabled).
            ensure!(
                ChannelCreationEnabled::get(),
                MSG_CHANNEL_CREATION_DISABLED
            );

            // Ensure prospective owner member is currently allowed to become channel owner
            let (member_in_role, next_channel_id) = Self::ensure_can_register_channel_owner_role_on_member(&owner, None)?;

            // Ensure channel handle is acceptable length
            Self::ensure_channel_handle_is_valid(&handle)?;

            // Ensure title is acceptable length
            Self::ensure_channel_title_is_valid(&title)?;

            // Ensure description is acceptable length
            Self::ensure_channel_description_is_valid(&description)?;

            // Ensure avatar URL is acceptable length
            Self::ensure_channel_avatar_is_valid(&avatar)?;

            // Ensure banner URL is acceptable length
            Self::ensure_channel_banner_is_valid(&banner)?;

            //
            // == MUTATION SAFE ==
            //

            // Make and add new principal
            let principal_id = Self::add_new_principal(&Principal::ChannelOwner(next_channel_id));

            // Construct channel
            let new_channel = Channel {
                verified: false,
                handle: handle.clone(),
                title: title,
                description: description,
                avatar: avatar,
                banner: banner,
                content: content,
                owner: owner,
                role_account: role_account,
                publishing_status: ChannelPublishingStatus::NotPublished,
                curation_status: ChannelCurationStatus::Normal,
                created: <system::Module<T>>::block_number(),
                principal_id: principal_id
            };

            // Add channel to ChannelById under id
            ChannelById::<T>::insert(next_channel_id, new_channel);

            // Add id to ChannelIdByHandle under handle
            ChannelIdByHandle::<T>::insert(handle.clone(), next_channel_id);

            // Increment NextChannelId
            NextChannelId::<T>::mutate(|id| *id += <ChannelId<T> as One>::one());

            /// CREDENTIAL STUFF ///

            // Dial out to membership module and inform about new role as channe owner.
            let registered_role = <members::Module<T>>::register_role_on_member(owner, &member_in_role).is_ok();

            assert!(registered_role);

            // Trigger event
            Self::deposit_event(RawEvent::ChannelCreated(next_channel_id));

        }

        /// An owner transfers channel ownership to a new owner.
        ///
        /// Notice that working group participants cannot do this.
        /// Notice that censored or unpublished channel may still be transferred.
        /// Notice that transfers are unilateral, so new owner cannot block. This may be problematic: https://github.com/Joystream/substrate-runtime-joystream/issues/95
        pub fn transfer_channel_ownership(origin, channel_id: ChannelId<T>, new_owner: T::MemberId, new_role_account: T::AccountId) {

            // Ensure channel owner has signed
            let channel = Self::ensure_channel_owner_signed(origin, &channel_id)?;

            // Ensure prospective new owner can actually become a channel owner
            let (new_owner_as_channel_owner, _next_channel_id) = Self::ensure_can_register_channel_owner_role_on_member(&new_owner, Some(channel_id))?;

            //
            // == MUTATION SAFE ==
            //

            // Construct new channel with altered properties
            let new_channel = Channel {
                owner: new_owner,
                role_account: new_role_account.clone(),
                ..channel
            };

            // Overwrite entry in ChannelById
            ChannelById::<T>::insert(channel_id, new_channel);

            // Remove
            let unregistered_role = <members::Module<T>>::unregister_role(role_types::ActorInRole::new(role_types::Role::ChannelOwner, channel_id)).is_ok();

            assert!(unregistered_role);

            // Dial out to membership module and inform about new role as channe owner.
            let registered_role = <members::Module<T>>::register_role_on_member(
                new_owner,
                &new_owner_as_channel_owner)
                .is_ok();

            assert!(registered_role);

            // Trigger event
            Self::deposit_event(RawEvent::ChannelOwnershipTransferred(channel_id));
        }

        /// Channel owner updates some channel properties
        pub fn update_channel_as_owner(
            origin,
            channel_id: ChannelId<T>,
            new_handle: Option<Vec<u8>>,
            new_title: Option<OptionalText>,
            new_description: Option<OptionalText>,
            new_avatar: Option<OptionalText>,
            new_banner: Option<OptionalText>,
            new_publishing_status: Option<ChannelPublishingStatus>
        ) {

            // Ensure channel owner has signed
            Self::ensure_channel_owner_signed(origin, &channel_id)?;

            // If set, ensure handle is acceptable length
            if let Some(ref handle) = new_handle {
                Self::ensure_channel_handle_is_valid(handle)?;
            }

            // If set, ensure title is acceptable length
            if let Some(ref title) = new_title {
                Self::ensure_channel_title_is_valid(title)?;
            }

            // If set, ensure description is acceptable length
            if let Some(ref description) = new_description {
                Self::ensure_channel_description_is_valid(description)?;
            }

            // If set, ensure avatar image URL is acceptable length
            if let Some(ref avatar) = new_avatar {
                Self::ensure_channel_avatar_is_valid(avatar)?;
            }

            // If set, ensure banner image URL is acceptable length
            if let Some(ref banner) = new_banner {
                Self::ensure_channel_banner_is_valid(banner)?;
            }

            //
            // == MUTATION SAFE ==
            //

            Self::update_channel(
                &channel_id,
                &None, // verified
                &new_handle,
                &new_title,
                &new_description,
                &new_avatar,
                &new_banner,
                &new_publishing_status,
                &None // curation_status
            );
        }

        /// Update channel as a curation actor
        pub fn update_channel_as_curation_actor(
            origin,
            curation_actor: CurationActor<CuratorId<T>>,
            channel_id: ChannelId<T>,
            new_verified: Option<bool>,
            new_curation_status: Option<ChannelCurationStatus>
        ) {

            // Ensure curation actor signed
            Self::ensure_curation_actor_signed(origin, &curation_actor)?;

            //
            // == MUTATION SAFE ==
            //

            Self::update_channel(
                &channel_id,
                &new_verified,
                &None, // handle
                &None, // title
                &None, // description,
                &None, // avatar
                &None, // banner
                &None, // publishing_status
                &new_curation_status
            );
        }

        /// Add an opening for a curator role.
        pub fn add_curator_opening(origin, activate_at: hiring::ActivateOpeningAt<T::BlockNumber>, commitment: OpeningPolicyCommitment<T::BlockNumber, BalanceOf<T>>, human_readable_text: Vec<u8>)  {

            // Ensure lead is set and is origin signer
            Self::ensure_origin_is_set_lead(origin)?;

            // Ensure human radable text is valid
            Self::ensure_opening_human_readable_text_is_valid(&human_readable_text)?;

            // Add opening
            // NB: This call can in principle fail, because the staking policies
            // may not respect the minimum currency requirement.

            let policy_commitment = commitment.clone();

            let opening_id = ensure_on_wrapped_error!(
                hiring::Module::<T>::add_opening(
                    activate_at,
                    commitment.max_review_period_length,
                    commitment.application_rationing_policy,
                    commitment.application_staking_policy,
                    commitment.role_staking_policy,
                    human_readable_text,
                ))?;

            //
            // == MUTATION SAFE ==
            //

            let new_curator_opening_id = NextCuratorOpeningId::<T>::get();

            // Create and add curator opening.
            let new_opening_by_id = CuratorOpening {
                opening_id : opening_id,
                curator_applications: BTreeSet::new(),
                policy_commitment: policy_commitment
            };

            CuratorOpeningById::<T>::insert(new_curator_opening_id, new_opening_by_id);

            // Update NextCuratorOpeningId
            NextCuratorOpeningId::<T>::mutate(|id| *id += <CuratorOpeningId<T> as One>::one());

            // Trigger event
            Self::deposit_event(RawEvent::CuratorOpeningAdded(new_curator_opening_id));
        }

        /// Begin accepting curator applications to an opening that is active.
        pub fn accept_curator_applications(origin, curator_opening_id: CuratorOpeningId<T>)  {

            // Ensure lead is set and is origin signer
            Self::ensure_origin_is_set_lead(origin)?;

            // Ensure opening exists in this working group
            // NB: Even though call to hiring modul will have implicit check for
            // existence of opening as well, this check is to make sure that the opening is for
            // this working group, not something else.
            let (curator_opening, _opening) = Self::ensure_curator_opening_exists(&curator_opening_id)?;

            // Attempt to begin accepting applicationsa
            // NB: Combined ensure check and mutation in hiring module
            ensure_on_wrapped_error!(
                hiring::Module::<T>::begin_accepting_applications(curator_opening.opening_id)
                )?;

            //
            // == MUTATION SAFE ==
            //

            // Trigger event
            Self::deposit_event(RawEvent::AcceptedCuratorApplications(curator_opening_id));
        }

        /// Begin reviewing, and therefore not accepting new applications.
        pub fn begin_curator_applicant_review(origin, curator_opening_id: CuratorOpeningId<T>) {

            // Ensure lead is set and is origin signer
            let (_lead_id, _lead) = Self::ensure_origin_is_set_lead(origin)?;

            // Ensure opening exists
            // NB: Even though call to hiring modul will have implicit check for
            // existence of opening as well, this check is to make sure that the opening is for
            // this working group, not something else.
            let (curator_opening, _opening) = Self::ensure_curator_opening_exists(&curator_opening_id)?;

            // Attempt to begin review of applications
            // NB: Combined ensure check and mutation in hiring module
            ensure_on_wrapped_error!(
                hiring::Module::<T>::begin_review(curator_opening.opening_id)
                )?;

            //
            // == MUTATION SAFE ==
            //

            // Trigger event
            Self::deposit_event(RawEvent::BeganCuratorApplicationReview(curator_opening_id));
        }

        /// Fill opening for curator
        pub fn fill_curator_opening(
            origin,
            curator_opening_id: CuratorOpeningId<T>,
            successful_curator_application_ids: BTreeSet<CuratorApplicationId<T>>
        ) {
            // Ensure lead is set and is origin signer
            let (lead_id, _lead) = Self::ensure_origin_is_set_lead(origin)?;

            // Ensure curator opening exists
            let (curator_opening, _) = Self::ensure_curator_opening_exists(&curator_opening_id)?;

            // Make iterator over successful curator application
            let successful_iter = successful_curator_application_ids
                                    .iter()
                                    // recover curator application from id
                                    .map(|curator_application_id| { Self::ensure_curator_application_exists(curator_application_id) })
                                    // remove Err cases, i.e. non-existing applications
                                    .filter_map(|result| result.ok());

            // Count number of successful curators provided
            let num_provided_successful_curator_application_ids = successful_curator_application_ids.len();

            // Ensure all curator applications exist
            let number_of_successful_applications = successful_iter
                                                    .clone()
                                                    .collect::<Vec<_>>()
                                                    .len();

            ensure!(
                number_of_successful_applications == num_provided_successful_curator_application_ids,
                MSG_SUCCESSFUL_CURATOR_APPLICATION_DOES_NOT_EXIST
            );

            // Attempt to fill opening
            let successful_application_ids = successful_iter
                                            .clone()
                                            .map(|(successful_curator_application, _, _)| successful_curator_application.application_id)
                                            .collect::<BTreeSet<_>>();

            // Ensure all applications are from members that _still_ can step into the given role
            let num_successful_applications_that_can_register_as_curator = successful_iter
                                                                        .clone()
                                                                        .map(|(successful_curator_application, _, _)| successful_curator_application.member_id)
                                                                        .filter_map(|successful_member_id| Self::ensure_can_register_curator_role_on_member(&successful_member_id).ok() )
                                                                        .collect::<Vec<_>>().len();

            ensure!(
                num_successful_applications_that_can_register_as_curator == num_provided_successful_curator_application_ids,
                MSG_MEMBER_NO_LONGER_REGISTRABLE_AS_CURATOR
            );

            // NB: Combined ensure check and mutation in hiring module
            ensure_on_wrapped_error!(
                hiring::Module::<T>::fill_opening(
                    curator_opening.opening_id,
                    successful_application_ids,
                    curator_opening.policy_commitment.fill_opening_successful_applicant_application_stake_unstaking_period,
                    curator_opening.policy_commitment.fill_opening_failed_applicant_application_stake_unstaking_period,
                    curator_opening.policy_commitment.fill_opening_failed_applicant_role_stake_unstaking_period
                )
            )?;

            //
            // == MUTATION SAFE ==
            //

            let current_block = <system::Module<T>>::block_number();

            // For each successful application
            // - create and hold on to curator
            // - register role with membership module

            successful_iter
            .clone()
            .for_each(|(successful_curator_application, id, _)| {

                // No reward is established by default
                let reward_relationship: Option<RewardRelationshipId<T>> = None;

                // Get possible stake for role
                let application = hiring::ApplicationById::<T>::get(successful_curator_application.application_id);

                // Staking profile for curator
                let stake_profile =
                    if let Some(ref stake_id) = application.active_role_staking_id {

                        Some(
                            CuratorRoleStakeProfile::new(
                                stake_id,
                                &curator_opening.policy_commitment.terminate_curator_role_stake_unstaking_period,
                                &curator_opening.policy_commitment.exit_curator_role_stake_unstaking_period
                            )
                        )
                    } else {
                        None
                    };

                // Get curator id
                let new_curator_id = NextCuratorId::<T>::get();

                // Make and add new principal
                let principal_id = Self::add_new_principal(&Principal::Curator(new_curator_id));

                // Construct curator
                let curator = Curator::new(
                    &(successful_curator_application.role_account),
                    &reward_relationship,
                    &stake_profile,
                    &CuratorRoleStage::Active,
                    &CuratorInduction::new(&lead_id, &id, &current_block),
                    //false,
                    &principal_id
                );

                // Store curator
                CuratorById::<T>::insert(new_curator_id, curator);

                // Register role on member
                let registered_role = members::Module::<T>::register_role_on_member(
                    successful_curator_application.member_id,
                    &role_types::ActorInRole::new(role_types::Role::Curator, new_curator_id)
                ).is_ok();

                assert!(registered_role);

                // Update next curator id
                NextCuratorId::<T>::mutate(|id| *id += <CuratorId<T> as One>::one());
            });

            // Trigger event
            Self::deposit_event(RawEvent::CuratorOpeningFilled(curator_opening_id, successful_curator_application_ids));

        }

        /*
        /// ...
        pub fn update_curator_reward(_origin) {

        }
        */

        /*
        /// ...
        pub fn slash_curator(_origin) {

        }
        */

        pub fn withdraw_curator_application(
            origin,
            curator_application_id: CuratorApplicationId<T>
        ) {
            // Ensuring curator application actually exists
            let (curator_application, _, curator_opening) = Self::ensure_curator_application_exists(&curator_application_id)?;

            // Ensure that it is signed
            let signer_account = ensure_signed(origin)?;

            // Ensure that signer is applicant role account
            ensure!(
                signer_account == curator_application.role_account,
                MSG_ORIGIN_IS_NOT_APPLICANT
            );

            // Attempt to deactivate application
            // NB: Combined ensure check and mutation in hiring module
            ensure_on_wrapped_error!(
                hiring::Module::<T>::deactive_application(
                    curator_application.application_id,
                    curator_opening.policy_commitment.exit_curator_role_application_stake_unstaking_period,
                    curator_opening.policy_commitment.exit_curator_role_stake_unstaking_period
                )
            )?;

            //
            // == MUTATION SAFE ==
            //

            // Trigger event
            Self::deposit_event(RawEvent::CuratorApplicationWithdrawn(curator_application_id));

        }

        /// Lead terminate curator application
        pub fn terminate_curator_application(
            origin,
            curator_application_id: CuratorApplicationId<T>
            ) {

            // Ensure lead is set and is origin signer
            Self::ensure_origin_is_set_lead(origin)?;

            // Ensuring curator application actually exists
            let (curator_application, _, curator_opening) = Self::ensure_curator_application_exists(&curator_application_id)?;

            // Attempt to deactivate application
            // NB: Combined ensure check and mutation in hiring module
            ensure_on_wrapped_error!(
                hiring::Module::<T>::deactive_application(
                    curator_application.application_id,
                    curator_opening.policy_commitment.terminate_curator_application_stake_unstaking_period,
                    curator_opening.policy_commitment.terminate_curator_role_stake_unstaking_period
                )
            )?;

            //
            // == MUTATION SAFE ==
            //

            // Trigger event
            Self::deposit_event(RawEvent::CuratorApplicationTerminated(curator_application_id));
        }

        /// Apply on a curator opening.
        pub fn apply_on_curator_opening(
            origin,
            member_id: T::MemberId,
            curator_opening_id: CuratorOpeningId<T>,
            role_account: T::AccountId,
            source_account: T::AccountId,
            opt_role_stake_balance: Option<BalanceOf<T>>,
            opt_application_stake_balance: Option<BalanceOf<T>>,
            human_readable_text: Vec<u8>
        ) {
            // Ensure that origin is signed by member with given id.
            ensure_on_wrapped_error!(
                members::Module::<T>::ensure_member_controller_account_signed(origin, &member_id)
            )?;

            // Ensure curator opening exists
            let (curator_opening, _opening) = Self::ensure_curator_opening_exists(&curator_opening_id)?;

            // Ensure new owner can actually become a curator
            let (_member_as_curator, _new_curator_id) = Self::ensure_can_register_curator_role_on_member(&member_id)?;

            // Ensure that there is sufficient balance to cover stake proposed
            Self::ensure_can_make_stake_imbalance(
                vec![&opt_role_stake_balance, &opt_application_stake_balance],
                &source_account)
                .map_err(|_err| MSG_INSUFFICIENT_BALANCE_TO_APPLY)?;

            // Ensure application text is valid
            Self::ensure_curator_application_text_is_valid(&human_readable_text)?;

            // Ensure application can actually be added
            ensure_on_wrapped_error!(
                hiring::Module::<T>::ensure_can_add_application(curator_opening.opening_id, opt_role_stake_balance, opt_application_stake_balance)
            )?;

            //
            // == MUTATION SAFE ==
            //

            // Make imbalances for staking
            let opt_role_stake_imbalance = Self::make_stake_opt_imbalance(&opt_role_stake_balance, &source_account);
            let opt_application_stake_imbalance = Self::make_stake_opt_imbalance(&opt_application_stake_balance, &source_account);

            // Call hiring module to add application
            let add_application_result = hiring::Module::<T>::add_application(
                curator_opening.opening_id,
                opt_role_stake_imbalance,
                opt_application_stake_imbalance,
                human_readable_text
            );

            // Has to hold
            assert!(add_application_result.is_ok());

            let application_id = add_application_result.unwrap().application_id_added;

            // Get id of new curator application
            let new_curator_application_id = NextCuratorApplicationId::<T>::get();

            // Make curator application
            let curator_application = CuratorApplication::new(&role_account, &curator_opening_id, &member_id, &application_id);

            // Store application
            CuratorApplicationById::<T>::insert(new_curator_application_id, curator_application);

            // Update next curator application identifier value
            NextCuratorApplicationId::<T>::mutate(|id| *id += <CuratorApplicationId<T> as One>::one());

            // Add application to set of application in curator opening
            CuratorOpeningById::<T>::mutate(curator_opening_id, |curator_opening| {
                curator_opening.curator_applications.insert(new_curator_application_id);
            });

            // Trigger event
            Self::deposit_event(RawEvent::AppliedOnCuratorOpening(curator_opening_id, new_curator_application_id));
        }

        /// An active curator can update the associated role account.
        pub fn update_curator_role_account(
            origin,
            member_id: T::MemberId,
            curator_id: CuratorId<T>,
            new_role_account: T::AccountId
        ) {
            // Ensure that origin is signed by member with given id.
            ensure_on_wrapped_error!(
                members::Module::<T>::ensure_member_controller_account_signed(origin, &member_id)
            )?;

            // Ensure that member is this curator
            let actor_in_role = role_types::ActorInRole::new(role_types::Role::Curator, curator_id);

            ensure!(
                members::MembershipIdByActorInRole::<T>::get(actor_in_role) == member_id,
                MSG_CURATOR_NOT_CONTROLLED_BY_MEMBER
            );

            //
            // == MUTATION SAFE ==
            //

            // Update role account
            CuratorById::<T>::mutate(curator_id, |curator| {
                curator.role_account = new_role_account.clone()
            });

            // Trigger event
            Self::deposit_event(RawEvent::CuratorRoleAccountUpdated(curator_id, new_role_account));
        }

        /// An active curator can update the reward account associated
        /// with a set reward relationship.
        pub fn update_curator_reward_account(
            origin,
            curator_id: CuratorId<T>,
            new_reward_account: T::AccountId
        ) {

            // Ensure there is a signer which matches role account of curator corresponding to provided id.
            let curator = Self::ensure_active_curator_signed(origin, &curator_id)?;

            // Ensure the curator actually has a recurring reward
            let relationship_id = Self::ensure_curator_has_recurring_reward(&curator)?;

            //
            // == MUTATION SAFE ==
            //

            // Update, only, reward account.
            recurringrewards::Module::<T>::set_reward_relationship(
                relationship_id,
                Some(new_reward_account.clone()), // new_account
                None, // new_payout
                None, //new_next_payment_at
                None //new_payout_interval
            )
            .expect("Must be set, since curator has recurring reward");

            // Trigger event
            Self::deposit_event(RawEvent::CuratorRewardAccountUpdated(curator_id, new_reward_account));
        }

        /// An active curator leaves role
        pub fn leave_curator_role(
            origin,
            curator_id: CuratorId<T>,
            rationale_text: Vec<u8>
        ) {
            // Ensure there is a signer which matches role account of curator corresponding to provided id.
            let active_curator = Self::ensure_active_curator_signed(origin, &curator_id)?;

            //
            // == MUTATION SAFE ==
            //

            Self::deactivate_curator(
                &curator_id,
                &active_curator,
                &CuratorExitInitiationOrigin::Curator,
                &rationale_text
            );
        }

        /// Lead can terminate and active curator
        pub fn terminate_curator_role(
            origin,
            curator_id: CuratorId<T>,
            rationale_text: Vec<u8>
            ) {

            // Ensure lead is set and is origin signer
            Self::ensure_origin_is_set_lead(origin)?;

            // Ensuring curator actually exists and is active
            let curator = Self::ensure_active_curator_exists(&curator_id)?;

            // Ensure rationale text is valid
            Self::ensure_curator_exit_rationale_text_is_valid(&rationale_text)?;

            //
            // == MUTATION SAFE ==
            //

            Self::deactivate_curator(
                &curator_id,
                &curator,
                &CuratorExitInitiationOrigin::Lead,
                &rationale_text
            );
        }

        /*
         * Root origin routines for managing lead.
         */


        /// Introduce a lead when one is not currently set.
        pub fn set_lead(origin, member: T::MemberId, role_account: T::AccountId) {

            // Ensure root is origin
            ensure_root(origin)?;

            // Ensure there is no current lead
            ensure!(
                <CurrentLeadId<T>>::get().is_none(),
                MSG_CURRENT_LEAD_ALREADY_SET
            );

            // Ensure that member can actually become lead
            let new_lead_id = <NextLeadId<T>>::get();

            let _profile = <members::Module<T>>::can_register_role_on_member(
                &member,
                &role_types::ActorInRole::new(role_types::Role::CuratorLead, new_lead_id)
            )?;

            //
            // == MUTATION SAFE ==
            //

            // Construct lead
            let new_lead = Lead{
                role_account: role_account.clone(),
                reward_relationship: None,
                inducted: <system::Module<T>>::block_number(),
                stage: LeadRoleState::Active
            };

            // Store lead
            <LeadById<T>>::insert(new_lead_id, new_lead);

            // Update current lead
            <CurrentLeadId<T>>::put(new_lead_id); // Some(new_lead_id)

            // Update next lead counter
            <NextLeadId<T>>::mutate(|id| *id += <LeadId<T> as One>::one());

            // Trigger event
            Self::deposit_event(RawEvent::LeadSet(new_lead_id));
        }

        /// Evict the currently unset lead
        pub fn unset_lead(origin) {

            // Ensure root is origin
            ensure_root(origin)?;

            // Ensure there is a lead set
            let (lead_id,lead) = Self::ensure_lead_is_set()?;

            //
            // == MUTATION SAFE ==
            //

            // Unregister from role in membership model
            let current_lead_role = role_types::ActorInRole{
                role: role_types::Role::CuratorLead,
                actor_id: lead_id
            };

            let unregistered_role = <members::Module<T>>::unregister_role(current_lead_role).is_ok();

            assert!(unregistered_role);

            // Update lead stage as exited
            let current_block = <system::Module<T>>::block_number();

            let new_lead = Lead{
                stage: LeadRoleState::Exited(ExitedLeadRole { initiated_at_block_number: current_block}),
                ..lead
            };

            <LeadById<T>>::insert(lead_id, new_lead);

            // Update current lead
            <CurrentLeadId<T>>::take(); // None

            // Trigger event
            Self::deposit_event(RawEvent::LeadUnset(lead_id));
        }

        /// The stake, with the given id, was unstaked.
        pub fn unstaked(
            origin,
            stake_id: StakeId<T>
        ) {
            // Ensure its a runtime root origin
            ensure_root(origin)?;

            // Ensure its an unstaker in this group
            let unstaker = Self::ensure_unstaker_exists(&stake_id)?;

            // Get curator doing the unstaking,
            // urrently the only possible unstaker in this module.
            let curator_id =
                if let WorkingGroupUnstaker::Curator(curator_id) = unstaker {
                    curator_id
                } else {
                    panic!("Should not be possible, only curators unstake in this module currently");
                };

            // Grab curator from id, unwrap, because this curator _must_ exist.
            let unstaking_curator = Self::ensure_curator_exists(&curator_id).unwrap();

            //
            // == MUTATION SAFE ==
            //

            // Update stage of curator
            let curator_exit_summary =
                if let CuratorRoleStage::Unstaking(summary) = unstaking_curator.stage {
                    summary
                } else {
                    panic!("Curator must be in unstaking stage");
                };

            let new_curator = Curator{
                stage: CuratorRoleStage::Exited(curator_exit_summary.clone()),
                ..unstaking_curator
            };

            CuratorById::<T>::insert(curator_id, new_curator);

            // Remove from unstaker
            UnstakerByStakeId::<T>::remove(stake_id);

            // Trigger event
            let event = match curator_exit_summary.origin {
                CuratorExitInitiationOrigin::Lead => RawEvent::TerminatedCurator(curator_id),
                CuratorExitInitiationOrigin::Curator => RawEvent::CuratorExited(curator_id),
            };

            Self::deposit_event(event);
        }

    }
}

impl<T: Trait> versioned_store_permissions::PrincipalIdChecker<T> for Module<T> {
    fn account_can_act_as_principal(account: &T::AccountId, id: PrincipalId<T>) -> bool {
        // Check that principal exists
        if !PrincipalById::<T>::exists(&id) {
            return false;
        }

        // Get principal
        let principal = PrincipalById::<T>::get(&id);

        // Get possible
        let opt_prinicipal_account = match principal {
            Principal::Lead => {
                // Try to get lead
                match Self::ensure_lead_is_set() {
                    Ok((_, lead)) => Some(lead.role_account),
                    Err(_) => None,
                }
            }

            Principal::Curator(curator_id) => Some(
                Self::ensure_curator_exists(&curator_id)
                    .expect("Curator must exist")
                    .role_account,
            ),

            Principal::ChannelOwner(channel_id) => Some(
                Self::ensure_channel_id_is_valid(&channel_id)
                    .expect("Channel must exist")
                    .role_account,
            ),
        };

        // Compare, possibly set, principal account with the given account
        match opt_prinicipal_account {
            Some(principal_account) => *account == principal_account,
            None => false,
        }
    }
}

impl<T: Trait> Module<T> {
    fn ensure_can_register_role_on_member(
        member_id: &T::MemberId,
        role: role_types::Role,
        actor_id: &ActorIdInMembersModule<T>,
    ) -> Result<members::ActorInRole<ActorIdInMembersModule<T>>, &'static str> {
        let new_actor_in_role = role_types::ActorInRole::new(role, *actor_id);

        <members::Module<T>>::can_register_role_on_member(member_id, &new_actor_in_role)
            .map(|_| new_actor_in_role)
    }

    fn ensure_can_register_curator_role_on_member(
        member_id: &T::MemberId,
    ) -> Result<
        (
            members::ActorInRole<ActorIdInMembersModule<T>>,
            CuratorId<T>,
        ),
        &'static str,
    > {
        let next_id = <NextCuratorId<T>>::get();

        Self::ensure_can_register_role_on_member(member_id, role_types::Role::Curator, &next_id)
            .map(|curator_in_role| (curator_in_role, next_id))
    }

    fn ensure_can_register_channel_owner_role_on_member(
        member_id: &T::MemberId,
        opt_channel_id: Option<ChannelId<T>>,
    ) -> Result<
        (
            members::ActorInRole<ActorIdInMembersModule<T>>,
            CuratorId<T>,
        ),
        &'static str,
    > {
        let next_channel_id = opt_channel_id.unwrap_or(NextChannelId::<T>::get());

        Self::ensure_can_register_role_on_member(
            member_id,
            role_types::Role::ChannelOwner,
            &next_channel_id,
        )
        .map(|member_in_role| (member_in_role, next_channel_id))
    }

    // TODO: convert InputConstraint ensurer routines into macroes

    fn ensure_channel_handle_is_valid(handle: &Vec<u8>) -> dispatch::Result {
        ChannelHandleConstraint::get().ensure_valid(
            handle.len(),
            MSG_CHANNEL_HANDLE_TOO_SHORT,
            MSG_CHANNEL_HANDLE_TOO_LONG,
        )?;

        // Has to not already be occupied
        ensure!(
            ChannelIdByHandle::<T>::exists(handle),
            MSG_CHANNEL_HANDLE_ALREADY_TAKEN
        );

        Ok(())
    }

    
    fn ensure_channel_title_is_valid(text_opt: &OptionalText) -> dispatch::Result {
        if let Some(text) = text_opt {
            ChannelTitleConstraint::get().ensure_valid(
                text.len(),
                MSG_CHANNEL_TITLE_TOO_SHORT,
                MSG_CHANNEL_TITLE_TOO_LONG,
            )
        } else {
            Ok(())
        }
    }

    fn ensure_channel_description_is_valid(text_opt: &OptionalText) -> dispatch::Result {
        if let Some(text) = text_opt {
            ChannelDescriptionConstraint::get().ensure_valid(
                text.len(),
                MSG_CHANNEL_DESCRIPTION_TOO_SHORT,
                MSG_CHANNEL_DESCRIPTION_TOO_LONG,
            )
        } else {
            Ok(())
        }
    }

    fn ensure_channel_avatar_is_valid(text_opt: &OptionalText) -> dispatch::Result {
        if let Some(text) = text_opt {
            ChannelAvatarConstraint::get().ensure_valid(
                text.len(),
                MSG_CHANNEL_AVATAR_TOO_SHORT,
                MSG_CHANNEL_AVATAR_TOO_LONG,
            )
        } else {
            Ok(())
        }
    }

    fn ensure_channel_banner_is_valid(text_opt: &OptionalText) -> dispatch::Result {
        if let Some(text) = text_opt {
            ChannelBannerConstraint::get().ensure_valid(
                text.len(),
                MSG_CHANNEL_BANNER_TOO_SHORT,
                MSG_CHANNEL_BANNER_TOO_LONG,
            )
        } else {
            Ok(())
        }
    }

    fn ensure_curator_application_text_is_valid(text: &Vec<u8>) -> dispatch::Result {
        CuratorApplicationHumanReadableText::get().ensure_valid(
            text.len(),
            MSG_CURATOR_APPLICATION_TEXT_TOO_SHORT,
            MSG_CURATOR_APPLICATION_TEXT_TOO_LONG,
        )
    }

    fn ensure_curator_exit_rationale_text_is_valid(text: &Vec<u8>) -> dispatch::Result {
        CuratorExitRationaleText::get().ensure_valid(
            text.len(),
            MSG_CURATOR_EXIT_RATIONALE_TEXT_TOO_SHORT,
            MSG_CURATOR_EXIT_RATIONALE_TEXT_TOO_LONG,
        )
    }

    fn ensure_opening_human_readable_text_is_valid(text: &Vec<u8>) -> dispatch::Result {
        OpeningHumanReadableText::get().ensure_valid(
            text.len(),
            MSG_CHANNEL_DESCRIPTION_TOO_SHORT,
            MSG_CHANNEL_DESCRIPTION_TOO_LONG,
        )
    }

    fn ensure_channel_id_is_valid(
        channel_id: &ChannelId<T>,
    ) -> Result<Channel<T::MemberId, T::AccountId, T::BlockNumber, PrincipalId<T>>, &'static str>
    {
        if ChannelById::<T>::exists(channel_id) {
            let channel = ChannelById::<T>::get(channel_id);

            Ok(channel)
        } else {
            Err(MSG_CHANNEL_ID_INVALID)
        }
    }

    fn ensure_lead_is_set() -> Result<
        (
            LeadId<T>,
            Lead<T::AccountId, T::RewardRelationshipId, T::BlockNumber>,
        ),
        &'static str,
    > {
        // Ensure lead id is set
        let lead_id = Self::ensure_lead_id_set()?;

        // If so, grab actual lead
        let lead = <LeadById<T>>::get(lead_id);

        // and return both
        Ok((lead_id, lead))
    }

    fn ensure_lead_id_set() -> Result<LeadId<T>, &'static str> {
        let opt_current_lead_id = <CurrentLeadId<T>>::get();

        if let Some(lead_id) = opt_current_lead_id {
            Ok(lead_id)
        } else {
            Err(MSG_CURRENT_LEAD_NOT_SET)
        }
    }

    fn ensure_origin_is_set_lead(
        origin: T::Origin,
    ) -> Result<
        (
            LeadId<T>,
            Lead<T::AccountId, T::RewardRelationshipId, T::BlockNumber>,
        ),
        &'static str,
    > {
        // Ensure lead is actually set
        let (lead_id, lead) = Self::ensure_lead_is_set()?;

        // Ensure is signed
        let signer = ensure_signed(origin)?;

        // Ensure signer is lead
        ensure!(signer == lead.role_account, MSG_ORIGIN_IS_NOT_LEAD);

        Ok((lead_id, lead))
    }
    /*
        fn ensure_activate_opening_at_valid(activate_at: &hiring::ActivateOpeningAt<T::BlockNumber>) -> Result<T::BlockNumber, &'static str>{

            let current_block = <system::Module<T>>::block_number();

            let starting_block =
                match activate_at {
                    hiring::ActivateOpeningAt::CurrentBlock => current_block,
                    hiring::ActivateOpeningAt::ExactBlock(block_number) => block_number.clone()
            };

            ensure!(
                starting_block >= current_block,
                MSG_OPENING_CANNOT_ACTIVATE_IN_THE_PAST
            );

            Ok(starting_block)
        }
    */
    fn ensure_curator_opening_exists(
        curator_opening_id: &CuratorOpeningId<T>,
    ) -> Result<
        (
            CuratorOpening<T::OpeningId, T::BlockNumber, BalanceOf<T>, CuratorApplicationId<T>>,
            hiring::Opening<BalanceOf<T>, T::BlockNumber, <T as hiring::Trait>::ApplicationId>,
        ),
        &'static str,
    > {
        ensure!(
            CuratorOpeningById::<T>::exists(curator_opening_id),
            MSG_CURATOR_OPENING_DOES_NOT_EXIST
        );

        let curator_opening = CuratorOpeningById::<T>::get(curator_opening_id);

        let opening = hiring::OpeningById::<T>::get(curator_opening.opening_id);

        Ok((curator_opening, opening))
    }

    fn ensure_curator_exists(
        curator_id: &CuratorId<T>,
    ) -> Result<
        Curator<
            T::AccountId,
            T::RewardRelationshipId,
            T::StakeId,
            T::BlockNumber,
            LeadId<T>,
            T::ApplicationId,
            PrincipalId<T>,
        >,
        &'static str,
    > {
        ensure!(
            CuratorById::<T>::exists(curator_id),
            MSG_CURATOR_DOES_NOT_EXIST
        );

        let curator = CuratorById::<T>::get(curator_id);

        Ok(curator)
    }

    fn ensure_unstaker_exists(
        stake_id: &StakeId<T>,
    ) -> Result<WorkingGroupUnstaker<LeadId<T>, CuratorId<T>>, &'static str> {
        ensure!(
            UnstakerByStakeId::<T>::exists(stake_id),
            MSG_UNSTAKER_DOES_NOT_EXIST
        );

        let unstaker = UnstakerByStakeId::<T>::get(stake_id);

        Ok(unstaker)
    }

    fn ensure_active_curator_exists(
        curator_id: &CuratorId<T>,
    ) -> Result<
        Curator<
            T::AccountId,
            T::RewardRelationshipId,
            T::StakeId,
            T::BlockNumber,
            LeadId<T>,
            T::ApplicationId,
            PrincipalId<T>,
        >,
        &'static str,
    > {
        // Ensuring curator actually exists
        let curator = Self::ensure_curator_exists(curator_id)?;

        // Ensure curator is still active
        ensure!(
            match curator.stage {
                CuratorRoleStage::Active => true,
                _ => false,
            },
            MSG_CURATOR_IS_NOT_ACTIVE
        );

        Ok(curator)
    }

    fn ensure_active_curator_signed(
        origin: T::Origin,
        curator_id: &CuratorId<T>,
    ) -> Result<
        Curator<
            T::AccountId,
            T::RewardRelationshipId,
            T::StakeId,
            T::BlockNumber,
            LeadId<T>,
            T::ApplicationId,
            PrincipalId<T>,
        >,
        &'static str,
    > {
        // Ensure that it is signed
        let signer_account = ensure_signed(origin)?;

        // Ensure that id corresponds to active curator
        let curator = Self::ensure_active_curator_exists(&curator_id)?;

        // Ensure that signer is actually role account of curator
        ensure!(
            signer_account == curator.role_account,
            MSG_SIGNER_IS_NOT_CURATOR_ROLE_ACCOUNT
        );

        Ok(curator)
    }

    fn ensure_curation_actor_signed(
        origin: T::Origin,
        curation_actor: &CurationActor<CuratorId<T>>,
    ) -> Result<(), &'static str> {
        match curation_actor {
            CurationActor::Lead => {
                // Ensure lead is set and is origin signer
                Self::ensure_origin_is_set_lead(origin).map(|_| ())
            }
            CurationActor::Curator(curator_id) => {
                // Ensure there is a signer which matches role account of curator corresponding to provided id.
                Self::ensure_active_curator_signed(origin, &curator_id).map(|_| ())
            }
        }
    }

    /// Ensure origin is signed by account matching role account corresponding to the channel
    fn ensure_channel_owner_signed(
        origin: T::Origin,
        channel_id: &ChannelId<T>,
    ) -> Result<Channel<T::MemberId, T::AccountId, T::BlockNumber, PrincipalId<T>>, &'static str>
    {
        // Ensure that it is signed
        let signer_account = ensure_signed(origin)?;

        // Ensure channel id is valid
        let channel = Self::ensure_channel_id_is_valid(&channel_id)?;

        // Ensure origin matches channel role account
        ensure!(
            signer_account == channel.role_account,
            MSG_ORIGIN_DOES_NOT_MATCH_CHANNEL_ROLE_ACCOUNT
        );

        Ok(channel)
    }

    fn ensure_curator_application_exists(
        curator_application_id: &CuratorApplicationId<T>,
    ) -> Result<
        (
            CuratorApplication<T::AccountId, CuratorOpeningId<T>, T::MemberId, T::ApplicationId>,
            CuratorApplicationId<T>,
            CuratorOpening<T::OpeningId, T::BlockNumber, BalanceOf<T>, CuratorApplicationId<T>>,
        ),
        &'static str,
    > {
        //Result<(hiring::Application<<T as hiring::Trait>::OpeningId, T::BlockNumber, <T as stake::Trait>::StakeId>, CuratorOpening<T::OpeningId, T::BlockNumber, BalanceOf<T>, CuratorApplicationId<T>> ,hiring::Opening<BalanceOf<T>, T::BlockNumber, <T as hiring::Trait>::ApplicationId>), &'static str> {

        ensure!(
            CuratorApplicationById::<T>::exists(curator_application_id),
            MSG_CURATOR_APPLICATION_DOES_NOT_EXIST
        );

        let curator_application = CuratorApplicationById::<T>::get(curator_application_id);

        //let application = hiring::ApplicationById::<T>::get(curator_application.application_id);

        let curator_opening = CuratorOpeningById::<T>::get(curator_application.curator_opening_id);

        //let opening = hiring::OpeningById::<T>::get(curator_opening.opening_id);

        Ok((
            curator_application,
            curator_application_id.clone(),
            curator_opening,
        ))
    }

    fn ensure_curator_has_recurring_reward(
        curator: &Curator<
            T::AccountId,
            T::RewardRelationshipId,
            T::StakeId,
            T::BlockNumber,
            LeadId<T>,
            T::ApplicationId,
            PrincipalId<T>,
        >,
    ) -> Result<T::RewardRelationshipId, &'static str> {
        ensure!(
            curator.reward_relationship.is_some(),
            MSG_CURATOR_HAS_NO_REWARD
        );

        let relationship_id = curator.reward_relationship.unwrap();

        Ok(relationship_id)
    }

    /// CRITICAL:
    /// https://github.com/Joystream/substrate-runtime-joystream/issues/92
    /// This assumes that ensure_can_withdraw can be don
    /// for a sum of balance that later will be actually withdrawn
    /// using individual terms in that sum.
    /// This needs to be fully checked across all possibly scenarios
    /// of actual balance, minimum balance limit, reservation, vesting and locking.
    fn ensure_can_make_stake_imbalance(
        opt_balances: Vec<&Option<BalanceOf<T>>>,
        source_account: &T::AccountId,
    ) -> Result<(), &'static str> {
        let zero_balance = <BalanceOf<T> as Zero>::zero();

        // Total amount to be staked
        let total_amount = opt_balances.iter().fold(zero_balance, |sum, opt_balance| {
            sum + if let Some(balance) = opt_balance {
                *balance
            } else {
                zero_balance
            }
        });

        if total_amount > zero_balance {
            let new_balance = CurrencyOf::<T>::free_balance(source_account) - total_amount;

            CurrencyOf::<T>::ensure_can_withdraw(
                source_account,
                total_amount,
                WithdrawReasons::all(),
                new_balance,
            )
        } else {
            Ok(())
        }
    }

    fn make_stake_opt_imbalance(
        opt_balance: &Option<BalanceOf<T>>,
        source_account: &T::AccountId,
    ) -> Option<NegativeImbalance<T>> {
        if let Some(balance) = opt_balance {
            let withdraw_result = CurrencyOf::<T>::withdraw(
                source_account,
                *balance,
                WithdrawReasons::all(),
                ExistenceRequirement::AllowDeath,
            );

            assert!(withdraw_result.is_ok());

            withdraw_result.ok()
        } else {
            None
        }
    }

    fn deactivate_curator(
        curator_id: &CuratorId<T>,
        curator: &Curator<
            T::AccountId,
            T::RewardRelationshipId,
            T::StakeId,
            T::BlockNumber,
            LeadId<T>,
            CuratorApplicationId<T>,
            PrincipalId<T>,
        >,
        exit_initiation_origin: &CuratorExitInitiationOrigin,
        rationale_text: &Vec<u8>,
    ) {
        // Stop any possible recurring rewards
        let _did_deactivate_recurring_reward = if let Some(ref reward_relationship_id) =
            curator.reward_relationship
        {
            // Attempt to deactivate
            recurringrewards::Module::<T>::try_to_deactivate_relationship(*reward_relationship_id)
                .expect("Relatioship must exist")
        } else {
            // Did not deactivate, there was no reward relationship!
            false
        };

        // When the curator is staked, unstaking must first be initated,
        // otherwise they can be terminted right away.

        // Create exit summary for this termination
        let current_block = <system::Module<T>>::block_number();

        let curator_exit_summary =
            CuratorExitSummary::new(exit_initiation_origin, &current_block, rationale_text);

        // Determine new curator stage and event to emit
        let (new_curator_stage, unstake_directions, event) =
            if let Some(ref stake_profile) = curator.role_stake_profile {
                // Determine unstaknig period based on who initiated deactivation
                let unstaking_period = match curator_exit_summary.origin {
                    CuratorExitInitiationOrigin::Lead => stake_profile.termination_unstaking_period,
                    CuratorExitInitiationOrigin::Curator => stake_profile.exit_unstaking_period,
                };

                (
                    CuratorRoleStage::Unstaking(curator_exit_summary),
                    Some((stake_profile.stake_id.clone(), unstaking_period)),
                    RawEvent::CuratorUnstaking(curator_id.clone()),
                )
            } else {
                (
                    CuratorRoleStage::Exited(curator_exit_summary.clone()),
                    None,
                    match curator_exit_summary.origin {
                        CuratorExitInitiationOrigin::Lead => {
                            RawEvent::TerminatedCurator(curator_id.clone())
                        }
                        CuratorExitInitiationOrigin::Curator => {
                            RawEvent::CuratorExited(curator_id.clone())
                        }
                    },
                )
            };

        // Update curator
        let new_curator = Curator {
            stage: new_curator_stage,
            ..(curator.clone())
        };

        CuratorById::<T>::insert(curator_id, new_curator);

        // Unstake if directions provided
        if let Some(directions) = unstake_directions {
            // Unstake
            stake::Module::<T>::initiate_unstaking(&directions.0, directions.1)
                .expect("Unstaking must be possible at this time");
        }

        // Trigger event
        Self::deposit_event(event);
    }

    /// Adds the given principal to storage under the returned identifier.
    fn add_new_principal(principal: &Principal<CuratorId<T>, ChannelId<T>>) -> PrincipalId<T> {
        // Get principal id for curator
        let principal_id = NextPrincipalId::<T>::get();

        // Update next principal id value
        NextPrincipalId::<T>::mutate(|id| *id += PrincipalId::<T>::one());

        // Store principal
        PrincipalById::<T>::insert(principal_id, principal);

        // Return id
        principal_id
    }

    fn update_channel(
        channel_id: &ChannelId<T>,
        new_verified: &Option<bool>,
        new_handle: &Option<Vec<u8>>,
        new_title: &Option<OptionalText>,
        new_description: &Option<OptionalText>,
        new_avatar: &Option<OptionalText>,
        new_banner: &Option<OptionalText>,
        new_publishing_status: &Option<ChannelPublishingStatus>,
        new_curation_status: &Option<ChannelCurationStatus>,
    ) {
        // Update channel id to handle mapping, if there is a new handle.
        if let Some(ref handle) = new_handle {
            // Remove mapping under old handle
            let current_handle = ChannelById::<T>::get(channel_id).handle;
            ChannelIdByHandle::<T>::remove(current_handle);

            // Establish mapping under new handle
            ChannelIdByHandle::<T>::insert(handle.clone(), channel_id);
        }

        // Update channel
        ChannelById::<T>::mutate(channel_id, |channel| {

            if let Some(ref verified) = new_verified {
                channel.verified = *verified;
            }

            if let Some(ref handle) = new_handle {
                channel.handle = handle.clone();
            }

            if let Some(ref title) = new_title {
                channel.title = title.clone();
            }

            if let Some(ref description) = new_description {
                channel.description = description.clone();
            }

            if let Some(ref avatar) = new_avatar {
                channel.avatar = avatar.clone();
            }

            if let Some(ref banner) = new_banner {
                channel.banner = banner.clone();
            }

            if let Some(ref publishing_status) = new_publishing_status {
                channel.publishing_status = publishing_status.clone();
            }

            if let Some(ref curation_status) = new_curation_status {
                channel.curation_status = *curation_status;
            }
        });

        // Trigger event
        Self::deposit_event(RawEvent::ChannelUpdatedByCurationActor(*channel_id));
    }
}
