mod mock;

use frame_support::dispatch::{DispatchError, DispatchResult};
use frame_support::storage::StorageMap;
use frame_support::traits::Currency;
use frame_system::RawOrigin;

use common::working_group::WorkingGroup;
use proposals_engine::ProposalParameters;
use working_group::Penalty;

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
    proposal_details: ProposalDetails<u64, u64, u64, u64, u64, u64>,
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

        let general_proposal_parameters_no_staking = GeneralProposalParameters::<Test> {
            member_id: 1,
            title: b"title".to_vec(),
            description: b"body".to_vec(),
            staking_account_id: None,
            exact_execution_block: None,
        };

        let general_proposal_parameters_with_staking = GeneralProposalParameters::<Test> {
            member_id: 1,
            title: b"title".to_vec(),
            description: b"body".to_vec(),
            staking_account_id: Some(1),
            exact_execution_block: None,
        };

        let text_proposal_details = ProposalDetails::Text(b"text".to_vec());

        let proposal_fixture = ProposalTestFixture {
            insufficient_rights_call: || {
                ProposalCodex::create_proposal(
                    RawOrigin::None.into(),
                    general_proposal_parameters_no_staking.clone(),
                    text_proposal_details.clone(),
                )
            },
            empty_stake_call: || {
                ProposalCodex::create_proposal(
                    RawOrigin::Signed(1).into(),
                    general_proposal_parameters_no_staking.clone(),
                    text_proposal_details.clone(),
                )
            },
            successful_call: || {
                ProposalCodex::create_proposal(
                    RawOrigin::Signed(1).into(),
                    general_proposal_parameters_with_staking.clone(),
                    text_proposal_details.clone(),
                )
            },
            proposal_parameters: <Test as crate::Trait>::TextProposalParameters::get(),
            proposal_details: text_proposal_details.clone(),
        };
        proposal_fixture.check_all();
    });
}

#[test]
fn create_text_proposal_codex_call_fails_without_text() {
    initial_test_ext().execute_with(|| {
        let general_proposal_parameters = GeneralProposalParameters::<Test> {
            member_id: 1,
            title: b"title".to_vec(),
            description: b"body".to_vec(),
            staking_account_id: None,
            exact_execution_block: None,
        };

        assert_eq!(
            ProposalCodex::create_proposal(
                RawOrigin::Signed(1).into(),
                general_proposal_parameters.clone(),
                ProposalDetails::Text(Vec::new()),
            ),
            Err(Error::<Test>::TextProposalIsEmpty.into())
        );
    });
}

#[test]
fn create_runtime_upgrade_common_checks_succeed() {
    initial_test_ext().execute_with(|| {
        increase_total_balance_issuance_using_account_id(1, 5000000);

        let general_proposal_parameters_no_staking = GeneralProposalParameters::<Test> {
            member_id: 1,
            title: b"title".to_vec(),
            description: b"body".to_vec(),
            staking_account_id: None,
            exact_execution_block: None,
        };

        let general_proposal_parameters_with_staking = GeneralProposalParameters::<Test> {
            member_id: 1,
            title: b"title".to_vec(),
            description: b"body".to_vec(),
            staking_account_id: Some(1),
            exact_execution_block: None,
        };

        let proposal_details_upgrade = ProposalDetails::RuntimeUpgrade(b"wasm".to_vec());

        let proposal_fixture = ProposalTestFixture {
            insufficient_rights_call: || {
                ProposalCodex::create_proposal(
                    RawOrigin::None.into(),
                    general_proposal_parameters_no_staking.clone(),
                    proposal_details_upgrade.clone(),
                )
            },
            empty_stake_call: || {
                ProposalCodex::create_proposal(
                    RawOrigin::Signed(1).into(),
                    general_proposal_parameters_no_staking.clone(),
                    proposal_details_upgrade.clone(),
                )
            },
            successful_call: || {
                ProposalCodex::create_proposal(
                    RawOrigin::Signed(1).into(),
                    general_proposal_parameters_with_staking.clone(),
                    proposal_details_upgrade.clone(),
                )
            },
            proposal_parameters: <Test as crate::Trait>::RuntimeUpgradeProposalParameters::get(),
            proposal_details: proposal_details_upgrade.clone(),
        };
        proposal_fixture.check_all();
    });
}

#[test]
fn create_upgrade_runtime_proposal_codex_call_fails_with_empty_wasm() {
    initial_test_ext().execute_with(|| {
        let general_proposal_parameters = GeneralProposalParameters::<Test> {
            member_id: 1,
            title: b"title".to_vec(),
            description: b"body".to_vec(),
            staking_account_id: None,
            exact_execution_block: None,
        };

        assert_eq!(
            ProposalCodex::create_proposal(
                RawOrigin::Signed(1).into(),
                general_proposal_parameters.clone(),
                ProposalDetails::RuntimeUpgrade(Vec::new()),
            ),
            Err(Error::<Test>::RuntimeProposalIsEmpty.into())
        );
    });
}

#[test]
fn create_spending_proposal_common_checks_succeed() {
    initial_test_ext().execute_with(|| {
        increase_total_balance_issuance(500000);

        let general_proposal_parameters_no_staking = GeneralProposalParameters::<Test> {
            member_id: 1,
            title: b"title".to_vec(),
            description: b"body".to_vec(),
            staking_account_id: None,
            exact_execution_block: None,
        };

        let general_proposal_parameters_with_staking = GeneralProposalParameters::<Test> {
            member_id: 1,
            title: b"title".to_vec(),
            description: b"body".to_vec(),
            staking_account_id: Some(1),
            exact_execution_block: None,
        };

        let spending_proposal_details = ProposalDetails::Spending(20, 10);
        let spending_proposal_details_succesful = ProposalDetails::Spending(100, 2);

        let proposal_fixture = ProposalTestFixture {
            insufficient_rights_call: || {
                ProposalCodex::create_proposal(
                    RawOrigin::None.into(),
                    general_proposal_parameters_no_staking.clone(),
                    spending_proposal_details.clone(),
                )
            },
            empty_stake_call: || {
                ProposalCodex::create_proposal(
                    RawOrigin::Signed(1).into(),
                    general_proposal_parameters_no_staking.clone(),
                    spending_proposal_details.clone(),
                )
            },
            successful_call: || {
                ProposalCodex::create_proposal(
                    RawOrigin::Signed(1).into(),
                    general_proposal_parameters_with_staking.clone(),
                    spending_proposal_details_succesful.clone(),
                )
            },
            proposal_parameters: <Test as crate::Trait>::SpendingProposalParameters::get(),
            proposal_details: spending_proposal_details_succesful.clone(),
        };
        proposal_fixture.check_all();
    });
}

#[test]
fn create_spending_proposal_call_fails_with_incorrect_balance() {
    initial_test_ext().execute_with(|| {
        increase_total_balance_issuance_using_account_id(500000, 1);

        let general_proposal_parameters = GeneralProposalParameters::<Test> {
            member_id: 1,
            title: b"title".to_vec(),
            description: b"body".to_vec(),
            staking_account_id: Some(1),
            exact_execution_block: None,
        };

        assert_eq!(
            ProposalCodex::create_proposal(
                RawOrigin::Signed(1).into(),
                general_proposal_parameters.clone(),
                ProposalDetails::Spending(0, 2),
            ),
            Err(Error::<Test>::InvalidSpendingProposalBalance.into())
        );

        assert_eq!(
            ProposalCodex::create_proposal(
                RawOrigin::Signed(1).into(),
                general_proposal_parameters.clone(),
                ProposalDetails::Spending(5000001, 2),
            ),
            Err(Error::<Test>::InvalidSpendingProposalBalance.into())
        );
    });
}

#[test]
fn create_set_validator_count_proposal_common_checks_succeed() {
    initial_test_ext().execute_with(|| {
        increase_total_balance_issuance_using_account_id(1, 500000);

        let general_proposal_parameters_no_staking = GeneralProposalParameters::<Test> {
            member_id: 1,
            title: b"title".to_vec(),
            description: b"body".to_vec(),
            staking_account_id: None,
            exact_execution_block: None,
        };

        let general_proposal_parameters_with_staking = GeneralProposalParameters::<Test> {
            member_id: 1,
            title: b"title".to_vec(),
            description: b"body".to_vec(),
            staking_account_id: Some(1),
            exact_execution_block: None,
        };

        let validator_count_details = ProposalDetails::SetValidatorCount(4);

        let proposal_fixture = ProposalTestFixture {
            insufficient_rights_call: || {
                ProposalCodex::create_proposal(
                    RawOrigin::None.into(),
                    general_proposal_parameters_no_staking.clone(),
                    validator_count_details.clone(),
                )
            },
            empty_stake_call: || {
                ProposalCodex::create_proposal(
                    RawOrigin::Signed(1).into(),
                    general_proposal_parameters_no_staking.clone(),
                    validator_count_details.clone(),
                )
            },
            successful_call: || {
                ProposalCodex::create_proposal(
                    RawOrigin::Signed(1).into(),
                    general_proposal_parameters_with_staking.clone(),
                    validator_count_details.clone(),
                )
            },
            proposal_parameters: <Test as crate::Trait>::SetValidatorCountProposalParameters::get(),
            proposal_details: validator_count_details.clone(),
        };
        proposal_fixture.check_all();
    });
}

#[test]
fn create_set_validator_count_proposal_failed_with_invalid_validator_count() {
    initial_test_ext().execute_with(|| {
        staking::MinimumValidatorCount::put(10);

        let general_proposal_parameters = GeneralProposalParameters::<Test> {
            member_id: 1,
            title: b"title".to_vec(),
            description: b"body".to_vec(),
            staking_account_id: Some(<BalanceOf<Test>>::from(100_000_u32)),
            exact_execution_block: None,
        };

        assert_eq!(
            ProposalCodex::create_proposal(
                RawOrigin::Signed(1).into(),
                general_proposal_parameters.clone(),
                ProposalDetails::SetValidatorCount(3),
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
        let general_proposal_parameters_no_staking = GeneralProposalParameters::<Test> {
            member_id: 1,
            title: b"title".to_vec(),
            description: b"body".to_vec(),
            staking_account_id: None,
            exact_execution_block: None,
        };

        let general_proposal_parameters_with_staking = GeneralProposalParameters::<Test> {
            member_id: 1,
            title: b"title".to_vec(),
            description: b"body".to_vec(),
            staking_account_id: Some(1),
            exact_execution_block: None,
        };

        let add_opening_parameters = AddOpeningParameters {
            description: b"some text".to_vec(),
            stake_policy: None,
            reward_per_block: None,
            working_group,
        };

        let add_leader_details =
            ProposalDetails::AddWorkingGroupLeaderOpening(add_opening_parameters);

        increase_total_balance_issuance_using_account_id(1, 500000);

        let proposal_fixture = ProposalTestFixture {
            insufficient_rights_call: || {
                ProposalCodex::create_proposal(
                    RawOrigin::None.into(),
                    general_proposal_parameters_no_staking.clone(),
                    add_leader_details.clone(),
                )
            },
            empty_stake_call: || {
                ProposalCodex::create_proposal(
                    RawOrigin::Signed(1).into(),
                    general_proposal_parameters_no_staking.clone(),
                    add_leader_details.clone(),
                )
            },
            successful_call: || {
                ProposalCodex::create_proposal(
                    RawOrigin::Signed(1).into(),
                    general_proposal_parameters_with_staking.clone(),
                    add_leader_details.clone(),
                )
            },
            proposal_parameters:
                <Test as crate::Trait>::AddWorkingGroupOpeningProposalParameters::get(),
            proposal_details: add_leader_details.clone(),
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

        let general_proposal_parameters_no_staking = GeneralProposalParameters::<Test> {
            member_id: 1,
            title: b"title".to_vec(),
            description: b"body".to_vec(),
            staking_account_id: None,
            exact_execution_block: None,
        };

        let general_proposal_parameters_with_staking = GeneralProposalParameters::<Test> {
            member_id: 1,
            title: b"title".to_vec(),
            description: b"body".to_vec(),
            staking_account_id: Some(1),
            exact_execution_block: None,
        };

        let fill_opening_parameters = FillOpeningParameters {
            opening_id,
            successful_application_id: 1,
            working_group,
        };

        let fill_opening_details =
            ProposalDetails::FillWorkingGroupLeaderOpening(fill_opening_parameters);

        increase_total_balance_issuance_using_account_id(1, 500000);

        let proposal_fixture = ProposalTestFixture {
            insufficient_rights_call: || {
                ProposalCodex::create_proposal(
                    RawOrigin::None.into(),
                    general_proposal_parameters_no_staking.clone(),
                    fill_opening_details.clone(),
                )
            },
            empty_stake_call: || {
                ProposalCodex::create_proposal(
                    RawOrigin::Signed(1).into(),
                    general_proposal_parameters_no_staking.clone(),
                    fill_opening_details.clone(),
                )
            },
            successful_call: || {
                ProposalCodex::create_proposal(
                    RawOrigin::Signed(1).into(),
                    general_proposal_parameters_with_staking.clone(),
                    fill_opening_details.clone(),
                )
            },
            proposal_parameters:
                <Test as crate::Trait>::FillWorkingGroupOpeningProposalParameters::get(),
            proposal_details: fill_opening_details.clone(),
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

        let general_proposal_parameters = GeneralProposalParameters::<Test> {
            member_id: 1,
            title: b"title".to_vec(),
            description: b"body".to_vec(),
            staking_account_id: Some(1),
            exact_execution_block: None,
        };

        assert_eq!(
            ProposalCodex::create_proposal(
                RawOrigin::Signed(1).into(),
                general_proposal_parameters.clone(),
                ProposalDetails::SetWorkingGroupBudgetCapacity(
                    (crate::WORKING_GROUP_BUDGET_CAPACITY_MAX_VALUE + 1) as u64,
                    working_group,
                ),
            ),
            Err(Error::<Test>::InvalidWorkingGroupBudgetCapacity.into())
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

        let general_proposal_parameters_no_staking = GeneralProposalParameters::<Test> {
            member_id: 1,
            title: b"title".to_vec(),
            description: b"body".to_vec(),
            staking_account_id: None,
            exact_execution_block: None,
        };

        let general_proposal_parameters_with_staking = GeneralProposalParameters::<Test> {
            member_id: 1,
            title: b"title".to_vec(),
            description: b"body".to_vec(),
            staking_account_id: Some(1),
            exact_execution_block: None,
        };

        let budget_capacity_details =
            ProposalDetails::SetWorkingGroupBudgetCapacity(0, working_group);
        let budget_capacity_details_success =
            ProposalDetails::SetWorkingGroupBudgetCapacity(0, working_group);

        let proposal_fixture = ProposalTestFixture {
            insufficient_rights_call: || {
                ProposalCodex::create_proposal(
                    RawOrigin::None.into(),
                    general_proposal_parameters_no_staking.clone(),
                    budget_capacity_details.clone(),
                )
            },
            empty_stake_call: || {
                ProposalCodex::create_proposal(
                    RawOrigin::Signed(1).into(),
                    general_proposal_parameters_no_staking.clone(),
                    budget_capacity_details.clone(),
                )
            },
            successful_call: || {
                ProposalCodex::create_proposal(
                    RawOrigin::Signed(1).into(),
                    general_proposal_parameters_with_staking.clone(),
                    budget_capacity_details_success.clone(),
                )
            },
            proposal_parameters:
                <Test as crate::Trait>::SetWorkingGroupBudgetCapacityProposalParameters::get(),
            proposal_details: budget_capacity_details_success.clone(),
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

        let general_proposal_parameters_no_staking = GeneralProposalParameters::<Test> {
            member_id: 1,
            title: b"title".to_vec(),
            description: b"body".to_vec(),
            staking_account_id: None,
            exact_execution_block: None,
        };

        let general_proposal_parameters_with_staking = GeneralProposalParameters::<Test> {
            member_id: 1,
            title: b"title".to_vec(),
            description: b"body".to_vec(),
            staking_account_id: Some(1),
            exact_execution_block: None,
        };

        let decrease_lead_stake_details =
            ProposalDetails::DecreaseWorkingGroupLeaderStake(0, 10, working_group);

        let decrease_lead_stake_details_success =
            ProposalDetails::DecreaseWorkingGroupLeaderStake(10, 10, working_group);

        let proposal_fixture = ProposalTestFixture {
            insufficient_rights_call: || {
                ProposalCodex::create_proposal(
                    RawOrigin::None.into(),
                    general_proposal_parameters_no_staking.clone(),
                    decrease_lead_stake_details.clone(),
                )
            },
            empty_stake_call: || {
                ProposalCodex::create_proposal(
                    RawOrigin::Signed(1).into(),
                    general_proposal_parameters_no_staking.clone(),
                    decrease_lead_stake_details.clone(),
                )
            },
            successful_call: || {
                ProposalCodex::create_proposal(
                    RawOrigin::Signed(1).into(),
                    general_proposal_parameters_with_staking.clone(),
                    decrease_lead_stake_details_success.clone(),
                )
            },
            proposal_parameters:
                <Test as crate::Trait>::DecreaseWorkingGroupLeaderStakeProposalParameters::get(),
            proposal_details: decrease_lead_stake_details_success.clone(),
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

        let general_proposal_parameters_no_staking = GeneralProposalParameters::<Test> {
            member_id: 1,
            title: b"title".to_vec(),
            description: b"body".to_vec(),
            staking_account_id: None,
            exact_execution_block: None,
        };

        let general_proposal_parameters_with_staking = GeneralProposalParameters::<Test> {
            member_id: 1,
            title: b"title".to_vec(),
            description: b"body".to_vec(),
            staking_account_id: Some(1),
            exact_execution_block: None,
        };

        let slash_lead_details = ProposalDetails::SlashWorkingGroupLeaderStake(
            0,
            Penalty {
                slashing_amount: 10,
                slashing_text: Vec::new(),
            },
            working_group,
        );

        let slash_lead_details_success = ProposalDetails::SlashWorkingGroupLeaderStake(
            10,
            Penalty {
                slashing_amount: 10,
                slashing_text: Vec::new(),
            },
            working_group,
        );

        let proposal_fixture = ProposalTestFixture {
            insufficient_rights_call: || {
                ProposalCodex::create_proposal(
                    RawOrigin::None.into(),
                    general_proposal_parameters_no_staking.clone(),
                    slash_lead_details.clone(),
                )
            },
            empty_stake_call: || {
                ProposalCodex::create_proposal(
                    RawOrigin::Signed(1).into(),
                    general_proposal_parameters_no_staking.clone(),
                    slash_lead_details.clone(),
                )
            },
            successful_call: || {
                ProposalCodex::create_proposal(
                    RawOrigin::Signed(1).into(),
                    general_proposal_parameters_with_staking.clone(),
                    slash_lead_details_success.clone(),
                )
            },
            proposal_parameters:
                <Test as crate::Trait>::SlashWorkingGroupLeaderStakeProposalParameters::get(),
            proposal_details: slash_lead_details_success.clone(),
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

        let general_proposal_parameters = GeneralProposalParameters::<Test> {
            member_id: 1,
            title: b"title".to_vec(),
            description: b"body".to_vec(),
            staking_account_id: Some(1),
            exact_execution_block: None,
        };

        let lead_account_id = 20;
        <governance::council::Module<Test>>::set_council(
            RawOrigin::Root.into(),
            vec![lead_account_id],
        )
        .unwrap();

        assert_eq!(
            ProposalCodex::create_proposal(
                RawOrigin::Signed(1).into(),
                general_proposal_parameters.clone(),
                ProposalDetails::SlashWorkingGroupLeaderStake(
                    10,
                    Penalty {
                        slashing_amount: 0,
                        slashing_text: Vec::new()
                    },
                    working_group,
                )
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

        let general_proposal_parameters = GeneralProposalParameters::<Test> {
            member_id: 1,
            title: b"title".to_vec(),
            description: b"body".to_vec(),
            staking_account_id: Some(1),
            exact_execution_block: None,
        };

        let lead_account_id = 20;
        <governance::council::Module<Test>>::set_council(
            RawOrigin::Root.into(),
            vec![lead_account_id],
        )
        .unwrap();

        assert_eq!(
            ProposalCodex::create_proposal(
                RawOrigin::Signed(1).into(),
                general_proposal_parameters,
                ProposalDetails::DecreaseWorkingGroupLeaderStake(10, 0, working_group,)
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
        let general_proposal_parameters_no_staking = GeneralProposalParameters::<Test> {
            member_id: 1,
            title: b"title".to_vec(),
            description: b"body".to_vec(),
            staking_account_id: None,
            exact_execution_block: None,
        };

        let general_proposal_parameters_with_staking = GeneralProposalParameters::<Test> {
            member_id: 1,
            title: b"title".to_vec(),
            description: b"body".to_vec(),
            staking_account_id: Some(1),
            exact_execution_block: None,
        };

        let set_lead_reward_details =
            ProposalDetails::SetWorkingGroupLeaderReward(0, Some(10), working_group);

        let set_lead_reward_details_success =
            ProposalDetails::SetWorkingGroupLeaderReward(10, Some(10), working_group);
        let proposal_fixture = ProposalTestFixture {
            insufficient_rights_call: || {
                ProposalCodex::create_proposal(
                    RawOrigin::None.into(),
                    general_proposal_parameters_no_staking.clone(),
                    set_lead_reward_details.clone(),
                )
            },
            empty_stake_call: || {
                ProposalCodex::create_proposal(
                    RawOrigin::Signed(1).into(),
                    general_proposal_parameters_no_staking.clone(),
                    set_lead_reward_details.clone(),
                )
            },
            successful_call: || {
                ProposalCodex::create_proposal(
                    RawOrigin::Signed(1).into(),
                    general_proposal_parameters_with_staking.clone(),
                    set_lead_reward_details_success.clone(),
                )
            },
            proposal_parameters:
                <Test as crate::Trait>::SlashWorkingGroupLeaderStakeProposalParameters::get(),
            proposal_details: set_lead_reward_details_success.clone(),
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

        let general_proposal_parameters_no_staking = GeneralProposalParameters::<Test> {
            member_id: 1,
            title: b"title".to_vec(),
            description: b"body".to_vec(),
            staking_account_id: None,
            exact_execution_block: None,
        };

        let general_proposal_parameters_with_staking = GeneralProposalParameters::<Test> {
            member_id: 1,
            title: b"title".to_vec(),
            description: b"body".to_vec(),
            staking_account_id: Some(1),
            exact_execution_block: None,
        };

        let terminate_role_parameters = TerminateRoleParameters {
            worker_id: 10,
            penalty: None,
            working_group,
        };

        let terminate_lead_details =
            ProposalDetails::TerminateWorkingGroupLeaderRole(terminate_role_parameters);

        let proposal_fixture = ProposalTestFixture {
            insufficient_rights_call: || {
                ProposalCodex::create_proposal(
                    RawOrigin::None.into(),
                    general_proposal_parameters_no_staking.clone(),
                    terminate_lead_details.clone(),
                )
            },
            empty_stake_call: || {
                ProposalCodex::create_proposal(
                    RawOrigin::Signed(1).into(),
                    general_proposal_parameters_no_staking.clone(),
                    terminate_lead_details.clone(),
                )
            },
            successful_call: || {
                ProposalCodex::create_proposal(
                    RawOrigin::Signed(1).into(),
                    general_proposal_parameters_with_staking.clone(),
                    terminate_lead_details.clone(),
                )
            },
            proposal_parameters:
                <Test as crate::Trait>::TerminateWorkingGroupLeaderRoleProposalParameters::get(),
            proposal_details: terminate_lead_details.clone(),
        };
        proposal_fixture.check_all();
    });
}

#[test]
fn create_amend_constitution_proposal_common_checks_succeed() {
    initial_test_ext().execute_with(|| {
        increase_total_balance_issuance_using_account_id(1, 1_500_000);

        let general_proposal_parameters_no_staking = GeneralProposalParameters::<Test> {
            member_id: 1,
            title: b"title".to_vec(),
            description: b"body".to_vec(),
            staking_account_id: None,
            exact_execution_block: None,
        };

        let general_proposal_parameters_with_staking = GeneralProposalParameters::<Test> {
            member_id: 1,
            title: b"title".to_vec(),
            description: b"body".to_vec(),
            staking_account_id: Some(1),
            exact_execution_block: None,
        };

        let amend_constitution_details =
            ProposalDetails::AmendConstitution(b"constitution text".to_vec());

        let proposal_fixture = ProposalTestFixture {
            insufficient_rights_call: || {
                ProposalCodex::create_proposal(
                    RawOrigin::None.into(),
                    general_proposal_parameters_no_staking.clone(),
                    amend_constitution_details.clone(),
                )
            },
            empty_stake_call: || {
                ProposalCodex::create_proposal(
                    RawOrigin::Signed(1).into(),
                    general_proposal_parameters_no_staking.clone(),
                    amend_constitution_details.clone(),
                )
            },
            successful_call: || {
                ProposalCodex::create_proposal(
                    RawOrigin::Signed(1).into(),
                    general_proposal_parameters_with_staking.clone(),
                    amend_constitution_details.clone(),
                )
            },
            proposal_parameters: <Test as crate::Trait>::AmendConstitutionProposalParameters::get(),
            proposal_details: amend_constitution_details.clone(),
        };
        proposal_fixture.check_all();
    });
}
