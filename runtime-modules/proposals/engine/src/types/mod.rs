//! Proposals types module for the Joystream platform. Version 2.
//! Provides types for the proposal engine.

#![warn(missing_docs)]

use codec::{Decode, Encode};
use frame_support::dispatch::DispatchResult;
#[cfg(feature = "std")]
use serde::{Deserialize, Serialize};
use sp_runtime::Perbill;
use sp_std::boxed::Box;
use sp_std::cmp::PartialOrd;
use sp_std::ops::Add;
use sp_std::vec::Vec;

use common::MemberId;

mod proposal_statuses;

pub use proposal_statuses::{
    ApprovedProposalDecision, ExecutionStatus, ProposalDecision, ProposalStatus,
};

/// Vote kind for the proposal. Sum of all votes defines proposal status.
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Clone, PartialEq, Eq, Debug)]
pub enum VoteKind {
    /// Pass, an alternative or a ranking, for binary, multiple choice
    /// and ranked choice propositions, respectively.
    Approve,

    /// Against proposal.
    Reject,

    /// Reject proposal and slash it stake.
    Slash,

    /// Signals presence, but unwillingness to cast judgment on substance of vote.
    Abstain,
}

impl Default for VoteKind {
    fn default() -> Self {
        VoteKind::Reject
    }
}

/// Proposal parameters required to manage proposal risk.
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Default, Clone, Copy, PartialEq, Eq, Debug)]
pub struct ProposalParameters<BlockNumber, Balance> {
    /// During this period, votes can be accepted
    pub voting_period: BlockNumber,

    /// A pause before execution of the approved proposal. Zero means approved proposal would be
    /// executed immediately.
    pub grace_period: BlockNumber,

    /// Quorum percentage of approving voters required to pass the proposal.
    pub approval_quorum_percentage: u32,

    /// Approval votes percentage threshold to pass the proposal.
    pub approval_threshold_percentage: u32,

    /// Quorum percentage of voters required to slash the proposal.
    pub slashing_quorum_percentage: u32,

    /// Slashing votes percentage threshold to slash the proposal.
    pub slashing_threshold_percentage: u32,

    /// Proposal stake
    pub required_stake: Option<Balance>,

    /// The number of councils in that must approve the proposal in a row before it has its
    /// intended effect. Integer no less than 1.
    pub constitutionality: u32,
}

/// Contains current voting results
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Default, Clone, PartialEq, Eq, Debug)]
pub struct VotingResults {
    /// 'Abstain' votes counter
    pub abstentions: u32,

    /// 'Approve' votes counter
    pub approvals: u32,

    /// 'Reject' votes counter
    pub rejections: u32,

    /// 'Slash' votes counter
    pub slashes: u32,
}

impl VotingResults {
    /// Add vote to the related counter
    pub fn add_vote(&mut self, vote: VoteKind) {
        match vote {
            VoteKind::Abstain => self.abstentions += 1,
            VoteKind::Approve => self.approvals += 1,
            VoteKind::Reject => self.rejections += 1,
            VoteKind::Slash => self.slashes += 1,
        }
    }

    /// Calculates number of votes so far
    pub fn votes_number(&self) -> u32 {
        self.abstentions + self.approvals + self.rejections + self.slashes
    }

    /// Returns True if there were no votes. False otherwise.
    pub fn no_votes_yet(&self) -> bool {
        self.votes_number() == 0
    }
}

/// 'Proposal' contains information necessary for the proposal system functioning.
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Default, Clone, PartialEq, Eq, Debug)]
pub struct Proposal<BlockNumber, ProposerId, Balance, AccountId> {
    /// Proposals parameter, characterize different proposal types.
    pub parameters: ProposalParameters<BlockNumber, Balance>,

    /// Identifier of member proposing.
    pub proposer_id: ProposerId,

    /// It contains the block number when it was first created or the beginning of a new council
    /// where the proposal was automatically activated due to constitutionality.
    pub activated_at: BlockNumber,

    /// Current proposal status
    pub status: ProposalStatus<BlockNumber>,

    /// Curring voting result for the proposal
    pub voting_results: VotingResults,

    /// Optional exact block height which triggers the execution.
    pub exact_execution_block: Option<BlockNumber>,

    /// The number of councils in that must approve the proposal in a row before it has its
    /// intended effect.
    pub nr_of_council_confirmations: u32,

    /// Optional account id for staking.
    pub staking_account_id: Option<AccountId>,
}

impl<BlockNumber, ProposerId, Balance, AccountId>
    Proposal<BlockNumber, ProposerId, Balance, AccountId>
where
    BlockNumber: Add<Output = BlockNumber> + PartialOrd + Copy,
    AccountId: Clone,
{
    /// Increases proposal constitutionality level.
    pub fn increase_constitutionality_level(&mut self) {
        self.nr_of_council_confirmations += 1;
    }

    /// Returns whether voting period expired by now
    pub fn is_voting_period_expired(&self, now: BlockNumber) -> bool {
        now >= self.activated_at + self.parameters.voting_period
    }

    /// Returns whether grace period expired by now.
    /// Grace period can be expired only if proposal is finalized with Approved status.
    /// Returns false otherwise.
    pub fn is_grace_period_expired(&self, now: BlockNumber) -> bool {
        if let ProposalStatus::PendingExecution(finalized_at) = self.status.clone() {
            return now >= finalized_at + self.parameters.grace_period;
        }

        false
    }

    /// Returns whether the proposal is ready for execution by now.
    /// It compares grace period and exact execution block with the current block.
    pub fn is_ready_for_execution(&self, now: BlockNumber) -> bool {
        self.is_grace_period_expired(now) && self.is_execution_block_reached_or_not_set(now)
    }

    /// Returns whether exact execution block reached by now.
    /// If not set returns True.
    /// Returns False otherwise.
    pub fn is_execution_block_reached_or_not_set(&self, now: BlockNumber) -> bool {
        self.exact_execution_block
            .map(|block_number| block_number <= now)
            .unwrap_or(true)
    }

    /// Determines the finalized proposal status using voting results tally for current proposal.
    /// Calculates votes, takes in account voting period expiration.
    /// If voting process is in progress, then decision status is None.
    /// Parameters: current time, total voters number involved (council size).
    /// Returns the proposal finalized status if any.
    pub fn define_proposal_decision(
        &self,
        total_voters_count: u32,
        now: BlockNumber,
    ) -> Option<ProposalDecision> {
        let proposal_status_resolution = ProposalStatusResolution {
            proposal: self,
            approvals: self.voting_results.approvals,
            slashes: self.voting_results.slashes,
            now,
            votes_count: self.voting_results.votes_number(),
            total_voters_count,
        };

        if proposal_status_resolution.is_approval_quorum_reached()
            && proposal_status_resolution.is_approval_threshold_reached()
        {
            let approved_status =
                if proposal_status_resolution.is_constitutionality_reached_on_approval() {
                    ApprovedProposalDecision::PendingExecution
                } else {
                    ApprovedProposalDecision::PendingConstitutionality
                };

            Some(ProposalDecision::Approved(approved_status))
        } else if proposal_status_resolution.is_slashing_quorum_reached()
            && proposal_status_resolution.is_slashing_threshold_reached()
        {
            Some(ProposalDecision::Slashed)
        } else if proposal_status_resolution.is_rejection_imminent() {
            Some(ProposalDecision::Rejected)
        } else if proposal_status_resolution.is_expired() {
            Some(ProposalDecision::Expired)
        } else if proposal_status_resolution.is_voting_completed() {
            Some(ProposalDecision::Rejected)
        } else {
            None
        }
    }

    /// Reset the proposal in Active status. Proposal with other status won't be changed.
    /// Reset proposal operation clears voting results.
    pub fn reset_proposal_votes(&mut self) {
        if self.status == ProposalStatus::Active {
            self.voting_results = VotingResults::default();
        }
    }
}

/// Provides data for the voting.
pub trait VotersParameters {
    /// Defines maximum voters count for the proposal
    fn total_voters_count() -> u32;
}

// Calculates quorum, votes threshold, expiration status
pub(crate) struct ProposalStatusResolution<'a, BlockNumber, ProposerId, Balance, AccountId> {
    /// Proposal data
    pub proposal: &'a Proposal<BlockNumber, ProposerId, Balance, AccountId>,
    /// Current block
    pub now: BlockNumber,
    /// Total votes number so far
    pub votes_count: u32,
    /// Council size
    pub total_voters_count: u32,
    /// Approval votes number
    pub approvals: u32,
    /// Slash votes number
    pub slashes: u32,
}

impl<'a, BlockNumber, ProposerId, Balance, AccountId>
    ProposalStatusResolution<'a, BlockNumber, ProposerId, Balance, AccountId>
where
    BlockNumber: Add<Output = BlockNumber> + PartialOrd + Copy,
    AccountId: Clone,
{
    // Proposal has been expired and quorum not reached.
    pub fn is_expired(&self) -> bool {
        self.proposal.is_voting_period_expired(self.now)
    }

    // Approval quorum reached for the proposal. Compares predefined parameter with actual
    // votes sum divided by total possible votes number.
    pub(crate) fn is_approval_quorum_reached(&self) -> bool {
        let actual_votes_fraction =
            Perbill::from_rational_approximation(self.votes_count, self.total_voters_count);
        let approval_quorum_fraction =
            Perbill::from_percent(self.proposal.parameters.approval_quorum_percentage);

        actual_votes_fraction.deconstruct() >= approval_quorum_fraction.deconstruct()
    }

    // Verifies that approval threshold is still achievable for the proposal.
    // Compares actual approval votes sum with remaining possible votes number.
    pub(crate) fn is_approval_threshold_achievable(&self) -> bool {
        let remaining_votes_count = self.total_voters_count - self.votes_count;
        let possible_approval_votes_fraction = Perbill::from_rational_approximation(
            self.approvals + remaining_votes_count,
            self.votes_count + remaining_votes_count,
        );

        let required_threshold_fraction =
            Perbill::from_percent(self.proposal.parameters.approval_threshold_percentage);

        possible_approval_votes_fraction.deconstruct() >= required_threshold_fraction.deconstruct()
    }

    // Verifies that both approval and slashing thresholds cannot be achieved.
    pub fn is_rejection_imminent(&self) -> bool {
        !self.is_approval_threshold_achievable() && !self.is_slashing_threshold_achievable()
    }

    // Verifies that slashing threshold is still achievable for the proposal.
    // Compares actual slashing votes sum with remaining possible votes number.
    pub(crate) fn is_slashing_threshold_achievable(&self) -> bool {
        let remaining_votes_count = self.total_voters_count - self.votes_count;
        let possible_slashing_votes_fraction = Perbill::from_rational_approximation(
            self.slashes + remaining_votes_count,
            self.votes_count + remaining_votes_count,
        );

        let required_threshold_fraction =
            Perbill::from_percent(self.proposal.parameters.slashing_threshold_percentage);

        possible_slashing_votes_fraction.deconstruct() >= required_threshold_fraction.deconstruct()
    }

    // Slashing quorum reached for the proposal. Compares predefined parameter with actual
    // votes sum divided by total possible votes number.
    pub fn is_slashing_quorum_reached(&self) -> bool {
        let actual_votes_fraction =
            Perbill::from_rational_approximation(self.votes_count, self.total_voters_count);
        let slashing_quorum_fraction =
            Perbill::from_percent(self.proposal.parameters.slashing_quorum_percentage);

        actual_votes_fraction.deconstruct() >= slashing_quorum_fraction.deconstruct()
    }

    // Approval threshold reached for the proposal. Compares predefined parameter with 'approve'
    // votes sum divided by actual votes number.
    pub fn is_approval_threshold_reached(&self) -> bool {
        let approval_votes_fraction =
            Perbill::from_rational_approximation(self.approvals, self.votes_count);
        let required_threshold_fraction =
            Perbill::from_percent(self.proposal.parameters.approval_threshold_percentage);

        approval_votes_fraction.deconstruct() >= required_threshold_fraction.deconstruct()
    }

    // Slashing threshold reached for the proposal. Compares predefined parameter with 'approve'
    // votes sum divided by actual votes count.
    pub fn is_slashing_threshold_reached(&self) -> bool {
        let slashing_votes_fraction =
            Perbill::from_rational_approximation(self.slashes, self.votes_count);
        let required_threshold_fraction =
            Perbill::from_percent(self.proposal.parameters.slashing_threshold_percentage);

        slashing_votes_fraction.deconstruct() >= required_threshold_fraction.deconstruct()
    }

    // All voters had voted
    pub fn is_voting_completed(&self) -> bool {
        self.votes_count == self.total_voters_count
    }

    // Council approved the proposal enough times.
    pub fn is_constitutionality_reached_on_approval(&self) -> bool {
        self.proposal.nr_of_council_confirmations + 1 >= self.proposal.parameters.constitutionality
    }
}

/// Proposal executable code wrapper
pub trait ProposalExecutable {
    /// Executes proposal code
    fn execute(&self) -> DispatchResult;
}

/// Proposal code binary converter
pub trait ProposalCodeDecoder<T: frame_system::Config> {
    /// Converts proposal code binary to executable representation
    fn decode_proposal(
        proposal_type: u32,
        proposal_code: Vec<u8>,
    ) -> Result<Box<dyn ProposalExecutable>, &'static str>;
}

/// Containter-type for a proposal creation method.
pub struct ProposalCreationParameters<BlockNumber, Balance, MemberId, AccountId> {
    /// Account id of the proposer.
    pub account_id: AccountId,

    /// Proposer member id.
    pub proposer_id: MemberId,

    /// Risk management proposal parameters.
    pub proposal_parameters: ProposalParameters<BlockNumber, Balance>,

    /// Proposal title.
    pub title: Vec<u8>,

    /// Proposal description.
    pub description: Vec<u8>,

    /// Staking account for the proposal.
    pub staking_account_id: Option<AccountId>,

    /// Encoded executable proposal code.
    pub encoded_dispatchable_call_code: Vec<u8>,

    /// Exact block for the proposal execution.
    /// Should be greater than starting block + grace_period if set.
    pub exact_execution_block: Option<BlockNumber>,
}

/// Balance alias for `balances` module.
pub type BalanceOf<T> = <T as balances::Config>::Balance;

// Simplification of the 'Proposal' type
pub(crate) type ProposalOf<T> = Proposal<
    <T as frame_system::Config>::BlockNumber,
    MemberId<T>,
    BalanceOf<T>,
    <T as frame_system::Config>::AccountId,
>;
