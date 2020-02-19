//! Proposals types module for the Joystream platform. Version 2.
//! Provides types for the proposal engine.

use codec::{Decode, Encode};
use rstd::cmp::PartialOrd;
use rstd::ops::Add;
use rstd::prelude::*;

#[cfg(feature = "std")]
use serde::{Deserialize, Serialize};
use srml_support::dispatch;
use srml_support::traits::Currency;

mod stakes;

pub use stakes::{DefaultStakeHandlerProvider, StakeHandler, StakeHandlerProvider};

/// Current status of the proposal
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Clone, PartialEq, Eq, Debug)]
pub enum ProposalStatus {
    /// A new proposal that is available for voting.
    Active,

    /// To clear the quorum requirement, the percentage of council members with revealed votes
    /// must be no less than the quorum value for the given proposal type.
    Approved,

    /// A proposal was approved and grace period is in effect
    PendingExecution,

    /// A proposal was rejected
    Rejected,

    /// Not enough votes and voting period expired.
    Expired,

    /// Proposal was successfully executed
    Executed,

    /// Proposal was executed and failed with an error
    Failed {
        /// Error message
        error: Vec<u8>,
    },

    /// Proposal was withdrawn by its proposer.
    Canceled,

    /// Proposal was vetoed by root.
    Vetoed,
}

impl ProposalStatus {
    /// Defines whether proposal status is 'point of the proposal decision'  (the decision about
    /// this proposal was made).
    pub fn is_decision_status(&self) -> bool {
        match self {
            ProposalStatus::Approved
            | ProposalStatus::Vetoed
            | ProposalStatus::Canceled
            | ProposalStatus::Expired
            | ProposalStatus::Rejected => true,
            _ => false,
        }
    }
}
impl Default for ProposalStatus {
    fn default() -> Self {
        ProposalStatus::Active
    }
}

/// Vote kind for the proposal. Sum of all votes defines proposal status.
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Clone, PartialEq, Eq, Debug)]
pub enum VoteKind {
    /// Pass, an alternative or a ranking, for binary, multiple choice
    /// and ranked choice propositions, respectively.
    Approve,

    /// Against proposal.
    Reject,

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

    /// Quorum percentage of approving voters required to pass a proposal.
    pub approval_quorum_percentage: u32,

    /// Approval votes percentage threshold to pass the vote.
    pub approval_threshold_percentage: u32,

    /// Proposal stake
    pub required_stake: Option<Balance>,
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
}

impl VotingResults {
    /// Add vote to the related counter
    pub fn add_vote(&mut self, vote: VoteKind) {
        match vote {
            VoteKind::Abstain => self.abstentions += 1,
            VoteKind::Approve => self.approvals += 1,
            VoteKind::Reject => self.rejections += 1,
        }
    }

    /// Calculates number of votes so far
    pub fn votes_number(&self) -> u32 {
        self.abstentions + self.approvals + self.rejections
    }
}

/// 'Proposal' contains information necessary for the proposal system functioning.
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Default, Clone, PartialEq, Eq, Debug)]
pub struct Proposal<BlockNumber, ProposerId, Balance, StakeId> {
    /// Proposal type id
    pub proposal_type: u32,

    /// Proposals parameter, characterize different proposal types.
    pub parameters: ProposalParameters<BlockNumber, Balance>,

    /// Identifier of member proposing.
    pub proposer_id: ProposerId,

    /// Proposal title
    pub title: Vec<u8>,

    /// Proposal body
    pub body: Vec<u8>,

    /// When it was created.
    pub created_at: BlockNumber,

    /// When it was approved.
    pub approved_at: Option<BlockNumber>,

    /// Current proposal status
    pub status: ProposalStatus,

    /// Curring voting result for the proposal
    pub voting_results: VotingResults,

    // TODO: update proposal.finalized_at
    /// Proposal finalization block number
    pub finalized_at: Option<BlockNumber>,

    /// Created stake id for the proposal
    pub stake_id: Option<StakeId>,
}

impl<BlockNumber, ProposerId, Balance, StakeId> Proposal<BlockNumber, ProposerId, Balance, StakeId>
where
    BlockNumber: Add<Output = BlockNumber> + PartialOrd + Copy,
{
    /// Returns whether voting period expired by now
    pub fn is_voting_period_expired(&self, now: BlockNumber) -> bool {
        now >= self.created_at + self.parameters.voting_period
    }

    /// Returns whether grace period expired by now. Returns false if not approved.
    pub fn is_grace_period_expired(&self, now: BlockNumber) -> bool {
        if let Some(approved_at) = self.approved_at {
            now >= approved_at + self.parameters.grace_period
        } else {
            false
        }
    }

    /// Determines the finalized proposal status using voting results tally for current proposal.
    /// Parameters: current time, total voters number involved (council size)
    /// Returns whether the proposal has finalized status
    pub fn define_proposal_decision_status(
        &self,
        total_voters_count: u32,
        now: BlockNumber,
    ) -> Option<ProposalStatus> {
        let proposal_status_decision = ProposalStatusDecision {
            proposal: self,
            approvals: self.voting_results.approvals,
            now,
            votes_count: self.voting_results.votes_number(),
            total_voters_count,
        };

        if proposal_status_decision.is_approval_quorum_reached()
            && proposal_status_decision.is_approval_threshold_reached()
        {
            Some(ProposalStatus::Approved)
        } else if proposal_status_decision.is_expired() {
            Some(ProposalStatus::Expired)
        } else if proposal_status_decision.is_voting_completed() {
            Some(ProposalStatus::Rejected)
        } else {
            None
        }
    }
}

/// Provides data for voting.
pub trait VotersParameters {
    /// Defines maximum voters count for the proposal
    fn total_voters_count() -> u32;
}

// Calculates quorum, votes threshold, expiration status
struct ProposalStatusDecision<'a, BlockNumber, ProposerId, Balance, StakeId> {
    proposal: &'a Proposal<BlockNumber, ProposerId, Balance, StakeId>,
    now: BlockNumber,
    votes_count: u32,
    total_voters_count: u32,
    approvals: u32,
}

impl<'a, BlockNumber, ProposerId, Balance, StakeId>
    ProposalStatusDecision<'a, BlockNumber, ProposerId, Balance, StakeId>
where
    BlockNumber: Add<Output = BlockNumber> + PartialOrd + Copy,
{
    // Proposal has been expired and quorum not reached.
    pub fn is_expired(&self) -> bool {
        self.proposal.is_voting_period_expired(self.now)
    }

    // Approval quorum reached for the proposal. Compares predefined parameter with actual
    // votes sum divided by total possible votes count.
    pub fn is_approval_quorum_reached(&self) -> bool {
        let actual_votes_fraction: f32 = self.votes_count as f32 / self.total_voters_count as f32;

        let approval_quorum_fraction =
            self.proposal.parameters.approval_quorum_percentage as f32 / 100.0;

        actual_votes_fraction >= approval_quorum_fraction
    }

    // Approval threshold reached for the proposal. Compares predefined parameter with 'approve'
    // votes sum divided by actual votes count.
    pub fn is_approval_threshold_reached(&self) -> bool {
        let approval_votes_fraction: f32 = self.approvals as f32 / self.votes_count as f32;

        let required_threshold_fraction =
            self.proposal.parameters.approval_threshold_percentage as f32 / 100.0;

        approval_votes_fraction >= required_threshold_fraction
    }

    // All voters had voted
    pub fn is_voting_completed(&self) -> bool {
        self.votes_count == self.total_voters_count
    }
}

/// Proposal executable code wrapper
pub trait ProposalExecutable {
    /// Executes proposal code
    fn execute(&self) -> dispatch::Result;
}

/// Proposal code binary converter
pub trait ProposalCodeDecoder<T: system::Trait> {
    /// Converts proposal code binary to executable representation
    fn decode_proposal(
        proposal_type: u32,
        proposal_code: Vec<u8>,
    ) -> Result<Box<dyn ProposalExecutable>, &'static str>;
}

/// Balance alias
pub type BalanceOf<T> =
    <<T as stake::Trait>::Currency as Currency<<T as system::Trait>::AccountId>>::Balance;

/// Balance alias for staking
pub type NegativeImbalance<T> =
    <<T as stake::Trait>::Currency as Currency<<T as system::Trait>::AccountId>>::NegativeImbalance;

/// Balance type of runtime
pub type CurrencyOf<T> = <T as stake::Trait>::Currency;

/// Data container for the finalized proposal results
pub(crate) struct FinalizedProposalData<ProposalId, BlockNumber, ProposerId, Balance, StakeId> {
    /// Proposal id
    pub proposal_id: ProposalId,

    /// Proposal to be finalized
    pub proposal: Proposal<BlockNumber, ProposerId, Balance, StakeId>,

    /// Proposal finalization status
    pub status: ProposalStatus,

    /// Proposal finalization block number
    pub finalized_at: BlockNumber,
}

#[cfg(test)]
mod tests {
    use crate::*;

    #[test]
    fn proposal_voting_period_expired() {
        let mut proposal = Proposal::<u64, u64, u64, u64>::default();

        proposal.created_at = 1;
        proposal.parameters.voting_period = 3;

        assert!(proposal.is_voting_period_expired(4));
    }

    #[test]
    fn proposal_voting_period_not_expired() {
        let mut proposal = Proposal::<u64, u64, u64, u64>::default();

        proposal.created_at = 1;
        proposal.parameters.voting_period = 3;

        assert!(!proposal.is_voting_period_expired(3));
    }

    #[test]
    fn proposal_grace_period_expired() {
        let mut proposal = Proposal::<u64, u64, u64, u64>::default();

        proposal.approved_at = Some(1);
        proposal.parameters.grace_period = 3;

        assert!(proposal.is_grace_period_expired(4));
    }

    #[test]
    fn proposal_grace_period_auto_expired() {
        let mut proposal = Proposal::<u64, u64, u64, u64>::default();

        proposal.approved_at = Some(1);
        proposal.parameters.grace_period = 0;

        assert!(proposal.is_grace_period_expired(1));
    }

    #[test]
    fn proposal_grace_period_not_expired() {
        let mut proposal = Proposal::<u64, u64, u64, u64>::default();

        proposal.approved_at = Some(1);
        proposal.parameters.grace_period = 3;

        assert!(!proposal.is_grace_period_expired(3));
    }

    #[test]
    fn proposal_grace_period_not_expired_because_of_not_approved_proposal() {
        let mut proposal = Proposal::<u64, u64, u64, u64>::default();

        proposal.approved_at = None;
        proposal.parameters.grace_period = 3;

        assert!(!proposal.is_grace_period_expired(3));
    }

    #[test]
    fn define_proposal_decision_status_returns_expired() {
        let mut proposal = Proposal::<u64, u64, u64, u64>::default();
        let now = 5;
        proposal.created_at = 1;
        proposal.parameters.voting_period = 3;
        proposal.parameters.approval_quorum_percentage = 80;
        proposal.parameters.approval_threshold_percentage = 40;

        proposal.voting_results.add_vote(VoteKind::Reject);
        proposal.voting_results.add_vote(VoteKind::Approve);
        proposal.voting_results.add_vote(VoteKind::Approve);

        assert_eq!(
            proposal.voting_results,
            VotingResults {
                abstentions: 0,
                approvals: 2,
                rejections: 1,
            }
        );

        let expected_proposal_status = proposal.define_proposal_decision_status(5, now);
        assert_eq!(expected_proposal_status, Some(ProposalStatus::Expired));
    }

    #[test]
    fn define_proposal_decision_status_returns_approved() {
        let now = 2;
        let mut proposal = Proposal::<u64, u64, u64, u64>::default();
        proposal.created_at = 1;
        proposal.parameters.voting_period = 3;
        proposal.parameters.approval_quorum_percentage = 60;

        proposal.voting_results.add_vote(VoteKind::Reject);
        proposal.voting_results.add_vote(VoteKind::Approve);
        proposal.voting_results.add_vote(VoteKind::Approve);
        proposal.voting_results.add_vote(VoteKind::Approve);

        assert_eq!(
            proposal.voting_results,
            VotingResults {
                abstentions: 0,
                approvals: 3,
                rejections: 1,
            }
        );

        let expected_proposal_status = proposal.define_proposal_decision_status(5, now);
        assert_eq!(expected_proposal_status, Some(ProposalStatus::Approved));
    }

    #[test]
    fn define_proposal_decision_status_returns_rejected() {
        let mut proposal = Proposal::<u64, u64, u64, u64>::default();
        let now = 2;

        proposal.created_at = 1;
        proposal.parameters.voting_period = 3;
        proposal.parameters.approval_quorum_percentage = 50;
        proposal.parameters.approval_threshold_percentage = 51;

        proposal.voting_results.add_vote(VoteKind::Reject);
        proposal.voting_results.add_vote(VoteKind::Reject);
        proposal.voting_results.add_vote(VoteKind::Abstain);
        proposal.voting_results.add_vote(VoteKind::Approve);

        assert_eq!(
            proposal.voting_results,
            VotingResults {
                abstentions: 1,
                approvals: 1,
                rejections: 2,
            }
        );

        let expected_proposal_status = proposal.define_proposal_decision_status(4, now);
        assert_eq!(expected_proposal_status, Some(ProposalStatus::Rejected));
    }

    #[test]
    fn define_proposal_decision_status_returns_none() {
        let mut proposal = Proposal::<u64, u64, u64, u64>::default();
        let now = 2;

        proposal.created_at = 1;
        proposal.parameters.voting_period = 3;
        proposal.parameters.approval_quorum_percentage = 60;

        proposal.voting_results.add_vote(VoteKind::Abstain);
        assert_eq!(
            proposal.voting_results,
            VotingResults {
                abstentions: 1,
                approvals: 0,
                rejections: 0,
            }
        );

        let expected_proposal_status = proposal.define_proposal_decision_status(5, now);
        assert_eq!(expected_proposal_status, None);
    }

    #[test]
    fn proposal_status_is_decision_status_check_works() {
        assert!(ProposalStatus::Approved.is_decision_status());
        assert!(ProposalStatus::Rejected.is_decision_status());
        assert!(ProposalStatus::Vetoed.is_decision_status());
        assert!(ProposalStatus::Canceled.is_decision_status());
        assert!(ProposalStatus::Expired.is_decision_status());
        assert!(!(ProposalStatus::Active.is_decision_status()));
        assert!(!(ProposalStatus::PendingExecution.is_decision_status()));
        assert!(!(ProposalStatus::Executed.is_decision_status()));
        assert!(!(ProposalStatus::Failed { error: Vec::new() }.is_decision_status()));
    }
}
