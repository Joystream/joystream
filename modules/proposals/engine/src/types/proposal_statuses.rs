use codec::{Decode, Encode};
use rstd::prelude::*;

#[cfg(feature = "std")]
use serde::{Deserialize, Serialize};

/// Current status of the proposal
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Clone, PartialEq, Eq, Debug)]
pub enum ProposalStatus<BlockNumber> {
    /// A new proposal that is available for voting.
    Active,

    /// The proposal decision was made.
    Finalized(FinalizationData<BlockNumber>),
}

impl<BlockNumber> Default for ProposalStatus<BlockNumber> {
    fn default() -> Self {
        ProposalStatus::Active
    }
}

impl<BlockNumber> ProposalStatus<BlockNumber> {
    /// Creates finalized proposal status with provided ProposalDecisionStatus
    pub fn finalized(
        decision_status: ProposalDecisionStatus,
        now: BlockNumber,
    ) -> ProposalStatus<BlockNumber> {
        Self::finalized_with_error(decision_status, None, now)
    }

    /// Creates finalized proposal status with provided ProposalDecisionStatus and error
    pub fn finalized_with_error(
        decision_status: ProposalDecisionStatus,
        finalization_error: Option<&str>,
        now: BlockNumber,
    ) -> ProposalStatus<BlockNumber> {
        ProposalStatus::Finalized(FinalizationData {
            proposal_status: decision_status,
            finalization_error: finalization_error.map(|err| err.as_bytes().to_vec()),
            finalized_at: now,
        })
    }

    /// Creates finalized and approved proposal status with provided ApprovedProposalStatus
    pub fn approved(
        approved_status: ApprovedProposalStatus,
        now: BlockNumber,
    ) -> ProposalStatus<BlockNumber> {
        ProposalStatus::Finalized(FinalizationData {
            proposal_status: ProposalDecisionStatus::Approved(approved_status),
            finalization_error: None,
            finalized_at: now,
        })
    }
}

/// Final proposal status and potential error.
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Clone, PartialEq, Eq, Debug)]
pub struct FinalizationData<BlockNumber> {
    /// Final proposal status
    pub proposal_status: ProposalDecisionStatus,

    /// Proposal finalization block number
    pub finalized_at: BlockNumber,

    /// Error occured during the proposal finalization
    pub finalization_error: Option<Vec<u8>>,
}

impl<BlockNumber> FinalizationData<BlockNumber> {
    /// FinalizationData helper, creates ApprovedProposalStatus
    pub fn create_approved_proposal_status(
        self,
        approved_status: ApprovedProposalStatus,
    ) -> ProposalStatus<BlockNumber> {
        ProposalStatus::Finalized(FinalizationData {
            proposal_status: ProposalDecisionStatus::Approved(approved_status),
            ..self
        })
    }
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
