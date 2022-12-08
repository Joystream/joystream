//! This module contains default "production" parameters configuration for the runtime codex proposals.

use crate::{
    currency, days, dollars, hours, Balance, BlockNumber, CouncilSize, ExpectedBlockTime,
    ProposalParameters,
};
use static_assertions::const_assert;

/// Some useful labels
const TWO_OUT_OF_THREE: u32 = 66; // at least 2 in council of 3, which is 2/3 = 66.66..% > 66%
const ALL: u32 = 100;

// This assert is here to remind anyone who tries to touch updated `CouncilSize` that parameters
// like `TWO_OUT_OF_THREE` need to be updated as well.
const_assert!(CouncilSize::get() == 3);

// Proposal parameters for the 'Set Max Validator Count' proposal
pub(crate) fn set_max_validator_count_proposal() -> ProposalParameters<BlockNumber, Balance> {
    ProposalParameters {
        voting_period: days!(7),
        grace_period: days!(5),
        approval_quorum_percentage: ALL,
        approval_threshold_percentage: ALL,
        slashing_quorum_percentage: ALL,
        slashing_threshold_percentage: ALL,
        required_stake: Some(dollars!(10_000)),
        constitutionality: 3,
    }
}

// Proposal parameters for the 'Runtime Upgrade' proposal
pub(crate) fn runtime_upgrade_proposal() -> ProposalParameters<BlockNumber, Balance> {
    ProposalParameters {
        voting_period: days!(7),
        grace_period: days!(5),
        approval_quorum_percentage: ALL,
        approval_threshold_percentage: ALL,
        slashing_quorum_percentage: ALL,
        slashing_threshold_percentage: ALL,
        required_stake: Some(dollars!(10_000)),
        constitutionality: 4,
    }
}

// Proposal parameters for the 'Signal' proposal
pub(crate) fn signal_proposal() -> ProposalParameters<BlockNumber, Balance> {
    ProposalParameters {
        voting_period: days!(3),
        grace_period: hours!(2),
        approval_quorum_percentage: ALL,
        approval_threshold_percentage: ALL,
        slashing_quorum_percentage: ALL,
        slashing_threshold_percentage: ALL,
        required_stake: Some(dollars!(1_000)),
        constitutionality: 1,
    }
}

// Proposal parameters for the 'Funding Request' proposal
pub(crate) fn funding_request_proposal() -> ProposalParameters<BlockNumber, Balance> {
    ProposalParameters {
        voting_period: days!(3),
        grace_period: hours!(2),
        approval_quorum_percentage: TWO_OUT_OF_THREE,
        approval_threshold_percentage: TWO_OUT_OF_THREE,
        slashing_quorum_percentage: ALL,
        slashing_threshold_percentage: ALL,
        required_stake: Some(dollars!(10)),
        constitutionality: 1,
    }
}
// Proposal parameters for the 'Create Working Group Lead Opening' proposal
pub(crate) fn create_working_group_lead_opening_proposal(
) -> ProposalParameters<BlockNumber, Balance> {
    ProposalParameters {
        voting_period: days!(3),
        grace_period: hours!(2),
        approval_quorum_percentage: TWO_OUT_OF_THREE,
        approval_threshold_percentage: TWO_OUT_OF_THREE,
        slashing_quorum_percentage: ALL,
        slashing_threshold_percentage: ALL,
        required_stake: Some(dollars!(100)),
        constitutionality: 1,
    }
}

// Proposal parameters for the 'Fill Working Group Lead Opening' proposal
pub(crate) fn fill_working_group_lead_opening_proposal() -> ProposalParameters<BlockNumber, Balance>
{
    ProposalParameters {
        voting_period: days!(3),
        grace_period: hours!(2),
        approval_quorum_percentage: TWO_OUT_OF_THREE,
        approval_threshold_percentage: TWO_OUT_OF_THREE,
        slashing_quorum_percentage: ALL,
        slashing_threshold_percentage: ALL,
        required_stake: Some(dollars!(50)),
        constitutionality: 1,
    }
}

// Proposal parameters for the 'Update Working Group Budget' proposal
pub(crate) fn update_working_group_budget_proposal() -> ProposalParameters<BlockNumber, Balance> {
    ProposalParameters {
        voting_period: days!(3),
        grace_period: hours!(2),
        approval_quorum_percentage: TWO_OUT_OF_THREE,
        approval_threshold_percentage: TWO_OUT_OF_THREE,
        slashing_quorum_percentage: ALL,
        slashing_threshold_percentage: ALL,
        required_stake: Some(dollars!(50)),
        constitutionality: 1,
    }
}

// Proposal parameters for the 'Decrease Working Group Lead Stake' proposal
pub(crate) fn decrease_working_group_lead_stake_proposal(
) -> ProposalParameters<BlockNumber, Balance> {
    ProposalParameters {
        voting_period: days!(3),
        grace_period: hours!(2),
        approval_quorum_percentage: ALL,
        approval_threshold_percentage: ALL,
        slashing_quorum_percentage: ALL,
        slashing_threshold_percentage: ALL,
        required_stake: Some(dollars!(50)),
        constitutionality: 1,
    }
}

// Proposal parameters for the 'Slash Working Group Lead' proposal
pub const fn slash_working_group_lead_proposal() -> ProposalParameters<BlockNumber, Balance> {
    ProposalParameters {
        voting_period: days!(3),
        grace_period: hours!(2),
        approval_quorum_percentage: TWO_OUT_OF_THREE,
        approval_threshold_percentage: TWO_OUT_OF_THREE,
        slashing_quorum_percentage: ALL,
        slashing_threshold_percentage: ALL,
        required_stake: Some(dollars!(50)),
        constitutionality: 1,
    }
}

// Proposal parameters for the 'Set Working Group Lead Reward' proposal
pub(crate) fn set_working_group_lead_reward_proposal() -> ProposalParameters<BlockNumber, Balance> {
    ProposalParameters {
        voting_period: days!(3),
        grace_period: hours!(2),
        approval_quorum_percentage: TWO_OUT_OF_THREE,
        approval_threshold_percentage: TWO_OUT_OF_THREE,
        slashing_quorum_percentage: ALL,
        slashing_threshold_percentage: ALL,
        required_stake: Some(dollars!(50)),
        constitutionality: 1,
    }
}

// Proposal parameters for the 'Terminate Working Group Lead' proposal
pub(crate) fn terminate_working_group_lead_proposal() -> ProposalParameters<BlockNumber, Balance> {
    ProposalParameters {
        voting_period: days!(3),
        grace_period: hours!(2),
        approval_quorum_percentage: TWO_OUT_OF_THREE,
        approval_threshold_percentage: TWO_OUT_OF_THREE,
        slashing_quorum_percentage: ALL,
        slashing_threshold_percentage: ALL,
        required_stake: Some(dollars!(50)),
        constitutionality: 1,
    }
}

// Proposal parameters for the 'Amend Constitution' proposal
// TODO: To be removed
pub(crate) fn amend_constitution_proposal() -> ProposalParameters<BlockNumber, Balance> {
    ProposalParameters {
        voting_period: 72200,
        grace_period: 14400,
        approval_quorum_percentage: 80,
        approval_threshold_percentage: 100,
        slashing_quorum_percentage: 60,
        slashing_threshold_percentage: 80,
        required_stake: Some(dollars!(100)),
        constitutionality: 2,
    }
}

// Proposal parameters for the 'Cancel Working Group Lead Opening' proposal
pub(crate) fn cancel_working_group_lead_opening_proposal(
) -> ProposalParameters<BlockNumber, Balance> {
    ProposalParameters {
        voting_period: days!(3),
        grace_period: hours!(2),
        approval_quorum_percentage: TWO_OUT_OF_THREE,
        approval_threshold_percentage: TWO_OUT_OF_THREE,
        slashing_quorum_percentage: ALL,
        slashing_threshold_percentage: ALL,
        required_stake: Some(dollars!(50)),
        constitutionality: 1,
    }
}

// Proposal parameters for the 'Set Membership Price' proposal
pub(crate) fn set_membership_price_proposal() -> ProposalParameters<BlockNumber, Balance> {
    ProposalParameters {
        voting_period: days!(3),
        grace_period: hours!(2),
        approval_quorum_percentage: TWO_OUT_OF_THREE,
        approval_threshold_percentage: TWO_OUT_OF_THREE,
        slashing_quorum_percentage: ALL,
        slashing_threshold_percentage: ALL,
        required_stake: Some(dollars!(50)),
        constitutionality: 1,
    }
}

// Proposal parameters for the 'Set Council Budget Increment' proposal
pub(crate) fn set_council_budget_increment_proposal() -> ProposalParameters<BlockNumber, Balance> {
    ProposalParameters {
        voting_period: days!(5),
        grace_period: days!(5),
        approval_quorum_percentage: ALL,
        approval_threshold_percentage: ALL,
        slashing_quorum_percentage: ALL,
        slashing_threshold_percentage: ALL,
        required_stake: Some(dollars!(2_000)),
        constitutionality: 3,
    }
}

// Proposal parameters for the 'Set Councilor Reward' proposal
pub(crate) fn set_councilor_reward_proposal() -> ProposalParameters<BlockNumber, Balance> {
    ProposalParameters {
        voting_period: days!(2),
        grace_period: days!(3),
        approval_quorum_percentage: ALL,
        approval_threshold_percentage: ALL,
        slashing_quorum_percentage: ALL,
        slashing_threshold_percentage: ALL,
        required_stake: Some(dollars!(2_000)),
        constitutionality: 2,
    }
}

// Proposal parameters for the 'Set Initial Invitation Balance' proposal
pub(crate) fn set_initial_invitation_balance_proposal() -> ProposalParameters<BlockNumber, Balance>
{
    ProposalParameters {
        voting_period: days!(2),
        grace_period: hours!(2),
        approval_quorum_percentage: TWO_OUT_OF_THREE,
        approval_threshold_percentage: TWO_OUT_OF_THREE,
        slashing_quorum_percentage: ALL,
        slashing_threshold_percentage: ALL,
        required_stake: Some(dollars!(200)),
        constitutionality: 1,
    }
}

// Proposal parameters for the 'Set Initial Invitation Quota' proposal
// The parameter for this proposal still have to be more carefully reviewed
pub(crate) fn set_membership_lead_invitation_quota_proposal(
) -> ProposalParameters<BlockNumber, Balance> {
    ProposalParameters {
        voting_period: days!(3),
        grace_period: hours!(2),
        approval_quorum_percentage: TWO_OUT_OF_THREE,
        approval_threshold_percentage: TWO_OUT_OF_THREE,
        slashing_quorum_percentage: ALL,
        slashing_threshold_percentage: ALL,
        required_stake: Some(dollars!(50)),
        constitutionality: 1,
    }
}

// Proposal parameters for the 'Set Referral Cut' proposal
pub(crate) fn set_referral_cut_proposal() -> ProposalParameters<BlockNumber, Balance> {
    ProposalParameters {
        voting_period: days!(3),
        grace_period: hours!(2),
        approval_quorum_percentage: TWO_OUT_OF_THREE,
        approval_threshold_percentage: TWO_OUT_OF_THREE,
        slashing_quorum_percentage: ALL,
        slashing_threshold_percentage: ALL,
        required_stake: Some(dollars!(50)),
        constitutionality: 1,
    }
}

// Proposal parameters for the 'Set Initial Invitation Count' proposal
pub(crate) fn set_invitation_count_proposal() -> ProposalParameters<BlockNumber, Balance> {
    ProposalParameters {
        voting_period: days!(3),
        grace_period: hours!(2),
        approval_quorum_percentage: TWO_OUT_OF_THREE,
        approval_threshold_percentage: TWO_OUT_OF_THREE,
        slashing_quorum_percentage: ALL,
        slashing_threshold_percentage: ALL,
        required_stake: Some(dollars!(50)),
        constitutionality: 1,
    }
}

// Proposal parameters for the 'Veto Proposal' proposal
pub(crate) fn veto_proposal_proposal() -> ProposalParameters<BlockNumber, Balance> {
    ProposalParameters {
        // Doesn't make sense to be longer than longest grace period of all other proposals?
        voting_period: days!(1),
        grace_period: 0,
        approval_quorum_percentage: ALL,
        approval_threshold_percentage: ALL,
        slashing_quorum_percentage: ALL,
        slashing_threshold_percentage: ALL,
        required_stake: Some(dollars!(1_000)),
        constitutionality: 1,
    }
}

// Proposal parameters for the 'Update global NFT limit' proposal
pub(crate) fn update_global_nft_limit_proposal() -> ProposalParameters<BlockNumber, Balance> {
    ProposalParameters {
        voting_period: days!(2),
        grace_period: hours!(2),
        approval_quorum_percentage: TWO_OUT_OF_THREE,
        approval_threshold_percentage: TWO_OUT_OF_THREE,
        slashing_quorum_percentage: ALL,
        slashing_threshold_percentage: ALL,
        required_stake: Some(dollars!(100)),
        constitutionality: 1,
    }
}

// Proposal parameters for the 'Update Channel Payouts' proposal
pub(crate) fn update_channel_payouts_proposal() -> ProposalParameters<BlockNumber, Balance> {
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
