// Ensure we're `no_std` when compiling for Wasm.
#![cfg_attr(not(feature = "std"), no_std)]

#[cfg(feature = "std")]
use serde::{Deserialize, Serialize};

use codec::{Codec, Decode, Encode};
//use rstd::collections::btree_map::BTreeMap;
use rstd::collections::btree_set::BTreeSet;
use rstd::prelude::*;
use srml_support::traits::Currency;
use srml_support::{
    decl_module, decl_storage, decl_event, ensure, StorageMap, StorageValue, Parameter
};
use runtime_primitives::traits::{Member, One, SimpleArithmetic, MaybeSerialize};
use minting;
use recurringrewards;
use stake;
use hiring;
use versioned_store_permissions;
use super::super::membership::members as membership;

/// Module configuration trait for this Substrate module.
pub trait Trait: system::Trait + minting::Trait + recurringrewards::Trait + stake::Trait + hiring::Trait + versioned_store_permissions::Trait + membership::Trait + Sized {

    /// The event type.
    type Event: From<Event<Self>> + Into<<Self as system::Trait>::Event>;

    /// Type for identifier for lead.
    type LeadId: Parameter
        + Member
        + SimpleArithmetic
        + Codec
        + Default
        + Copy
        + MaybeSerialize
        + PartialEq;

    /// Type for identifier for curators.
    type CuratorId: Parameter
        + Member
        + SimpleArithmetic
        + Codec
        + Default
        + Copy
        + MaybeSerialize
        + PartialEq
        + Ord;

    /// Type for identifier for channels.
    type ChannelId: Parameter
        + Member
        + SimpleArithmetic
        + Codec
        + Default
        + Copy
        + MaybeSerialize
        + PartialEq;
}

/// Type for identifier for dynamic version store credential.
pub type DynamicCredentialId<T: Trait> = T::PrincipalId;

/// Balance type of runtime
pub type BalanceOf<T> =
    <<T as stake::Trait>::Currency as Currency<<T as system::Trait>::AccountId>>::Balance;

/// Negative imbalance of runtime.
pub type NegativeImbalance<T> =
    <<T as stake::Trait>::Currency as Currency<<T as system::Trait>::AccountId>>::NegativeImbalance;

/// The exit stage of a lead involvement in the working group.
#[derive(Encode, Decode, Debug, Eq, PartialEq, Clone, PartialOrd)]
pub struct ExitedLeadRole<BlockNumber> {

    /// When exit was initiated.
    pub initiated_at_block_number: BlockNumber
}

/// The stage of the involvement of a lead in the working group.
#[derive(Encode, Decode, Debug, Eq, PartialEq, Clone, PartialOrd)]
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
#[derive(Encode, Decode, Default, Debug, Eq, PartialEq, Clone, PartialOrd)]
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
#[derive(Encode, Decode, Debug, Eq, PartialEq, Clone, PartialOrd)]
pub enum CuratorExitInitiationOrigin {

    /// Lead is origin.
    Lead,

    /// The curator exiting is the origin.
    Curator
}

/// The exit stage of a curators involvement in the working group.
#[derive(Encode, Decode, Debug, Eq, PartialEq, Clone, PartialOrd)]
pub struct ExitedCuratorRoleStage<BlockNumber> {

    /// Origin for exit.
    pub origin: CuratorExitInitiationOrigin,

    /// When exit was initiated.
    pub initiated_at_block_number: BlockNumber,

    /// Explainer for why exit was initited.
    pub rationale_text: Vec<u8>
}

/// The stage of the involvement of a curator in the working group.
#[derive(Encode, Decode, Debug, Eq, PartialEq, Clone, PartialOrd)]
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
#[derive(Encode, Decode, Default, Debug, Eq, PartialEq, Clone, PartialOrd)]
pub struct CuratorInduction<LeadId, ApplicationId, BlockNumber> {

    /// Lead responsible
    pub lead: LeadId,

    /// Application through which curator was inducted
    pub application: ApplicationId,

    /// When induction occurred
    pub at_block: BlockNumber
}

/// Working group participant: curator
/// This role can be staked, have reward and be inducted through the hiring module.
#[derive(Encode, Decode, Default, Debug, Eq, PartialEq, Clone, PartialOrd)]
pub struct Curator<AccountId, RewardRelationshipId, StakeId, BlockNumber, LeadId, ApplicationId> {

    /// Account used to authenticate in this role,
    pub role_account: AccountId,

    /// Whether the role has recurring reward, and if so an identifier for this.
    pub reward_relationship: Option<RewardRelationshipId>,

    /// Whether participant is staked, and if so, the identifier for this staking in the staking module.
    pub stake: Option<StakeId>,

    /// The stage of this curator in the working group.
    pub stage: CuratorRoleStage<BlockNumber>,

    /// How the curator was inducted into the working group.
    pub induction: CuratorInduction<LeadId, ApplicationId, BlockNumber>,

    /// Whether this curator can unilaterally alter the curation status of a channel.
    pub can_update_channel_curation_status: bool
}

/// Type of channel content.
#[derive(Encode, Decode, Debug, Eq, PartialEq, Clone, PartialOrd)]
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
#[derive(Encode, Decode, Debug, Eq, PartialEq, Clone, PartialOrd)]
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
#[derive(Encode, Decode, Debug, Eq, PartialEq, Clone, PartialOrd)]
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
#[derive(Encode, Decode, Default, Debug, Eq, PartialEq, Clone, PartialOrd)]
pub struct Channel<MemberId, AccountId, BlockNumber> {

    /// Unique human readble channel handle.
    pub handle: Vec<u8>, 

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

/// The types of built in credential holders.
#[derive(Encode, Decode, Debug, Eq, PartialEq, Clone, PartialOrd)]
pub enum BuiltInCredentialHolder {

    /// Cyrrent working group lead.
    Lead,
    
    /// Any active urator in the working group.
    AnyCurator,

    /// Any active member in the membership registry.
    AnyMember
}

/// Holder of dynamic credential.
#[derive(Encode, Decode, Debug, Eq, PartialEq, Clone, PartialOrd)]
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
#[derive(Encode, Decode, Debug, Eq, PartialEq, Clone, PartialOrd, Default)]
pub struct LeadCredential {

    /// Whether it is currently possible to authenticate with this credential.
    pub is_active: bool
}

/// Represents credential for authenticating as "any curator".
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Debug, Eq, PartialEq, Clone, PartialOrd, Default)]
pub struct AnyCuratorCredential {

    /// Whether it is currently possible to authenticate with this credential.
    pub is_active: bool
}

/// Represents credential for authenticating as "any member".
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Debug, Eq, PartialEq, Clone, PartialOrd, Default)]
pub struct AnyMemberCredential {

    /// Whether it is currently possible to authenticate with this credential.
    pub is_active: bool
}

/// Represents credential to be referenced from the version store.
/// It is dynamic in the sense that these can be created on the fly.
#[derive(Encode, Decode, Default, Debug, Eq, PartialEq, Clone, PartialOrd)]
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

/// Policy governing any curator opening which can be made by lead.
/// Be aware that all limits are forward looking in constrainign future extrinsics or method calls.
/// Updating them has no side-effects beyond changing the limit.
#[derive(Encode, Decode, Debug, Eq, PartialEq, Clone, PartialOrd)]
pub struct OpeningPolicy<BlockNumber, StakingPolicy> {

    /// Limits the total number of curators which can be active, or possibly active through an active opening. 
    /// The contribution of an active opening is counted by looking at the rationing policy of the opening.
    /// A limit of N is counted as there being N actual active curators, as a worst case bound.
    /// The absence of a limit is counted as "infinity", thus blocking any further openings from being created,
    /// and is is not possible to actually hire a number of curators that would bring the number above this parameter `curator_limit`.
    pub curator_limit: Option<u16>,

    /// Maximum length of review period of applications
    pub max_review_period_length: BlockNumber,

    /// Staking policy for application
    pub application_staking_policy: Option<StakingPolicy>,

    /// Staking policy for role itself
    pub role_staking_policy: Option<StakingPolicy>
}

/// Represents 
#[derive(Encode, Decode, Debug, Eq, PartialEq, Clone, PartialOrd)]
pub enum WorkingGroupActor<T: Trait> {

    ///
    Lead(T::LeadId),

    ///
    Curator(T::CuratorId),
}

pub enum ChannelActor<T: Trait> {

    ///
    WorkingGroupActor(WorkingGroupActor<T>),

    ///
    Owner
}

decl_storage! {
    trait Store for Module<T: Trait> as ContentWorkingGroup {

        /// The mint currently funding the rewards for this module.
        pub Mint get(mint) config(): <T as minting::Trait>::MintId; 

        /// The current lead.
        pub CurrentLeadId get(current_lead_id) config(): Option<T::LeadId>;

        /// Maps identifier to corresponding lead.
        pub LeadById get(lead_by_id) config(): linked_map T::LeadId => Lead<T::AccountId, T::RewardRelationshipId, T::BlockNumber>;

        /// Next identifier for new current lead.
        pub NextLeadId get(next_lead_id) config(): T::LeadId;

        /// Set of identifiers for all openings originated from this group.
        /// Using map to model a set.
        pub Openings get(openings) config(): linked_map T::OpeningId => ();

        /// Maps identifier to corresponding channel.
        pub ChannelById get(channel_by_id) config(): linked_map T::ChannelId => Channel<T::MemberId, T::AccountId, T::BlockNumber>;

        /// Identifier to be used by the next channel introduced.
        pub NextChannelId get(next_channel_id) config(): T::ChannelId;

        /// Maps (unique+immutable) channel handle to the corresponding identifier for the channel.
        /// Mapping is required to allow efficient (O(log N)) on-chain verification that a proposed handle is indeed unique 
        /// at the time it is being proposed.
        pub ChannelIdByHandle get(channel_id_by_handle) config(): linked_map Vec<u8> => T::ChannelId;

        /// Maps identifier to corresponding curator.
        pub CuratorById get(curator_by_id) config(): linked_map T::CuratorId => Curator<T::AccountId, T::RewardRelationshipId, T::StakeId, T::BlockNumber, T::LeadId, T::ApplicationId>;
        
        /// Next identifier for new curator.
        pub NextCuratorId get(next_curator_id) config(): T::CuratorId;

        /// The constraints lead must respect when creating a new curator opening.
        /// Lack of policy is interpreted as blocking any new openings at all.
        pub OptOpeningPolicy get(opening_policy) config(): Option<OpeningPolicy<T::BlockNumber, hiring::StakingPolicy<BalanceOf<T>, T::BlockNumber>>>;

        /// Credentials for built in roles.
        pub CredentialOfLead get(credential_of_lead) config(): LeadCredential;

        /// The "any curator" credential.
        pub CredentialOfAnyCurator get(credential_of_anycurator) config(): AnyCuratorCredential;

        /// The "any member" credential.
        pub CredentialOfAnyMember get(credential_of_anymember) config(): AnyMemberCredential;

        /// Maps dynamic credential by
        pub DynamicCredentialById get(dynamic_credential_by_id) config(): linked_map DynamicCredentialId<T> => DynamicCredential<T::CuratorId, T::ChannelId, T::BlockNumber>;

        /// ...
        pub NextDynamicCredentialId get(next_dynamic_credential_id) config(): DynamicCredentialId<T>;

        /// Whether it is currently possible to create a channel via `create_channel` extrinsic.
        pub ChannelCreationEnabled get(channel_creation_enabled) config(): bool;


        // Input guards

        // TODO: use proper input constraint types

        /// Upper bound for character length of description field of any new or updated PermissionGroup 
        pub MaxPermissionGroupDescriptionLength get(max_permission_group_description_length) config(): u16;

        /// Upper bound for character length of the rationale_text field of any new CuratorRoleStage.
        pub MaxCuratorExitRationaleTextLength get(max_curator_exit_rationale_text_length) config(): u16;

    }
}

/*
/// Substrate module events.
decl_event! {
    pub enum Event<T> where
      <T as system::Trait>::AccountId,
      <T as Trait>::MemberId,
      <T as Trait>::ActorId, 
      {

        LeadSet
        LeadUnset
        OpeningPolicySet
        LeadRewardUpdated
        LeadRoleAccountUpdated
        LeadRewardAccountUpdated
        PermissionGroupAdded
        PermissionGroupUpdated
        CuratorOpeningAdded
        AcceptedCuratorApplications
        BeganCuratorApplicationReview
        CuratorOpeningFilled
        CuratorSlashed
        TerminatedCurator
        AppliedOnCuratorOpening
        CuratorRewardUpdated
        CuratorRoleAccountUpdated
        CuratorRewardAccountUpdated
        CuratorExited
        
    }
}
*/

decl_event!(
    pub enum Event<T>
    where
        <T as system::Trait>::AccountId,
    {
        MyOtherEvent(AccountId),
    }
);

decl_module! {
    pub struct Module<T: Trait> for enum Call where origin: T::Origin {

        fn deposit_event() = default;

        /*
         * Channel management
         */

        /// Create a new channel.
        pub fn create_channel(origin, handle: Vec<u8>, description: Vec<u8>, content: ChannelContentType, owner: T::MemberId, role_account: T::AccountId) {

            // Ensure is signed by "who".

            // Ensure it is currently possible to create channels (ChannelCreationEnabled).

            // Ensure handle is acceptable length

            // Ensure description is acceptable length

            // Ensure tx signer "who" is allowed to do this under owner id by dialing out to
            // membership module and asking.

            //
            // == MUTATION SAFE ==
            //

            // Get id of new channel 

            // Construct channel

            // Add channel to ChannelById under id

            // Add id to ChannelIdByHandle under handle

            // Increment NextChannelId

            // Dial out to membership module and inform about new role as channe owner.

            // event?

        }

        /// An owner transfers channel ownership to a new owner.
        /// 
        /// Notice that working group participants cannot do this.
        /// Notice that censored or unpublished channel may still be transferred.
        pub fn transfer_channel_ownership(origin, channel_id: T::ChannelId, new_owner: T::MemberId, new_role_account: T::AccountId) {

            // Ensure extrinsic is signed by "who"

            // Ensure channel id is valid

            // Ensure "who" matches role account of channel

            // Ensure new owner is allowed to do this under new owner id by dialing out to
            // membership module and asking

            //
            // == MUTATION SAFE ==
            //

            // Construct new channel with altered properties

            // Overwrite entry in ChannelById

            // Dial out to membership module and inform about removal of role as channle owner for old owner.

            // Dial out to membership module and inform about new role as channe owner for new owner.

            // event?
    
        }

        // perhaps curation can be done here in one go.

        /// Update channel curation status of a channel.
        /// 
        /// Can 
        pub fn update_channel_curation_status(origin) {

            // WorkingGroupActor

        }

        /*
         * Credential management for versioned store permissions.
         * 
         * Lead credential is managed as non-dispatchable.
         */

        pub fn update_any_member_credential(origin) {
            
        }

        pub fn update_any_curator_credential(origin) {
            
        }

        pub fn create_dynamic_credential(origin) {

        }

        pub fn update_dynamic_credential(origin) {

        }

        /// ...
        pub fn update_channel_as_owner(origin) {

        }

        /// ...
        pub fn update_channel_as_curator(origin) {

        }



        /// ..
        pub fn create_version_store_credential(origin)  {


        }

        /// ...
        pub fn update_lead_role_account(origin) {

        }

        /// ...
        pub fn update_lead_reward_account(origin)  {

        }

        /// ...
        pub fn add_curator_opening(origin)  {

        }

        /// ...
        pub fn accept_curator_applications(origin)  {

        }

        /// ...
        pub fn begin_curator_applicant_review(origin) {
        }

        /// ...
        pub fn fill_curator_opening(origin) {

        }

        /// ...
        pub fn update_curator_reward(origin) {

        }

        /// ...
        pub fn slash_curator(origin) {

        }

        /// ...
        pub fn terminate_curator(origin) {

        }

        /// ...
        pub fn apply_on_curator_opening(origin) {

        }

        /// ...
        pub fn update_curator_role_account(origin) {


        }

        /// ...
        pub fn update_curator_reward_account(origin) {

        }

        /// ...
        pub fn exit_curator_role(origin) {

        }

        fn on_finalize(now: T::BlockNumber) {

        }
    }
}

impl<T: Trait> Module<T> {

    /*  
    /// ...
    pub fn set_lead();

    /// ...
    pub fn unset_lead();
    
    /// ...
    pub fn set_opening_policy();

    /// ...
    pub fn update_lead_reward();
    
    /// ...
    pub fn account_is_in_group();

    pub fn update_lead_credential();
    */
} 

/*
 *  ======== ======== ======== ======== =======
 *  ======== PRIVATE TYPES AND METHODS ========
 *  ======== ======== ======== ======== =======
 */

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
    fn credential_from_id(credential_id: T::PrincipalId) -> Option<DynamicCredential<T::CuratorId, T::ChannelId, T::BlockNumber>> {

        //let  = credential_id_to_built_in_credential_holder(credential_id);

        // 2. 


        None
    }
    
}