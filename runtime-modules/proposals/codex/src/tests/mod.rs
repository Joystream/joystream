mod mock;

use frame_support::dispatch::{DispatchError, DispatchResult};
use frame_support::storage::StorageMap;
use frame_support::traits::Currency;
use system::RawOrigin;

use common::working_group::WorkingGroup;
use hiring::ActivateOpeningAt;
use proposals_engine::ProposalParameters;
use working_group::OpeningPolicyCommitment;

use crate::*;
use crate::{Error, ProposalDetails};
pub use mock::*;

use strum::IntoEnumIterator;

pub(crate) fn increase_total_balance_issuance(balance: u64) {
    increase_total_balance_issuance_using_account_id(999, balance);
}

pub(crate) fn increase_total_balance_issuance_using_account_id(account_id: u64, balance: u64) {
    let initial_balance = Balances::total_issuance();
    {
        let _ = Balances::deposit_creating(&account_id, balance);
    }
    assert_eq!(Balances::total_issuance(), initial_balance + balance);
}

struct ProposalTestFixture<InsufficientRightsCall, EmptyStakeCall, SuccessfulCall>
where
    InsufficientRightsCall: Fn() -> DispatchResult,
    EmptyStakeCall: Fn() -> DispatchResult,
    SuccessfulCall: Fn() -> DispatchResult,
{
    insufficient_rights_call: InsufficientRightsCall,
    empty_stake_call: EmptyStakeCall,
    successful_call: SuccessfulCall,
    proposal_parameters: ProposalParameters<u64, u64>,
    proposal_details: ProposalDetails<u64, u64, u64, u64, u64, u64, u64, u64>,
}

impl<InsufficientRightsCall, EmptyStakeCall, SuccessfulCall>
    ProposalTestFixture<InsufficientRightsCall, EmptyStakeCall, SuccessfulCall>
where
    InsufficientRightsCall: Fn() -> DispatchResult,
    EmptyStakeCall: Fn() -> DispatchResult,
    SuccessfulCall: Fn() -> DispatchResult,
{
    fn check_for_invalid_stakes(&self) {
        assert_eq!(
            (self.empty_stake_call)(),
            Err(proposals_engine::Error::<Test>::EmptyStake.into())
        );
    }

    fn check_call_for_insufficient_rights(&self) {
        assert_eq!(
            (self.insufficient_rights_call)(),
            Err(DispatchError::Other("Bad origin"))
        );
    }

    fn check_for_successful_call(&self) {
        let account_id = 1;
        let _imbalance = Balances::deposit_creating(&account_id, 150000);

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
                    None,
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
                    None,
                )
            },
            successful_call: || {
                ProposalCodex::create_text_proposal(
                    RawOrigin::Signed(1).into(),
                    1,
                    b"title".to_vec(),
                    b"body".to_vec(),
                    Some(1),
                    b"text".to_vec(),
                    None,
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
                None,
            ),
            Err(Error::<Test>::TextProposalSizeExceeded.into())
        );

        assert_eq!(
            ProposalCodex::create_text_proposal(
                RawOrigin::Signed(1).into(),
                1,
                b"title".to_vec(),
                b"body".to_vec(),
                None,
                Vec::new(),
                None,
            ),
            Err(Error::<Test>::TextProposalIsEmpty.into())
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
                    None,
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
                    None,
                )
            },
            successful_call: || {
                ProposalCodex::create_runtime_upgrade_proposal(
                    RawOrigin::Signed(1).into(),
                    1,
                    b"title".to_vec(),
                    b"body".to_vec(),
                    Some(1),
                    b"wasm".to_vec(),
                    None,
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
                None,
            ),
            Err(Error::<Test>::RuntimeProposalSizeExceeded.into())
        );

        assert_eq!(
            ProposalCodex::create_runtime_upgrade_proposal(
                RawOrigin::Signed(1).into(),
                1,
                b"title".to_vec(),
                b"body".to_vec(),
                None,
                Vec::new(),
                None,
            ),
            Err(Error::<Test>::RuntimeProposalIsEmpty.into())
        );
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
                    None,
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
                    None,
                )
            },
            successful_call: || {
                ProposalCodex::create_spending_proposal(
                    RawOrigin::Signed(1).into(),
                    1,
                    b"title".to_vec(),
                    b"body".to_vec(),
                    Some(1),
                    100,
                    2,
                    None,
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
                Some(1),
                0,
                2,
                None,
            ),
            Err(Error::<Test>::InvalidSpendingProposalBalance.into())
        );

        assert_eq!(
            ProposalCodex::create_spending_proposal(
                RawOrigin::Signed(1).into(),
                1,
                b"title".to_vec(),
                b"body".to_vec(),
                Some(1),
                5000001,
                2,
                None,
            ),
            Err(Error::<Test>::InvalidSpendingProposalBalance.into())
        );
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
                    None,
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
                    None,
                )
            },
            successful_call: || {
                ProposalCodex::create_set_validator_count_proposal(
                    RawOrigin::Signed(1).into(),
                    1,
                    b"title".to_vec(),
                    b"body".to_vec(),
                    Some(1),
                    4,
                    None,
                )
            },
            proposal_parameters: <Test as crate::Trait>::SetValidatorCountProposalParameters::get(),
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
                Some(1),
                3,
                None,
            ),
            Err(Error::<Test>::InvalidValidatorCount.into())
        );

        assert_eq!(
            ProposalCodex::create_set_validator_count_proposal(
                RawOrigin::Signed(1).into(),
                1,
                b"title".to_vec(),
                b"body".to_vec(),
                Some(1),
                3,
                None,
            ),
            Err(Error::<Test>::InvalidValidatorCount.into())
        );
    });
}

#[test]
fn create_add_working_group_leader_opening_proposal_common_checks_succeed() {
    // This uses strum crate for enum iteration
    for group in WorkingGroup::iter() {
        run_create_add_working_group_leader_opening_proposal_common_checks_succeed(group);
    }
}

fn run_create_add_working_group_leader_opening_proposal_common_checks_succeed(
    working_group: WorkingGroup,
) {
    initial_test_ext().execute_with(|| {
        let add_opening_parameters = AddOpeningParameters {
            activate_at: ActivateOpeningAt::CurrentBlock,
            commitment: OpeningPolicyCommitment::default(),
            human_readable_text: b"some text".to_vec(),
            working_group,
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
                    None,
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
                    None,
                )
            },
            successful_call: || {
                ProposalCodex::create_add_working_group_leader_opening_proposal(
                    RawOrigin::Signed(1).into(),
                    1,
                    b"title".to_vec(),
                    b"body".to_vec(),
                    Some(1),
                    add_opening_parameters.clone(),
                    None,
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

#[test]
fn create_begin_review_working_group_leader_applications_proposal_common_checks_succeed() {
    // This uses strum crate for enum iteration
    for group in WorkingGroup::iter() {
        run_create_begin_review_working_group_leader_applications_proposal_common_checks_succeed(
            group,
        );
    }
}

fn run_create_begin_review_working_group_leader_applications_proposal_common_checks_succeed(
    working_group: WorkingGroup,
) {
    initial_test_ext().execute_with(|| {
        let opening_id = 1; // random opening id.

        increase_total_balance_issuance_using_account_id(1, 500000);

        let proposal_fixture = ProposalTestFixture {
            insufficient_rights_call: || {
                ProposalCodex::create_begin_review_working_group_leader_applications_proposal(
                    RawOrigin::None.into(),
                    1,
                    b"title".to_vec(),
                    b"body".to_vec(),
                    None,
                    opening_id,
                    working_group,
 					None,
                )
            },
            empty_stake_call: || {
                ProposalCodex::create_begin_review_working_group_leader_applications_proposal(
                    RawOrigin::Signed(1).into(),
                    1,
                    b"title".to_vec(),
                    b"body".to_vec(),
                    None,
                    opening_id,
                    working_group,
 					None,
                )
            },
            successful_call: || {
                ProposalCodex::create_begin_review_working_group_leader_applications_proposal(
                    RawOrigin::Signed(1).into(),
                    1,
                    b"title".to_vec(),
                    b"body".to_vec(),
                    Some(1),
                    opening_id,
                    working_group,
 					None,
                )
            },
            proposal_parameters: crate::proposal_types::parameters::begin_review_working_group_leader_applications_proposal::<
                Test,
            >(),
            proposal_details: ProposalDetails::BeginReviewWorkingGroupLeaderApplications(opening_id,
                working_group),
        };
        proposal_fixture.check_all();
    });
}

#[test]
fn create_fill_working_group_leader_opening_proposal_common_checks_succeed() {
    // This uses strum crate for enum iteration
    for group in WorkingGroup::iter() {
        run_create_fill_working_group_leader_opening_proposal_common_checks_succeed(group);
    }
}

fn run_create_fill_working_group_leader_opening_proposal_common_checks_succeed(
    working_group: WorkingGroup,
) {
    initial_test_ext().execute_with(|| {
        let opening_id = 1; // random opening id.

        let fill_opening_parameters = FillOpeningParameters {
            opening_id,
            successful_application_id: 1,
            reward_policy: None,
            working_group,
        };

        increase_total_balance_issuance_using_account_id(1, 500000);

        let proposal_fixture = ProposalTestFixture {
            insufficient_rights_call: || {
                ProposalCodex::create_fill_working_group_leader_opening_proposal(
                    RawOrigin::None.into(),
                    1,
                    b"title".to_vec(),
                    b"body".to_vec(),
                    None,
                    fill_opening_parameters.clone(),
                    None,
                )
            },
            empty_stake_call: || {
                ProposalCodex::create_fill_working_group_leader_opening_proposal(
                    RawOrigin::Signed(1).into(),
                    1,
                    b"title".to_vec(),
                    b"body".to_vec(),
                    None,
                    fill_opening_parameters.clone(),
                    None,
                )
            },
            successful_call: || {
                ProposalCodex::create_fill_working_group_leader_opening_proposal(
                    RawOrigin::Signed(1).into(),
                    1,
                    b"title".to_vec(),
                    b"body".to_vec(),
                    Some(1),
                    fill_opening_parameters.clone(),
                    None,
                )
            },
            proposal_parameters: crate::proposal_types::parameters::fill_working_group_leader_opening_proposal::<
                Test,
            >(),
            proposal_details: ProposalDetails::FillWorkingGroupLeaderOpening(fill_opening_parameters.clone()),
        };
        proposal_fixture.check_all();
    });
}

#[test]
fn create_working_group_mint_capacity_proposal_fails_with_invalid_parameters() {
    // This uses strum crate for enum iteration
    for group in WorkingGroup::iter() {
        run_create_working_group_mint_capacity_proposal_fails_with_invalid_parameters(group);
    }
}

fn run_create_working_group_mint_capacity_proposal_fails_with_invalid_parameters(
    working_group: WorkingGroup,
) {
    initial_test_ext().execute_with(|| {
        increase_total_balance_issuance_using_account_id(1, 500000);

        assert_eq!(
            ProposalCodex::create_set_working_group_mint_capacity_proposal(
                RawOrigin::Signed(1).into(),
                1,
                b"title".to_vec(),
                b"body".to_vec(),
                Some(1),
                (crate::WORKING_GROUP_MINT_CAPACITY_MAX_VALUE + 1) as u64,
                working_group,
                None,
            ),
            Err(Error::<Test>::InvalidWorkingGroupMintCapacity.into())
        );
    });
}

#[test]
fn create_set_working_group_mint_capacity_proposal_common_checks_succeed() {
    // This uses strum crate for enum iteration
    for group in WorkingGroup::iter() {
        run_create_set_working_group_mint_capacity_proposal_common_checks_succeed(group);
    }
}

fn run_create_set_working_group_mint_capacity_proposal_common_checks_succeed(
    working_group: WorkingGroup,
) {
    initial_test_ext().execute_with(|| {
        increase_total_balance_issuance(500000);

        let proposal_fixture = ProposalTestFixture {
            insufficient_rights_call: || {
                ProposalCodex::create_set_working_group_mint_capacity_proposal(
                    RawOrigin::None.into(),
                    1,
                    b"title".to_vec(),
                    b"body".to_vec(),
                    None,
                    0,
                    working_group,
                    None,
                )
            },
            empty_stake_call: || {
                ProposalCodex::create_set_working_group_mint_capacity_proposal(
                    RawOrigin::Signed(1).into(),
                    1,
                    b"title".to_vec(),
                    b"body".to_vec(),
                    None,
                    0,
                    working_group,
                    None,
                )
            },
            successful_call: || {
                ProposalCodex::create_set_working_group_mint_capacity_proposal(
                    RawOrigin::Signed(1).into(),
                    1,
                    b"title".to_vec(),
                    b"body".to_vec(),
                    Some(1),
                    10,
                    working_group,
                    None,
                )
            },
            proposal_parameters:
                crate::proposal_types::parameters::set_working_group_mint_capacity_proposal::<Test>(
                ),
            proposal_details: ProposalDetails::SetWorkingGroupMintCapacity(10, working_group),
        };
        proposal_fixture.check_all();
    });
}

#[test]
fn create_decrease_working_group_leader_stake_proposal_common_checks_succeed() {
    // This uses strum crate for enum iteration
    for group in WorkingGroup::iter() {
        run_create_decrease_working_group_leader_stake_proposal_common_checks_succeed(group);
    }
}

fn run_create_decrease_working_group_leader_stake_proposal_common_checks_succeed(
    working_group: WorkingGroup,
) {
    initial_test_ext().execute_with(|| {
        increase_total_balance_issuance(500000);

        let proposal_fixture = ProposalTestFixture {
            insufficient_rights_call: || {
                ProposalCodex::create_decrease_working_group_leader_stake_proposal(
                    RawOrigin::None.into(),
                    1,
                    b"title".to_vec(),
                    b"body".to_vec(),
                    None,
                    0,
                    10,
                    working_group,
                    None,
                )
            },
            empty_stake_call: || {
                ProposalCodex::create_decrease_working_group_leader_stake_proposal(
                    RawOrigin::Signed(1).into(),
                    1,
                    b"title".to_vec(),
                    b"body".to_vec(),
                    None,
                    0,
                    10,
                    working_group,
                    None,
                )
            },
            successful_call: || {
                ProposalCodex::create_decrease_working_group_leader_stake_proposal(
                    RawOrigin::Signed(1).into(),
                    1,
                    b"title".to_vec(),
                    b"body".to_vec(),
                    Some(1),
                    10,
                    10,
                    working_group,
                    None,
                )
            },
            proposal_parameters:
                crate::proposal_types::parameters::decrease_working_group_leader_stake_proposal::<
                    Test,
                >(),
            proposal_details: ProposalDetails::DecreaseWorkingGroupLeaderStake(
                10,
                10,
                working_group,
            ),
        };
        proposal_fixture.check_all();
    });
}

#[test]
fn create_slash_working_group_leader_stake_proposal_common_checks_succeed() {
    // This uses strum crate for enum iteration
    for group in WorkingGroup::iter() {
        run_create_slash_working_group_leader_stake_proposal_common_checks_succeed(group);
    }
}

fn run_create_slash_working_group_leader_stake_proposal_common_checks_succeed(
    working_group: WorkingGroup,
) {
    initial_test_ext().execute_with(|| {
        increase_total_balance_issuance(500000);

        let proposal_fixture = ProposalTestFixture {
            insufficient_rights_call: || {
                ProposalCodex::create_slash_working_group_leader_stake_proposal(
                    RawOrigin::None.into(),
                    1,
                    b"title".to_vec(),
                    b"body".to_vec(),
                    None,
                    0,
                    10,
                    working_group,
 					None,
                )
            },
            empty_stake_call: || {
                ProposalCodex::create_slash_working_group_leader_stake_proposal(
                    RawOrigin::Signed(1).into(),
                    1,
                    b"title".to_vec(),
                    b"body".to_vec(),
                    None,
                    0,
                    10,
                    working_group,
 					None,
                )
            },
            successful_call: || {
                ProposalCodex::create_slash_working_group_leader_stake_proposal(
                    RawOrigin::Signed(1).into(),
                    1,
                    b"title".to_vec(),
                    b"body".to_vec(),
                    Some(1),
                    10,
                    10,
                    working_group,
 					None,
                )
            },
            proposal_parameters:
                crate::proposal_types::parameters::slash_working_group_leader_stake_proposal::<
                    Test,
                >(),
            proposal_details: ProposalDetails::SlashWorkingGroupLeaderStake(
                10,
                10,
                working_group,
            ),
        };
        proposal_fixture.check_all();
    });
}

#[test]
fn slash_stake_with_zero_staking_balance_fails() {
    // This uses strum crate for enum iteration
    for group in WorkingGroup::iter() {
        run_slash_stake_with_zero_staking_balance_fails(group);
    }
}

fn run_slash_stake_with_zero_staking_balance_fails(working_group: WorkingGroup) {
    initial_test_ext().execute_with(|| {
        increase_total_balance_issuance_using_account_id(1, 500000);

        let lead_account_id = 20;
        <governance::council::Module<Test>>::set_council(
            RawOrigin::Root.into(),
            vec![lead_account_id],
        )
        .unwrap();

        assert_eq!(
            ProposalCodex::create_slash_working_group_leader_stake_proposal(
                RawOrigin::Signed(1).into(),
                1,
                b"title".to_vec(),
                b"body".to_vec(),
                Some(1),
                10,
                0,
                working_group,
                None,
            ),
            Err(Error::<Test>::SlashingStakeIsZero.into())
        );
    });
}

#[test]
fn decrease_stake_with_zero_staking_balance_fails() {
    // This uses strum crate for enum iteration
    for group in WorkingGroup::iter() {
        run_decrease_stake_with_zero_staking_balance_fails(group);
    }
}

fn run_decrease_stake_with_zero_staking_balance_fails(working_group: WorkingGroup) {
    initial_test_ext().execute_with(|| {
        increase_total_balance_issuance_using_account_id(1, 500000);

        let lead_account_id = 20;
        <governance::council::Module<Test>>::set_council(
            RawOrigin::Root.into(),
            vec![lead_account_id],
        )
        .unwrap();

        assert_eq!(
            ProposalCodex::create_decrease_working_group_leader_stake_proposal(
                RawOrigin::Signed(1).into(),
                1,
                b"title".to_vec(),
                b"body".to_vec(),
                Some(1),
                10,
                0,
                working_group,
                None,
            ),
            Err(Error::<Test>::DecreasingStakeIsZero.into())
        );
    });
}

#[test]
fn create_set_working_group_leader_reward_proposal_common_checks_succeed() {
    // This uses strum crate for enum iteration
    for group in WorkingGroup::iter() {
        run_create_set_working_group_leader_reward_proposal_common_checks_succeed(group);
    }
}

fn run_create_set_working_group_leader_reward_proposal_common_checks_succeed(
    working_group: WorkingGroup,
) {
    initial_test_ext().execute_with(|| {
        let proposal_fixture = ProposalTestFixture {
            insufficient_rights_call: || {
                ProposalCodex::create_set_working_group_leader_reward_proposal(
                    RawOrigin::None.into(),
                    1,
                    b"title".to_vec(),
                    b"body".to_vec(),
                    None,
                    0,
                    10,
                    working_group,
                    None,
                )
            },
            empty_stake_call: || {
                ProposalCodex::create_set_working_group_leader_reward_proposal(
                    RawOrigin::Signed(1).into(),
                    1,
                    b"title".to_vec(),
                    b"body".to_vec(),
                    None,
                    0,
                    10,
                    working_group,
                    None,
                )
            },
            successful_call: || {
                ProposalCodex::create_set_working_group_leader_reward_proposal(
                    RawOrigin::Signed(1).into(),
                    1,
                    b"title".to_vec(),
                    b"body".to_vec(),
                    Some(1),
                    10,
                    10,
                    working_group,
                    None,
                )
            },
            proposal_parameters:
                crate::proposal_types::parameters::set_working_group_leader_reward_proposal::<Test>(
                ),
            proposal_details: ProposalDetails::SetWorkingGroupLeaderReward(10, 10, working_group),
        };
        proposal_fixture.check_all();
    });
}

#[test]
fn create_terminate_working_group_leader_role_proposal_common_checks_succeed() {
    // This uses strum crate for enum iteration
    for group in WorkingGroup::iter() {
        run_create_terminate_working_group_leader_role_proposal_common_checks_succeed(group);
    }
}

fn run_create_terminate_working_group_leader_role_proposal_common_checks_succeed(
    working_group: WorkingGroup,
) {
    initial_test_ext().execute_with(|| {
        increase_total_balance_issuance(500000);

        let terminate_role_parameters = TerminateRoleParameters {
            worker_id: 10,
            rationale: Vec::new(),
            slash: false,
            working_group,
        };

        let proposal_fixture = ProposalTestFixture {
            insufficient_rights_call: || {
                ProposalCodex::create_terminate_working_group_leader_role_proposal(
                    RawOrigin::None.into(),
                    1,
                    b"title".to_vec(),
                    b"body".to_vec(),
                    None,
                    terminate_role_parameters.clone(),
                    None,
                )
            },
            empty_stake_call: || {
                ProposalCodex::create_terminate_working_group_leader_role_proposal(
                    RawOrigin::Signed(1).into(),
                    1,
                    b"title".to_vec(),
                    b"body".to_vec(),
                    None,
                    terminate_role_parameters.clone(),
                    None,
                )
            },
            successful_call: || {
                ProposalCodex::create_terminate_working_group_leader_role_proposal(
                    RawOrigin::Signed(1).into(),
                    1,
                    b"title".to_vec(),
                    b"body".to_vec(),
                    Some(1),
                    terminate_role_parameters.clone(),
                    None,
                )
            },
            proposal_parameters:
                crate::proposal_types::parameters::terminate_working_group_leader_role_proposal::<
                    Test,
                >(),
            proposal_details: ProposalDetails::TerminateWorkingGroupLeaderRole(
                terminate_role_parameters.clone(),
            ),
        };
        proposal_fixture.check_all();
    });
}

#[test]
fn create_amend_constitution_proposal_common_checks_succeed() {
    initial_test_ext().execute_with(|| {
        increase_total_balance_issuance_using_account_id(1, 1_500_000);

        let proposal_fixture = ProposalTestFixture {
            insufficient_rights_call: || {
                ProposalCodex::create_amend_constitution_proposal(
                    RawOrigin::None.into(),
                    1,
                    b"title".to_vec(),
                    b"body".to_vec(),
                    None,
                    b"constitution text".to_vec(),
                    None,
                )
            },
            empty_stake_call: || {
                ProposalCodex::create_amend_constitution_proposal(
                    RawOrigin::Signed(1).into(),
                    1,
                    b"title".to_vec(),
                    b"body".to_vec(),
                    None,
                    b"constitution text".to_vec(),
                    None,
                )
            },
            successful_call: || {
                ProposalCodex::create_amend_constitution_proposal(
                    RawOrigin::Signed(1).into(),
                    1,
                    b"title".to_vec(),
                    b"body".to_vec(),
                    Some(1),
                    b"constitution text".to_vec(),
                    None,
                )
            },
            proposal_parameters: crate::proposal_types::parameters::amend_constitution_proposal::<
                Test,
            >(),
            proposal_details: ProposalDetails::AmendConstitution(b"constitution text".to_vec()),
        };
        proposal_fixture.check_all();
    });
}
