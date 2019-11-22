// Ensure we're `no_std` when compiling for Wasm.
#![cfg_attr(not(feature = "std"), no_std)]

#[cfg(feature = "std")]
use serde::{Deserialize, Serialize};

use codec::{Decode, Encode}; // Codec
//use rstd::collections::btree_map::BTreeMap;
use rstd::collections::btree_set::BTreeSet;
use rstd::prelude::*;
use rstd::convert::From;
use srml_support::traits::{Currency, WithdrawReasons, ExistenceRequirement};
use srml_support::{
    decl_module, decl_storage, decl_event, ensure, dispatch // , StorageMap, , Parameter
};
use system::{self, ensure_signed, ensure_root};
use runtime_primitives::traits::{One, Zero}; // Member, SimpleArithmetic, MaybeSerialize
use minting;
use recurringrewards;
use stake;
use hiring;
use versioned_store_permissions;
use crate::membership::{members, role_types};

/// DIRTY IMPORT BECAUSE
/// InputValidationLengthConstraint has not been factored out yet!!!
use forum::InputValidationLengthConstraint;

/*
 * Permissions model.
 * 
 * New channels are created, and the corresponding member
 * is set as owner, and a new dynamic credential is created.
 * 
 * 
 *
 * 
 * 
 */

/// Module configuration trait for this Substrate module.
pub trait Trait: system::Trait + minting::Trait + recurringrewards::Trait + stake::Trait + hiring::Trait + versioned_store_permissions::Trait + members::Trait { // + Sized

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

/// Type for identifier for dynamic version store credential.
pub type DynamicCredentialId<T> = <T as versioned_store_permissions::Trait>::PrincipalId;

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


pub type RewardRelationshipId<T> = <T as recurringrewards::Trait>::RewardRelationshipId;

/*
 * MOVE ALL OF THESE OUT TO COMMON LATER
 */

static MSG_CHANNEL_CREATION_DISABLED: &str =
    "Channel creation currently disabled.";
static MSG_CHANNEL_HANDLE_TOO_SHORT: &str = 
    "Channel handle too short.";
static MSG_CHANNEL_HANDLE_TOO_LONG: &str = 
    "Channel handle too long.";
static MSG_CHANNEL_DESCRIPTION_TOO_SHORT: &str = 
    "Channel description too short";
static MSG_CHANNEL_DESCRIPTION_TOO_LONG: &str = 
    "Channel description too long";
static MSG_MEMBER_CANNOT_BECOME_PUBLISHER: &str =
    "Member cannot become a publisher";
static MSG_CHANNEL_ID_INVALID: &str = 
    "Channel id invalid";
static MSG_ORIGIN_DOES_NOT_MATCH_CHANNEL_ROLE_ACCOUNT: &str =
    "Origin does not match channel role account";
static MSG_CURRENT_LEAD_ALREADY_SET: &str = 
    "Current lead is already set";
static MSG_CURRENT_LEAD_NOT_SET: &str = 
    "Current lead is not set";
static MSG_MEMBER_CANNOT_BECOME_CURATOR_LEAD: &str =
    "The member cannot become curator lead";
//static MSG_LEAD_IS_NOT_SET: &str = 
//    "Lead is not set";
static MSG_ORIGIN_IS_NOT_LEAD: &str =
    "Origin is not lead";
//static MSG_OPENING_CANNOT_ACTIVATE_IN_THE_PAST: &str =
//    "Opening cannot activate in the past";
static MSG_CURATOR_OPENING_DOES_NOT_EXIST: &str =
    "Curator opening does not exist";
static MSG_CURATOR_APPLICATION_DOES_NOT_EXIST: &str =
    "Curator application does not exist";
//static MSG_INSUFFICIENT_BALANCE_TO_COVER_ROLE_STAKE: &str =
//    "Insufficient balance to cover role stake";
//static MSG_INSUFFICIENT_BALANCE_TO_COVER_APPLICATION_STAKE: &str =
//    "Insufficient balance to cover application stake";
static MSG_INSUFFICIENT_BALANCE_TO_APPLY: &str =
    "Insufficient balance to apply";
static MSG_SUCCESSFUL_CURATOR_APPLICATION_DOES_NOT_EXIST: &str =
    "Successful curatora pplication does not exist";
static MSG_MEMBER_NO_LONGER_REGISTRABLE_AS_CURATOR: &str =
    "Member no longer registrable as curator";
static MSG_CURATOR_DOES_NOT_EXIST: &str = 
    "Curator does not exist";

/// The exit stage of a lead involvement in the working group.
#[derive(Encode, Decode, Debug, Clone)]
pub struct ExitedLeadRole<BlockNumber> {

    /// When exit was initiated.
    pub initiated_at_block_number: BlockNumber
}

/// The stage of the involvement of a lead in the working group.
#[derive(Encode, Decode, Debug, Clone)]
pub enum LeadRoleState<BlockNumber> {

    /// Currently active.
    Active,

    /// No longer active, for some reason
    Exited(ExitedLeadRole<BlockNumber>)
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
    pub stage: LeadRoleState<BlockNumber>
}

/// Origin of exit initiation on behalf of a curator.'
#[derive(Encode, Decode, Debug, Clone)]
pub enum CuratorExitInitiationOrigin {

    /// Lead is origin.
    Lead,

    /// The curator exiting is the origin.
    Curator
}

/// The exit stage of a curators involvement in the working group.
#[derive(Encode, Decode, Debug, Clone)]
pub struct ExitedCuratorRoleStage<BlockNumber> {

    /// Origin for exit.
    pub origin: CuratorExitInitiationOrigin,

    /// When exit was initiated.
    pub initiated_at_block_number: BlockNumber,

    /// Explainer for why exit was initited.
    pub rationale_text: Vec<u8>
}

/// The stage of the involvement of a curator in the working group.
#[derive(Encode, Decode, Debug, Clone)]
pub enum CuratorRoleStage<BlockNumber> {

    /// Currently active.
    Active,

    /// No longer active, for some reason
    Exited(ExitedCuratorRoleStage<BlockNumber>)
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
    pub at_block: BlockNumber
}

impl< 
    LeadId: Clone, 
    CuratorApplicationId: Clone,
    BlockNumber: Clone
>
CuratorInduction
<
    LeadId,
    CuratorApplicationId,
    BlockNumber
> {
    pub fn new(
    lead: &LeadId,
    curator_application_id: &CuratorApplicationId,
    at_block: &BlockNumber) -> Self {

        CuratorInduction {
            lead: (*lead).clone(),
            curator_application_id: (*curator_application_id).clone(),
            at_block: (*at_block).clone()
        }
    }
}

/// Working group participant: curator
/// This role can be staked, have reward and be inducted through the hiring module.
#[derive(Encode, Decode, Default, Debug, Clone)]
pub struct Curator<AccountId, RewardRelationshipId, StakeId, BlockNumber, LeadId, CuratorApplicationId> {

    /// Account used to authenticate in this role,
    pub role_account: AccountId,

    /// Whether the role has recurring reward, and if so an identifier for this.
    pub reward_relationship: Option<RewardRelationshipId>,

    /// Whether participant is staked, and if so, the identifier for this staking in the staking module.
    pub stake: Option<StakeId>,

    /// The stage of this curator in the working group.
    pub stage: CuratorRoleStage<BlockNumber>,

    /// How the curator was inducted into the working group.
    pub induction: CuratorInduction<LeadId, CuratorApplicationId, BlockNumber>,

    /// Whether this curator can unilaterally alter the curation status of a channel.
    pub can_update_channel_curation_status: bool
}

impl<
    AccountId: Clone,
    RewardRelationshipId: Clone,
    StakeId: Clone,
    BlockNumber: Clone,
    LeadId: Clone,
    ApplicationId: Clone
    > 
    Curator<
        AccountId,
        RewardRelationshipId,
        StakeId,
        BlockNumber,
        LeadId,
        ApplicationId
        > {

    pub fn new(
        role_account: &AccountId,
        reward_relationship: &Option<RewardRelationshipId>,
        stake: &Option<StakeId>,
        stage: &CuratorRoleStage<BlockNumber>,
        induction: &CuratorInduction<LeadId, ApplicationId, BlockNumber>,
        can_update_channel_curation_status: bool) -> Self {

        Curator {
            role_account: (*role_account).clone(),
            reward_relationship: (*reward_relationship).clone(),
            stake: (*stake).clone(),
            stage: (*stage).clone(),
            induction: (*induction).clone(),
            can_update_channel_curation_status: can_update_channel_curation_status
        }
    }

}

/// An opening for a curator role.
#[derive(Encode, Decode, Default, Debug, Clone)]
pub struct CuratorOpening<OpeningId, BlockNumber, Balance, CuratorApplicationId: core::cmp::Ord> {

    /// Identifer for underlying opening in the hiring module.
    pub opening_id: OpeningId,

    /// Set of identifiers for curator applications
    pub curator_applications: BTreeSet<CuratorApplicationId>,

    /// Commitment to policies in opening.
    pub policy_commitment: OpeningPolicyCommitment<BlockNumber, Balance>

    /*
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

impl<
    AccountId: Clone,
    CuratorOpeningId: Clone,
    MemberId: Clone, 
    ApplicationId: Clone
    >
    CuratorApplication<
        AccountId,
        CuratorOpeningId,
        MemberId,
        ApplicationId
        > {

    pub fn new(role_account: &AccountId, curator_opening_id: &CuratorOpeningId, member_id: &MemberId, application_id: &ApplicationId) -> Self {

        CuratorApplication {
            role_account: (*role_account).clone(),
            curator_opening_id: (*curator_opening_id).clone(),
            member_id: (*member_id).clone(),
            application_id: (*application_id).clone()
        }
    }
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
    Ebook
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
    NotPublished
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
#[derive(Encode, Decode, Debug, Clone, PartialEq)]
pub enum ChannelCurationStatus {
    Normal,
    Censored
}

/// Must be default constructible because it indirectly is a value in a storage map.
/// ***SHOULD NEVER ACTUALLY GET CALLED, IS REQUIRED TO DUE BAD STORAGE MODEL IN SUBSTRATE***
impl Default for ChannelCurationStatus {

    fn default() -> Self {
        ChannelCurationStatus::Normal
    }
}

/// A channel for publishing content.
#[derive(Encode, Decode, Default, Debug, Clone, PartialEq)]
pub struct Channel<MemberId, AccountId, BlockNumber> {

    /// Unique human readble channel name.
    pub channel_name: Vec<u8>, 

    /// Whether channel has been verified, in the normal Web2.0 platform sense of being authenticated.
    pub verified: bool,

    /// Human readable description of channel purpose and scope.
    pub description: Vec<u8>,

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
    pub created: BlockNumber

}

/*
 * END: =========================================================
 * Channel stuff
 */

/// The types of built in credential holders.
#[derive(Encode, Decode, Debug, Clone)]
pub enum BuiltInCredentialHolder {

    /// Cyrrent working group lead.
    Lead,
    
    /// Any active urator in the working group.
    AnyCurator,

    /// Any active member in the membership registry.
    AnyMember
}

/// Holder of dynamic credential.
#[derive(Encode, Decode, Debug, Clone)]
pub enum DynamicCredentialHolder<CuratorId: Ord, ChannelId> {

    /// Sets of curators.
    Curators(BTreeSet<CuratorId>),

    /// Owner of a channel.
    ChannelOwner(ChannelId),
}

/// Must be default constructible because it indirectly is a value in a storage map.
/// ***SHOULD NEVER ACTUALLY GET CALLED, IS REQUIRED TO DUE BAD STORAGE MODEL IN SUBSTRATE***
impl<CuratorId: Ord, ChannelId> Default for DynamicCredentialHolder<CuratorId, ChannelId> {

    fn default() -> Self {
        DynamicCredentialHolder::Curators(BTreeSet::new())
    }
}

/// Represents credential for authenticating as "the current lead".
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Debug, Clone, Default)]
pub struct LeadCredential {

    /// Whether it is currently possible to authenticate with this credential.
    pub is_active: bool
}

/// Represents credential for authenticating as "any curator".
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Debug, Clone, Default)]
pub struct AnyCuratorCredential {

    /// Whether it is currently possible to authenticate with this credential.
    pub is_active: bool
}

/// Represents credential for authenticating as "any member".
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Debug, Clone, Default)]
pub struct AnyMemberCredential {

    /// Whether it is currently possible to authenticate with this credential.
    pub is_active: bool
}

/// Represents credential to be referenced from the version store.
/// It is dynamic in the sense that these can be created on the fly.
#[derive(Encode, Decode, Default, Debug, Clone)]
pub struct DynamicCredential<CuratorId: Ord, ChannelId, BlockNumber> {

    /// Who holds this credential, meaning they can successfully authenticate with this credential.
    pub holder: DynamicCredentialHolder<CuratorId, ChannelId>,

    /// Whether it is currently possible to authenticate with this credential.
    pub is_active: bool,

    /// When it was created.
    pub created: BlockNumber,

    /// Human readable description of credential.
    pub description: Vec<u8>
}

/// Terms for slashings applied to a given role
#[derive(Encode, Decode, Debug, Clone, PartialEq, Eq)]
pub struct SlashableTerms {

    /// Maximum number of slashes.
    pub max_count: u16,

    /// Maximum percentage points of remaining stake which may be slashed in a single slash.
    pub max_percent_pts_per_time: u16
}

/// Terms for what slashing can be applied in some context
#[derive(Encode, Decode, Debug, Clone, PartialEq, Eq)]
pub enum SlashingTerms {
    Unslashable,
    Slashable(SlashableTerms)
}

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
    pub exit_curator_rolerole_stake_unstaking_period: Option<BlockNumber>

}

/// Represents 
#[derive(Encode, Decode, Debug, Eq, PartialEq, Clone, PartialOrd)]
pub enum WorkingGroupActor<T: Trait> {

    ///
    Lead(LeadId<T>),

    ///
    Curator(CuratorId<T>),
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

struct WrappedError<E> { // can this be made generic, or does that undermine the whole orhpan rule spirit?
    pub error: E
}

/// ....
macro_rules! ensure_on_wrapped_error {
    ($call:expr) => {{

        {$call}.map_err(|err| WrappedError{error: err})

    }};
}

// Add macro here to make this 
//derive_from_impl(hiring::BeginAcceptingApplicationsError)
//derive_from_impl(hiring::BeginAcceptingApplicationsError)

impl rstd::convert::From<WrappedError<hiring::BeginAcceptingApplicationsError>> for &str {
    fn from(wrapper: WrappedError<hiring::BeginAcceptingApplicationsError>) -> Self {
       
       match wrapper.error {
            hiring::BeginAcceptingApplicationsError::OpeningDoesNotExist => "Opening does not exist",
            hiring::BeginAcceptingApplicationsError::OpeningIsNotInWaitingToBeginStage => "Opening Is Not in Waiting"
       }
    }
}

impl rstd::convert::From<WrappedError<hiring::AddOpeningError>> for &str {
    fn from(wrapper: WrappedError<hiring::AddOpeningError>) -> Self {
       
       match wrapper.error {
            hiring::AddOpeningError::OpeningMustActivateInTheFuture => "Opening must activate in the future",
            hiring::AddOpeningError::StakeAmountLessThanMinimumCurrencyBalance(purpose) => {
                match purpose {
                    hiring::StakePurpose::Role => "Role stake amount less than minimum currency balance",
                    hiring::StakePurpose::Application => "Application stake amount less than minimum currency balance"
                }
            }
       }
    }
}

impl rstd::convert::From<WrappedError<hiring::BeginReviewError>> for &str {
    fn from(wrapper: WrappedError<hiring::BeginReviewError>) -> Self {
       
       match wrapper.error {
            hiring::BeginReviewError::OpeningDoesNotExist => "Opening does not exist",
            hiring::BeginReviewError::OpeningNotInAcceptingApplicationsStage => "Opening not in accepting applications stage"
       }
    }
}

impl<T: hiring::Trait> rstd::convert::From<WrappedError<hiring::FillOpeningError<T>>> for &str {
    fn from(wrapper: WrappedError<hiring::FillOpeningError<T>>) -> Self {
       
       match wrapper.error {
            hiring::FillOpeningError::<T>::OpeningDoesNotExist => "OpeningDoesNotExist",
            hiring::FillOpeningError::<T>::OpeningNotInReviewPeriodStage => "OpeningNotInReviewPeriodStage",
            hiring::FillOpeningError::<T>::UnstakingPeriodTooShort(stake_purpose, outcome_in_filled_opening) => {

                match stake_purpose {
                    hiring::StakePurpose::Application => {

                        match outcome_in_filled_opening {
                            hiring::ApplicationOutcomeInFilledOpening::Success => "Application stake unstaking period for successful applicants too short",
                            hiring::ApplicationOutcomeInFilledOpening::Failure => "Application stake unstaking period for failed applicants too short",
                        }
                    },
                    hiring::StakePurpose::Role => {

                        match outcome_in_filled_opening {
                            hiring::ApplicationOutcomeInFilledOpening::Success => "Role stake unstaking period for successful applicants too short",
                            hiring::ApplicationOutcomeInFilledOpening::Failure => "Role stake unstaking period for failed applicants too short",
                        }
                    }
                }
            },
            hiring::FillOpeningError::<T>::RedundantUnstakingPeriodProvided(stake_purpose, outcome_in_filled_opening) => {

                match stake_purpose {
                    hiring::StakePurpose::Application => {

                        match outcome_in_filled_opening {
                            hiring::ApplicationOutcomeInFilledOpening::Success => "Application stake unstaking period for successful applicants redundant",
                            hiring::ApplicationOutcomeInFilledOpening::Failure => "Application stake unstaking period for failed applicants redundant",
                        }
                    },
                    hiring::StakePurpose::Role => {

                        match outcome_in_filled_opening {
                            hiring::ApplicationOutcomeInFilledOpening::Success => "Role stake unstaking period for successful applicants redundant",
                            hiring::ApplicationOutcomeInFilledOpening::Failure => "Role stake unstaking period for failed applicants redundant",
                        }
                    }
                }
            },
            hiring::FillOpeningError::<T>::ApplicationDoesNotExist(_application_id) => "ApplicationDoesNotExist",
            hiring::FillOpeningError::<T>::ApplicationNotInActiveStage(_application_id) => "ApplicationNotInActiveStage"
       }
    }
}

impl rstd::convert::From<WrappedError<hiring::DeactivateApplicationError>> for &str {
    fn from(wrapper: WrappedError<hiring::DeactivateApplicationError>) -> Self {
       
       match wrapper.error {
            hiring::DeactivateApplicationError::ApplicationDoesNotExist => "ApplicationDoesNotExist",
            hiring::DeactivateApplicationError::ApplicationNotActive => "ApplicationNotActive",
            hiring::DeactivateApplicationError::OpeningNotAcceptingApplications => "OpeningNotAcceptingApplications",
            hiring::DeactivateApplicationError::UnstakingPeriodTooShort(_stake_purpose) => "UnstakingPeriodTooShort ...",
            hiring::DeactivateApplicationError::RedundantUnstakingPeriodProvided(_stake_purpose) => "RedundantUnstakingPeriodProvided ..."
       }
    }
}

impl rstd::convert::From<WrappedError<members::ControllerAccountForMemberCheckFailed>> for &str {
    fn from(wrapper: WrappedError<members::ControllerAccountForMemberCheckFailed>) -> Self {
       
       match wrapper.error {
            members::ControllerAccountForMemberCheckFailed::NotMember => "Is not a member",
            members::ControllerAccountForMemberCheckFailed::NotControllerAccount => "Account is not controller account of member",
       }
    }
}

impl rstd::convert::From<WrappedError<hiring::AddApplicationError>> for &str {
    fn from(wrapper: WrappedError<hiring::AddApplicationError>) -> Self {
       
       match wrapper.error {
            hiring::AddApplicationError::OpeningDoesNotExist => "OpeningDoesNotExist",
            hiring::AddApplicationError::StakeProvidedWhenRedundant(_stake_purpose) => "StakeProvidedWhenRedundant ...",
            hiring::AddApplicationError::StakeMissingWhenRequired(_stake_purpose) => "StakeMissingWhenRequired ...",
            hiring::AddApplicationError::StakeAmountTooLow(_stake_purpose) => "StakeAmountTooLow ...",
            hiring::AddApplicationError::OpeningNotInAcceptingApplicationsStage => "OpeningNotInAcceptingApplicationsStage",
            hiring::AddApplicationError::NewApplicationWasCrowdedOut => "NewApplicationWasCrowdedOut"
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

        // The set of active openings.
        // This must be maintained to effectively enforce 
        // `MaxSimultaneouslyActiveOpenings`.
        // pub ActiveOpenings get(openings) config(): BTreeSet<T::OpeningId>;

        /// Maps identifier to corresponding channel.
        pub ChannelById get(channel_by_id) config(): linked_map ChannelId<T> => Channel<T::MemberId, T::AccountId, T::BlockNumber>;

        /// Identifier to be used by the next channel introduced.
        pub NextChannelId get(next_channel_id) config(): ChannelId<T>;

        /// Maps (unique+immutable) channel handle to the corresponding identifier for the channel.
        /// Mapping is required to allow efficient (O(log N)) on-chain verification that a proposed handle is indeed unique 
        /// at the time it is being proposed.
        pub ChannelIdByName get(channel_id_by_handle) config(): linked_map Vec<u8> => ChannelId<T>;

        /// Maps identifier to corresponding curator.
        pub CuratorById get(curator_by_id) config(): linked_map CuratorId<T> => Curator<T::AccountId, T::RewardRelationshipId, T::StakeId, T::BlockNumber, LeadId<T>, CuratorApplicationId<T>>;
        
        /// Next identifier for new curator.
        pub NextCuratorId get(next_curator_id) config(): CuratorId<T>;

        /// The set of ids for currently active curators.
        pub ActiveCuratorIds get(active_curator_ids) config(): BTreeSet<CuratorId<T>>;

        /// Credentials for built in roles.
        pub CredentialOfLead get(credential_of_lead) config(): LeadCredential;

        /// The "any curator" credential.
        pub CredentialOfAnyCurator get(credential_of_anycurator) config(): AnyCuratorCredential;

        /// The "any member" credential.
        pub CredentialOfAnyMember get(credential_of_anymember) config(): AnyMemberCredential;

        /// Maps dynamic credential by
        pub DynamicCredentialById get(dynamic_credential_by_id) config(): linked_map DynamicCredentialId<T> => DynamicCredential<CuratorId<T>, ChannelId<T>, T::BlockNumber>;

        /// ...
        pub NextDynamicCredentialId get(next_dynamic_credential_id) config(): DynamicCredentialId<T>;

        /// Whether it is currently possible to create a channel via `create_channel` extrinsic.
        pub ChannelCreationEnabled get(channel_creation_enabled) config(): bool;

        // Limits
        
        /// Limits the total number of curators which can be active.

        // Limits the total number of openings which are not yet deactivated.
        // pub MaxSimultaneouslyActiveOpenings get(max_simultaneously_active_openings) config(): Option<u16>,

        // Vector length input guards

        pub ChannelHandleConstraint get(channel_handle_constraint) config(): InputValidationLengthConstraint;
        pub ChannelDescriptionConstraint get(channel_description_constraint) config(): InputValidationLengthConstraint;
        pub OpeningHumanReadableText get(opening_human_readble_text) config(): InputValidationLengthConstraint;
    }
}

/*
TODO 
- building issues: <=== done!!

- redo extrinsics so hiring: routine isguard, and we converterro to strings thoruhg
helper orutines. That way we do not need to replicate guards here? 
   - step 0: just do it with simple "ERR" for every case. 
   - step 1: later

- Introduce CuratorOpening class with time bounds, which is instantiated in add_opening, which also
needs checks for validation.



- Implement permissions model & checker in sensible way.

- Impl curation & channel editing (as curator and owner) in sensible way.

- step 1: add actual mapper for real error messages.

*/

decl_event! {
    pub enum Event<T> where
        ChannelId = ChannelId<T>,
        LeadId = LeadId<T>,
        CuratorOpeningId = CuratorOpeningId<T>,
        CuratorApplicationId = CuratorApplicationId<T>
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
        TerminatedCurator(CuratorOpeningId),
        AppliedOnCuratorOpening(CuratorOpeningId, CuratorApplicationId),
        //CuratorRewardUpdated
        //CuratorRoleAccountUpdated
        //CuratorRewardAccountUpdated
        //CuratorExited
    }
}

decl_module! {
    pub struct Module<T: Trait> for enum Call where origin: T::Origin {

        fn deposit_event() = default;

        /*
         * Channel management
         */

        /// Create a new channel.
        pub fn create_channel(origin, owner: T::MemberId, role_account: T::AccountId, channel_name: Vec<u8>, description: Vec<u8>, content: ChannelContentType) {

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

            // Ensure handle is acceptable length
            Self::ensure_channel_handle_is_valid(&channel_name)?;

            // Ensure description is acceptable length
            Self::ensure_channel_description_is_valid(&description)?;

            //
            // == MUTATION SAFE ==
            //

            // Construct channel
            let new_channel = Channel {
                channel_name: channel_name.clone(), 
                verified: false,
                description: description,
                content: content,
                owner: owner,
                role_account: role_account,
                publishing_status: ChannelPublishingStatus::NotPublished,
                curation_status: ChannelCurationStatus::Normal,
                created: <system::Module<T>>::block_number()
            };

            // Add channel to ChannelById under id
            ChannelById::<T>::insert(next_channel_id, new_channel);

            // Add id to ChannelIdByName under handle
            ChannelIdByName::<T>::insert(channel_name.clone(), next_channel_id);

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

            // Ensure that it is signed
            let signer_account = ensure_signed(origin)?;

            // Ensure channel id is valid
            let channel = Self::ensure_channel_id_is_valid(channel_id)?;

            // Ensure origin matches channel role account
            ensure!(
                signer_account == channel.role_account,
                MSG_ORIGIN_DOES_NOT_MATCH_CHANNEL_ROLE_ACCOUNT
            );

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

        /// Update channel curation status of a channel.
        /// 
        /// Can 
        pub fn update_channel_curation_status(_origin) {

            // WorkingGroupActor

        }

        /*
         * Credential management for versioned store permissions.
         * 
         * Lead credential is managed as non-dispatchable.
         */

        pub fn update_any_member_credential(_origin) {
            
        }

        pub fn update_any_curator_credential(_origin) {
            
        }

        pub fn create_dynamic_credential(_origin) {

        }

        pub fn update_dynamic_credential(_origin) {

        }

        /// ...
        pub fn update_channel_as_owner(_origin) {

        }

        /// ...
        pub fn update_channel_as_curator(_origin) {

        }

        /// ..
        pub fn create_version_store_credential(_origin)  {


        }

        /// Add an opening for a curator role.
        pub fn add_curator_opening(origin, activate_at: hiring::ActivateOpeningAt<T::BlockNumber>, commitment: OpeningPolicyCommitment<T::BlockNumber, BalanceOf<T>>, human_readable_text: Vec<u8>)  {

            // Ensure lead is set and is origin signer
            Self::ensure_origin_is_set_lead(origin)?;

            // Validate activate_at
            //Self::ensure_activate_opening_at_valid(&activate_at)?;

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
                let role_stake = application.active_role_staking_id;

                // Construct curator
                let curator = Curator::new(
                    &(successful_curator_application.role_account),
                    &reward_relationship, 
                    &role_stake,
                    &CuratorRoleStage::Active,
                    &CuratorInduction::new(&lead_id, &id, &current_block),
                    false
                );

                // Get curator id
                let new_curator_id = NextCuratorId::<T>::get();

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

        pub fn withdraw_curator_application(_origin) {

        }

        /// Lead terminate curator application
        pub fn terminate_curator_application(
            origin,
            curator_application_id: CuratorApplicationId<T>
            ) {
            /*
            // Ensure lead is set and is origin signer
            Self::ensure_origin_is_set_lead(origin)?;

            // Ensuring curator application actually exists
            let (curator_application, _, curator_opening) = Self::ensure_curator_application_exists(&curator_application_id)?;

            // when is tha ppliation actually removed from the curator opening?????
            // it may not be possible to do right away if ther eis unstaking?
            // so we have to wait?

            
            // **************************************** //

            
            // Attempt to deactive applications
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
            Self::deposit_event(RawEvent::TerminatedCurator(curator_application_id));

            */
        }

        /// ...
        pub fn apply_on_curator_opening(_origin) {

            /*
            pub fn add_application(
                opening_id: T::OpeningId,
                opt_role_stake_imbalance: Option<NegativeImbalance<T>>,
                opt_application_stake_imbalance: Option<NegativeImbalance<T>>,
                human_readable_text: Vec<u8>,
            ) -> Result<ApplicationAdded<T::ApplicationId>, AddApplicationError> {
            */

        }

        /// ...
        pub fn update_curator_role_account(_origin) {


        }

        /// ...
        pub fn update_curator_reward_account(_origin) {

        }

        /// ...
        pub fn exit_curator_role(_origin) {

            /*
            pub fn deactive_application(
                application_id: T::ApplicationId,
                application_stake_unstaking_period: Option<T::BlockNumber>,
                role_stake_unstaking_period: Option<T::BlockNumber>,
            ) -> Result<(), DeactivateApplicationError> {
            */

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
        
        /// ...
        pub fn account_is_in_group(_origin) {

        }

        /// ..
        pub fn update_lead_credential(_origin) {

        }

    }
}

/*
 *  ======== ======== ======== ======== =======
 *  ======== PRIVATE TYPES AND METHODS ========
 *  ======== ======== ======== ======== =======

/// ...
enum Credential<CuratorId: Ord, ChannelId, BlockNumber> {
    Lead(LeadCredential),
    AnyCurator(AnyCuratorCredential),
    AnyMember(AnyMemberCredential),
    Dynamic(DynamicCredential<CuratorId, ChannelId, BlockNumber>)
}

/// Holder of a credential.
enum CredentialHolder<DynamicCredentialId> {

    /// Built in credential holder.
    BuiltInCredentialHolder(BuiltInCredentialHolder),

    /// A possible dynamic credendtial holder.
    CandidateDynamicCredentialId(DynamicCredentialId)
}

impl<T: Trait> Module<T> {

    /// Maps a permission module credential identifier to a credential holder.
    /// 
    /// **CRITICAL**: 
    /// 
    /// Credential identifiers are stored in the permissions module, this means that
    /// the mapping in this function _must_ not disturb how it maps any id that is actually in use
    /// across runtime upgrades, _unless_ one is also prepared to make the corresponding migrations
    /// in the permissions module. Best to keep mapping stable.
    /// 
    /// In practice the only way one may want augment this map is to support new
    /// built in credentials. In this case, the mapping has to be written and deployed while
    /// no new dynamic credentials are created, and a new case of the form below must be introcued
    /// in the match: CandidateDynamicCredentialId(credential_id - X), where X = #ChannelIds mapped so far.
    fn credential_id_to_holder(credential_id: T::PrincipalId) -> CredentialHolder<DynamicCredentialId<T>> {

        // Credential identifiers for built in credential holder types.
        let LEAD_CREDENTIAL_ID = T::PrincipalId::from(0);
        let ANY_CURATOR_CREDENTIAL_ID = T::PrincipalId::from(1);
        let ANY_MEMBER_CREDENTIAL_ID = T::PrincipalId::from(2);

        match credential_id {

            LEAD_CREDENTIAL_ID => CredentialHolder::BuiltInCredentialHolder(BuiltInCredentialHolder::Lead),
            ANY_CURATOR_CREDENTIAL_ID => CredentialHolder::BuiltInCredentialHolder(BuiltInCredentialHolder::AnyCurator),
            ANY_MEMBER_CREDENTIAL_ID => CredentialHolder::BuiltInCredentialHolder(BuiltInCredentialHolder::AnyMember),
            _ => CredentialHolder::CandidateDynamicCredentialId(credential_id - T::PrincipalId::from(3)) // will map first dynamic id to 0

            /*
            Add new built in credentials here below
            */
        }
    }
    
    /// .
    fn credential_from_id(credential_id: T::PrincipalId) -> Option<DynamicCredential<T::CuratorId, ChannelId, T::BlockNumber>> {

        //let  = credential_id_to_built_in_credential_holder(credential_id);

        // 2. 


        None
    }
    
}
*/

impl<T: Trait> Module<T> {

    fn ensure_can_register_role_on_member(
        member_id: &T::MemberId,
        role: role_types::Role,
        actor_id: &ActorIdInMembersModule<T>,
     ) -> Result< members::ActorInRole<ActorIdInMembersModule<T>>, &'static str>{

        let new_actor_in_role = role_types::ActorInRole::new(role, *actor_id);

        <members::Module<T>>::can_register_role_on_member(member_id, &new_actor_in_role).map(|_| new_actor_in_role)    
    }

    fn ensure_can_register_curator_role_on_member(member_id: &T::MemberId) -> Result<(members::ActorInRole<ActorIdInMembersModule<T>>, CuratorId<T>), &'static str>{

        let next_id = <NextCuratorId<T>>::get();

        Self::ensure_can_register_role_on_member(member_id, role_types::Role::Curator, &next_id)
        .map(|curator_in_role| (curator_in_role, next_id))
    }

    fn ensure_can_register_channel_owner_role_on_member(member_id: &T::MemberId, opt_channel_id: Option<ChannelId<T>>) -> Result< (members::ActorInRole<ActorIdInMembersModule<T>>, CuratorId<T>), &'static str> {

        let next_channel_id =  opt_channel_id.unwrap_or(NextChannelId::<T>::get());

        Self::ensure_can_register_role_on_member(member_id, role_types::Role::ChannelOwner, &next_channel_id)
        .map(|member_in_role| (member_in_role, next_channel_id))
    }

    // TODO: convert InputConstraint ensurer routines into macroes

    fn ensure_channel_handle_is_valid(handle: &Vec<u8>) -> dispatch::Result {
        ChannelHandleConstraint::get().ensure_valid(
            handle.len(),
            MSG_CHANNEL_HANDLE_TOO_SHORT,
            MSG_CHANNEL_HANDLE_TOO_LONG,
        )
    }

    fn ensure_channel_description_is_valid(description: &Vec<u8>) -> dispatch::Result {
        ChannelDescriptionConstraint::get().ensure_valid(
            description.len(),
            MSG_CHANNEL_DESCRIPTION_TOO_SHORT,
            MSG_CHANNEL_DESCRIPTION_TOO_LONG,
        )
    }

    fn ensure_opening_human_readable_text_is_valid(text: &Vec<u8>) -> dispatch::Result {
        ChannelDescriptionConstraint::get().ensure_valid(
            text.len(),
            MSG_CHANNEL_DESCRIPTION_TOO_SHORT,
            MSG_CHANNEL_DESCRIPTION_TOO_LONG,
        )
    }

    fn ensure_channel_id_is_valid(channel_id: ChannelId<T>) -> Result<Channel<T::MemberId, T::AccountId, T::BlockNumber>,&'static str> {

        if ChannelById::<T>::exists(channel_id) {

            let channel = ChannelById::<T>::get(channel_id);

            Ok(channel)
        } else {
            Err(MSG_CHANNEL_ID_INVALID)
        }
    }

    fn ensure_lead_is_set() -> Result<(LeadId<T>, Lead<T::AccountId, T::RewardRelationshipId, T::BlockNumber>), &'static str>{

        // Ensure lead id is set
        let lead_id = Self::ensure_lead_id_set()?;

        // If so, grab actual lead
        let lead = <LeadById<T>>::get(lead_id);

        // and return both
        Ok((lead_id, lead))
    }

    fn ensure_lead_id_set() -> Result<LeadId<T>,&'static str> {

        let opt_current_lead_id = <CurrentLeadId<T>>::get();

        if let Some(lead_id) = opt_current_lead_id {
            Ok(lead_id)
        } else {
            Err(MSG_CURRENT_LEAD_NOT_SET)
        }
    }

    fn ensure_origin_is_set_lead(origin: T::Origin) -> Result<(LeadId<T>, Lead<T::AccountId, T::RewardRelationshipId, T::BlockNumber>), &'static str>{

        // Ensure lead is actually set
        let (lead_id, lead) = Self::ensure_lead_is_set()?;
        
        // Ensure is signed
        let signer = ensure_signed(origin)?;

        // Ensure signer is lead
        ensure!(
            signer == lead.role_account,
            MSG_ORIGIN_IS_NOT_LEAD
        );

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
    fn ensure_curator_opening_exists(curator_opening_id: &CuratorOpeningId<T>) -> Result<(CuratorOpening<T::OpeningId, T::BlockNumber, BalanceOf<T>, CuratorApplicationId<T>> ,hiring::Opening<BalanceOf<T>, T::BlockNumber, <T as hiring::Trait>::ApplicationId>), &'static str> {

        ensure!(
            CuratorOpeningById::<T>::exists(curator_opening_id),
            MSG_CURATOR_OPENING_DOES_NOT_EXIST
        );

        let curator_opening = CuratorOpeningById::<T>::get(curator_opening_id);

        let opening = hiring::OpeningById::<T>::get(curator_opening.opening_id);

        Ok((curator_opening, opening))
    }

    fn ensure_curator_exists(curator_id: &CuratorId<T>) -> Result<Curator<T::AccountId, T::RewardRelationshipId, T::StakeId, T::BlockNumber, LeadId<T>, T::ApplicationId>, &'static str> {

        ensure!(
            CuratorById::<T>::exists(curator_id),
            MSG_CURATOR_DOES_NOT_EXIST
        );

        let curator = CuratorById::<T>::get(curator_id);

        Ok(curator)
    }

    fn ensure_curator_application_exists(curator_application_id: &CuratorApplicationId<T>) -> Result<(
        CuratorApplication<T::AccountId, CuratorOpeningId<T>, T::MemberId, T::ApplicationId>, 
        CuratorApplicationId<T>,
        CuratorOpening<T::OpeningId, T::BlockNumber, BalanceOf<T>, CuratorApplicationId<T>>), &'static str> {
    
        //Result<(hiring::Application<<T as hiring::Trait>::OpeningId, T::BlockNumber, <T as stake::Trait>::StakeId>, CuratorOpening<T::OpeningId, T::BlockNumber, BalanceOf<T>, CuratorApplicationId<T>> ,hiring::Opening<BalanceOf<T>, T::BlockNumber, <T as hiring::Trait>::ApplicationId>), &'static str> {

        ensure!(
            CuratorApplicationById::<T>::exists(curator_application_id),
            MSG_CURATOR_APPLICATION_DOES_NOT_EXIST
        );

        let curator_application = CuratorApplicationById::<T>::get(curator_application_id);

        //let application = hiring::ApplicationById::<T>::get(curator_application.application_id);

        let curator_opening = CuratorOpeningById::<T>::get(curator_application.curator_opening_id);

        //let opening = hiring::OpeningById::<T>::get(curator_opening.opening_id);

        Ok((curator_application, curator_application_id.clone(), curator_opening))
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
        source_account: &T::AccountId) -> Result<(), &'static str> {

        let zero_balance = <BalanceOf<T> as Zero>::zero();

        // Total amount to be staked
        let total_amount = opt_balances
        .iter()
        .fold(zero_balance, |sum, opt_balance| {

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
                new_balance
            )

        } else {
            Ok(())
        }

    }

    fn make_stake_opt_imbalance(opt_balance: &Option<BalanceOf<T>>, source_account: &T::AccountId) -> Option<NegativeImbalance<T>> {

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
}
