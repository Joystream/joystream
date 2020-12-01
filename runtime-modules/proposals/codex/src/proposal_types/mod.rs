#![warn(missing_docs)]

use codec::{Decode, Encode};
#[cfg(feature = "std")]
use serde::{Deserialize, Serialize};
use sp_std::vec::Vec;

use common::working_group::WorkingGroup;

use working_group::{Penalty, RewardPolicy, StakePolicy};

/// Encodes proposal using its details information.
pub trait ProposalEncoder<T: crate::Trait> {
    /// Encodes proposal using its details information.
    fn encode_proposal(proposal_details: ProposalDetailsOf<T>) -> Vec<u8>;
}

/// _ProposalDetails_ alias for type simplification
pub type ProposalDetailsOf<T> = ProposalDetails<
    crate::BalanceOfMint<T>,
    crate::BalanceOfGovernanceCurrency<T>,
    <T as frame_system::Trait>::BlockNumber,
    <T as frame_system::Trait>::AccountId,
    crate::BalanceOf<T>,
    working_group::WorkerId<T>,
>;

/// Proposal details provide voters the information required for the perceived voting.
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Clone, PartialEq, Debug)]
pub enum ProposalDetails<
    MintedBalance,
    CurrencyBalance,
    BlockNumber,
    AccountId,
    StakeBalance,
    WorkerId,
> {
    /// The text of the `text` proposal
    Text(Vec<u8>),

    /// The wasm code for the `runtime upgrade` proposal
    RuntimeUpgrade(Vec<u8>),

    /// Balance and destination account for the `spending` proposal
    Spending(MintedBalance, AccountId),

    /// Validator count for the `set validator count` proposal
    SetValidatorCount(u32),

    /// Add opening for the working group leader position.
    AddWorkingGroupLeaderOpening(AddOpeningParameters<BlockNumber, CurrencyBalance>),

    /// Fill opening for the working group leader position.
    FillWorkingGroupLeaderOpening(FillOpeningParameters),

    /// Set working group budget capacity.
    SetWorkingGroupBudgetCapacity(MintedBalance, WorkingGroup),

    /// Decrease the working group leader stake.
    DecreaseWorkingGroupLeaderStake(WorkerId, StakeBalance, WorkingGroup),

    /// Slash the working group leader stake.
    SlashWorkingGroupLeaderStake(WorkerId, Penalty<StakeBalance>, WorkingGroup),

    /// Set working group leader reward balance.
    SetWorkingGroupLeaderReward(WorkerId, Option<MintedBalance>, WorkingGroup),

    /// Fire the working group leader with possible slashing.
    TerminateWorkingGroupLeaderRole(TerminateRoleParameters<WorkerId, StakeBalance>),

    /// Amend constitution.
    AmendConstitution(Vec<u8>),
}

impl<MintedBalance, CurrencyBalance, BlockNumber, AccountId, StakeBalance, WorkerId> Default
    for ProposalDetails<
        MintedBalance,
        CurrencyBalance,
        BlockNumber,
        AccountId,
        StakeBalance,
        WorkerId,
    >
{
    fn default() -> Self {
        ProposalDetails::Text(b"invalid proposal details".to_vec())
    }
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

    /// Reward policy for the opening.
    pub reward_policy: Option<RewardPolicy<Balance>>,

    /// Defines working group with the open position.
    pub working_group: WorkingGroup,
}
