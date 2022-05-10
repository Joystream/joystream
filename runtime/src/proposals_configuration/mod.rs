//! This module defines a set of the parameters for each proposal in the runtime like
//! _SetValidatorCountProposalParameters_.

use crate::{Balance, BlockNumber, ProposalParameters};
use frame_support::parameter_types;

// This is the default configuration, so only include it if neither staging or testing runtime feature is enabled
#[cfg(not(any(feature = "staging_runtime", feature = "testing_runtime")))]
mod defaults;
#[cfg(not(any(feature = "staging_runtime", feature = "testing_runtime")))]
use defaults::*;

#[cfg(feature = "staging_runtime")]
mod staging;
#[cfg(feature = "staging_runtime")]
use staging::*;

#[cfg(feature = "testing_runtime")]
mod testing;
#[cfg(feature = "testing_runtime")]
use testing::*;

/////////// Proposal parameters definition

parameter_types! {
    pub SetMaxValidatorCountProposalParameters: ProposalParameters<BlockNumber, Balance> =
        set_max_validator_count_proposal();

    pub RuntimeUpgradeProposalParameters: ProposalParameters<BlockNumber, Balance> =
        runtime_upgrade_proposal();

    pub SignalProposalParameters: ProposalParameters<BlockNumber, Balance> =
        signal_proposal();

    pub FundingRequestProposalParameters: ProposalParameters<BlockNumber, Balance> =
        funding_request_proposal();

    pub CreateWorkingGroupLeadOpeningProposalParameters: ProposalParameters<BlockNumber, Balance> =
        create_working_group_lead_opening_proposal();

    pub FillWorkingGroupLeadOpeningProposalParameters: ProposalParameters<BlockNumber, Balance> =
        fill_working_group_lead_opening_proposal();

    pub UpdateWorkingGroupBudgetProposalParameters: ProposalParameters<BlockNumber, Balance> =
        update_working_group_budget_proposal();

    pub DecreaseWorkingGroupLeadStakeProposalParameters: ProposalParameters<BlockNumber, Balance> =
        decrease_working_group_lead_stake_proposal();

    pub SlashWorkingGroupLeadProposalParameters: ProposalParameters<BlockNumber, Balance> =
        slash_working_group_lead_proposal();

    pub SetWorkingGroupLeadRewardProposalParameters: ProposalParameters<BlockNumber, Balance> =
        set_working_group_lead_reward_proposal();

    pub TerminateWorkingGroupLeadProposalParameters: ProposalParameters<BlockNumber, Balance> =
        terminate_working_group_lead_proposal();

    pub AmendConstitutionProposalParameters: ProposalParameters<BlockNumber, Balance> =
        amend_constitution_proposal();

    pub CancelWorkingGroupLeadOpeningProposalParameters: ProposalParameters<BlockNumber, Balance> =
        cancel_working_group_lead_opening_proposal();

    pub SetMembershipPriceProposalParameters: ProposalParameters<BlockNumber, Balance> =
        set_membership_price_proposal();

    pub SetCouncilBudgetIncrementProposalParameters: ProposalParameters<BlockNumber, Balance> =
        set_council_budget_increment_proposal();

    pub SetCouncilorRewardProposalParameters: ProposalParameters<BlockNumber, Balance> =
        set_councilor_reward_proposal();

    pub SetInitialInvitationBalanceProposalParameters: ProposalParameters<BlockNumber, Balance> =
        set_initial_invitation_balance_proposal();

    pub SetMembershipLeadInvitationQuotaProposalParameters: ProposalParameters<BlockNumber, Balance> =
        set_membership_lead_invitation_quota_proposal();

    pub SetReferralCutProposalParameters: ProposalParameters<BlockNumber, Balance> =
        set_referral_cut_proposal();

    pub SetInvitationCountProposalParameters: ProposalParameters<BlockNumber, Balance> =
        set_invitation_count_proposal();

    pub CreateBlogPostProposalParameters: ProposalParameters<BlockNumber, Balance> =
        create_blog_post_proposal();

    pub EditBlogPostProoposalParamters: ProposalParameters<BlockNumber, Balance> =
        edit_blog_post_proposal();

    pub LockBlogPostProposalParameters: ProposalParameters<BlockNumber, Balance> =
        lock_blog_post_proposal();

    pub UnlockBlogPostProposalParameters: ProposalParameters<BlockNumber, Balance> =
        unlock_blog_post_proposal();

    pub VetoProposalProposalParameters: ProposalParameters<BlockNumber, Balance> =
        veto_proposal_proposal();

    pub UpdateChannelPayoutsProposalParameters: ProposalParameters<BlockNumber, Balance> =
        update_channel_payouts_proposal();
}
