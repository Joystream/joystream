//! This module contains default parameters for the runtime codex proposals.

use crate::{Balance, BlockNumber, ProposalParameters};

// Proposal parameters for the 'Set Max Validator Count' proposal
pub(crate) fn set_max_validator_count_proposal() -> ProposalParameters<BlockNumber, Balance> {
    ProposalParameters {
        voting_period: 200,
        grace_period: 0,
        approval_quorum_percentage: 66,
        approval_threshold_percentage: 80,
        slashing_quorum_percentage: 60,
        slashing_threshold_percentage: 80,
        required_stake: Some(100_000),
        constitutionality: 1,
    }
}

// Proposal parameters for the 'Runtime Upgrade' proposal
pub(crate) fn runtime_upgrade_proposal() -> ProposalParameters<BlockNumber, Balance> {
    ProposalParameters {
        voting_period: 200,
        grace_period: 200,
        approval_quorum_percentage: 80,
        approval_threshold_percentage: 100,
        slashing_quorum_percentage: 60,
        slashing_threshold_percentage: 80,
        required_stake: Some(1_000_000),
        constitutionality: 1,
    }
}

// Proposal parameters for the 'Signal' proposal
pub(crate) fn signal_proposal() -> ProposalParameters<BlockNumber, Balance> {
    ProposalParameters {
        voting_period: 200,
        grace_period: 0,
        approval_quorum_percentage: 60,
        approval_threshold_percentage: 80,
        slashing_quorum_percentage: 60,
        slashing_threshold_percentage: 80,
        required_stake: Some(25_000),
        constitutionality: 1,
    }
}

// Proposal parameters for the 'Funding Request' proposal
pub(crate) fn funding_request_proposal() -> ProposalParameters<BlockNumber, Balance> {
    ProposalParameters {
        voting_period: 200,
        grace_period: 100,
        approval_quorum_percentage: 60,
        approval_threshold_percentage: 80,
        slashing_quorum_percentage: 60,
        slashing_threshold_percentage: 80,
        required_stake: Some(25_000),
        constitutionality: 1,
    }
}
// Proposal parameters for the 'Create Working Group Lead Opening' proposal
pub(crate) fn create_working_group_lead_opening_proposal(
) -> ProposalParameters<BlockNumber, Balance> {
    ProposalParameters {
        voting_period: 200,
        grace_period: 0,
        approval_quorum_percentage: 60,
        approval_threshold_percentage: 80,
        slashing_quorum_percentage: 60,
        slashing_threshold_percentage: 80,
        required_stake: Some(100_000),
        constitutionality: 1,
    }
}

// Proposal parameters for the 'Fill Working Group Lead Opening' proposal
pub(crate) fn fill_working_group_lead_opening_proposal() -> ProposalParameters<BlockNumber, Balance>
{
    ProposalParameters {
        voting_period: 200,
        grace_period: 0,
        approval_quorum_percentage: 60,
        approval_threshold_percentage: 75,
        slashing_quorum_percentage: 60,
        slashing_threshold_percentage: 80,
        required_stake: Some(50_000),
        constitutionality: 1,
    }
}

// Proposal parameters for the 'Update Working Group Budget' proposal
pub(crate) fn update_working_group_budget_proposal() -> ProposalParameters<BlockNumber, Balance> {
    ProposalParameters {
        voting_period: 200,
        grace_period: 0,
        approval_quorum_percentage: 60,
        approval_threshold_percentage: 75,
        slashing_quorum_percentage: 60,
        slashing_threshold_percentage: 80,
        required_stake: Some(50_000),
        constitutionality: 1,
    }
}

// Proposal parameters for the 'Decrease Working Group Lead Stake' proposal
pub(crate) fn decrease_working_group_lead_stake_proposal(
) -> ProposalParameters<BlockNumber, Balance> {
    ProposalParameters {
        voting_period: 200,
        grace_period: 0,
        approval_quorum_percentage: 60,
        approval_threshold_percentage: 75,
        slashing_quorum_percentage: 60,
        slashing_threshold_percentage: 80,
        required_stake: Some(50_000),
        constitutionality: 1,
    }
}

// Proposal parameters for the 'Slash Working Group Lead' proposal
pub fn slash_working_group_lead_proposal() -> ProposalParameters<BlockNumber, Balance> {
    ProposalParameters {
        voting_period: 200,
        grace_period: 0,
        approval_quorum_percentage: 60,
        approval_threshold_percentage: 75,
        slashing_quorum_percentage: 60,
        slashing_threshold_percentage: 80,
        required_stake: Some(50_000),
        constitutionality: 1,
    }
}

// Proposal parameters for the 'Set Working Group Lead Reward' proposal
pub(crate) fn set_working_group_lead_reward_proposal() -> ProposalParameters<BlockNumber, Balance> {
    ProposalParameters {
        voting_period: 200,
        grace_period: 0,
        approval_quorum_percentage: 60,
        approval_threshold_percentage: 75,
        slashing_quorum_percentage: 60,
        slashing_threshold_percentage: 80,
        required_stake: Some(50_000),
        constitutionality: 1,
    }
}

// Proposal parameters for the 'Terminate Working Group Lead' proposal
pub(crate) fn terminate_working_group_lead_proposal() -> ProposalParameters<BlockNumber, Balance> {
    ProposalParameters {
        voting_period: 200,
        grace_period: 0,
        approval_quorum_percentage: 66,
        approval_threshold_percentage: 80,
        slashing_quorum_percentage: 60,
        slashing_threshold_percentage: 80,
        required_stake: Some(100_000),
        constitutionality: 1,
    }
}

// Proposal parameters for the 'Amend Constitution' proposal
pub(crate) fn amend_constitution_proposal() -> ProposalParameters<BlockNumber, Balance> {
    ProposalParameters {
        voting_period: 200,
        grace_period: 100,
        approval_quorum_percentage: 80,
        approval_threshold_percentage: 100,
        slashing_quorum_percentage: 60,
        slashing_threshold_percentage: 80,
        required_stake: Some(1_000_000),
        constitutionality: 2,
    }
}

// Proposal parameters for the 'Cancel Working Group Lead Opening' proposal
pub(crate) fn cancel_working_group_lead_opening_proposal(
) -> ProposalParameters<BlockNumber, Balance> {
    ProposalParameters {
        voting_period: 200,
        grace_period: 0,
        approval_quorum_percentage: 60,
        approval_threshold_percentage: 75,
        slashing_quorum_percentage: 60,
        slashing_threshold_percentage: 80,
        required_stake: Some(50_000),
        constitutionality: 1,
    }
}

// Proposal parameters for the 'Set Membership Price' proposal
pub(crate) fn set_membership_price_proposal() -> ProposalParameters<BlockNumber, Balance> {
    ProposalParameters {
        voting_period: 200,
        grace_period: 100,
        approval_quorum_percentage: 60,
        approval_threshold_percentage: 75,
        slashing_quorum_percentage: 60,
        slashing_threshold_percentage: 80,
        required_stake: Some(50_000),
        constitutionality: 1,
    }
}

// Proposal parameters for the 'Set Council Budget Increment' proposal
pub(crate) fn set_council_budget_increment_proposal() -> ProposalParameters<BlockNumber, Balance> {
    ProposalParameters {
        voting_period: 200,
        grace_period: 100,
        approval_quorum_percentage: 66,
        approval_threshold_percentage: 80,
        slashing_quorum_percentage: 60,
        slashing_threshold_percentage: 80,
        required_stake: Some(200_000),
        constitutionality: 1,
    }
}

// Proposal parameters for the 'Set Councilor Reward' proposal
pub(crate) fn set_councilor_reward_proposal() -> ProposalParameters<BlockNumber, Balance> {
    ProposalParameters {
        voting_period: 200,
        grace_period: 100, // A council term
        approval_quorum_percentage: 66,
        approval_threshold_percentage: 80,
        slashing_quorum_percentage: 60,
        slashing_threshold_percentage: 80,
        required_stake: Some(200_000),
        constitutionality: 2,
    }
}

// Proposal parameters for the 'Set Initial Invitation Balance' proposal
pub(crate) fn set_initial_invitation_balance_proposal() -> ProposalParameters<BlockNumber, Balance>
{
    ProposalParameters {
        voting_period: 200,
        grace_period: 100,
        approval_quorum_percentage: 60,
        approval_threshold_percentage: 75,
        slashing_quorum_percentage: 60,
        slashing_threshold_percentage: 80,
        required_stake: Some(50_000),
        constitutionality: 1,
    }
}

// Proposal parameters for the 'Set Initial Invitation Quota' proposal
// The parameter for this proposal still have to be more carefully reviewed
pub(crate) fn set_membership_lead_invitation_quota_proposal(
) -> ProposalParameters<BlockNumber, Balance> {
    ProposalParameters {
        voting_period: 200,
        grace_period: 100,
        approval_quorum_percentage: 60,
        approval_threshold_percentage: 75,
        slashing_quorum_percentage: 60,
        slashing_threshold_percentage: 80,
        required_stake: Some(50_000),
        constitutionality: 1,
    }
}

// Proposal parameters for the 'Set Referral Cut' proposal
pub(crate) fn set_referral_cut_proposal() -> ProposalParameters<BlockNumber, Balance> {
    ProposalParameters {
        voting_period: 200,
        grace_period: 100,
        approval_quorum_percentage: 60,
        approval_threshold_percentage: 75,
        slashing_quorum_percentage: 60,
        slashing_threshold_percentage: 80,
        required_stake: Some(50_000),
        constitutionality: 1,
    }
}

// Proposal parameters for the 'Set Initial Invitation Count' proposal
pub(crate) fn set_invitation_count_proposal() -> ProposalParameters<BlockNumber, Balance> {
    ProposalParameters {
        voting_period: 200,
        grace_period: 100,
        approval_quorum_percentage: 60,
        approval_threshold_percentage: 75,
        slashing_quorum_percentage: 60,
        slashing_threshold_percentage: 80,
        required_stake: Some(50_000),
        constitutionality: 1,
    }
}

// Proposal parameters for the 'Create Blog Post' proposal
pub(crate) fn create_blog_post_proposal() -> ProposalParameters<BlockNumber, Balance> {
    ProposalParameters {
        voting_period: 200,
        grace_period: 100,
        approval_quorum_percentage: 60,
        approval_threshold_percentage: 80,
        slashing_quorum_percentage: 60,
        slashing_threshold_percentage: 80,
        required_stake: Some(25_000),
        constitutionality: 1,
    }
}

// Proposal parameters for the 'Edit Blog Post' proposal
pub(crate) fn edit_blog_post_proposal() -> ProposalParameters<BlockNumber, Balance> {
    ProposalParameters {
        voting_period: 200,
        grace_period: 100,
        approval_quorum_percentage: 60,
        approval_threshold_percentage: 80,
        slashing_quorum_percentage: 60,
        slashing_threshold_percentage: 80,
        required_stake: Some(25_000),
        constitutionality: 1,
    }
}

// Proposal parameters for the 'Lock Blog Post' proposal
pub(crate) fn lock_blog_post_proposal() -> ProposalParameters<BlockNumber, Balance> {
    ProposalParameters {
        voting_period: 200,
        grace_period: 100,
        approval_quorum_percentage: 60,
        approval_threshold_percentage: 80,
        slashing_quorum_percentage: 60,
        slashing_threshold_percentage: 80,
        required_stake: Some(25_000),
        constitutionality: 1,
    }
}

// Proposal parameters for the 'Unlock Blog Post' proposal
pub(crate) fn unlock_blog_post_proposal() -> ProposalParameters<BlockNumber, Balance> {
    ProposalParameters {
        voting_period: 200,
        grace_period: 100,
        approval_quorum_percentage: 60,
        approval_threshold_percentage: 80,
        slashing_quorum_percentage: 60,
        slashing_threshold_percentage: 80,
        required_stake: Some(25_000),
        constitutionality: 1,
    }
}

// Proposal parameters for the 'Veto Proposal' proposal
pub(crate) fn veto_proposal_proposal() -> ProposalParameters<BlockNumber, Balance> {
    ProposalParameters {
        // Doesn't make sense to be longer than longest grace period of all other proposals?
        voting_period: 200,
        grace_period: 0,
        approval_quorum_percentage: 75,
        approval_threshold_percentage: 80,
        slashing_quorum_percentage: 60,
        slashing_threshold_percentage: 66,
        required_stake: Some(1_000_000),
        constitutionality: 1,
    }
}
