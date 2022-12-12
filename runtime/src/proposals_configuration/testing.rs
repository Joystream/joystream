//! This module contains testing parameters for the runtime codex proposals,
//! suitable for automated integration testing.

use crate::{currency, Balance, BlockNumber, ProposalParameters};

// Proposal parameters for the 'Set Max Validator Count' proposal
pub(crate) fn set_max_validator_count_proposal() -> ProposalParameters<BlockNumber, Balance> {
    ProposalParameters {
        voting_period: 30,
        grace_period: 0,
        approval_quorum_percentage: 66,
        approval_threshold_percentage: 80,
        slashing_quorum_percentage: 60,
        slashing_threshold_percentage: 80,
        required_stake: Some(currency::DOLLARS.saturating_mul(100)),
        constitutionality: 1,
    }
}

// Proposal parameters for the 'Runtime Upgrade' proposal
pub(crate) fn runtime_upgrade_proposal() -> ProposalParameters<BlockNumber, Balance> {
    ProposalParameters {
        voting_period: 100,
        grace_period: 40,
        approval_quorum_percentage: 80,
        approval_threshold_percentage: 100,
        slashing_quorum_percentage: 60,
        slashing_threshold_percentage: 80,
        required_stake: Some(currency::DOLLARS.saturating_mul(1000)),
        constitutionality: 2,
    }
}

// Proposal parameters for the 'Signal' proposal
pub(crate) fn signal_proposal() -> ProposalParameters<BlockNumber, Balance> {
    ProposalParameters {
        voting_period: 30,
        grace_period: 0,
        approval_quorum_percentage: 60,
        approval_threshold_percentage: 80,
        slashing_quorum_percentage: 60,
        slashing_threshold_percentage: 80,
        required_stake: Some(currency::DOLLARS.saturating_mul(25)),
        constitutionality: 1,
    }
}

// Proposal parameters for the 'Funding Request' proposal
pub(crate) fn funding_request_proposal() -> ProposalParameters<BlockNumber, Balance> {
    ProposalParameters {
        voting_period: 30,
        grace_period: 20,
        approval_quorum_percentage: 60,
        approval_threshold_percentage: 80,
        slashing_quorum_percentage: 60,
        slashing_threshold_percentage: 80,
        required_stake: Some(currency::DOLLARS.saturating_mul(25)),
        constitutionality: 1,
    }
}
// Proposal parameters for the 'Create Working Group Lead Opening' proposal
pub(crate) fn create_working_group_lead_opening_proposal(
) -> ProposalParameters<BlockNumber, Balance> {
    ProposalParameters {
        voting_period: 30,
        grace_period: 0,
        approval_quorum_percentage: 60,
        approval_threshold_percentage: 80,
        slashing_quorum_percentage: 60,
        slashing_threshold_percentage: 80,
        required_stake: Some(currency::DOLLARS.saturating_mul(100)),
        constitutionality: 1,
    }
}

// Proposal parameters for the 'Fill Working Group Lead Opening' proposal
pub(crate) fn fill_working_group_lead_opening_proposal() -> ProposalParameters<BlockNumber, Balance>
{
    ProposalParameters {
        voting_period: 30,
        grace_period: 0,
        approval_quorum_percentage: 60,
        approval_threshold_percentage: 75,
        slashing_quorum_percentage: 60,
        slashing_threshold_percentage: 80,
        required_stake: Some(currency::DOLLARS.saturating_mul(50)),
        constitutionality: 1,
    }
}

// Proposal parameters for the 'Update Working Group Budget' proposal
pub(crate) fn update_working_group_budget_proposal() -> ProposalParameters<BlockNumber, Balance> {
    ProposalParameters {
        voting_period: 30,
        grace_period: 0,
        approval_quorum_percentage: 60,
        approval_threshold_percentage: 75,
        slashing_quorum_percentage: 60,
        slashing_threshold_percentage: 80,
        required_stake: Some(currency::DOLLARS.saturating_mul(50)),
        constitutionality: 1,
    }
}

// Proposal parameters for the 'Decrease Working Group Lead Stake' proposal
pub(crate) fn decrease_working_group_lead_stake_proposal(
) -> ProposalParameters<BlockNumber, Balance> {
    ProposalParameters {
        voting_period: 30,
        grace_period: 0,
        approval_quorum_percentage: 60,
        approval_threshold_percentage: 75,
        slashing_quorum_percentage: 60,
        slashing_threshold_percentage: 80,
        required_stake: Some(currency::DOLLARS.saturating_mul(50)),
        constitutionality: 1,
    }
}

// Proposal parameters for the 'Slash Working Group Lead' proposal
pub const fn slash_working_group_lead_proposal() -> ProposalParameters<BlockNumber, Balance> {
    ProposalParameters {
        voting_period: 30,
        grace_period: 0,
        approval_quorum_percentage: 60,
        approval_threshold_percentage: 75,
        slashing_quorum_percentage: 60,
        slashing_threshold_percentage: 80,
        required_stake: Some(currency::DOLLARS.saturating_mul(50)),
        constitutionality: 1,
    }
}

// Proposal parameters for the 'Set Working Group Lead Reward' proposal
pub(crate) fn set_working_group_lead_reward_proposal() -> ProposalParameters<BlockNumber, Balance> {
    ProposalParameters {
        voting_period: 30,
        grace_period: 0,
        approval_quorum_percentage: 60,
        approval_threshold_percentage: 75,
        slashing_quorum_percentage: 60,
        slashing_threshold_percentage: 80,
        required_stake: Some(currency::DOLLARS.saturating_mul(50)),
        constitutionality: 1,
    }
}

// Proposal parameters for the 'Terminate Working Group Lead' proposal
pub(crate) fn terminate_working_group_lead_proposal() -> ProposalParameters<BlockNumber, Balance> {
    ProposalParameters {
        voting_period: 30,
        grace_period: 0,
        approval_quorum_percentage: 66,
        approval_threshold_percentage: 80,
        slashing_quorum_percentage: 60,
        slashing_threshold_percentage: 80,
        required_stake: Some(currency::DOLLARS.saturating_mul(100)),
        constitutionality: 1,
    }
}

// Proposal parameters for the 'Amend Constitution' proposal
pub(crate) fn amend_constitution_proposal() -> ProposalParameters<BlockNumber, Balance> {
    ProposalParameters {
        voting_period: 30,
        grace_period: 40,
        approval_quorum_percentage: 80,
        approval_threshold_percentage: 100,
        slashing_quorum_percentage: 60,
        slashing_threshold_percentage: 80,
        required_stake: Some(currency::DOLLARS.saturating_mul(1000)),
        constitutionality: 2,
    }
}

// Proposal parameters for the 'Cancel Working Group Lead Opening' proposal
pub(crate) fn cancel_working_group_lead_opening_proposal(
) -> ProposalParameters<BlockNumber, Balance> {
    ProposalParameters {
        voting_period: 30,
        grace_period: 0,
        approval_quorum_percentage: 60,
        approval_threshold_percentage: 75,
        slashing_quorum_percentage: 60,
        slashing_threshold_percentage: 80,
        required_stake: Some(currency::DOLLARS.saturating_mul(50)),
        constitutionality: 1,
    }
}

// Proposal parameters for the 'Set Membership Price' proposal
pub(crate) fn set_membership_price_proposal() -> ProposalParameters<BlockNumber, Balance> {
    ProposalParameters {
        voting_period: 30,
        grace_period: 20,
        approval_quorum_percentage: 60,
        approval_threshold_percentage: 75,
        slashing_quorum_percentage: 60,
        slashing_threshold_percentage: 80,
        required_stake: Some(currency::DOLLARS.saturating_mul(50)),
        constitutionality: 1,
    }
}

// Proposal parameters for the 'Set Council Budget Increment' proposal
pub(crate) fn set_council_budget_increment_proposal() -> ProposalParameters<BlockNumber, Balance> {
    ProposalParameters {
        voting_period: 30,
        grace_period: 20,
        approval_quorum_percentage: 66,
        approval_threshold_percentage: 80,
        slashing_quorum_percentage: 60,
        slashing_threshold_percentage: 80,
        required_stake: Some(currency::DOLLARS.saturating_mul(200)),
        constitutionality: 1,
    }
}

// Proposal parameters for the 'Set Councilor Reward' proposal
pub(crate) fn set_councilor_reward_proposal() -> ProposalParameters<BlockNumber, Balance> {
    ProposalParameters {
        voting_period: 30,
        grace_period: 40, // A council term
        approval_quorum_percentage: 66,
        approval_threshold_percentage: 80,
        slashing_quorum_percentage: 60,
        slashing_threshold_percentage: 80,
        required_stake: Some(currency::DOLLARS.saturating_mul(200)),
        constitutionality: 2,
    }
}

// Proposal parameters for the 'Set Initial Invitation Balance' proposal
pub(crate) fn set_initial_invitation_balance_proposal() -> ProposalParameters<BlockNumber, Balance>
{
    ProposalParameters {
        voting_period: 30,
        grace_period: 20,
        approval_quorum_percentage: 60,
        approval_threshold_percentage: 75,
        slashing_quorum_percentage: 60,
        slashing_threshold_percentage: 80,
        required_stake: Some(currency::DOLLARS.saturating_mul(50)),
        constitutionality: 1,
    }
}

// Proposal parameters for the 'Set Initial Invitation Quota' proposal
// The parameter for this proposal still have to be more carefully reviewed
pub(crate) fn set_membership_lead_invitation_quota_proposal(
) -> ProposalParameters<BlockNumber, Balance> {
    ProposalParameters {
        voting_period: 30,
        grace_period: 20,
        approval_quorum_percentage: 60,
        approval_threshold_percentage: 75,
        slashing_quorum_percentage: 60,
        slashing_threshold_percentage: 80,
        required_stake: Some(currency::DOLLARS.saturating_mul(50)),
        constitutionality: 1,
    }
}

// Proposal parameters for the 'Set Referral Cut' proposal
pub(crate) fn set_referral_cut_proposal() -> ProposalParameters<BlockNumber, Balance> {
    ProposalParameters {
        voting_period: 30,
        grace_period: 20,
        approval_quorum_percentage: 60,
        approval_threshold_percentage: 75,
        slashing_quorum_percentage: 60,
        slashing_threshold_percentage: 80,
        required_stake: Some(currency::DOLLARS.saturating_mul(50)),
        constitutionality: 1,
    }
}

// Proposal parameters for the 'Set Initial Invitation Count' proposal
pub(crate) fn set_invitation_count_proposal() -> ProposalParameters<BlockNumber, Balance> {
    ProposalParameters {
        voting_period: 30,
        grace_period: 20,
        approval_quorum_percentage: 60,
        approval_threshold_percentage: 75,
        slashing_quorum_percentage: 60,
        slashing_threshold_percentage: 80,
        required_stake: Some(currency::DOLLARS.saturating_mul(50)),
        constitutionality: 1,
    }
}

// Proposal parameters for the 'Veto Proposal' proposal
pub(crate) fn veto_proposal_proposal() -> ProposalParameters<BlockNumber, Balance> {
    ProposalParameters {
        // Doesn't make sense to be longer than longest grace period of all other proposals?
        voting_period: 30,
        grace_period: 0,
        approval_quorum_percentage: 75,
        approval_threshold_percentage: 80,
        slashing_quorum_percentage: 60,
        slashing_threshold_percentage: 66,
        required_stake: Some(currency::DOLLARS.saturating_mul(1000)),
        constitutionality: 1,
    }
}

// Proposal parameters for the 'Update global NFT limit' proposal
pub(crate) fn update_global_nft_limit_proposal() -> ProposalParameters<BlockNumber, Balance> {
    ProposalParameters {
        voting_period: 30,
        grace_period: 0,
        approval_quorum_percentage: 60,
        approval_threshold_percentage: 80,
        slashing_quorum_percentage: 60,
        slashing_threshold_percentage: 80,
        required_stake: Some(currency::DOLLARS.saturating_mul(100)),
        constitutionality: 1,
    }
}

// Proposal parameters for the 'Update Channel Payouts' proposal
pub(crate) fn update_channel_payouts_proposal() -> ProposalParameters<BlockNumber, Balance> {
    ProposalParameters {
        voting_period: 30,
        grace_period: 0,
        approval_quorum_percentage: 60,
        approval_threshold_percentage: 80,
        slashing_quorum_percentage: 60,
        slashing_threshold_percentage: 80,
        required_stake: Some(currency::DOLLARS.saturating_mul(100)),
        constitutionality: 1,
    }
}

// Proposal parameters for the 'Update Max Yearly Patronage Rate' proposal
pub(crate) fn update_max_yearly_patronage_rate_proposal() -> ProposalParameters<BlockNumber, Balance>
{
    ProposalParameters {
        voting_period: days!(7),
        grace_period: days!(1),
        approval_quorum_percentage: TWO_OUT_OF_THREE,
        approval_threshold_percentage: ALL,
        slashing_quorum_percentage: ALL,
        slashing_threshold_percentage: ALL,
        required_stake: Some(dollars!(100)),
        constitutionality: 1,
    }
}
