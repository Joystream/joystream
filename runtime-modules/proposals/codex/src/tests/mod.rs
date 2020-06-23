mod mock;

use governance::election_params::ElectionParameters;
use srml_support::traits::Currency;
use srml_support::StorageMap;
use system::RawOrigin;

use crate::*;
use crate::{BalanceOf, Error, ProposalDetails};
use proposal_engine::ProposalParameters;
use srml_support::dispatch::DispatchResult;

use crate::proposal_types::ProposalsConfigParameters;
pub use mock::*;

use common::working_group::WorkingGroup;
use hiring::ActivateOpeningAt;
use working_group::OpeningPolicyCommitment;

pub(crate) fn increase_total_balance_issuance(balance: u64) {
    increase_total_balance_issuance_using_account_id(999, balance);
}

pub(crate) fn increase_total_balance_issuance_using_account_id(account_id: u64, balance: u64) {
    let initial_balance = Balances::total_issuance();
    {
        let _ = <Test as stake::Trait>::Currency::deposit_creating(&account_id, balance);
    }
    assert_eq!(Balances::total_issuance(), initial_balance + balance);
}

struct ProposalTestFixture<InsufficientRightsCall, EmptyStakeCall, InvalidStakeCall, SuccessfulCall>
where
    InsufficientRightsCall: Fn() -> DispatchResult<crate::Error>,
    EmptyStakeCall: Fn() -> DispatchResult<crate::Error>,
    InvalidStakeCall: Fn() -> DispatchResult<crate::Error>,
    SuccessfulCall: Fn() -> DispatchResult<crate::Error>,
{
    insufficient_rights_call: InsufficientRightsCall,
    empty_stake_call: EmptyStakeCall,
    invalid_stake_call: InvalidStakeCall,
    successful_call: SuccessfulCall,
    proposal_parameters: ProposalParameters<u64, u64>,
    proposal_details: ProposalDetails<u64, u64, u64, u64, u64>,
}

impl<InsufficientRightsCall, EmptyStakeCall, InvalidStakeCall, SuccessfulCall>
    ProposalTestFixture<InsufficientRightsCall, EmptyStakeCall, InvalidStakeCall, SuccessfulCall>
where
    InsufficientRightsCall: Fn() -> DispatchResult<crate::Error>,
    EmptyStakeCall: Fn() -> DispatchResult<crate::Error>,
    InvalidStakeCall: Fn() -> DispatchResult<crate::Error>,
    SuccessfulCall: Fn() -> DispatchResult<crate::Error>,
{
    fn check_for_invalid_stakes(&self) {
        assert_eq!((self.empty_stake_call)(), Err(Error::Other("EmptyStake")));

        assert_eq!(
            (self.invalid_stake_call)(),
            Err(Error::Other("StakeDiffersFromRequired"))
        );
    }

    fn check_call_for_insufficient_rights(&self) {
        assert_eq!(
            (self.insufficient_rights_call)(),
            Err(Error::Other("RequireSignedOrigin"))
        );
    }

    fn check_for_successful_call(&self) {
        let account_id = 1;
        let _imbalance = <Test as stake::Trait>::Currency::deposit_creating(&account_id, 50000);

        assert_eq!((self.successful_call)(), Ok(()));

        // a discussion was created
        let thread_id = <crate::ThreadIdByProposalId<Test>>::get(1);
        assert_eq!(thread_id, 1);

        let proposal_id = 1;
        let proposal = ProposalsEngine::proposals(proposal_id);
        // check for correct proposal parameters
        assert_eq!(proposal.parameters, self.proposal_parameters);

        // proposal details was set
        let details = <crate::ProposalDetailsByProposalId<Test>>::get(proposal_id);
        assert_eq!(details, self.proposal_details);
    }

    pub fn check_all(&self) {
        self.check_call_for_insufficient_rights();
        self.check_for_invalid_stakes();
        self.check_for_successful_call();
    }
}

#[test]
fn create_text_proposal_common_checks_succeed() {
    initial_test_ext().execute_with(|| {
        increase_total_balance_issuance(500000);

        let proposal_fixture = ProposalTestFixture {
            insufficient_rights_call: || {
                ProposalCodex::create_text_proposal(
                    RawOrigin::None.into(),
                    1,
                    b"title".to_vec(),
                    b"body".to_vec(),
                    None,
                    b"text".to_vec(),
                )
            },
            empty_stake_call: || {
                ProposalCodex::create_text_proposal(
                    RawOrigin::Signed(1).into(),
                    1,
                    b"title".to_vec(),
                    b"body".to_vec(),
                    None,
                    b"text".to_vec(),
                )
            },
            invalid_stake_call: || {
                ProposalCodex::create_text_proposal(
                    RawOrigin::Signed(1).into(),
                    1,
                    b"title".to_vec(),
                    b"body".to_vec(),
                    Some(<BalanceOf<Test>>::from(5000u32)),
                    b"text".to_vec(),
                )
            },
            successful_call: || {
                ProposalCodex::create_text_proposal(
                    RawOrigin::Signed(1).into(),
                    1,
                    b"title".to_vec(),
                    b"body".to_vec(),
                    Some(<BalanceOf<Test>>::from(25000u32)),
                    b"text".to_vec(),
                )
            },
            proposal_parameters: crate::proposal_types::parameters::text_proposal::<Test>(),
            proposal_details: ProposalDetails::Text(b"text".to_vec()),
        };
        proposal_fixture.check_all();
    });
}

#[test]
fn create_text_proposal_codex_call_fails_with_incorrect_text_size() {
    initial_test_ext().execute_with(|| {
        let origin = RawOrigin::Signed(1).into();

        let long_text = [0u8; 30000].to_vec();
        assert_eq!(
            ProposalCodex::create_text_proposal(
                origin,
                1,
                b"title".to_vec(),
                b"body".to_vec(),
                None,
                long_text,
            ),
            Err(Error::TextProposalSizeExceeded)
        );

        assert_eq!(
            ProposalCodex::create_text_proposal(
                RawOrigin::Signed(1).into(),
                1,
                b"title".to_vec(),
                b"body".to_vec(),
                None,
                Vec::new(),
            ),
            Err(Error::TextProposalIsEmpty)
        );
    });
}

#[test]
fn create_runtime_upgrade_common_checks_succeed() {
    initial_test_ext().execute_with(|| {
        increase_total_balance_issuance_using_account_id(1, 5000000);

        let proposal_fixture = ProposalTestFixture {
            insufficient_rights_call: || {
                ProposalCodex::create_runtime_upgrade_proposal(
                    RawOrigin::None.into(),
                    1,
                    b"title".to_vec(),
                    b"body".to_vec(),
                    None,
                    b"wasm".to_vec(),
                )
            },
            empty_stake_call: || {
                ProposalCodex::create_runtime_upgrade_proposal(
                    RawOrigin::Signed(1).into(),
                    1,
                    b"title".to_vec(),
                    b"body".to_vec(),
                    None,
                    b"wasm".to_vec(),
                )
            },
            invalid_stake_call: || {
                ProposalCodex::create_runtime_upgrade_proposal(
                    RawOrigin::Signed(1).into(),
                    1,
                    b"title".to_vec(),
                    b"body".to_vec(),
                    Some(<BalanceOf<Test>>::from(500u32)),
                    b"wasm".to_vec(),
                )
            },
            successful_call: || {
                ProposalCodex::create_runtime_upgrade_proposal(
                    RawOrigin::Signed(1).into(),
                    1,
                    b"title".to_vec(),
                    b"body".to_vec(),
                    Some(<BalanceOf<Test>>::from(1_000_000_u32)),
                    b"wasm".to_vec(),
                )
            },
            proposal_parameters: crate::proposal_types::parameters::runtime_upgrade_proposal::<Test>(),
            proposal_details: ProposalDetails::RuntimeUpgrade(b"wasm".to_vec()),
        };
        proposal_fixture.check_all();
    });
}

#[test]
fn create_upgrade_runtime_proposal_codex_call_fails_with_incorrect_wasm_size() {
    initial_test_ext().execute_with(|| {
        let origin = RawOrigin::Signed(1).into();

        let long_wasm = [0u8; 30000].to_vec();
        assert_eq!(
            ProposalCodex::create_runtime_upgrade_proposal(
                origin,
                1,
                b"title".to_vec(),
                b"body".to_vec(),
                None,
                long_wasm,
            ),
            Err(Error::RuntimeProposalSizeExceeded)
        );

        assert_eq!(
            ProposalCodex::create_runtime_upgrade_proposal(
                RawOrigin::Signed(1).into(),
                1,
                b"title".to_vec(),
                b"body".to_vec(),
                None,
                Vec::new(),
            ),
            Err(Error::RuntimeProposalIsEmpty)
        );
    });
}

#[test]
fn create_set_election_parameters_proposal_common_checks_succeed() {
    initial_test_ext().execute_with(|| {
        increase_total_balance_issuance_using_account_id(1, 500000);

        let proposal_fixture = ProposalTestFixture {
            insufficient_rights_call: || {
                ProposalCodex::create_set_election_parameters_proposal(
                    RawOrigin::None.into(),
                    1,
                    b"title".to_vec(),
                    b"body".to_vec(),
                    None,
                    get_valid_election_parameters(),
                )
            },
            empty_stake_call: || {
                ProposalCodex::create_set_election_parameters_proposal(
                    RawOrigin::Signed(1).into(),
                    1,
                    b"title".to_vec(),
                    b"body".to_vec(),
                    None,
                    get_valid_election_parameters(),
                )
            },
            invalid_stake_call: || {
                ProposalCodex::create_set_election_parameters_proposal(
                    RawOrigin::Signed(1).into(),
                    1,
                    b"title".to_vec(),
                    b"body".to_vec(),
                    Some(<BalanceOf<Test>>::from(50000u32)),
                    get_valid_election_parameters(),
                )
            },
            successful_call: || {
                ProposalCodex::create_set_election_parameters_proposal(
                    RawOrigin::Signed(1).into(),
                    1,
                    b"title".to_vec(),
                    b"body".to_vec(),
                    Some(<BalanceOf<Test>>::from(200_000_u32)),
                    get_valid_election_parameters(),
                )
            },
            proposal_parameters:
                crate::proposal_types::parameters::set_election_parameters_proposal::<Test>(),
            proposal_details: ProposalDetails::SetElectionParameters(
                get_valid_election_parameters(),
            ),
        };
        proposal_fixture.check_all();
    });
}

fn assert_failed_election_parameters_call(
    election_parameters: ElectionParameters<u64, u64>,
    error: Error,
) {
    assert_eq!(
        ProposalCodex::create_set_election_parameters_proposal(
            RawOrigin::Signed(1).into(),
            1,
            b"title".to_vec(),
            b"body".to_vec(),
            Some(<BalanceOf<Test>>::from(3750u32)),
            election_parameters,
        ),
        Err(error)
    );
}

fn get_valid_election_parameters() -> ElectionParameters<u64, u64> {
    ElectionParameters {
        announcing_period: 14400,
        voting_period: 14400,
        revealing_period: 14400,
        council_size: 4,
        candidacy_limit: 25,
        new_term_duration: 14400,
        min_council_stake: 1,
        min_voting_stake: 1,
    }
}

#[test]
fn create_set_election_parameters_call_fails_with_incorrect_parameters() {
    initial_test_ext().execute_with(|| {
        increase_total_balance_issuance_using_account_id(1, 500000);

        let mut election_parameters = get_valid_election_parameters();
        election_parameters.council_size = 2;
        assert_failed_election_parameters_call(
            election_parameters,
            Error::InvalidCouncilElectionParameterCouncilSize,
        );

        election_parameters.council_size = 21;
        assert_failed_election_parameters_call(
            election_parameters,
            Error::InvalidCouncilElectionParameterCouncilSize,
        );

        election_parameters = get_valid_election_parameters();
        election_parameters.candidacy_limit = 22;
        assert_failed_election_parameters_call(
            election_parameters,
            Error::InvalidCouncilElectionParameterCandidacyLimit,
        );

        election_parameters = get_valid_election_parameters();
        election_parameters.candidacy_limit = 122;
        assert_failed_election_parameters_call(
            election_parameters,
            Error::InvalidCouncilElectionParameterCandidacyLimit,
        );

        election_parameters = get_valid_election_parameters();
        election_parameters.min_voting_stake = 0;
        assert_failed_election_parameters_call(
            election_parameters,
            Error::InvalidCouncilElectionParameterMinVotingStake,
        );

        election_parameters = get_valid_election_parameters();
        election_parameters.min_voting_stake = 200000;
        assert_failed_election_parameters_call(
            election_parameters,
            Error::InvalidCouncilElectionParameterMinVotingStake,
        );

        election_parameters = get_valid_election_parameters();
        election_parameters.new_term_duration = 10000;
        assert_failed_election_parameters_call(
            election_parameters,
            Error::InvalidCouncilElectionParameterNewTermDuration,
        );

        election_parameters = get_valid_election_parameters();
        election_parameters.new_term_duration = 500000;
        assert_failed_election_parameters_call(
            election_parameters,
            Error::InvalidCouncilElectionParameterNewTermDuration,
        );

        election_parameters = get_valid_election_parameters();
        election_parameters.min_council_stake = 0;
        assert_failed_election_parameters_call(
            election_parameters,
            Error::InvalidCouncilElectionParameterMinCouncilStake,
        );

        election_parameters = get_valid_election_parameters();
        election_parameters.min_council_stake = 200000;
        assert_failed_election_parameters_call(
            election_parameters,
            Error::InvalidCouncilElectionParameterMinCouncilStake,
        );

        election_parameters = get_valid_election_parameters();
        election_parameters.voting_period = 10000;
        assert_failed_election_parameters_call(
            election_parameters,
            Error::InvalidCouncilElectionParameterVotingPeriod,
        );

        election_parameters = get_valid_election_parameters();
        election_parameters.voting_period = 50000;
        assert_failed_election_parameters_call(
            election_parameters,
            Error::InvalidCouncilElectionParameterVotingPeriod,
        );

        election_parameters = get_valid_election_parameters();
        election_parameters.revealing_period = 10000;
        assert_failed_election_parameters_call(
            election_parameters,
            Error::InvalidCouncilElectionParameterRevealingPeriod,
        );

        election_parameters = get_valid_election_parameters();
        election_parameters.revealing_period = 50000;
        assert_failed_election_parameters_call(
            election_parameters,
            Error::InvalidCouncilElectionParameterRevealingPeriod,
        );

        election_parameters = get_valid_election_parameters();
        election_parameters.announcing_period = 10000;
        assert_failed_election_parameters_call(
            election_parameters,
            Error::InvalidCouncilElectionParameterAnnouncingPeriod,
        );

        election_parameters = get_valid_election_parameters();
        election_parameters.announcing_period = 50000;
        assert_failed_election_parameters_call(
            election_parameters,
            Error::InvalidCouncilElectionParameterAnnouncingPeriod,
        );
    });
}

#[test]
fn create_working_group_mint_capacity_proposal_fails_with_invalid_parameters() {
    initial_test_ext().execute_with(|| {
        increase_total_balance_issuance_using_account_id(1, 500000);

        assert_eq!(
            ProposalCodex::create_set_content_working_group_mint_capacity_proposal(
                RawOrigin::Signed(1).into(),
                1,
                b"title".to_vec(),
                b"body".to_vec(),
                Some(<BalanceOf<Test>>::from(50000u32)),
                (crate::CONTENT_WORKING_GROUP_MINT_CAPACITY_MAX_VALUE + 1) as u64,
            ),
            Err(Error::InvalidStorageWorkingGroupMintCapacity)
        );
    });
}

#[test]
fn create_set_content_working_group_mint_capacity_proposal_common_checks_succeed() {
    initial_test_ext().execute_with(|| {
        increase_total_balance_issuance(500000);

        let proposal_fixture = ProposalTestFixture {
            insufficient_rights_call: || {
                ProposalCodex::create_set_content_working_group_mint_capacity_proposal(
                    RawOrigin::None.into(),
                    1,
                    b"title".to_vec(),
                    b"body".to_vec(),
                    None,
                    0,
                )
            },
            empty_stake_call: || {
                ProposalCodex::create_set_content_working_group_mint_capacity_proposal(
                    RawOrigin::Signed(1).into(),
                    1,
                    b"title".to_vec(),
                    b"body".to_vec(),
                    None,
                    0,
                )
            },
            invalid_stake_call: || {
                ProposalCodex::create_set_content_working_group_mint_capacity_proposal(
                    RawOrigin::Signed(1).into(),
                    1,
                    b"title".to_vec(),
                    b"body".to_vec(),
                    Some(<BalanceOf<Test>>::from(5000u32)),
                    0,
                )
            },
            successful_call: || {
                ProposalCodex::create_set_content_working_group_mint_capacity_proposal(
                    RawOrigin::Signed(1).into(),
                    1,
                    b"title".to_vec(),
                    b"body".to_vec(),
                    Some(<BalanceOf<Test>>::from(50000u32)),
                    10,
                )
            },
            proposal_parameters: crate::proposal_types::parameters::set_content_working_group_mint_capacity_proposal::<Test>(),
            proposal_details: ProposalDetails::SetContentWorkingGroupMintCapacity(10),
        };
        proposal_fixture.check_all();
    });
}

#[test]
fn create_spending_proposal_common_checks_succeed() {
    initial_test_ext().execute_with(|| {
        increase_total_balance_issuance(500000);

        let proposal_fixture = ProposalTestFixture {
            insufficient_rights_call: || {
                ProposalCodex::create_spending_proposal(
                    RawOrigin::None.into(),
                    1,
                    b"title".to_vec(),
                    b"body".to_vec(),
                    None,
                    20,
                    10,
                )
            },
            empty_stake_call: || {
                ProposalCodex::create_spending_proposal(
                    RawOrigin::Signed(1).into(),
                    1,
                    b"title".to_vec(),
                    b"body".to_vec(),
                    None,
                    20,
                    10,
                )
            },
            invalid_stake_call: || {
                ProposalCodex::create_spending_proposal(
                    RawOrigin::Signed(1).into(),
                    1,
                    b"title".to_vec(),
                    b"body".to_vec(),
                    Some(<BalanceOf<Test>>::from(5000u32)),
                    20,
                    10,
                )
            },
            successful_call: || {
                ProposalCodex::create_spending_proposal(
                    RawOrigin::Signed(1).into(),
                    1,
                    b"title".to_vec(),
                    b"body".to_vec(),
                    Some(<BalanceOf<Test>>::from(25000u32)),
                    100,
                    2,
                )
            },
            proposal_parameters: crate::proposal_types::parameters::spending_proposal::<Test>(),
            proposal_details: ProposalDetails::Spending(100, 2),
        };
        proposal_fixture.check_all();
    });
}

#[test]
fn create_spending_proposal_call_fails_with_incorrect_balance() {
    initial_test_ext().execute_with(|| {
        increase_total_balance_issuance_using_account_id(500000, 1);

        assert_eq!(
            ProposalCodex::create_spending_proposal(
                RawOrigin::Signed(1).into(),
                1,
                b"title".to_vec(),
                b"body".to_vec(),
                Some(<BalanceOf<Test>>::from(1250u32)),
                0,
                2,
            ),
            Err(Error::InvalidSpendingProposalBalance)
        );

        assert_eq!(
            ProposalCodex::create_spending_proposal(
                RawOrigin::Signed(1).into(),
                1,
                b"title".to_vec(),
                b"body".to_vec(),
                Some(<BalanceOf<Test>>::from(1250u32)),
                2000001,
                2,
            ),
            Err(Error::InvalidSpendingProposalBalance)
        );
    });
}

#[test]
fn create_set_lead_proposal_fails_with_proposed_councilor() {
    initial_test_ext().execute_with(|| {
        increase_total_balance_issuance_using_account_id(1, 500000);

        let lead_account_id = 20;
        <governance::council::Module<Test>>::set_council(
            RawOrigin::Root.into(),
            vec![lead_account_id],
        )
        .unwrap();

        assert_eq!(
            ProposalCodex::create_set_lead_proposal(
                RawOrigin::Signed(1).into(),
                1,
                b"title".to_vec(),
                b"body".to_vec(),
                Some(<BalanceOf<Test>>::from(1250u32)),
                Some((20, lead_account_id)),
            ),
            Err(Error::InvalidSetLeadParameterCannotBeCouncilor)
        );
    });
}

#[test]
fn create_set_lead_proposal_common_checks_succeed() {
    initial_test_ext().execute_with(|| {
        increase_total_balance_issuance(500000);

        let proposal_fixture = ProposalTestFixture {
            insufficient_rights_call: || {
                ProposalCodex::create_set_lead_proposal(
                    RawOrigin::None.into(),
                    1,
                    b"title".to_vec(),
                    b"body".to_vec(),
                    None,
                    Some((20, 10)),
                )
            },
            empty_stake_call: || {
                ProposalCodex::create_set_lead_proposal(
                    RawOrigin::Signed(1).into(),
                    1,
                    b"title".to_vec(),
                    b"body".to_vec(),
                    None,
                    Some((20, 10)),
                )
            },
            invalid_stake_call: || {
                ProposalCodex::create_set_lead_proposal(
                    RawOrigin::Signed(1).into(),
                    1,
                    b"title".to_vec(),
                    b"body".to_vec(),
                    Some(<BalanceOf<Test>>::from(5000u32)),
                    Some((20, 10)),
                )
            },
            successful_call: || {
                ProposalCodex::create_set_lead_proposal(
                    RawOrigin::Signed(1).into(),
                    1,
                    b"title".to_vec(),
                    b"body".to_vec(),
                    Some(<BalanceOf<Test>>::from(50000u32)),
                    Some((20, 10)),
                )
            },
            proposal_parameters: crate::proposal_types::parameters::set_lead_proposal::<Test>(),
            proposal_details: ProposalDetails::SetLead(Some((20, 10))),
        };
        proposal_fixture.check_all();
    });
}

#[test]
fn create_set_validator_count_proposal_common_checks_succeed() {
    initial_test_ext().execute_with(|| {
        increase_total_balance_issuance_using_account_id(1, 500000);

        let proposal_fixture = ProposalTestFixture {
            insufficient_rights_call: || {
                ProposalCodex::create_set_validator_count_proposal(
                    RawOrigin::None.into(),
                    1,
                    b"title".to_vec(),
                    b"body".to_vec(),
                    None,
                    4,
                )
            },
            empty_stake_call: || {
                ProposalCodex::create_set_validator_count_proposal(
                    RawOrigin::Signed(1).into(),
                    1,
                    b"title".to_vec(),
                    b"body".to_vec(),
                    None,
                    4,
                )
            },
            invalid_stake_call: || {
                ProposalCodex::create_set_validator_count_proposal(
                    RawOrigin::Signed(1).into(),
                    1,
                    b"title".to_vec(),
                    b"body".to_vec(),
                    Some(<BalanceOf<Test>>::from(5000u32)),
                    4,
                )
            },
            successful_call: || {
                ProposalCodex::create_set_validator_count_proposal(
                    RawOrigin::Signed(1).into(),
                    1,
                    b"title".to_vec(),
                    b"body".to_vec(),
                    Some(<BalanceOf<Test>>::from(100_000_u32)),
                    4,
                )
            },
            proposal_parameters: crate::proposal_types::parameters::set_validator_count_proposal::<
                Test,
            >(),
            proposal_details: ProposalDetails::SetValidatorCount(4),
        };
        proposal_fixture.check_all();
    });
}

#[test]
fn create_set_validator_count_proposal_failed_with_invalid_validator_count() {
    initial_test_ext().execute_with(|| {
        assert_eq!(
            ProposalCodex::create_set_validator_count_proposal(
                RawOrigin::Signed(1).into(),
                1,
                b"title".to_vec(),
                b"body".to_vec(),
                Some(<BalanceOf<Test>>::from(500u32)),
                3,
            ),
            Err(Error::InvalidValidatorCount)
        );

        assert_eq!(
            ProposalCodex::create_set_validator_count_proposal(
                RawOrigin::Signed(1).into(),
                1,
                b"title".to_vec(),
                b"body".to_vec(),
                Some(<BalanceOf<Test>>::from(1001u32)),
                3,
            ),
            Err(Error::InvalidValidatorCount)
        );
    });
}

#[test]
fn set_default_proposal_parameters_succeeded() {
    initial_test_ext().execute_with(|| {
        let p = ProposalsConfigParameters::default();

        // nothing is set
        assert_eq!(<SetValidatorCountProposalVotingPeriod<Test>>::get(), 0);

        ProposalCodex::set_default_config_values();

        assert_eq!(
            <SetValidatorCountProposalVotingPeriod<Test>>::get(),
            p.set_validator_count_proposal_voting_period as u64
        );
        assert_eq!(
            <SetValidatorCountProposalGracePeriod<Test>>::get(),
            p.set_validator_count_proposal_grace_period as u64
        );
        assert_eq!(
            <RuntimeUpgradeProposalVotingPeriod<Test>>::get(),
            p.runtime_upgrade_proposal_voting_period as u64
        );
        assert_eq!(
            <RuntimeUpgradeProposalGracePeriod<Test>>::get(),
            p.runtime_upgrade_proposal_grace_period as u64
        );
        assert_eq!(
            <TextProposalVotingPeriod<Test>>::get(),
            p.text_proposal_voting_period as u64
        );
        assert_eq!(
            <TextProposalGracePeriod<Test>>::get(),
            p.text_proposal_grace_period as u64
        );
        assert_eq!(
            <SetElectionParametersProposalVotingPeriod<Test>>::get(),
            p.set_election_parameters_proposal_voting_period as u64
        );
        assert_eq!(
            <SetElectionParametersProposalGracePeriod<Test>>::get(),
            p.set_election_parameters_proposal_grace_period as u64
        );
        assert_eq!(
            <SetContentWorkingGroupMintCapacityProposalVotingPeriod<Test>>::get(),
            p.set_content_working_group_mint_capacity_proposal_voting_period as u64
        );
        assert_eq!(
            <SetContentWorkingGroupMintCapacityProposalGracePeriod<Test>>::get(),
            p.set_content_working_group_mint_capacity_proposal_grace_period as u64
        );
        assert_eq!(
            <SetLeadProposalVotingPeriod<Test>>::get(),
            p.set_lead_proposal_voting_period as u64
        );
        assert_eq!(
            <SetLeadProposalGracePeriod<Test>>::get(),
            p.set_lead_proposal_grace_period as u64
        );
        assert_eq!(
            <SpendingProposalVotingPeriod<Test>>::get(),
            p.spending_proposal_voting_period as u64
        );
        assert_eq!(
            <SpendingProposalGracePeriod<Test>>::get(),
            p.spending_proposal_grace_period as u64
        );
    });
}

#[test]
fn create_add_working_group_leader_opening_proposal_common_checks_succeed() {
    initial_test_ext().execute_with(|| {
        let add_opening_parameters = AddOpeningParameters {
            activate_at: ActivateOpeningAt::CurrentBlock,
            commitment: OpeningPolicyCommitment::default(),
            human_readable_text: b"some text".to_vec(),
            working_group: WorkingGroup::Storage,
        };

        increase_total_balance_issuance_using_account_id(1, 500000);

        let proposal_fixture = ProposalTestFixture {
            insufficient_rights_call: || {
                ProposalCodex::create_add_working_group_leader_opening_proposal(
                    RawOrigin::None.into(),
                    1,
                    b"title".to_vec(),
                    b"body".to_vec(),
                    None,
                    add_opening_parameters.clone(),
                )
            },
            empty_stake_call: || {
                ProposalCodex::create_add_working_group_leader_opening_proposal(
                    RawOrigin::Signed(1).into(),
                    1,
                    b"title".to_vec(),
                    b"body".to_vec(),
                    None,
                    add_opening_parameters.clone(),
                )
            },
            invalid_stake_call: || {
                ProposalCodex::create_add_working_group_leader_opening_proposal(
                    RawOrigin::Signed(1).into(),
                    1,
                    b"title".to_vec(),
                    b"body".to_vec(),
                    Some(<BalanceOf<Test>>::from(5000u32)),
                    add_opening_parameters.clone(),
                )
            },
            successful_call: || {
                ProposalCodex::create_add_working_group_leader_opening_proposal(
                    RawOrigin::Signed(1).into(),
                    1,
                    b"title".to_vec(),
                    b"body".to_vec(),
                    Some(<BalanceOf<Test>>::from(50000u32)),
                    add_opening_parameters.clone(),
                )
            },
            proposal_parameters: crate::proposal_types::parameters::add_working_group_leader_opening_proposal::<
                Test,
            >(),
            proposal_details: ProposalDetails::AddWorkingGroupLeaderOpening(add_opening_parameters.clone()),
        };
        proposal_fixture.check_all();
    });
}
