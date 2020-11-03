//! This module contains default parameters for the runtime codex proposals.

use crate::{Balance, BlockNumber, ProposalParameters};

// Proposal parameters for the 'Set validator count' proposal
pub(crate) fn set_validator_count_proposal() -> ProposalParameters<BlockNumber, Balance> {
    ProposalParameters {
        voting_period: 43200,
        grace_period: 0,
        approval_quorum_percentage: 66,
        approval_threshold_percentage: 80,
        slashing_quorum_percentage: 60,
        slashing_threshold_percentage: 80,
        required_stake: Some(100_000),
        constitutionality: 1,
    }
}

// Proposal parameters for the upgrade runtime proposal
pub(crate) fn runtime_upgrade_proposal() -> ProposalParameters<BlockNumber, Balance> {
    ProposalParameters {
        voting_period: 72000,
        grace_period: 72000,
        approval_quorum_percentage: 80,
        approval_threshold_percentage: 100,
        slashing_quorum_percentage: 60,
        slashing_threshold_percentage: 80,
        required_stake: Some(1_000_000),
        constitutionality: 1,
    }
}

// Proposal parameters for the text proposal
pub(crate) fn text_proposal() -> ProposalParameters<BlockNumber, Balance> {
    ProposalParameters {
        voting_period: 72000,
        grace_period: 0,
        approval_quorum_percentage: 60,
        approval_threshold_percentage: 80,
        slashing_quorum_percentage: 60,
        slashing_threshold_percentage: 80,
        required_stake: Some(25000),
        constitutionality: 1,
    }
}

// Proposal parameters for the 'Spending' proposal
pub(crate) fn spending_proposal() -> ProposalParameters<BlockNumber, Balance> {
    ProposalParameters {
        voting_period: 72000,
        grace_period: 14400,
        approval_quorum_percentage: 60,
        approval_threshold_percentage: 80,
        slashing_quorum_percentage: 60,
        slashing_threshold_percentage: 80,
        required_stake: Some(25000),
        constitutionality: 1,
    }
}
