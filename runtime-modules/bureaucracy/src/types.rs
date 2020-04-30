use codec::{Decode, Encode};
#[cfg(feature = "std")]
use serde::{Deserialize, Serialize};

/// The exit stage of a lead involvement in the working group.
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Debug, Clone, PartialEq)]
pub struct ExitedLeadRole<BlockNumber> {
    /// When exit was initiated.
    pub initiated_at_block_number: BlockNumber,
}

/// The stage of the involvement of a lead in the working group.
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Debug, Clone, PartialEq)]
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
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Default, Debug, Clone, PartialEq)]
pub struct Lead<MemberId, AccountId, RewardRelationshipId, BlockNumber> {
    /// Member id of the leader
    pub member_id: MemberId,

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
