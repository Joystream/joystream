use codec::{Decode, Encode};
//use rstd::collections::btree_map::BTreeMap;
use rstd::collections::btree_set::BTreeSet;

use crate::{Trait};

pub struct ExitedLeadRole<BlockNumber> {

    /// ...
    pub initiated_at_block_number: BlockNumber
}

/// ...
#[derive(Encode, Decode, Debug, Eq, PartialEq, Clone, PartialOrd, Ord)]
pub enum LeadRoleState<BlockNumber> {

    /// ...
    Active,
    
    /// ...
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
    /// TODO: Add richer information about circumstances of induction
    pub inducted: BlockNumber,

    /// ... 
    pub stage: LeadRoleState<BlockNumber>
}

/// Represents ...
#[derive(Encode, Decode, Debug, Eq, PartialEq, Clone, PartialOrd, Ord)]
pub enum CuratorExitInitiationOrigin {

    /// ...
    Lead,

    /// ...
    Curator
}

pub struct ExitedCuratorRoleStage<BlockNumber> {

    /// ...
    pub origin: CuratorExitInitiationOrigin,

    /// ...
    pub initiated_at_block_number: BlockNumber,

    /// ...
    pub rationale_text: Vec<u8> // <== needs constrainst in extrinsics
}

/// Represents ...
#[derive(Encode, Decode, Debug, Eq, PartialEq, Clone, PartialOrd, Ord)]
pub enum CuratorRoleStage<BlockNumber> {

    /// ...
    Active,

    /// ...
    Exited(ExitedCuratorRoleStage<BlockNumber>)
}

/// Represents ...
pub struct CuratorInduction<LeadId, ApplicationId, BlockNumber> {

    /// Lead responsible
    pub lead: LeadId,

    /// Application through which curator was inducted
    pub application: ApplicationId,

    /// When induction occurred
    pub at_block: BlockNumber // wasn't there some composte type here?
}

// Working group participant: curator
// This role can be staked, have reward and be inducted through the hiring module.
#[derive(Encode, Decode, Default, Debug, Eq, PartialEq, Clone, PartialOrd, Ord)]
pub struct Curator<AccountId, RewardRelationshipId, StakeId> {

    /// Account used to authenticate in this role,
    pub role_account: AccountId,

    /// Whether the role has recurring reward, and if so an identifier for this.
    pub reward_relationship: Option<RewardRelationshipId>,

    /// Whether participant is staked, and if so, the identifier for this staking in the staking module.
    pub stake: Option<StakeId>,

    /// ...
    pub stage: CuratorRoleStage<BlockNumber>,

    /// ..
    pub induction: CuratorInduction<T>
}

///
pub enum ChannelType {
    Video,
    Music,
    Ebook
}

/// 
pub enum ChannelPublishingStatus {
    Published,
    NotPublished
}

///
pub enum ChannelCurationStatus {
    Normal,
    Censored
}

/// 
pub struct Channel<BlockNumber> {

    ///
    pub handle: , 

    /// 
    pub description: ,

    /// The type of channel
    pub type: ChannelType,

    /// Member who owns channel
    pub owner: Trait::MemberId,

    /// Account used to authenticate as owner.
    /// Can be updated through membership role key.
    pub role_account: AccountId,

    ///
    pub publishing_status: 

    ///
    pub curation_status: ChannelCurationStatus,

    /// When channel was established
    pub created: BlockNumber

}

/// 
pub enum BuiltInCredentialHolder {

    /// 
    CurrentLead,
    
    ///
    AnyCurator,

    /// 
    AnyMember
}


/// ...
pub static CURRENT_LEAD_CREDENTIAL_ID: VersionedStorePermissions::Trait::CredentialId = VersionedStorePermissions::Trait::CredentialId::from(0);
pub static ANY_CURATOR_CREDENTIAL_ID: VersionedStorePermissions::Trait::CredentialId = VersionedStorePermissions::Trait::CredentialId::from(1);
pub static ANY_MEMBER_CREDENTIAL_ID: VersionedStorePermissions::Trait::CredentialId = VersionedStorePermissions::Trait::CredentialId::from(2);

/// ...
#[derive(Encode, Decode, Debug, Eq, PartialEq, Clone, PartialOrd, Ord)]
pub enum DynamicCredentialHolder<CuratorId, ChannelId> {

    ///
    Curators(BTreeSet<CuratorId>),

    /// 
    ChannelOwner(ChannelId),
}

/*
/// ...
enum CredentialHolder {

    /// ..
    BuiltInHolder(BuiltInHolder),

    /// ..
    DynamicHolder(DynamicCredentialHolder)
}
*/

enum CredentialIdToHolderMappingResult {

    ///
    BuiltInCredentialHolder(BuiltInCredentialHolder),

    /// ...
    CandidateDynamicVersionedStoreCredentialId(VersionedStorePermissions::Trait::CredentialId)
}

/// ...
fn credential_id_to_built_in_credential_holder(credential_id: VersionedStorePermissions::Trait::CredentialId) -> CredentialIdToHolderMappingResult {

    match credential_id {

        CURRENT_LEAD_CREDENTIAL_ID: BuiltInCredentialHolder(BuiltInCredentialHolder::CurrentLead),
        ANY_CURATOR_CREDENTIAL_ID: BuiltInCredentialHolder(BuiltInCredentialHolder::AnyCurator),
        ANY_MEMBER_CREDENTIAL_ID: BuiltInCredentialHolder(BuiltInCredentialHolder::AnyMember),
        _ => CandidateDynamicVersionedStoreCredentialId(credential_id - ANY_MEMBER_CREDENTIAL_ID)
    }
}


pub struct BuiltInVersionStoreCredential {

    /// Whether it is currently possible to authenticate with this credential,
    /// and also join.
    pub is_active: bool
}

/// Represents a group as understood by the VersionedStorePermissions module
#[derive(Encode, Decode, Default, Debug, Eq, PartialEq, Clone, PartialOrd, Ord)]
pub struct DynamicVersionedStoreCredential<T: Trait> {

    /// ..
    pub holder: DynamicCredentialHolder<,>,

    /// Whether it is currently possible to authenticate with this credential,
    /// and also join.
    pub is_active: bool,

    /// ..
    pub created: T::BlockNumber,

    /// ..
    pub description: Vec<u8>
}

/// Policy governing any curator opening which can be made by lead.
/// Be aware that all limits are forward looking in constrainign future extrinsics or method calls.
/// Updating them has no side-effects beyond changing the limit.
#[derive(Encode, Decode, Default, Debug, Eq, PartialEq, Clone, PartialOrd, Ord)]
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

