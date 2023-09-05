#![warn(missing_docs)]

use codec::{Decode, Encode};
use scale_info::TypeInfo;
#[cfg(feature = "std")]
use serde::{Deserialize, Serialize};
use sp_std::vec::Vec;

use common::working_group::WorkingGroup;
use common::BalanceKind;
use common::FundingRequestParameters;

use content::NftLimitPeriod;
use working_group::StakePolicy;

/// Encodes proposal using its details information.
pub trait ProposalEncoder<T: crate::Config> {
    /// Encodes proposal using its details information.
    fn encode_proposal(
        proposal_details: ProposalDetailsOf<T>,
        member_controller_account: <T as frame_system::Config>::AccountId,
    ) -> Vec<u8>;
}

/// _ProposalDetails_ alias for type simplification
pub type ProposalDetailsOf<T> = ProposalDetails<
    crate::BalanceOf<T>,
    <T as frame_system::Config>::BlockNumber,
    <T as frame_system::Config>::AccountId,
    working_group::WorkerId<T>,
    working_group::OpeningId,
    <T as proposals_engine::Config>::ProposalId,
    content::UpdateChannelPayoutsParameters<T>,
    token::GovernanceParametersOf<T>,
>;

/// Proposal details provide voters the information required for the perceived voting.
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Clone, PartialEq, Debug, Eq, TypeInfo)]
pub enum ProposalDetails<
    Balance,
    BlockNumber,
    AccountId,
    WorkerId,
    OpeningId,
    ProposalId,
    UpdateChannelPayoutsParameters,
    TokenGovernanceParameters,
> {
    /// The signal of the `Signal` proposal
    Signal(Vec<u8>),

    /// The wasm code for the `Runtime Upgrade` proposal
    RuntimeUpgrade(Vec<u8>),

    /// Vector of balance and destination accounts for the `FundingRequest` proposal
    FundingRequest(Vec<FundingRequestParameters<Balance, AccountId>>),

    /// `Set Max Validator Count` proposal
    SetMaxValidatorCount(u32),

    /// `Create Working Group Lead Opening` Proposal:
    /// Add opening for the working group leader position.
    CreateWorkingGroupLeadOpening(CreateOpeningParameters<BlockNumber, Balance>),

    /// `Fill Working Group Lead Opening` proposal:
    /// Fill opening for the working group leader position.
    FillWorkingGroupLeadOpening(FillOpeningParameters),

    /// `Update Working Group Budget` proposal: Set working group budget capacity.
    UpdateWorkingGroupBudget(Balance, WorkingGroup, BalanceKind),

    /// `Decrease Working Group Lead Stake` proposal: Decrease the working group leader stake.
    DecreaseWorkingGroupLeadStake(WorkerId, Balance, WorkingGroup),

    /// `Slash Working Group Lead Stake` proposal:  Slash the working group leader stake.
    SlashWorkingGroupLead(WorkerId, Balance, WorkingGroup),

    /// `Set Working Group Lead Reward` proposal: Set working group lead reward balance.
    SetWorkingGroupLeadReward(WorkerId, Option<Balance>, WorkingGroup),

    /// `Terminate Working Group Lead` proposal:
    /// Fire the working group leader with possible slashing.
    TerminateWorkingGroupLead(TerminateRoleParameters<WorkerId, Balance>),

    /// `Amend constitution` proposal.
    AmendConstitution(Vec<u8>),

    /// `Cancel Working Group Lead Opening` proposal:
    /// Cancels an opening for a working group leader
    CancelWorkingGroupLeadOpening(OpeningId, WorkingGroup),

    /// `Set Membership Price` proposal:
    /// Sets the membership price
    SetMembershipPrice(Balance),

    /// `Set Council Budget Increment` proposal
    SetCouncilBudgetIncrement(Balance),

    /// `Set Councilor Reward` proposal
    SetCouncilorReward(Balance),

    /// `Set Initial Invitation Balance` proposal
    SetInitialInvitationBalance(Balance),

    /// `Set Initial Invitation Count` proposal
    SetInitialInvitationCount(u32),

    /// `Set Membership Lead Invitation Quota` proposal
    SetMembershipLeadInvitationQuota(u32),

    /// `Set Referral Cut` proposal
    SetReferralCut(u8),

    /// `Veto Proposal` proposal
    VetoProposal(ProposalId),

    /// `Update global NFT limit` proposal
    UpdateGlobalNftLimit(NftLimitPeriod, u64),

    /// `Update Channel Payouts` proposal
    UpdateChannelPayouts(UpdateChannelPayoutsParameters),

    /// Update CRT governance parameters
    UpdateTokenPalletGovernanceParameters(TokenGovernanceParameters),
}

impl<
        Balance,
        BlockNumber,
        AccountId,
        WorkerId,
        OpeningId,
        ProposalId,
        UpdateChannelPayoutsParameters,
        TokenGovernanceParameters,
    > Default
    for ProposalDetails<
        Balance,
        BlockNumber,
        AccountId,
        WorkerId,
        OpeningId,
        ProposalId,
        UpdateChannelPayoutsParameters,
        TokenGovernanceParameters,
    >
{
    fn default() -> Self {
        ProposalDetails::Signal(b"invalid proposal details".to_vec())
    }
}

/// Proposal parameters common to all proposals
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Debug, Default, Clone, PartialEq, Eq, TypeInfo)]
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
#[derive(Encode, Decode, Clone, PartialEq, Debug, Eq, TypeInfo)]
pub struct TerminateRoleParameters<WorkerId, Balance> {
    /// Worker identifier.
    pub worker_id: WorkerId,

    /// Optional amount to be slashed.
    pub slashing_amount: Option<Balance>,

    /// Identifier for working group.
    pub group: WorkingGroup,
}

/// Parameters for the 'Fill Working Group Lead' proposal.
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Clone, PartialEq, Debug, Eq, TypeInfo)]
pub struct FillOpeningParameters {
    /// Identifier for opening in group.
    pub opening_id: working_group::OpeningId,

    /// Identifier for successful applicant.
    pub application_id: working_group::ApplicationId,

    /// Defines working group with the open position.
    pub working_group: WorkingGroup,
}

/// Parameters for the 'Create Working Group Lead Opening' proposal.
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Clone, PartialEq, Debug, Eq, TypeInfo)]
pub struct CreateOpeningParameters<BlockNumber, Balance> {
    /// Opening description.
    pub description: Vec<u8>,

    /// Optional Staking policy.
    pub stake_policy: StakePolicy<BlockNumber, Balance>,

    /// Reward per block for the opening.
    pub reward_per_block: Option<Balance>,

    /// Identifier for working group.
    pub group: WorkingGroup,
}
