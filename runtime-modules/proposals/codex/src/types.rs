#![warn(missing_docs)]

use codec::{Decode, Encode};
#[cfg(feature = "std")]
use serde::{Deserialize, Serialize};
use sp_std::vec::Vec;

use common::working_group::WorkingGroup;

use working_group::{Penalty, StakePolicy};

/// Encodes proposal using its details information.
pub trait ProposalEncoder<T: crate::Trait> {
    /// Encodes proposal using its details information.
    fn encode_proposal(proposal_details: ProposalDetailsOf<T>) -> Vec<u8>;
}

/// _ProposalDetails_ alias for type simplification
pub type ProposalDetailsOf<T> = ProposalDetails<
    <T as frame_system::Trait>::BlockNumber,
    <T as frame_system::Trait>::AccountId,
    crate::BalanceOf<T>,
    working_group::WorkerId<T>,
>;

/// Proposal details provide voters the information required for the perceived voting.
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Clone, PartialEq, Debug)]
pub enum ProposalDetails<BlockNumber, AccountId, Balance, WorkerId> {
    /// The text of the `text` proposal
    Text(Vec<u8>),

    /// The wasm code for the `runtime upgrade` proposal
    RuntimeUpgrade(Vec<u8>),

    /// Balance and destination account for the `spending` proposal
    Spending(Balance, AccountId),

    /// Validator count for the `set validator count` proposal
    SetValidatorCount(u32),

    /// Add opening for the working group leader position.
    AddWorkingGroupLeaderOpening(AddOpeningParameters<BlockNumber, Balance>),

    /// Fill opening for the working group leader position.
    FillWorkingGroupLeaderOpening(FillOpeningParameters),

    /// Set working group budget capacity.
    SetWorkingGroupBudgetCapacity(Balance, WorkingGroup),

    /// Decrease the working group leader stake.
    DecreaseWorkingGroupLeaderStake(WorkerId, Balance, WorkingGroup),

    /// Slash the working group leader stake.
    SlashWorkingGroupLeaderStake(WorkerId, Penalty<Balance>, WorkingGroup),

    /// Set working group leader reward balance.
    SetWorkingGroupLeaderReward(WorkerId, Option<Balance>, WorkingGroup),

    /// Fire the working group leader with possible slashing.
    TerminateWorkingGroupLeaderRole(TerminateRoleParameters<WorkerId, Balance>),

    /// Amend constitution.
    AmendConstitution(Vec<u8>),
}

impl<BlockNumber, AccountId, Balance, WorkerId> Default
    for ProposalDetails<BlockNumber, AccountId, Balance, WorkerId>
{
    fn default() -> Self {
        ProposalDetails::Text(b"invalid proposal details".to_vec())
    }
}

/// Proposal parameters common to all proposals
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Debug, Default, Clone, PartialEq, Eq)]
pub struct GeneralProposalParams<MemberId, AccountId, BlockNumber> {
    /// Member ID of proposer
    pub member_id: MemberId,

    /// Title of the proposal
    pub title: Vec<u8>,

    /// Proposal description
    pub description: Vec<u8>,

    /// Staking Account Id for proposer, must have one for proposal to work
    pub staking_account_id: Option<AccountId>,

    /// Intended execution block for the proposal
    pub exact_execution_block: Option<BlockNumber>,
}

/// Parameters for the 'terminate the leader position' proposal.
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Clone, PartialEq, Debug)]
pub struct TerminateRoleParameters<WorkerId, Balance> {
    /// Leader worker id to fire.
    pub worker_id: WorkerId,

    /// Terminate role slash penalty.
    pub penalty: Option<Penalty<Balance>>,

    /// Defines working group with the open position.
    pub working_group: WorkingGroup,
}

/// Parameters for the 'fill opening for the leader position' proposal.
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Clone, PartialEq, Debug)]
pub struct FillOpeningParameters {
    /// Finalizing opening id.
    pub opening_id: working_group::OpeningId,

    /// Id of the selected application.
    pub successful_application_id: working_group::ApplicationId,

    /// Defines working group with the open position.
    pub working_group: WorkingGroup,
}

/// Parameters for the 'add opening for the leader position' proposal.
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Clone, PartialEq, Debug)]
pub struct AddOpeningParameters<BlockNumber, Balance> {
    /// Opening description.
    pub description: Vec<u8>,

    /// Stake policy for the opening.
    pub stake_policy: Option<StakePolicy<BlockNumber, Balance>>,

    /// Reward per block for the opening.
    pub reward_per_block: Option<Balance>,

    /// Defines working group with the open position.
    pub working_group: WorkingGroup,
}
