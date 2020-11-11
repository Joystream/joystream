use crate::ProposalParameters;

// Enable during the conditional compilation tests.
#[ignore]
#[test]
fn proposal_parameters_are_initialized() {
    let actual_params = super::DecreaseWorkingGroupLeaderStakeProposalParameters::get();
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
