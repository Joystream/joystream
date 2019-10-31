use codec::{Codec, Decode, Encode};
//use rstd::collections::btree_map::BTreeMap;
use rstd::collections::btree_set::BTreeSet;
use rstd::prelude::*;
use srml_support::traits::Currency;
use srml_support::{
    decl_module, decl_storage, ensure, Parameter, StorageMap, StorageValue,
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
        + PartialEq;

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
    pub at_block: BlockNumber // wasn't there some composte type here?
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
    pub induction: CuratorInduction<LeadId, ApplicationId, BlockNumber>
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
pub enum DynamicCredentialHolder<CuratorId, ChannelId> {

    /// Sets of curators.
    Curators(BTreeSet<CuratorId>),

    /// Owner of a channel.
    ChannelOwner(ChannelId),
}

/// Must be default constructible because it indirectly is a value in a storage map.
/// ***SHOULD NEVER ACTUALLY GET CALLED, IS REQUIRED TO DUE BAD STORAGE MODEL IN SUBSTRATE***
impl<CuratorId, ChannelId> Default for DynamicCredentialHolder<CuratorId, ChannelId> {

    fn default() -> Self {
        DynamicCredentialHolder::Curators(BTreeSet::new())
    }
}

/// Represents credential for authenticating as "the current lead".
#[derive(Encode, Decode, Debug, Eq, PartialEq, Clone, PartialOrd)]
pub struct LeadCredential {

    /// Whether it is currently possible to authenticate with this credential.
    pub is_active: bool
}

/// Represents credential for authenticating as "any curator".
#[derive(Encode, Decode, Debug, Eq, PartialEq, Clone, PartialOrd)]
pub struct AnyCuratorCredential {

    /// Whether it is currently possible to authenticate with this credential.
    pub is_active: bool
}

/// Represents credential for authenticating as "any member".
#[derive(Encode, Decode, Debug, Eq, PartialEq, Clone, PartialOrd)]
pub struct AnyMemberCredential {

    /// Whether it is currently possible to authenticate with this credential.
    pub is_active: bool
}

/// Represents credential to be referenced from the version store.
/// It is dynamic in the sense that these can be created on the fly.
#[derive(Encode, Decode, Default, Debug, Eq, PartialEq, Clone, PartialOrd)]
pub struct DynamicCredential<CuratorId, ChannelId, BlockNumber> {

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

