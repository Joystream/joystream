use crate::{BalanceOf, CurrencyOf, ProposalParameters};
use rstd::convert::TryInto;
use sr_primitives::traits::SaturatedConversion;
pub use sr_primitives::Perbill;
use srml_support::traits::Currency;

// calculates required stake value using total issuance value and stake percentage. Truncates to
// lowest integer value.
fn get_required_stake_by_fraction<T: crate::Trait>(
    numerator: u32,
    denominator: u32,
) -> BalanceOf<T> {
    let total_issuance: u128 = <CurrencyOf<T>>::total_issuance().try_into().unwrap_or(0) as u128;
    let required_stake =
        Perbill::from_rational_approximation(numerator, denominator) * total_issuance;

    let balance: BalanceOf<T> = required_stake.saturated_into();

    balance
}

// Proposal parameters for the 'Set validator count' proposal
pub(crate) fn set_validator_count_proposal<T: crate::Trait>(
) -> ProposalParameters<T::BlockNumber, BalanceOf<T>> {
    ProposalParameters {
        voting_period: T::BlockNumber::from(43200u32),
        grace_period: T::BlockNumber::from(0u32),
        approval_quorum_percentage: 66,
        approval_threshold_percentage: 80,
        slashing_quorum_percentage: 60,
        slashing_threshold_percentage: 80,
        required_stake: Some(get_required_stake_by_fraction::<T>(25, 10000)),
    }
}

// Proposal parameters for the upgrade runtime proposal
pub(crate) fn runtime_upgrade_proposal<T: crate::Trait>(
) -> ProposalParameters<T::BlockNumber, BalanceOf<T>> {
    ProposalParameters {
        voting_period: T::BlockNumber::from(72000u32),
        grace_period: T::BlockNumber::from(72000u32),
        approval_quorum_percentage: 80,
        approval_threshold_percentage: 100,
        slashing_quorum_percentage: 60,
        slashing_threshold_percentage: 80,
        required_stake: Some(get_required_stake_by_fraction::<T>(1, 100)),
    }
}

// Proposal parameters for the text proposal
pub(crate) fn text_proposal<T: crate::Trait>() -> ProposalParameters<T::BlockNumber, BalanceOf<T>> {
    ProposalParameters {
        voting_period: T::BlockNumber::from(72000u32),
        grace_period: T::BlockNumber::from(0u32),
        approval_quorum_percentage: 66,
        approval_threshold_percentage: 80,
        slashing_quorum_percentage: 60,
        slashing_threshold_percentage: 80,
        required_stake: Some(get_required_stake_by_fraction::<T>(25, 10000)),
    }
}

// Proposal parameters for the 'Set Election Parameters' proposal
pub(crate) fn set_election_parameters_proposal<T: crate::Trait>(
) -> ProposalParameters<T::BlockNumber, BalanceOf<T>> {
    ProposalParameters {
        voting_period: T::BlockNumber::from(72000u32),
        grace_period: T::BlockNumber::from(201601u32),
        approval_quorum_percentage: 66,
        approval_threshold_percentage: 80,
        slashing_quorum_percentage: 60,
        slashing_threshold_percentage: 80,
        required_stake: Some(get_required_stake_by_fraction::<T>(75, 10000)),
    }
}

// Proposal parameters for the 'Set council mint capacity' proposal
pub(crate) fn set_council_mint_capacity_proposal<T: crate::Trait>(
) -> ProposalParameters<T::BlockNumber, BalanceOf<T>> {
    ProposalParameters {
        voting_period: T::BlockNumber::from(43200u32),
        grace_period: T::BlockNumber::from(0u32),
        approval_quorum_percentage: 66,
        approval_threshold_percentage: 80,
        slashing_quorum_percentage: 50,
        slashing_threshold_percentage: 50,
        required_stake: Some(get_required_stake_by_fraction::<T>(25, 10000)),
    }
}

// Proposal parameters for the 'Set content working group mint capacity' proposal
pub(crate) fn set_content_working_group_mint_capacity_proposal<T: crate::Trait>(
) -> ProposalParameters<T::BlockNumber, BalanceOf<T>> {
    ProposalParameters {
        voting_period: T::BlockNumber::from(43200u32),
        grace_period: T::BlockNumber::from(0u32),
        approval_quorum_percentage: 50,
        approval_threshold_percentage: 75,
        slashing_quorum_percentage: 60,
        slashing_threshold_percentage: 80,
        required_stake: Some(get_required_stake_by_fraction::<T>(25, 10000)),
    }
}

// Proposal parameters for the 'Spending' proposal
pub(crate) fn spending_proposal<T: crate::Trait>(
) -> ProposalParameters<T::BlockNumber, BalanceOf<T>> {
    ProposalParameters {
        voting_period: T::BlockNumber::from(43200u32),
        grace_period: T::BlockNumber::from(0u32),
        approval_quorum_percentage: 66,
        approval_threshold_percentage: 80,
        slashing_quorum_percentage: 60,
        slashing_threshold_percentage: 80,
        required_stake: Some(get_required_stake_by_fraction::<T>(25, 10000)),
    }
}

// Proposal parameters for the 'Set lead' proposal
pub(crate) fn set_lead_proposal<T: crate::Trait>(
) -> ProposalParameters<T::BlockNumber, BalanceOf<T>> {
    ProposalParameters {
        voting_period: T::BlockNumber::from(43200u32),
        grace_period: T::BlockNumber::from(0u32),
        approval_quorum_percentage: 66,
        approval_threshold_percentage: 80,
        slashing_quorum_percentage: 60,
        slashing_threshold_percentage: 80,
        required_stake: Some(get_required_stake_by_fraction::<T>(25, 10000)),
    }
}

// Proposal parameters for the 'Evict storage provider' proposal
pub(crate) fn evict_storage_provider_proposal<T: crate::Trait>(
) -> ProposalParameters<T::BlockNumber, BalanceOf<T>> {
    ProposalParameters {
        voting_period: T::BlockNumber::from(43200u32),
        grace_period: T::BlockNumber::from(0u32),
        approval_quorum_percentage: 50,
        approval_threshold_percentage: 75,
        slashing_quorum_percentage: 60,
        slashing_threshold_percentage: 80,
        required_stake: Some(get_required_stake_by_fraction::<T>(1, 1000)),
    }
}

// Proposal parameters for the 'Set storage role parameters' proposal
pub(crate) fn set_storage_role_parameters_proposal<T: crate::Trait>(
) -> ProposalParameters<T::BlockNumber, BalanceOf<T>> {
    ProposalParameters {
        voting_period: T::BlockNumber::from(43200u32),
        grace_period: T::BlockNumber::from(14400u32),
        approval_quorum_percentage: 75,
        approval_threshold_percentage: 80,
        slashing_quorum_percentage: 60,
        slashing_threshold_percentage: 80,
        required_stake: Some(get_required_stake_by_fraction::<T>(25, 10000)),
    }
}

#[cfg(test)]
mod test {
    use crate::proposal_types::parameters::get_required_stake_by_fraction;
    use crate::tests::{increase_total_balance_issuance, initial_test_ext, Test};

    pub use sr_primitives::Perbill;

    #[test]
    fn calculate_get_required_stake_by_fraction_with_zero_issuance() {
        initial_test_ext()
            .execute_with(|| assert_eq!(get_required_stake_by_fraction::<Test>(5, 7), 0));
    }

    #[test]
    fn calculate_stake_by_percentage_for_defined_issuance_succeeds() {
        initial_test_ext().execute_with(|| {
            increase_total_balance_issuance(50000);
            assert_eq!(get_required_stake_by_fraction::<Test>(1, 1000), 50)
        });
    }

    #[test]
    fn calculate_stake_by_percentage_for_defined_issuance_with_fraction_loss() {
        initial_test_ext().execute_with(|| {
            increase_total_balance_issuance(1111);
            assert_eq!(get_required_stake_by_fraction::<Test>(3, 1000), 3);
        });
    }
}
