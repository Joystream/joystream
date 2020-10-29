use crate::ProposalParameters;

#[test]
fn proposal_parameters_are_initialized() {
    let actual_params = super::SetValidatorCountProposalParameters::get();
    let expected_params = ProposalParameters {
        voting_period: 43200,
        grace_period: 0,
        approval_quorum_percentage: 66,
        approval_threshold_percentage: 80,
        slashing_quorum_percentage: 60,
        slashing_threshold_percentage: 80,
        required_stake: Some(100_000),
        constitutionality: 1,
    };

    assert_eq!(expected_params, actual_params);
}
