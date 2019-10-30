use codec::{Decode, Encode};
use rstd::collections::btree_map::BTreeMap;
use rstd::collections::btree_set::BTreeSet;

use minting;
use recurringrewards;
use stake;
use hiring;
use versioned-store-permissions;

/// Module configuration trait for this Substrate module.
pub trait Trait: system::Trait + minting::Trait + RecurringReward::Trait + stake::Trait + Hiring::Trait + VersionedStorePermissions::Trait + Membership::Trait + Sized {

    /// Type for identifier for curators.
    type CuratorId: Parameter
        + Member
        + SimpleArithmetic
        + Codec
        + Default
        + Copy
        + MaybeSerializeDebug
        + PartialEq;

    /// Type for identifier for channels.
    type ChannelId: Parameter
        + Member
        + SimpleArithmetic
        + Codec
        + Default
        + Copy
        + MaybeSerializeDebug
        + PartialEq;
}

/// Type for identifier for dynamic version store credential.
pub type DynamicCredentialId = VersionedStorePermissions::Trait::CredentialId;

/// Balance type of runtime
pub type BalanceOf<T> =
    <<T as stake::Trait>::Currency as Currency<<T as system::Trait>::AccountId>>::Balance;

/// Negative imbalance of runtime.
pub type NegativeImbalance<T> =
    <<T as stake::Trait>::Currency as Currency<<T as system::Trait>::AccountId>>::NegativeImbalance;

/// The exit stage of a lead involvement in the working group.
pub struct ExitedLeadRole<BlockNumber> {

    /// When exit was initiated.
    pub initiated_at_block_number: BlockNumber
}

/// The stage of the involvement of a lead in the working group.
#[derive(Encode, Decode, Debug, Eq, PartialEq, Clone, PartialOrd, Ord)]
pub enum LeadRoleState<BlockNumber> {

    /// Currently active.
    Active,

    /// No longer active, for some reason
    Exited(ExitedLeadRole<BlockNumber>)
}

/// Working group lead: curator lead
/// For now this role is not staked or inducted through an structured process, like the hiring module,
/// hence information about this is missing. Recurring rewards is included, somewhat arbitrarily!
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
#[derive(Encode, Decode, Debug, Eq, PartialEq, Clone, PartialOrd, Ord)]
pub enum CuratorExitInitiationOrigin {

    /// Lead is origin.
    Lead,

    /// The curator exiting is the origin.
    Curator
}

/// The exit stage of a curators involvement in the working group.
pub struct ExitedCuratorRoleStage<BlockNumber> {

    /// Origin for exit.
    pub origin: CuratorExitInitiationOrigin,

    /// When exit was initiated.
    pub initiated_at_block_number: BlockNumber,

    /// Explainer for why exit was initited.
    pub rationale_text: Vec<u8>
}

/// The stage of the involvement of a curator in the working group.
#[derive(Encode, Decode, Debug, Eq, PartialEq, Clone, PartialOrd, Ord)]
pub enum CuratorRoleStage<BlockNumber> {

    /// Currently active.
    Active,

    /// No longer active, for some reason
    Exited(ExitedCuratorRoleStage<BlockNumber>)
}

/// The induction of a curator in the working group.
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
#[derive(Encode, Decode, Default, Debug, Eq, PartialEq, Clone, PartialOrd, Ord)]
pub struct Curator<AccountId, RewardRelationshipId, StakeId> {

    /// Account used to authenticate in this role,
    pub role_account: AccountId,

    /// Whether the role has recurring reward, and if so an identifier for this.
    pub reward_relationship: Option<RewardRelationshipId>,

    /// Whether participant is staked, and if so, the identifier for this staking in the staking module.
    pub stake: Option<StakeId>,

    /// The stage of this curator in the working group.
    pub stage: CuratorRoleStage<BlockNumber>,

    /// How the curator was inducted into the working group.
    pub induction: CuratorInduction<T>
}

/// Type of channel content.
pub enum ChannelContentType {
    Video,
    Music,
    Ebook
}

/// Status of channel, as set by the owner.
/// Is only meant to affect visibility, mutation of channel and child content
/// is unaffected on runtime.
pub enum ChannelPublishingStatus {

    /// Compliant UIs should render.
    Published,
    
    /// Compliant UIs should not render it or any child content.
    NotPublished
}

/// Status of channel, as set by curators.
/// Is only meant to affect visibility currently, but in the future
/// it will also gate publication of new child content,
/// editing properties, revenue flows, etc. 
pub enum ChannelCurationStatus {
    Normal,
    Censored
}

/// A channel for publishing content.
pub struct Channel<BlockNumber> {

    /// Unique human readble channel handle.
    pub handle: Vec<u8>, 

    /// Whether channel has been verified, in the normal Web2.0 platform sense of being authenticated.
    pub verified: bool,

    /// Human readable description of channel purpose and scope.
    pub description: Vec<u8>,

    /// The type of channel.
    pub content: ChannelContentType,

    /// Member who owns channel.
    pub owner: Trait::MemberId,

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
pub enum BuiltInCredentialHolder {

    /// Cyrrent working group lead.
    Lead,
    
    /// Any active urator in the working group.
    AnyCurator,

    /// Any active member in the membership registry.
    AnyMember
}

/// Credential identifiers for built in credential holder types.
pub static LEAD_CREDENTIAL_ID: VersionedStorePermissions::Trait::CredentialId = VersionedStorePermissions::Trait::CredentialId::from(0);
pub static ANY_CURATOR_CREDENTIAL_ID: VersionedStorePermissions::Trait::CredentialId = VersionedStorePermissions::Trait::CredentialId::from(1);
pub static ANY_MEMBER_CREDENTIAL_ID: VersionedStorePermissions::Trait::CredentialId = VersionedStorePermissions::Trait::CredentialId::from(2);

/// Holder of dynamic credential.
#[derive(Encode, Decode, Debug, Eq, PartialEq, Clone, PartialOrd, Ord)]
pub enum DynamicCredentialHolder<CuratorId, ChannelId> {

    /// Sets of curators.
    Curators(BTreeSet<CuratorId>),

    /// Owner of a channel.
    ChannelOwner(ChannelId),
}

/// Holder of a credential.
enum CredentialHolder {

    /// Built in credential holder.
    BuiltInCredentialHolder(BuiltInCredentialHolder),

    /// A possible dynamic credendtial holder.
    CandidateDynamicCredentialId(DynamicCredentialId)
}

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
fn credential_id_to_holder(credential_id: VersionedStorePermissions::Trait::CredentialId) -> CredentialHolder {

    match credential_id {

        LEAD_CREDENTIAL_ID: BuiltInCredentialHolder(BuiltInCredentialHolder::Lead),
        ANY_CURATOR_CREDENTIAL_ID: BuiltInCredentialHolder(BuiltInCredentialHolder::AnyCurator),
        ANY_MEMBER_CREDENTIAL_ID: BuiltInCredentialHolder(BuiltInCredentialHolder::AnyMember),
        _ => CandidateDynamicCredentialId(credential_id - 3) // will map first dynamic id to 0

        /*
         Add new built in credentials here below
        */
    }
}

/// Represents credential for authenticating as "the current lead".
pub struct LeadCredential {

    /// Whether it is currently possible to authenticate with this credential.
    pub is_active: bool
}

/// Represents credential for authenticating as "any curator".
pub struct AnyCuratorCredential {

    /// Whether it is currently possible to authenticate with this credential.
    pub is_active: bool
}

/// Represents credential for authenticating as "any member".
pub struct AnyMemberCredential {

    /// Whether it is currently possible to authenticate with this credential.
    pub is_active: bool
}

/// Represents credential to be referenced from the version store.
/// It is dynamic in the sense that these can be created on the fly.
#[derive(Encode, Decode, Default, Debug, Eq, PartialEq, Clone, PartialOrd)]
pub struct DynamicCredential<CuratorId, ChannelIdt> {

    /// Who holds this credential, meaning they can successfully authenticate with this credential.
    pub holder: DynamicCredentialHolder<CuratorId, ChannelId>,

    /// Whether it is currently possible to authenticate with this credential.
    pub is_active: bool,

    /// When it was created.
    pub created: T::BlockNumber,

    /// Human readable description of credential.
    pub description: Vec<u8>
}

/// Policy governing any curator opening which can be made by lead.
/// Be aware that all limits are forward looking in constrainign future extrinsics or method calls.
/// Updating them has no side-effects beyond changing the limit.
#[derive(Encode, Decode, Default, Debug, Eq, PartialEq, Clone, PartialOrd)]
pub struct OpeningPolicy<BlockNumber, StakingPolicy> {

    /// Limits the total number of curators which can be active, or possibly active through an active opening. 
    /// The contribution of an active opening is counted by looking at the rationing policy of the opening.
    /// A limit of N is counted as there being N actual active curators, as a worst case bound.
    /// The absence of a limit is counted as "infinity", thus blocking any further openings from being created,
    /// and is is not possible to actually hire a number of curators that would bring the number above this parameter `curator_limit`.
    pub curator_limit: Option<u16>

    /// Maximum length of review period of applications
    pub max_review_period_length: BlockNumber,

    /// Staking policy for application
    pub application_staking_policy: Option<StakingPolicy>,

    /// Staking policy for role itself
    pub role_staking_policy: Option<StakingPolicy>
}

