#![warn(missing_docs)]

use codec::{Decode, Encode};
#[cfg(feature = "std")]
use serde::{Deserialize, Serialize};
use sp_std::vec::Vec;

use crate::ActiveStake;

/// Current status of the proposal
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Clone, PartialEq, Eq, Debug)]
pub enum ProposalStatus<BlockNumber, AccountId> {
    /// A new proposal status that is available for voting (with optional stake data).
    Active(Option<ActiveStake<AccountId>>),

    /// The proposal decision was made.
    Finalized(FinalizationData<BlockNumber>),
}

impl<BlockNumber, AccountId> Default for ProposalStatus<BlockNumber, AccountId> {
    fn default() -> Self {
        ProposalStatus::Active(None)
    }
}

impl<BlockNumber, AccountId> ProposalStatus<BlockNumber, AccountId> {
    /// Creates finalized proposal status with provided ProposalDecisionStatus.
    pub fn finalized(
        decision_status: ProposalDecisionStatus,
        now: BlockNumber,
    ) -> ProposalStatus<BlockNumber, AccountId> {
        ProposalStatus::Finalized(FinalizationData {
            proposal_status: decision_status,
            finalized_at: now,
        })
    }

    /// Creates finalized and approved proposal status with provided ApprovedProposalStatus
    pub fn approved(
        approved_status: ApprovedProposalStatus,
        now: BlockNumber,
    ) -> ProposalStatus<BlockNumber, AccountId> {
        ProposalStatus::Finalized(FinalizationData {
            proposal_status: ProposalDecisionStatus::Approved(approved_status),
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

#[cfg(test)]
mod tests {
    use crate::{ApprovedProposalStatus, FinalizationData, ProposalDecisionStatus, ProposalStatus};

    #[test]
    fn approved_proposal_status_helper_succeeds() {
        let msg = "error";

        assert_eq!(
            ApprovedProposalStatus::failed_execution(&msg),
            ApprovedProposalStatus::ExecutionFailed {
                error: msg.as_bytes().to_vec()
            }
        );
    }

    #[test]
    fn finalized_proposal_status_helper_succeeds() {
        let block_number = 20;

        let proposal_status =
            ProposalStatus::<u64, u64>::finalized(ProposalDecisionStatus::Slashed, block_number);

        assert_eq!(
            ProposalStatus::Finalized(FinalizationData {
                proposal_status: ProposalDecisionStatus::Slashed,
                finalized_at: block_number,
            }),
            proposal_status
        );
    }
}
