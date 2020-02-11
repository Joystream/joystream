//! Proposals types module for the Joystream platform. Version 2.
//! Provides types for the proposal engine.

use codec::{Decode, Encode};
use rstd::cmp::PartialOrd;
use rstd::ops::Add;
use rstd::prelude::*;

#[cfg(feature = "std")]
use serde::{Deserialize, Serialize};
use srml_support::dispatch;

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
        /// Fail error
        error: Vec<u8>,
    },

    /// Proposal was withdrawn by its proposer.
    Canceled,

    /// Proposal was vetoed by root.
    Vetoed,
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
pub struct ProposalParameters<BlockNumber> {
    /// During this period, votes can be accepted
    pub voting_period: BlockNumber,

    /// A pause before execution of the approved proposal. Zero means approved proposal would be
    /// executed immediately.
    pub grace_period: BlockNumber,

    /// Quorum percentage of approving voters required to pass a proposal.
    pub approval_quorum_percentage: u32,

    /// Approval votes percentage threshold to pass the vote.
    pub approval_threshold_percentage: u32,
    //pub stake: BalanceOf<T>, //<T: GovernanceCurrency>
}

/// 'Proposal' contains information necessary for the proposal system functioning.
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Default, Clone, PartialEq, Eq, Debug)]
pub struct Proposal<BlockNumber, AccountId> {
    /// Proposal type id
    pub proposal_type: u32,

    /// Proposals parameter, characterize different proposal types.
    pub parameters: ProposalParameters<BlockNumber>,

    /// Identifier of member proposing.
    pub proposer_id: AccountId,

    /// Proposal title
    pub title: Vec<u8>,

    /// Proposal body
    pub body: Vec<u8>,

    /// When it was created.
    pub created_at: BlockNumber,

    /// When it was approved.
    pub approved_at: Option<BlockNumber>,

    // Any stake associated with the proposal.
    //pub stake: Option<BalanceOf<T>>
    /// Current proposal status
    pub status: ProposalStatus,
}

impl<BlockNumber: Add<Output = BlockNumber> + PartialOrd + Copy, AccountId>
    Proposal<BlockNumber, AccountId>
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

    /// Voting results tally for single proposal.
    /// Parameters: own proposal id, current time, votes.
    /// Returns tally results if proposal status will should change
    pub fn tally_results(
        self,
        proposal_id: u32,
        votes: Vec<Vote<AccountId>>,
        total_voters_count: u32,
        now: BlockNumber,
    ) -> Option<TallyResult<BlockNumber>> {
        let mut abstentions: u32 = 0;
        let mut approvals: u32 = 0;
        let mut rejections: u32 = 0;

        for vote in votes.iter() {
            match vote.vote_kind {
                VoteKind::Abstain => abstentions += 1,
                VoteKind::Approve => approvals += 1,
                VoteKind::Reject => rejections += 1,
            }
        }

        let proposal_status_decision = ProposalStatusDecision {
            proposal: &self,
            approvals,
            now,
            votes_count: votes.len() as u32,
            total_voters_count,
        };

        let new_status: Option<ProposalStatus> = if proposal_status_decision
            .is_approval_quorum_reached()
            && proposal_status_decision.is_approval_threshold_reached()
        {
            Some(ProposalStatus::Approved)
        } else if proposal_status_decision.is_expired() {
            Some(ProposalStatus::Expired)
        } else if proposal_status_decision.is_voting_completed() {
            Some(ProposalStatus::Rejected)
        } else {
            None
        };

        if let Some(status) = new_status {
            Some(TallyResult {
                proposal_id,
                abstentions,
                approvals,
                rejections,
                status,
                finalized_at: now,
            })
        } else {
            None
        }
    }
}

/// Vote. Characterized by voter and vote kind.
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Default, Clone, PartialEq, Eq, Debug)]
pub struct Vote<AccountId> {
    /// Origin of the vote
    pub voter_id: AccountId,

    /// Vote kind
    pub vote_kind: VoteKind,
}

/// Tally result for the proposal
#[cfg_attr(feature = "std", derive(Serialize, Deserialize, Debug))]
#[derive(Encode, Decode, Default, Clone, PartialEq, Eq)]
pub struct TallyResult<BlockNumber> {
    /// Proposal Id
    pub proposal_id: u32,

    /// 'Abstention' votes count
    pub abstentions: u32,

    /// 'Approve' votes count
    pub approvals: u32,

    /// 'Reject' votes count
    pub rejections: u32,

    /// Proposal status after tally
    pub status: ProposalStatus,

    /// Proposal finalization block number
    pub finalized_at: BlockNumber,
}

/// Provides data for voting.
pub trait VotersParameters {
    /// Defines maximum voters count for the proposal
    fn total_voters_count() -> u32;
}

// Calculates quorum, votes threshold, expiration status
struct ProposalStatusDecision<'a, BlockNumber, AccountId> {
    proposal: &'a Proposal<BlockNumber, AccountId>,
    now: BlockNumber,
    votes_count: u32,
    total_voters_count: u32,
    approvals: u32,
}

impl<'a, BlockNumber, AccountId> ProposalStatusDecision<'a, BlockNumber, AccountId>
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
pub trait ProposalCodeDecoder {
    /// Converts proposal code binary to executable representation
    fn decode_proposal(
        proposal_type: u32,
        proposal_code: Vec<u8>,
    ) -> Result<Box<dyn ProposalExecutable>, &'static str>;
}

#[cfg(test)]
mod tests {
    use crate::*;

    #[test]
    fn proposal_voting_period_expired() {
        let mut proposal = Proposal::<u64, u64>::default();

        proposal.created_at = 1;
        proposal.parameters.voting_period = 3;

        assert!(proposal.is_voting_period_expired(4));
    }

    #[test]
    fn proposal_voting_period_not_expired() {
        let mut proposal = Proposal::<u64, u64>::default();

        proposal.created_at = 1;
        proposal.parameters.voting_period = 3;

        assert!(!proposal.is_voting_period_expired(3));
    }

    #[test]
    fn proposal_grace_period_expired() {
        let mut proposal = Proposal::<u64, u64>::default();

        proposal.approved_at = Some(1);
        proposal.parameters.grace_period = 3;

        assert!(proposal.is_grace_period_expired(4));
    }

    #[test]
    fn proposal_grace_period_auto_expired() {
        let mut proposal = Proposal::<u64, u64>::default();

        proposal.approved_at = Some(1);
        proposal.parameters.grace_period = 0;

        assert!(proposal.is_grace_period_expired(1));
    }

    #[test]
    fn proposal_grace_period_not_expired() {
        let mut proposal = Proposal::<u64, u64>::default();

        proposal.approved_at = Some(1);
        proposal.parameters.grace_period = 3;

        assert!(!proposal.is_grace_period_expired(3));
    }

    #[test]
    fn proposal_grace_period_not_expired_because_of_not_approved_proposal() {
        let mut proposal = Proposal::<u64, u64>::default();

        proposal.approved_at = None;
        proposal.parameters.grace_period = 3;

        assert!(!proposal.is_grace_period_expired(3));
    }

    #[test]
    fn tally_results_proposal_expired() {
        let mut proposal = Proposal::<u64, u64>::default();
        let proposal_id = 1;
        let now = 5;
        proposal.created_at = 1;
        proposal.parameters.voting_period = 3;
        proposal.parameters.approval_quorum_percentage = 80;
        proposal.parameters.approval_threshold_percentage = 40;

        let votes = vec![
            Vote {
                voter_id: 1,
                vote_kind: VoteKind::Approve,
            },
            Vote {
                voter_id: 2,
                vote_kind: VoteKind::Approve,
            },
            Vote {
                voter_id: 4,
                vote_kind: VoteKind::Reject,
            },
        ];

        let expected_tally_results = TallyResult {
            proposal_id,
            abstentions: 0,
            approvals: 2,
            rejections: 1,
            status: ProposalStatus::Expired,
            finalized_at: now,
        };

        assert_eq!(
            proposal.tally_results(proposal_id, votes, 5, now),
            Some(expected_tally_results)
        );
    }
    #[test]
    fn tally_results_proposal_approved() {
        let mut proposal = Proposal::<u64, u64>::default();
        let proposal_id = 1;
        proposal.created_at = 1;
        proposal.parameters.voting_period = 3;
        proposal.parameters.approval_quorum_percentage = 60;

        let votes = vec![
            Vote {
                voter_id: 1,
                vote_kind: VoteKind::Approve,
            },
            Vote {
                voter_id: 2,
                vote_kind: VoteKind::Approve,
            },
            Vote {
                voter_id: 3,
                vote_kind: VoteKind::Approve,
            },
            Vote {
                voter_id: 4,
                vote_kind: VoteKind::Reject,
            },
        ];

        let expected_tally_results = TallyResult {
            proposal_id,
            abstentions: 0,
            approvals: 3,
            rejections: 1,
            status: ProposalStatus::Approved,
            finalized_at: 2,
        };

        assert_eq!(
            proposal.tally_results(proposal_id, votes, 5, 2),
            Some(expected_tally_results)
        );
    }

    #[test]
    fn tally_results_proposal_rejected_because_of_failed_approval_threshold() {
        let mut proposal = Proposal::<u64, u64>::default();
        let proposal_id = 1;
        let now = 2;

        proposal.created_at = 1;
        proposal.parameters.voting_period = 3;
        proposal.parameters.approval_quorum_percentage = 50;
        proposal.parameters.approval_threshold_percentage = 51;

        let votes = vec![
            Vote {
                voter_id: 1,
                vote_kind: VoteKind::Approve,
            },
            Vote {
                voter_id: 2,
                vote_kind: VoteKind::Reject,
            },
            Vote {
                voter_id: 3,
                vote_kind: VoteKind::Abstain,
            },
            Vote {
                voter_id: 4,
                vote_kind: VoteKind::Approve,
            },
        ];

        let expected_tally_results = TallyResult {
            proposal_id,
            abstentions: 1,
            approvals: 2,
            rejections: 1,
            status: ProposalStatus::Rejected,
            finalized_at: now,
        };

        assert_eq!(
            proposal.tally_results(proposal_id, votes, 4, now),
            Some(expected_tally_results)
        );
    }

    #[test]
    fn tally_results_are_empty_with_not_expired_voting_period() {
        let mut proposal = Proposal::<u64, u64>::default();
        let proposal_id = 1;
        let now = 2;

        proposal.created_at = 1;
        proposal.parameters.voting_period = 3;
        proposal.parameters.approval_quorum_percentage = 60;

        let votes = vec![Vote {
            voter_id: 1,
            vote_kind: VoteKind::Abstain,
        }];

        assert_eq!(proposal.tally_results(proposal_id, votes, 5, now), None);
    }
}
