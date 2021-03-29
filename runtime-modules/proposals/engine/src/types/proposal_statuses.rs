#![warn(missing_docs)]

use codec::{Decode, Encode};
#[cfg(feature = "std")]
use serde::{Deserialize, Serialize};
use sp_std::vec::Vec;

/// Current status of the proposal.
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Clone, PartialEq, Eq, Debug)]
pub enum ProposalStatus<BlockNumber> {
    /// A new proposal status that is available for voting.
    Active,

    /// A proposal was approved and grace period is in effect.
    /// Parameter contains approval block number.
    PendingExecution(BlockNumber),

    /// The proposal needs more than one council approval.
    PendingConstitutionality,
}

impl<BlockNumber> Default for ProposalStatus<BlockNumber> {
    fn default() -> Self {
        ProposalStatus::Active
    }
}

impl<BlockNumber: Clone> ProposalStatus<BlockNumber> {
    /// Creates proposal status using ApprovedProposalDecision.
    pub fn approved(
        approved_status: ApprovedProposalDecision,
        now: BlockNumber,
    ) -> ProposalStatus<BlockNumber> {
        match approved_status {
            ApprovedProposalDecision::PendingExecution => ProposalStatus::PendingExecution(now),
            ApprovedProposalDecision::PendingConstitutionality => {
                ProposalStatus::PendingConstitutionality
            }
        }
    }

    /// Determines whether a proposal in active or pending execution statuses.
    pub fn is_active_or_pending_execution(&self) -> bool {
        self.is_active_proposal() || self.is_pending_execution_proposal()
    }

    /// Detemines whether a proposal in active status.
    pub fn is_active_proposal(&self) -> bool {
        matches!(self.clone(), ProposalStatus::Active)
    }

    /// Determines whether a proposal in pending execution status.
    pub fn is_pending_execution_proposal(&self) -> bool {
        matches!(self.clone(), ProposalStatus::PendingExecution { .. })
    }

    /// Determines whether a proposal in pending contitutionality status.
    pub fn is_pending_constitutionality_proposal(&self) -> bool {
        matches!(self.clone(), ProposalStatus::PendingConstitutionality)
    }
}

/// Decision for the finalized proposal.
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Clone, PartialEq, Eq, Debug)]
pub enum ProposalDecision {
    /// Proposal was withdrawn by its proposer.
    Canceled,

    /// Proposal was canceled by the runtime. No fee applied.
    CanceledByRuntime,

    /// Proposal was vetoed by root.
    Vetoed,

    /// A proposal was rejected.
    Rejected,

    /// A proposal was rejected ans its stake should be slashed.
    Slashed,

    /// Not enough votes and voting period expired.
    Expired,

    /// A proposal was approved.
    Approved(ApprovedProposalDecision),
}

/// Approved proposal decision.
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Clone, PartialEq, Eq, Debug)]
pub enum ApprovedProposalDecision {
    /// A proposal should be executed and grace period is in effect.
    PendingExecution,

    /// The proposal needs more than one council approval.
    PendingConstitutionality,
}

/// Defines execution outcome.
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Clone, PartialEq, Eq, Debug)]
pub enum ExecutionStatus {
    /// Proposal was successfully executed.
    Executed,

    /// Proposal was executed and failed with an error.
    ExecutionFailed {
        /// Error message
        error: Vec<u8>,
    },
}

impl ExecutionStatus {
    /// ExecutionStatus helper, creates ExecutionFailed proposal execution status
    pub fn failed_execution(err: &str) -> ExecutionStatus {
        ExecutionStatus::ExecutionFailed {
            error: err.as_bytes().to_vec(),
        }
    }
}
