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

#[cfg(test)]
pub(crate) use stakes::DefaultStakeHandler;

#[cfg(test)]
pub(crate) use stakes::MockStakeHandler;

/// Current status of the proposal
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Clone, PartialEq, Eq, Debug)]
pub enum ProposalStatus {
    /// A new proposal that is available for voting.
    Active,

    /// The proposal decision was made.
    Finalized(FinalizationStatus),
}

impl ProposalStatus {
    /// ProposalStatus helper, creates ExecutionFailed approved proposal status
    pub fn approved(approved_status: ApprovedProposalStatus) -> ProposalStatus {
        ProposalStatus::Finalized(FinalizationStatus {
            proposal_status: ProposalDecisionStatus::Approved(approved_status),
            finalization_error: None,
        })
    }

    /// Creates finalized proposal status with provided ProposalDecisionStatus
    pub fn finalized(decision_status: ProposalDecisionStatus) -> ProposalStatus {
        Self::finalized_with_error(decision_status, None)
    }

    /// Creates finalized proposal status with provided ProposalDecisionStatus and error
    pub fn finalized_with_error(
        decision_status: ProposalDecisionStatus,
        finalization_error: Option<&str>,
    ) -> ProposalStatus {
        ProposalStatus::Finalized(FinalizationStatus {
            proposal_status: decision_status,
            finalization_error: finalization_error.map(|err| err.as_bytes().to_vec()),
        })
    }
}

/// Final proposal status and potential error.
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Clone, PartialEq, Eq, Debug)]
pub struct FinalizationStatus {
    /// Final proposal status
    pub proposal_status: ProposalDecisionStatus,

    /// Error occured during the proposal finalization
    pub finalization_error: Option<Vec<u8>>,
}

/// Status of the approved proposal. Defines execution stages.
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Clone, PartialEq, Eq, Debug)]
pub enum ApprovedProposalStatus {
    /// A proposal was approved and grace period is in effect
    PendingExecution,

    /// Proposal was successfully executed
    Executed,

    /// Proposal was executed and failed with an error
    ExecutionFailed {
        /// Error message
        error: Vec<u8>,
    },
}

impl ApprovedProposalStatus {
    /// ApprovedProposalStatus helper, creates ExecutionFailed approved proposal status
    pub fn failed_execution(err: &str) -> ApprovedProposalStatus {
        ApprovedProposalStatus::ExecutionFailed {
            error: err.as_bytes().to_vec(),
        }
    }
}

/// Status for the proposal with finalized decision
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Clone, PartialEq, Eq, Debug)]
pub enum ProposalDecisionStatus {
    /// Proposal was withdrawn by its proposer.
    Canceled,

    /// Proposal was vetoed by root.
    Vetoed,

    /// A proposal was rejected
    Rejected,

    /// A proposal was rejected ans its stake should be slashed
    Slashed,

    /// Not enough votes and voting period expired.
    Expired,

    /// To clear the quorum requirement, the percentage of council members with revealed votes
    /// must be no less than the quorum value for the given proposal type.
    Approved(ApprovedProposalStatus),
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
    ) -> Option<ProposalDecisionStatus> {
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
            Some(ProposalDecisionStatus::Approved(
                ApprovedProposalStatus::PendingExecution,
            ))
        } else if proposal_status_resolution.is_slashing_quorum_reached()
            && proposal_status_resolution.is_slashing_threshold_reached()
        {
            Some(ProposalDecisionStatus::Slashed)
        } else if proposal_status_resolution.is_expired() {
            Some(ProposalDecisionStatus::Expired)
        } else if proposal_status_resolution.is_voting_completed() {
            Some(ProposalDecisionStatus::Rejected)
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
struct ProposalStatusResolution<'a, BlockNumber, ProposerId, Balance, StakeId> {
    proposal: &'a Proposal<BlockNumber, ProposerId, Balance, StakeId>,
    now: BlockNumber,
    votes_count: u32,
    total_voters_count: u32,
    approvals: u32,
    slashes: u32,
}

impl<'a, BlockNumber, ProposerId, Balance, StakeId>
    ProposalStatusResolution<'a, BlockNumber, ProposerId, Balance, StakeId>
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

    // Slashing quorum reached for the proposal. Compares predefined parameter with actual
    // votes sum divided by total possible votes count.
    pub fn is_slashing_quorum_reached(&self) -> bool {
        let actual_votes_fraction: f32 = self.votes_count as f32 / self.total_voters_count as f32;

        let slashing_quorum_fraction =
            self.proposal.parameters.slashing_quorum_percentage as f32 / 100.0;

        actual_votes_fraction >= slashing_quorum_fraction
    }

    // Approval threshold reached for the proposal. Compares predefined parameter with 'approve'
    // votes sum divided by actual votes count.
    pub fn is_approval_threshold_reached(&self) -> bool {
        let approval_votes_fraction: f32 = self.approvals as f32 / self.votes_count as f32;

        let required_threshold_fraction =
            self.proposal.parameters.approval_threshold_percentage as f32 / 100.0;

        approval_votes_fraction >= required_threshold_fraction
    }

    // Slashing threshold reached for the proposal. Compares predefined parameter with 'approve'
    // votes sum divided by actual votes count.
    pub fn is_slashing_threshold_reached(&self) -> bool {
        let slashing_votes_fraction: f32 = self.slashes as f32 / self.votes_count as f32;

        let required_threshold_fraction =
            self.proposal.parameters.slashing_threshold_percentage as f32 / 100.0;

        slashing_votes_fraction >= required_threshold_fraction
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
    pub status: ProposalDecisionStatus,

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
        proposal.parameters.slashing_quorum_percentage = 50;
        proposal.parameters.slashing_threshold_percentage = 50;

        proposal.voting_results.add_vote(VoteKind::Reject);
        proposal.voting_results.add_vote(VoteKind::Approve);
        proposal.voting_results.add_vote(VoteKind::Approve);

        assert_eq!(
            proposal.voting_results,
            VotingResults {
                abstentions: 0,
                approvals: 2,
                rejections: 1,
                slashes: 0,
            }
        );

        let expected_proposal_status = proposal.define_proposal_decision_status(5, now);
        assert_eq!(
            expected_proposal_status,
            Some(ProposalDecisionStatus::Expired)
        );
    }

    #[test]
    fn define_proposal_decision_status_returns_approved() {
        let now = 2;
        let mut proposal = Proposal::<u64, u64, u64, u64>::default();
        proposal.created_at = 1;
        proposal.parameters.voting_period = 3;
        proposal.parameters.approval_quorum_percentage = 60;
        proposal.parameters.slashing_quorum_percentage = 50;
        proposal.parameters.slashing_threshold_percentage = 50;

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
                slashes: 0,
            }
        );

        let expected_proposal_status = proposal.define_proposal_decision_status(5, now);
        assert_eq!(
            expected_proposal_status,
            Some(ProposalDecisionStatus::Approved(
                ApprovedProposalStatus::PendingExecution
            ))
        );
    }

    #[test]
    fn define_proposal_decision_status_returns_rejected() {
        let mut proposal = Proposal::<u64, u64, u64, u64>::default();
        let now = 2;

        proposal.created_at = 1;
        proposal.parameters.voting_period = 3;
        proposal.parameters.approval_quorum_percentage = 50;
        proposal.parameters.approval_threshold_percentage = 51;
        proposal.parameters.slashing_quorum_percentage = 50;
        proposal.parameters.slashing_threshold_percentage = 50;

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
                slashes: 0,
            }
        );

        let expected_proposal_status = proposal.define_proposal_decision_status(4, now);
        assert_eq!(
            expected_proposal_status,
            Some(ProposalDecisionStatus::Rejected)
        );
    }
    #[test]
    fn define_proposal_decision_status_returns_slashed() {
        let mut proposal = Proposal::<u64, u64, u64, u64>::default();
        let now = 2;

        proposal.created_at = 1;
        proposal.parameters.voting_period = 3;
        proposal.parameters.approval_quorum_percentage = 50;
        proposal.parameters.approval_threshold_percentage = 50;
        proposal.parameters.slashing_quorum_percentage = 50;
        proposal.parameters.slashing_threshold_percentage = 50;

        proposal.voting_results.add_vote(VoteKind::Slash);
        proposal.voting_results.add_vote(VoteKind::Reject);
        proposal.voting_results.add_vote(VoteKind::Abstain);
        proposal.voting_results.add_vote(VoteKind::Slash);

        assert_eq!(
            proposal.voting_results,
            VotingResults {
                abstentions: 1,
                approvals: 0,
                rejections: 1,
                slashes: 2,
            }
        );

        let expected_proposal_status = proposal.define_proposal_decision_status(4, now);
        assert_eq!(
            expected_proposal_status,
            Some(ProposalDecisionStatus::Slashed)
        );
    }

    #[test]
    fn define_proposal_decision_status_returns_none() {
        let mut proposal = Proposal::<u64, u64, u64, u64>::default();
        let now = 2;

        proposal.created_at = 1;
        proposal.parameters.voting_period = 3;
        proposal.parameters.approval_quorum_percentage = 60;
        proposal.parameters.slashing_quorum_percentage = 50;

        proposal.voting_results.add_vote(VoteKind::Abstain);
        assert_eq!(
            proposal.voting_results,
            VotingResults {
                abstentions: 1,
                approvals: 0,
                rejections: 0,
                slashes: 0,
            }
        );

        let expected_proposal_status = proposal.define_proposal_decision_status(5, now);
        assert_eq!(expected_proposal_status, None);
    }
}

#[test]
fn define_proposal_decision_status_returns_approved_before_slashing_before_rejection() {
    let mut proposal = Proposal::<u64, u64, u64, u64>::default();
    let now = 2;

    proposal.created_at = 1;
    proposal.parameters.voting_period = 3;
    proposal.parameters.approval_quorum_percentage = 50;
    proposal.parameters.approval_threshold_percentage = 30;
    proposal.parameters.slashing_quorum_percentage = 50;
    proposal.parameters.slashing_threshold_percentage = 30;

    proposal.voting_results.add_vote(VoteKind::Approve);
    proposal.voting_results.add_vote(VoteKind::Approve);
    proposal.voting_results.add_vote(VoteKind::Reject);
    proposal.voting_results.add_vote(VoteKind::Reject);
    proposal.voting_results.add_vote(VoteKind::Slash);
    proposal.voting_results.add_vote(VoteKind::Slash);

    assert_eq!(
        proposal.voting_results,
        VotingResults {
            abstentions: 0,
            approvals: 2,
            rejections: 2,
            slashes: 2,
        }
    );

    let expected_proposal_status = proposal.define_proposal_decision_status(6, now);

    assert_eq!(
        expected_proposal_status,
        Some(ProposalDecisionStatus::Approved(
            ApprovedProposalStatus::PendingExecution
        ))
    );
}

#[test]
fn define_proposal_decision_status_returns_slashed_before_rejection() {
    let mut proposal = Proposal::<u64, u64, u64, u64>::default();
    let now = 2;

    proposal.created_at = 1;
    proposal.parameters.voting_period = 3;
    proposal.parameters.approval_quorum_percentage = 50;
    proposal.parameters.approval_threshold_percentage = 30;
    proposal.parameters.slashing_quorum_percentage = 50;
    proposal.parameters.slashing_threshold_percentage = 30;

    proposal.voting_results.add_vote(VoteKind::Abstain);
    proposal.voting_results.add_vote(VoteKind::Approve);
    proposal.voting_results.add_vote(VoteKind::Reject);
    proposal.voting_results.add_vote(VoteKind::Reject);
    proposal.voting_results.add_vote(VoteKind::Slash);
    proposal.voting_results.add_vote(VoteKind::Slash);

    assert_eq!(
        proposal.voting_results,
        VotingResults {
            abstentions: 1,
            approvals: 1,
            rejections: 2,
            slashes: 2,
        }
    );

    let expected_proposal_status = proposal.define_proposal_decision_status(6, now);

    assert_eq!(
        expected_proposal_status,
        Some(ProposalDecisionStatus::Slashed)
    );
}
