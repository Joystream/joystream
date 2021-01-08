use crate::ProposalParameters;

// Enable during the conditional compilation tests.
#[test]
#[ignore]
fn proposal_parameters_are_initialized_max_validators() {
    let actual_params = super::SetMaxValidatorCountProposalParameters::get();
    let expected_params = ProposalParameters {
        voting_period: 1,
        grace_period: 2,
        approval_quorum_percentage: 3,
        approval_threshold_percentage: 4,
        slashing_quorum_percentage: 5,
        slashing_threshold_percentage: 6,
        required_stake: Some(7),
        constitutionality: 8,
    };

    assert_eq!(expected_params, actual_params);
}

// Enable during the conditional compilation tests.
#[test]
#[ignore]
fn proposal_parameters_are_initialized_runtime_upgrade() {
    let actual_params = super::RuntimeUpgradeProposalParameters::get();
    let expected_params = ProposalParameters {
        voting_period: 1,
        grace_period: 2,
        approval_quorum_percentage: 3,
        approval_threshold_percentage: 4,
        slashing_quorum_percentage: 5,
        slashing_threshold_percentage: 6,
        required_stake: Some(7),
        constitutionality: 8,
    };

    assert_eq!(expected_params, actual_params);
}

// Enable during the conditional compilation tests.
#[test]
#[ignore]
fn proposal_parameters_are_initialized_signal() {
    let actual_params = super::SignalProposalParameters::get();
    let expected_params = ProposalParameters {
        voting_period: 1,
        grace_period: 2,
        approval_quorum_percentage: 3,
        approval_threshold_percentage: 4,
        slashing_quorum_percentage: 5,
        slashing_threshold_percentage: 6,
        required_stake: Some(7),
        constitutionality: 8,
    };

    assert_eq!(expected_params, actual_params);
}

// Enable during the conditional compilation tests.
#[test]
#[ignore]
fn proposal_parameters_are_initialized_funding_request() {
    let actual_params = super::FundingRequestProposalParameters::get();
    let expected_params = ProposalParameters {
        voting_period: 1,
        grace_period: 2,
        approval_quorum_percentage: 3,
        approval_threshold_percentage: 4,
        slashing_quorum_percentage: 5,
        slashing_threshold_percentage: 6,
        required_stake: Some(7),
        constitutionality: 8,
    };

    assert_eq!(expected_params, actual_params);
}

// Enable during the conditional compilation tests.
#[test]
#[ignore]
fn proposal_parameters_are_initialized_create_wg_lead_opening() {
    let actual_params = super::CreateWorkingGroupLeadOpeningProposalParameters::get();
    let expected_params = ProposalParameters {
        voting_period: 1,
        grace_period: 2,
        approval_quorum_percentage: 3,
        approval_threshold_percentage: 4,
        slashing_quorum_percentage: 5,
        slashing_threshold_percentage: 6,
        required_stake: Some(7),
        constitutionality: 8,
    };

    assert_eq!(expected_params, actual_params);
}

// Enable during the conditional compilation tests.
#[test]
#[ignore]
fn proposal_parameters_are_initialized_wg_fill_lead_opening() {
    let actual_params = super::FillWorkingGroupLeadOpeningProposalParameters::get();
    let expected_params = ProposalParameters {
        voting_period: 1,
        grace_period: 2,
        approval_quorum_percentage: 3,
        approval_threshold_percentage: 4,
        slashing_quorum_percentage: 5,
        slashing_threshold_percentage: 6,
        required_stake: Some(7),
        constitutionality: 8,
    };

    assert_eq!(expected_params, actual_params);
}

// Enable during the conditional compilation tests.
#[test]
#[ignore]
fn proposal_parameters_are_initialized_update_budget() {
    let actual_params = super::UpdateWorkingGroupBudgetProposalParameters::get();
    let expected_params = ProposalParameters {
        voting_period: 1,
        grace_period: 2,
        approval_quorum_percentage: 3,
        approval_threshold_percentage: 4,
        slashing_quorum_percentage: 5,
        slashing_threshold_percentage: 6,
        required_stake: Some(7),
        constitutionality: 8,
    };

    assert_eq!(expected_params, actual_params);
}

// Enable during the conditional compilation tests.
#[test]
#[ignore]
fn proposal_parameters_are_initialized_decrease_wg_lead_stake() {
    let actual_params = super::DecreaseWorkingGroupLeadStakeProposalParameters::get();
    let expected_params = ProposalParameters {
        voting_period: 1,
        grace_period: 2,
        approval_quorum_percentage: 3,
        approval_threshold_percentage: 4,
        slashing_quorum_percentage: 5,
        slashing_threshold_percentage: 6,
        required_stake: Some(7),
        constitutionality: 8,
    };

    assert_eq!(expected_params, actual_params);
}

// Enable during the conditional compilation tests.
#[test]
#[ignore]
fn proposal_parameters_are_initialized_slash_wg_lead() {
    let actual_params = super::SlashWorkingGroupLeadProposalParameters::get();
    let expected_params = ProposalParameters {
        voting_period: 1,
        grace_period: 2,
        approval_quorum_percentage: 3,
        approval_threshold_percentage: 4,
        slashing_quorum_percentage: 5,
        slashing_threshold_percentage: 6,
        required_stake: Some(7),
        constitutionality: 8,
    };

    assert_eq!(expected_params, actual_params);
}

// Enable during the conditional compilation tests.
#[test]
#[ignore]
fn proposal_parameters_are_initialized_set_wg_lead_reward() {
    let actual_params = super::SetWorkingGroupLeadRewardProposalParameters::get();
    let expected_params = ProposalParameters {
        voting_period: 1,
        grace_period: 2,
        approval_quorum_percentage: 3,
        approval_threshold_percentage: 4,
        slashing_quorum_percentage: 5,
        slashing_threshold_percentage: 6,
        required_stake: Some(7),
        constitutionality: 8,
    };

    assert_eq!(expected_params, actual_params);
}

// Enable during the conditional compilation tests.
#[test]
#[ignore]
fn proposal_parameters_are_initialized_terminate_wg_lead() {
    let actual_params = super::TerminateWorkingGroupLeadProposalParameters::get();
    let expected_params = ProposalParameters {
        voting_period: 1,
        grace_period: 2,
        approval_quorum_percentage: 3,
        approval_threshold_percentage: 4,
        slashing_quorum_percentage: 5,
        slashing_threshold_percentage: 6,
        required_stake: Some(7),
        constitutionality: 8,
    };

    assert_eq!(expected_params, actual_params);
}

// Enable during the conditional compilation tests.
#[test]
#[ignore]
fn proposal_parameters_are_initialized_amend_constitution() {
    let actual_params = super::AmendConstitutionProposalParameters::get();
    let expected_params = ProposalParameters {
        voting_period: 1,
        grace_period: 2,
        approval_quorum_percentage: 3,
        approval_threshold_percentage: 4,
        slashing_quorum_percentage: 5,
        slashing_threshold_percentage: 6,
        required_stake: Some(7),
        constitutionality: 8,
    };

    assert_eq!(expected_params, actual_params);
}

// Enable during the conditional compilation tests.
#[test]
#[ignore]
fn proposal_parameters_are_initialized_cancel_wg_lead_opening() {
    let actual_params = super::CancelWorkingGroupLeadOpeningProposalParameters::get();
    let expected_params = ProposalParameters {
        voting_period: 1,
        grace_period: 2,
        approval_quorum_percentage: 3,
        approval_threshold_percentage: 4,
        slashing_quorum_percentage: 5,
        slashing_threshold_percentage: 6,
        required_stake: Some(7),
        constitutionality: 8,
    };

    assert_eq!(expected_params, actual_params);
}

// Enable during the conditional compilation tests.
#[test]
#[ignore]
fn proposal_parameters_are_initialized_set_membership_price() {
    let actual_params = super::SetMembershipPriceProposalParameters::get();
    let expected_params = ProposalParameters {
        voting_period: 1,
        grace_period: 2,
        approval_quorum_percentage: 3,
        approval_threshold_percentage: 4,
        slashing_quorum_percentage: 5,
        slashing_threshold_percentage: 6,
        required_stake: Some(7),
        constitutionality: 8,
    };

    assert_eq!(expected_params, actual_params);
}

// Enable during the conditional compilation tests.
#[test]
#[ignore]
fn proposal_parameters_are_initialized_set_council_budget_increment() {
    let actual_params = super::SetCouncilBudgetIncrementProposalParameters::get();
    let expected_params = ProposalParameters {
        voting_period: 1,
        grace_period: 2,
        approval_quorum_percentage: 3,
        approval_threshold_percentage: 4,
        slashing_quorum_percentage: 5,
        slashing_threshold_percentage: 6,
        required_stake: Some(7),
        constitutionality: 8,
    };

    assert_eq!(expected_params, actual_params);
}

// Enable during the conditional compilation tests.
#[test]
#[ignore]
fn proposal_parameters_are_initialized_set_councilor_reward() {
    let actual_params = super::SetCouncilorRewardProposalParameters::get();
    let expected_params = ProposalParameters {
        voting_period: 1,
        grace_period: 2,
        approval_quorum_percentage: 3,
        approval_threshold_percentage: 4,
        slashing_quorum_percentage: 5,
        slashing_threshold_percentage: 6,
        required_stake: Some(7),
        constitutionality: 8,
    };

    assert_eq!(expected_params, actual_params);
}

// Enable during the conditional compilation tests.
#[test]
#[ignore]
fn proposal_parameters_are_initialized_set_initial_invitation_balance() {
    let actual_params = super::SetInitialInvitationBalanceProposalParameters::get();
    let expected_params = ProposalParameters {
        voting_period: 1,
        grace_period: 2,
        approval_quorum_percentage: 3,
        approval_threshold_percentage: 4,
        slashing_quorum_percentage: 5,
        slashing_threshold_percentage: 6,
        required_stake: Some(7),
        constitutionality: 8,
    };

    assert_eq!(expected_params, actual_params);
}

// Enable during the conditional compilation tests.
#[test]
#[ignore]
fn proposal_parameters_are_initialized_set_membership_invitaiton_quota() {
    let actual_params = super::SetMembershipLeadInvitationQuotaProposalParameters::get();
    let expected_params = ProposalParameters {
        voting_period: 1,
        grace_period: 2,
        approval_quorum_percentage: 3,
        approval_threshold_percentage: 4,
        slashing_quorum_percentage: 5,
        slashing_threshold_percentage: 6,
        required_stake: Some(7),
        constitutionality: 8,
    };

    assert_eq!(expected_params, actual_params);
}

// Enable during the conditional compilation tests.
#[test]
#[ignore]
fn proposal_parameters_are_initialized_set_referral_cut() {
    let actual_params = super::SetReferralCutProposalParameters::get();
    let expected_params = ProposalParameters {
        voting_period: 1,
        grace_period: 2,
        approval_quorum_percentage: 3,
        approval_threshold_percentage: 4,
        slashing_quorum_percentage: 5,
        slashing_threshold_percentage: 6,
        required_stake: Some(7),
        constitutionality: 8,
    };

    assert_eq!(expected_params, actual_params);
}

// Enable during the conditional compilation tests.
#[test]
#[ignore]
fn proposal_parameters_are_initialized_set_invitation_count() {
    let actual_params = super::SetInvitationCountProposalParameters::get();
    let expected_params = ProposalParameters {
        voting_period: 1,
        grace_period: 2,
        approval_quorum_percentage: 3,
        approval_threshold_percentage: 4,
        slashing_quorum_percentage: 5,
        slashing_threshold_percentage: 6,
        required_stake: Some(7),
        constitutionality: 8,
    };

    assert_eq!(expected_params, actual_params);
}
