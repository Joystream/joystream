#![warn(missing_docs)]

use codec::{Decode, Encode};
#[cfg(feature = "std")]
use serde::{Deserialize, Serialize};
use sp_std::vec::Vec;

use crate::ActiveStake;

/// Current status of the proposal
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Clone, PartialEq, Eq, Debug)]
pub enum ProposalStatus<BlockNumber, StakeId, AccountId> {
    /// A new proposal status that is available for voting (with optional stake data).
    Active(Option<ActiveStake<StakeId, AccountId>>),

    /// The proposal decision was made.
    Finalized(FinalizationData<BlockNumber, StakeId, AccountId>),
}

impl<BlockNumber, StakeId, AccountId> Default for ProposalStatus<BlockNumber, StakeId, AccountId> {
    fn default() -> Self {
        ProposalStatus::Active(None)
    }
}

impl<BlockNumber, StakeId, AccountId> ProposalStatus<BlockNumber, StakeId, AccountId> {
    /// Creates finalized proposal status with provided ProposalDecisionStatus
    pub fn finalized_successfully(
        decision_status: ProposalDecisionStatus,
        now: BlockNumber,
    ) -> ProposalStatus<BlockNumber, StakeId, AccountId> {
        Self::finalized(decision_status, None, None, now)
    }

    /// Creates finalized proposal status with provided ProposalDecisionStatus and error
    pub fn finalized(
        decision_status: ProposalDecisionStatus,
        encoded_unstaking_error_due_to_broken_runtime: Option<&str>,
        active_stake: Option<ActiveStake<StakeId, AccountId>>,
        now: BlockNumber,
    ) -> ProposalStatus<BlockNumber, StakeId, AccountId> {
        // drop the stake information if there were no errors on unstaking
        let actual_stake = if encoded_unstaking_error_due_to_broken_runtime.is_some() {
            active_stake
        } else {
            None
        };
        ProposalStatus::Finalized(FinalizationData {
            proposal_status: decision_status,
            encoded_unstaking_error_due_to_broken_runtime:
                encoded_unstaking_error_due_to_broken_runtime.map(|err| err.as_bytes().to_vec()),
            finalized_at: now,
            stake_data_after_unstaking_error: actual_stake,
        })
    }

    /// Creates finalized and approved proposal status with provided ApprovedProposalStatus
    pub fn approved(
        approved_status: ApprovedProposalStatus,
        now: BlockNumber,
    ) -> ProposalStatus<BlockNumber, StakeId, AccountId> {
        ProposalStatus::Finalized(FinalizationData {
            proposal_status: ProposalDecisionStatus::Approved(approved_status),
            encoded_unstaking_error_due_to_broken_runtime: None,
            finalized_at: now,
            stake_data_after_unstaking_error: None,
        })
    }
}

/// Final proposal status and potential error.
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Clone, PartialEq, Eq, Debug)]
pub struct FinalizationData<BlockNumber, StakeId, AccountId> {
    /// Final proposal status
    pub proposal_status: ProposalDecisionStatus,

    /// Proposal finalization block number
    pub finalized_at: BlockNumber,

    /// Error occured during the proposal finalization - unstaking failed in the stake module
    pub encoded_unstaking_error_due_to_broken_runtime: Option<Vec<u8>>,

    /// Stake data for the proposal, filled if the unstaking wasn't successful
    pub stake_data_after_unstaking_error: Option<ActiveStake<StakeId, AccountId>>,
}

impl<BlockNumber, StakeId, AccountId> FinalizationData<BlockNumber, StakeId, AccountId> {
    /// FinalizationData helper, creates ApprovedProposalStatus
    pub fn create_approved_proposal_status(
        self,
        approved_status: ApprovedProposalStatus,
    ) -> ProposalStatus<BlockNumber, StakeId, AccountId> {
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

#[cfg(test)]
mod tests {
    use crate::{
        ActiveStake, ApprovedProposalStatus, FinalizationData, ProposalDecisionStatus,
        ProposalStatus,
    };

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
        let msg = "error";
        let block_number = 20;
        let stake = ActiveStake {
            stake_id: 50,
            source_account_id: 2,
        };

        let proposal_status = ProposalStatus::finalized(
            ProposalDecisionStatus::Slashed,
            Some(msg),
            Some(stake),
            block_number,
        );

        assert_eq!(
            ProposalStatus::Finalized(FinalizationData {
                proposal_status: ProposalDecisionStatus::Slashed,
                finalized_at: block_number,
                encoded_unstaking_error_due_to_broken_runtime: Some(msg.as_bytes().to_vec()),
                stake_data_after_unstaking_error: Some(stake)
            }),
            proposal_status
        );
    }
}
