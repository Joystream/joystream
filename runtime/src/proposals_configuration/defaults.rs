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
// Proposal parameters for the 'Add working group opening' proposal
pub(crate) fn add_working_group_opening_proposal() -> ProposalParameters<BlockNumber, Balance> {
    ProposalParameters {
        voting_period: 72000,
        grace_period: 0,
        approval_quorum_percentage: 60,
        approval_threshold_percentage: 80,
        slashing_quorum_percentage: 60,
        slashing_threshold_percentage: 80,
        required_stake: Some(100_000),
        constitutionality: 1,
    }
}

// Proposal parameters for the 'Fill working group opening' proposal
pub(crate) fn fill_working_group_opening_proposal() -> ProposalParameters<BlockNumber, Balance> {
    ProposalParameters {
        voting_period: 43200,
        grace_period: 0,
        approval_quorum_percentage: 60,
        approval_threshold_percentage: 75,
        slashing_quorum_percentage: 60,
        slashing_threshold_percentage: 80,
        required_stake: Some(50000),
        constitutionality: 1,
    }
}

// Proposal parameters for the 'Set working group budget capacity' proposal
pub(crate) fn set_working_group_budget_capacity_proposal(
) -> ProposalParameters<BlockNumber, Balance> {
    ProposalParameters {
        voting_period: 43200,
        grace_period: 0,
        approval_quorum_percentage: 60,
        approval_threshold_percentage: 75,
        slashing_quorum_percentage: 60,
        slashing_threshold_percentage: 80,
        required_stake: Some(50000),
        constitutionality: 1,
    }
}

// Proposal parameters for the 'Decrease working group leader stake' proposal
pub(crate) fn decrease_working_group_leader_stake_proposal(
) -> ProposalParameters<BlockNumber, Balance> {
    ProposalParameters {
        voting_period: 43200,
        grace_period: 0,
        approval_quorum_percentage: 60,
        approval_threshold_percentage: 75,
        slashing_quorum_percentage: 60,
        slashing_threshold_percentage: 80,
        required_stake: Some(50000),
        constitutionality: 1,
    }
}

// Proposal parameters for the 'Slash working group leader stake' proposal
pub fn slash_working_group_leader_stake_proposal() -> ProposalParameters<BlockNumber, Balance> {
    ProposalParameters {
        voting_period: 43200,
        grace_period: 0,
        approval_quorum_percentage: 60,
        approval_threshold_percentage: 75,
        slashing_quorum_percentage: 60,
        slashing_threshold_percentage: 80,
        required_stake: Some(50000),
        constitutionality: 1,
    }
}

// Proposal parameters for the 'Set working group leader reward' proposal
pub(crate) fn set_working_group_leader_reward_proposal() -> ProposalParameters<BlockNumber, Balance>
{
    ProposalParameters {
        voting_period: 43200,
        grace_period: 0,
        approval_quorum_percentage: 60,
        approval_threshold_percentage: 75,
        slashing_quorum_percentage: 60,
        slashing_threshold_percentage: 80,
        required_stake: Some(50000),
        constitutionality: 1,
    }
}

// Proposal parameters for the 'Terminate working group leader role' proposal
pub(crate) fn terminate_working_group_leader_role_proposal(
) -> ProposalParameters<BlockNumber, Balance> {
    ProposalParameters {
        voting_period: 72200,
        grace_period: 0,
        approval_quorum_percentage: 66,
        approval_threshold_percentage: 80,
        slashing_quorum_percentage: 60,
        slashing_threshold_percentage: 80,
        required_stake: Some(100_000),
        constitutionality: 1,
    }
}

// Proposal parameters for the 'Amend constitution' proposal
pub(crate) fn amend_constitution_proposal() -> ProposalParameters<BlockNumber, Balance> {
    ProposalParameters {
        voting_period: 72200,
        grace_period: 72200,
        approval_quorum_percentage: 80,
        approval_threshold_percentage: 100,
        slashing_quorum_percentage: 60,
        slashing_threshold_percentage: 80,
        required_stake: Some(1_000_000),
        constitutionality: 1,
    }
}

// TODO: decide on parameters
// Proposal parameters for the 'Amend constitution' proposal
pub(crate) fn cancel_working_group_leader_opening() -> ProposalParameters<BlockNumber, Balance> {
    ProposalParameters {
        voting_period: 72200,
        grace_period: 72200,
        approval_quorum_percentage: 80,
        approval_threshold_percentage: 100,
        slashing_quorum_percentage: 60,
        slashing_threshold_percentage: 80,
        required_stake: Some(1_000_000),
        constitutionality: 1,
    }
}
