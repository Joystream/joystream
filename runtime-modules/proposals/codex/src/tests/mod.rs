mod mock;

use governance::election_params::ElectionParameters;
use srml_support::traits::Currency;
use srml_support::StorageMap;
use system::RawOrigin;

use crate::{BalanceOf, Error};
use mock::*;
use proposal_engine::ProposalParameters;
use srml_support::dispatch::DispatchResult;

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
        assert!((self.insufficient_rights_call)().is_err());
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
                    Some(<BalanceOf<Test>>::from(500u32)),
                    b"text".to_vec(),
                )
            },
            proposal_parameters: crate::proposal_types::parameters::text_proposal::<Test>(),
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
                    Some(<BalanceOf<Test>>::from(50000u32)),
                    b"wasm".to_vec(),
                )
            },
            proposal_parameters: crate::proposal_types::parameters::upgrade_runtime::<Test>(),
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
        let election_parameters = ElectionParameters {
            announcing_period: 1,
            voting_period: 2,
            revealing_period: 3,
            council_size: 4,
            candidacy_limit: 5,
            min_voting_stake: 6,
            min_council_stake: 7,
            new_term_duration: 8,
        };

        let proposal_fixture = ProposalTestFixture {
            insufficient_rights_call: || {
                ProposalCodex::create_set_election_parameters_proposal(
                    RawOrigin::Signed(1).into(),
                    1,
                    b"title".to_vec(),
                    b"body".to_vec(),
                    Some(<BalanceOf<Test>>::from(500u32)),
                    ElectionParameters::default(),
                )
            },
            empty_stake_call: || {
                ProposalCodex::create_set_election_parameters_proposal(
                    RawOrigin::Signed(1).into(),
                    1,
                    b"title".to_vec(),
                    b"body".to_vec(),
                    None,
                    election_parameters.clone(),
                )
            },
            invalid_stake_call: || {
                ProposalCodex::create_set_election_parameters_proposal(
                    RawOrigin::Signed(1).into(),
                    1,
                    b"title".to_vec(),
                    b"body".to_vec(),
                    Some(<BalanceOf<Test>>::from(50000u32)),
                    election_parameters.clone(),
                )
            },
            successful_call: || {
                ProposalCodex::create_set_election_parameters_proposal(
                    RawOrigin::Signed(1).into(),
                    1,
                    b"title".to_vec(),
                    b"body".to_vec(),
                    Some(<BalanceOf<Test>>::from(500u32)),
                    election_parameters.clone(),
                )
            },
            proposal_parameters:
                crate::proposal_types::parameters::set_election_parameters_proposal::<Test>(),
        };
        proposal_fixture.check_all();
    });
}
#[test]
fn create_set_election_parameters_call_fails_with_incorrect_parameters() {
    initial_test_ext().execute_with(|| {
        let account_id = 1;
        let required_stake = Some(<BalanceOf<Test>>::from(500u32));
        let _imbalance = <Test as stake::Trait>::Currency::deposit_creating(&account_id, 50000);

        assert_eq!(
            ProposalCodex::create_set_election_parameters_proposal(
                RawOrigin::Signed(1).into(),
                1,
                b"title".to_vec(),
                b"body".to_vec(),
                required_stake,
                ElectionParameters::default(),
            ),
            Err(Error::Other("PeriodCannotBeZero"))
        );
    });
}

#[test]
fn create_set_council_mint_capacity_proposal_common_checks_succeed() {
    initial_test_ext().execute_with(|| {
        let proposal_fixture = ProposalTestFixture {
            insufficient_rights_call: || {
                ProposalCodex::create_set_council_mint_capacity_proposal(
                    RawOrigin::None.into(),
                    1,
                    b"title".to_vec(),
                    b"body".to_vec(),
                    None,
                    0,
                )
            },
            empty_stake_call: || {
                ProposalCodex::create_set_council_mint_capacity_proposal(
                    RawOrigin::Signed(1).into(),
                    1,
                    b"title".to_vec(),
                    b"body".to_vec(),
                    None,
                    0,
                )
            },
            invalid_stake_call: || {
                ProposalCodex::create_set_council_mint_capacity_proposal(
                    RawOrigin::Signed(1).into(),
                    1,
                    b"title".to_vec(),
                    b"body".to_vec(),
                    Some(<BalanceOf<Test>>::from(5000u32)),
                    0,
                )
            },
            successful_call: || {
                ProposalCodex::create_set_council_mint_capacity_proposal(
                    RawOrigin::Signed(1).into(),
                    1,
                    b"title".to_vec(),
                    b"body".to_vec(),
                    Some(<BalanceOf<Test>>::from(500u32)),
                    0,
                )
            },
            proposal_parameters:
                crate::proposal_types::parameters::set_council_mint_capacity_proposal::<Test>(),
        };
        proposal_fixture.check_all();
    });
}

#[test]
fn create_set_content_working_group_mint_capacity_proposal_common_checks_succeed() {
    initial_test_ext().execute_with(|| {
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
                    Some(<BalanceOf<Test>>::from(500u32)),
                    0,
                )
            },
            proposal_parameters: crate::proposal_types::parameters::set_content_working_group_mint_capacity_proposal::<Test>(),
        };
        proposal_fixture.check_all();
    });
}

#[test]
fn create_spending_proposal_common_checks_succeed() {
    initial_test_ext().execute_with(|| {
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
                    Some(<BalanceOf<Test>>::from(500u32)),
                    100,
                    2,
                )
            },
            proposal_parameters: crate::proposal_types::parameters::spending_proposal::<Test>(),
        };
        proposal_fixture.check_all();
    });
}

#[test]
fn create_spending_proposal_call_fails_with_incorrect_balance() {
    initial_test_ext().execute_with(|| {
        assert_eq!(
            ProposalCodex::create_spending_proposal(
                RawOrigin::Signed(1).into(),
                1,
                b"title".to_vec(),
                b"body".to_vec(),
                Some(<BalanceOf<Test>>::from(500u32)),
                0,
                2,
            ),
            Err(Error::SpendingProposalZeroBalance)
        );
    });
}

#[test]
fn create_set_lead_proposal_common_checks_succeed() {
    initial_test_ext().execute_with(|| {
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
                    Some(<BalanceOf<Test>>::from(500u32)),
                    Some((20, 10)),
                )
            },
            proposal_parameters: crate::proposal_types::parameters::set_lead_proposal::<Test>(),
        };
        proposal_fixture.check_all();
    });
}
