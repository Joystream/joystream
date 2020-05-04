use crate::{BalanceOf, Module, ProposalParameters};

// Proposal parameters for the 'Set validator count' proposal
pub(crate) fn set_validator_count_proposal<T: crate::Trait>(
) -> ProposalParameters<T::BlockNumber, BalanceOf<T>> {
    ProposalParameters {
        voting_period: <Module<T>>::set_validator_count_proposal_voting_period(),
        grace_period: <Module<T>>::set_validator_count_proposal_grace_period(),
        approval_quorum_percentage: 66,
        approval_threshold_percentage: 80,
        slashing_quorum_percentage: 60,
        slashing_threshold_percentage: 80,
        required_stake: Some(<BalanceOf<T>>::from(100_000_u32)),
    }
}

// Proposal parameters for the upgrade runtime proposal
pub(crate) fn runtime_upgrade_proposal<T: crate::Trait>(
) -> ProposalParameters<T::BlockNumber, BalanceOf<T>> {
    ProposalParameters {
        voting_period: <Module<T>>::runtime_upgrade_proposal_voting_period(),
        grace_period: <Module<T>>::runtime_upgrade_proposal_grace_period(),
        approval_quorum_percentage: 80,
        approval_threshold_percentage: 100,
        slashing_quorum_percentage: 60,
        slashing_threshold_percentage: 80,
        required_stake: Some(<BalanceOf<T>>::from(1_000_000_u32)),
    }
}

// Proposal parameters for the text proposal
pub(crate) fn text_proposal<T: crate::Trait>() -> ProposalParameters<T::BlockNumber, BalanceOf<T>> {
    ProposalParameters {
        voting_period: <Module<T>>::text_proposal_voting_period(),
        grace_period: <Module<T>>::text_proposal_grace_period(),
        approval_quorum_percentage: 60,
        approval_threshold_percentage: 80,
        slashing_quorum_percentage: 60,
        slashing_threshold_percentage: 80,
        required_stake: Some(<BalanceOf<T>>::from(25000u32)),
    }
}

// Proposal parameters for the 'Set Election Parameters' proposal
pub(crate) fn set_election_parameters_proposal<T: crate::Trait>(
) -> ProposalParameters<T::BlockNumber, BalanceOf<T>> {
    ProposalParameters {
        voting_period: <Module<T>>::set_election_parameters_proposal_voting_period(),
        grace_period: <Module<T>>::set_election_parameters_proposal_grace_period(),
        approval_quorum_percentage: 66,
        approval_threshold_percentage: 80,
        slashing_quorum_percentage: 60,
        slashing_threshold_percentage: 80,
        required_stake: Some(<BalanceOf<T>>::from(200_000_u32)),
    }
}

// Proposal parameters for the 'Set content working group mint capacity' proposal
pub(crate) fn set_content_working_group_mint_capacity_proposal<T: crate::Trait>(
) -> ProposalParameters<T::BlockNumber, BalanceOf<T>> {
    ProposalParameters {
        voting_period: <Module<T>>::set_content_working_group_mint_capacity_proposal_voting_period(
        ),
        grace_period: <Module<T>>::set_content_working_group_mint_capacity_proposal_grace_period(),
        approval_quorum_percentage: 60,
        approval_threshold_percentage: 75,
        slashing_quorum_percentage: 60,
        slashing_threshold_percentage: 80,
        required_stake: Some(<BalanceOf<T>>::from(50000u32)),
    }
}

// Proposal parameters for the 'Spending' proposal
pub(crate) fn spending_proposal<T: crate::Trait>(
) -> ProposalParameters<T::BlockNumber, BalanceOf<T>> {
    ProposalParameters {
        voting_period: <Module<T>>::spending_proposal_voting_period(),
        grace_period: <Module<T>>::spending_proposal_grace_period(),
        approval_quorum_percentage: 60,
        approval_threshold_percentage: 80,
        slashing_quorum_percentage: 60,
        slashing_threshold_percentage: 80,
        required_stake: Some(<BalanceOf<T>>::from(25000u32)),
    }
}

// Proposal parameters for the 'Set lead' proposal
pub(crate) fn set_lead_proposal<T: crate::Trait>(
) -> ProposalParameters<T::BlockNumber, BalanceOf<T>> {
    ProposalParameters {
        voting_period: <Module<T>>::set_lead_proposal_voting_period(),
        grace_period: <Module<T>>::set_lead_proposal_grace_period(),
        approval_quorum_percentage: 60,
        approval_threshold_percentage: 75,
        slashing_quorum_percentage: 60,
        slashing_threshold_percentage: 80,
        required_stake: Some(<BalanceOf<T>>::from(50000u32)),
    }
}

// Proposal parameters for the 'Evict storage provider' proposal
pub(crate) fn evict_storage_provider_proposal<T: crate::Trait>(
) -> ProposalParameters<T::BlockNumber, BalanceOf<T>> {
    ProposalParameters {
        voting_period: <Module<T>>::evict_storage_provider_proposal_voting_period(),
        grace_period: <Module<T>>::evict_storage_provider_proposal_grace_period(),
        approval_quorum_percentage: 50,
        approval_threshold_percentage: 75,
        slashing_quorum_percentage: 60,
        slashing_threshold_percentage: 80,
        required_stake: Some(<BalanceOf<T>>::from(25000u32)),
    }
}

// Proposal parameters for the 'Set storage role parameters' proposal
pub(crate) fn set_storage_role_parameters_proposal<T: crate::Trait>(
) -> ProposalParameters<T::BlockNumber, BalanceOf<T>> {
    ProposalParameters {
        voting_period: <Module<T>>::set_storage_role_parameters_proposal_voting_period(),
        grace_period: <Module<T>>::set_storage_role_parameters_proposal_grace_period(),
        approval_quorum_percentage: 66,
        approval_threshold_percentage: 80,
        slashing_quorum_percentage: 60,
        slashing_threshold_percentage: 80,
        required_stake: Some(<BalanceOf<T>>::from(100_000_u32)),
    }
}
