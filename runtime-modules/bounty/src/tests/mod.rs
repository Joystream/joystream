#![cfg(test)]

pub(crate) mod fixtures;
pub(crate) mod mocks;

use frame_support::storage::StorageMap;
use frame_system::RawOrigin;
use sp_runtime::DispatchError;
use sp_std::collections::btree_set::BTreeSet;

use crate::tests::fixtures::DEFAULT_BOUNTY_CHERRY;
use crate::{
    BountyActor, BountyCreationParameters, BountyMilestone, BountyRecord, BountyStage, Error,
    OracleJudgement, RawEvent,
};
use common::council::CouncilBudgetManager;
use fixtures::{
    increase_account_balance, increase_total_balance_issuance_using_account_id, run_to_block,
    set_council_budget, AnnounceWorkEntryFixture, CancelBountyFixture, CreateBountyFixture,
    EventFixture, FundBountyFixture, SubmitJudgementFixture, SubmitWorkFixture, VetoBountyFixture,
    WithdrawCreatorCherryFixture, WithdrawFundingFixture, WithdrawWorkEntryFixture,
};
use mocks::{
    build_test_externalities, Balances, Bounty, MaxWorkEntryLimit, System, Test,
    COUNCIL_BUDGET_ACCOUNT_ID,
};

#[test]
fn create_bounty_succeeds() {
    build_test_externalities().execute_with(|| {
        set_council_budget(500);

        let starting_block = 1;
        run_to_block(starting_block);

        let text = b"Bounty text".to_vec();

        let create_bounty_fixture = CreateBountyFixture::default().with_metadata(text);
        create_bounty_fixture.call_and_assert(Ok(()));

        let bounty_id = 1u64;

        EventFixture::assert_last_crate_event(RawEvent::BountyCreated(
            bounty_id,
            create_bounty_fixture.get_bounty_creation_parameters(),
        ));
    });
}

#[test]
fn create_bounty_fails_with_invalid_closed_contract() {
    build_test_externalities().execute_with(|| {
        CreateBountyFixture::default()
            .with_closed_contract(Vec::new())
            .call_and_assert(Err(Error::<Test>::ClosedContractMemberListIsEmpty.into()));

        let large_member_id_list: Vec<u64> = (1..(MaxWorkEntryLimit::get() + 10))
            .map(|x| x.into())
            .collect();

        CreateBountyFixture::default()
            .with_closed_contract(large_member_id_list)
            .call_and_assert(Err(Error::<Test>::ClosedContractMemberListIsTooLarge.into()));
    });
}

#[test]
fn create_bounty_fails_with_insufficient_cherry_value() {
    build_test_externalities().execute_with(|| {
        set_council_budget(500);

        CreateBountyFixture::default()
            .with_cherry(0)
            .call_and_assert(Err(Error::<Test>::CherryLessThenMinimumAllowed.into()));
    });
}

#[test]
fn create_bounty_transfers_member_balance_correctly() {
    build_test_externalities().execute_with(|| {
        let member_id = 1;
        let account_id = 1;
        let cherry = 100;
        let initial_balance = 500;

        increase_total_balance_issuance_using_account_id(account_id, initial_balance);

        // Insufficient member controller account balance.
        CreateBountyFixture::default()
            .with_origin(RawOrigin::Signed(account_id))
            .with_creator_member_id(member_id)
            .with_cherry(cherry)
            .call_and_assert(Ok(()));

        assert_eq!(
            balances::Module::<Test>::usable_balance(&account_id),
            initial_balance - cherry
        );

        let bounty_id = 1;

        assert_eq!(
            balances::Module::<Test>::usable_balance(&Bounty::bounty_account_id(bounty_id)),
            cherry
        );
    });
}

#[test]
fn create_bounty_transfers_the_council_balance_correctly() {
    build_test_externalities().execute_with(|| {
        let cherry = 100;
        let initial_balance = 500;

        <mocks::CouncilBudgetManager as CouncilBudgetManager<u64>>::set_budget(initial_balance);

        // Insufficient member controller account balance.
        CreateBountyFixture::default()
            .with_cherry(cherry)
            .call_and_assert(Ok(()));

        assert_eq!(
            <mocks::CouncilBudgetManager as CouncilBudgetManager<u64>>::get_budget(),
            initial_balance - cherry
        );

        let bounty_id = 1;

        assert_eq!(
            balances::Module::<Test>::usable_balance(&Bounty::bounty_account_id(bounty_id)),
            cherry
        );
    });
}

#[test]
fn create_bounty_fails_with_invalid_origin() {
    build_test_externalities().execute_with(|| {
        // For a council bounty.
        CreateBountyFixture::default()
            .with_origin(RawOrigin::Signed(1))
            .call_and_assert(Err(DispatchError::BadOrigin));

        // For a member bounty.
        CreateBountyFixture::default()
            .with_origin(RawOrigin::Root)
            .with_creator_member_id(1)
            .call_and_assert(Err(DispatchError::BadOrigin));
    });
}

#[test]
fn create_bounty_fails_with_invalid_min_max_amounts() {
    build_test_externalities().execute_with(|| {
        set_council_budget(500);

        CreateBountyFixture::default()
            .with_min_amount(100)
            .with_max_amount(0)
            .call_and_assert(Err(
                Error::<Test>::MinFundingAmountCannotBeGreaterThanMaxAmount.into(),
            ));
    });
}

#[test]
fn create_bounty_fails_with_invalid_periods() {
    build_test_externalities().execute_with(|| {
        set_council_budget(500);

        CreateBountyFixture::default()
            .with_work_period(0)
            .call_and_assert(Err(Error::<Test>::WorkPeriodCannotBeZero.into()));

        CreateBountyFixture::default()
            .with_judging_period(0)
            .call_and_assert(Err(Error::<Test>::JudgingPeriodCannotBeZero.into()));
    });
}

#[test]
fn create_bounty_fails_with_insufficient_balances() {
    build_test_externalities().execute_with(|| {
        let member_id = 1;
        let account_id = 1;
        let cherry = 100;

        // Insufficient council budget.
        CreateBountyFixture::default()
            .with_cherry(cherry)
            .call_and_assert(Err(Error::<Test>::InsufficientBalanceForBounty.into()));

        // Insufficient member controller account balance.
        CreateBountyFixture::default()
            .with_origin(RawOrigin::Signed(account_id))
            .with_creator_member_id(member_id)
            .with_cherry(cherry)
            .call_and_assert(Err(Error::<Test>::InsufficientBalanceForBounty.into()));
    });
}

#[test]
fn cancel_bounty_succeeds() {
    build_test_externalities().execute_with(|| {
        set_council_budget(500);

        let starting_block = 1;
        run_to_block(starting_block);

        CreateBountyFixture::default().call_and_assert(Ok(()));

        let bounty_id = 1u64;

        CancelBountyFixture::default()
            .with_bounty_id(bounty_id)
            .call_and_assert(Ok(()));

        EventFixture::assert_last_crate_event(RawEvent::BountyCanceled(
            bounty_id,
            BountyActor::Council,
        ));
    });
}

#[test]
fn cancel_bounty_by_member_succeeds() {
    build_test_externalities().execute_with(|| {
        let starting_block = 1;
        run_to_block(starting_block);

        let member_id = 1;
        let account_id = 1;
        let initial_balance = 500;

        increase_total_balance_issuance_using_account_id(account_id, initial_balance);

        CreateBountyFixture::default()
            .with_origin(RawOrigin::Signed(account_id))
            .with_creator_member_id(member_id)
            .call_and_assert(Ok(()));

        let bounty_id = 1u64;

        CancelBountyFixture::default()
            .with_origin(RawOrigin::Signed(account_id))
            .with_creator_member_id(member_id)
            .with_bounty_id(bounty_id)
            .call_and_assert(Ok(()));

        EventFixture::assert_last_crate_event(RawEvent::BountyCanceled(
            bounty_id,
            BountyActor::Member(member_id),
        ));
    });
}

#[test]
fn cancel_bounty_fails_with_invalid_bounty_id() {
    build_test_externalities().execute_with(|| {
        let invalid_bounty_id = 11u64;

        CancelBountyFixture::default()
            .with_bounty_id(invalid_bounty_id)
            .call_and_assert(Err(Error::<Test>::BountyDoesntExist.into()));
    });
}

#[test]
fn cancel_bounty_fails_with_invalid_origin() {
    build_test_externalities().execute_with(|| {
        let member_id = 1;
        let account_id = 1;
        let initial_balance = 500;

        increase_account_balance(&account_id, initial_balance);
        set_council_budget(initial_balance);

        // Created by council - try to cancel with bad origin
        CreateBountyFixture::default()
            .with_origin(RawOrigin::Root)
            .call_and_assert(Ok(()));

        let bounty_id = 1u64;
        CancelBountyFixture::default()
            .with_bounty_id(bounty_id)
            .with_origin(RawOrigin::Signed(account_id))
            .call_and_assert(Err(DispatchError::BadOrigin));

        // Created by a member - try to cancel with invalid member_id
        CreateBountyFixture::default()
            .with_origin(RawOrigin::Signed(account_id))
            .with_creator_member_id(member_id)
            .call_and_assert(Ok(()));

        let bounty_id = 2u64;
        let invalid_member_id = 2;

        CancelBountyFixture::default()
            .with_bounty_id(bounty_id)
            .with_origin(RawOrigin::Signed(account_id))
            .with_creator_member_id(invalid_member_id)
            .call_and_assert(Err(Error::<Test>::NotBountyActor.into()));

        // Created by a member - try to cancel with bad origin
        CreateBountyFixture::default()
            .with_origin(RawOrigin::Signed(account_id))
            .with_creator_member_id(member_id)
            .call_and_assert(Ok(()));

        let bounty_id = 3u64;

        CancelBountyFixture::default()
            .with_bounty_id(bounty_id)
            .with_origin(RawOrigin::None)
            .call_and_assert(Err(DispatchError::BadOrigin));

        // Created by a member  - try to cancel by council
        CreateBountyFixture::default()
            .with_origin(RawOrigin::Signed(account_id))
            .with_creator_member_id(member_id)
            .call_and_assert(Ok(()));

        let bounty_id = 4u64;

        CancelBountyFixture::default()
            .with_bounty_id(bounty_id)
            .with_origin(RawOrigin::Root)
            .call_and_assert(Err(Error::<Test>::NotBountyActor.into()));
    });
}

#[test]
fn cancel_bounty_fails_with_invalid_stage() {
    build_test_externalities().execute_with(|| {
        set_council_budget(500);

        // Test already cancelled bounty.
        CreateBountyFixture::default().call_and_assert(Ok(()));

        let bounty_id = 1u64;

        CancelBountyFixture::default()
            .with_bounty_id(bounty_id)
            .call_and_assert(Ok(()));

        CancelBountyFixture::default()
            .with_bounty_id(bounty_id)
            .call_and_assert(Err(Error::<Test>::InvalidBountyStage.into()));

        // Test bounty that was funded.
        let max_amount = 500;
        let amount = 100;
        let account_id = 1;
        let member_id = 1;
        let initial_balance = 500;

        increase_total_balance_issuance_using_account_id(account_id, initial_balance);

        CreateBountyFixture::default()
            .with_max_amount(max_amount)
            .call_and_assert(Ok(()));

        let bounty_id = 2u64;

        FundBountyFixture::default()
            .with_bounty_id(bounty_id)
            .with_amount(amount)
            .with_member_id(member_id)
            .with_origin(RawOrigin::Signed(account_id))
            .call_and_assert(Ok(()));

        CancelBountyFixture::default()
            .with_bounty_id(bounty_id)
            .call_and_assert(Err(Error::<Test>::InvalidBountyStage.into()));
    });
}

#[test]
fn veto_bounty_succeeds() {
    build_test_externalities().execute_with(|| {
        set_council_budget(500);

        let starting_block = 1;
        run_to_block(starting_block);

        CreateBountyFixture::default().call_and_assert(Ok(()));

        let bounty_id = 1u64;

        VetoBountyFixture::default()
            .with_bounty_id(bounty_id)
            .call_and_assert(Ok(()));

        EventFixture::assert_last_crate_event(RawEvent::BountyVetoed(bounty_id));
    });
}

#[test]
fn veto_bounty_fails_with_invalid_bounty_id() {
    build_test_externalities().execute_with(|| {
        let invalid_bounty_id = 11u64;

        VetoBountyFixture::default()
            .with_bounty_id(invalid_bounty_id)
            .call_and_assert(Err(Error::<Test>::BountyDoesntExist.into()));
    });
}

#[test]
fn veto_bounty_fails_with_invalid_origin() {
    build_test_externalities().execute_with(|| {
        set_council_budget(500);

        let account_id = 1;

        CreateBountyFixture::default()
            .with_origin(RawOrigin::Root)
            .call_and_assert(Ok(()));

        let bounty_id = 1u64;

        VetoBountyFixture::default()
            .with_bounty_id(bounty_id)
            .with_origin(RawOrigin::Signed(account_id))
            .call_and_assert(Err(DispatchError::BadOrigin));
    });
}

#[test]
fn veto_bounty_fails_with_invalid_stage() {
    build_test_externalities().execute_with(|| {
        set_council_budget(500);

        // Test already vetoed bounty.
        CreateBountyFixture::default().call_and_assert(Ok(()));

        let bounty_id = 1u64;

        CancelBountyFixture::default()
            .with_bounty_id(bounty_id)
            .call_and_assert(Ok(()));

        VetoBountyFixture::default()
            .with_bounty_id(bounty_id)
            .call_and_assert(Err(Error::<Test>::InvalidBountyStage.into()));

        // Test bounty that was funded.
        let max_amount = 500;
        let amount = 100;
        let account_id = 1;
        let member_id = 1;
        let initial_balance = 500;

        increase_total_balance_issuance_using_account_id(account_id, initial_balance);

        CreateBountyFixture::default()
            .with_max_amount(max_amount)
            .call_and_assert(Ok(()));

        let bounty_id = 2u64;

        FundBountyFixture::default()
            .with_bounty_id(bounty_id)
            .with_amount(amount)
            .with_member_id(member_id)
            .with_origin(RawOrigin::Signed(account_id))
            .call_and_assert(Ok(()));

        VetoBountyFixture::default()
            .with_bounty_id(bounty_id)
            .call_and_assert(Err(Error::<Test>::InvalidBountyStage.into()));
    });
}

#[test]
fn fund_bounty_succeeds_by_member() {
    build_test_externalities().execute_with(|| {
        let starting_block = 1;
        run_to_block(starting_block);

        let max_amount = 500;
        let amount = 100;
        let account_id = 1;
        let member_id = 1;
        let initial_balance = 500;
        let cherry = DEFAULT_BOUNTY_CHERRY;

        increase_total_balance_issuance_using_account_id(account_id, initial_balance);
        increase_total_balance_issuance_using_account_id(
            COUNCIL_BUDGET_ACCOUNT_ID,
            initial_balance,
        );

        CreateBountyFixture::default()
            .with_max_amount(max_amount)
            .with_cherry(cherry)
            .call_and_assert(Ok(()));

        let bounty_id = 1u64;

        FundBountyFixture::default()
            .with_bounty_id(bounty_id)
            .with_amount(amount)
            .with_member_id(member_id)
            .with_origin(RawOrigin::Signed(account_id))
            .call_and_assert(Ok(()));

        assert_eq!(
            balances::Module::<Test>::usable_balance(&account_id),
            initial_balance - amount
        );

        assert_eq!(
            crate::Module::<Test>::contribution_by_bounty_by_actor(
                bounty_id,
                BountyActor::Member(member_id)
            ),
            amount
        );

        assert_eq!(
            balances::Module::<Test>::usable_balance(&Bounty::bounty_account_id(bounty_id)),
            amount + cherry
        );

        EventFixture::assert_last_crate_event(RawEvent::BountyFunded(
            bounty_id,
            BountyActor::Member(member_id),
            amount,
        ));
    });
}

#[test]
fn fund_bounty_succeeds_by_council() {
    build_test_externalities().execute_with(|| {
        let starting_block = 1;
        run_to_block(starting_block);

        let max_amount = 500;
        let amount = 100;
        let initial_balance = 500;
        let cherry = DEFAULT_BOUNTY_CHERRY;

        increase_account_balance(&COUNCIL_BUDGET_ACCOUNT_ID, initial_balance);

        CreateBountyFixture::default()
            .with_max_amount(max_amount)
            .with_cherry(cherry)
            .call_and_assert(Ok(()));

        let bounty_id = 1u64;

        FundBountyFixture::default()
            .with_bounty_id(bounty_id)
            .with_amount(amount)
            .with_council()
            .with_origin(RawOrigin::Root)
            .call_and_assert(Ok(()));

        assert_eq!(
            balances::Module::<Test>::usable_balance(&COUNCIL_BUDGET_ACCOUNT_ID),
            initial_balance - amount - cherry
        );

        assert_eq!(
            crate::Module::<Test>::contribution_by_bounty_by_actor(bounty_id, BountyActor::Council),
            amount
        );

        assert_eq!(
            balances::Module::<Test>::usable_balance(&Bounty::bounty_account_id(bounty_id)),
            amount + cherry
        );

        EventFixture::assert_last_crate_event(RawEvent::BountyFunded(
            bounty_id,
            BountyActor::Council,
            amount,
        ));
    });
}

#[test]
fn fund_bounty_succeeds_with_reaching_max_funding_amount() {
    build_test_externalities().execute_with(|| {
        set_council_budget(500);

        let starting_block = 1;
        run_to_block(starting_block);

        let max_amount = 50;
        let amount = 100;
        let account_id = 1;
        let member_id = 1;
        let initial_balance = 500;

        increase_total_balance_issuance_using_account_id(account_id, initial_balance);

        CreateBountyFixture::default()
            .with_max_amount(max_amount)
            .call_and_assert(Ok(()));

        let bounty_id = 1u64;

        FundBountyFixture::default()
            .with_bounty_id(bounty_id)
            .with_amount(amount)
            .with_member_id(member_id)
            .with_origin(RawOrigin::Signed(account_id))
            .call_and_assert(Ok(()));

        assert_eq!(
            balances::Module::<Test>::usable_balance(&account_id),
            initial_balance - amount
        );

        let bounty = Bounty::bounties(&bounty_id);
        assert_eq!(
            bounty.milestone,
            BountyMilestone::BountyMaxFundingReached {
                max_funding_reached_at: starting_block,
            }
        );

        EventFixture::assert_last_crate_event(RawEvent::BountyMaxFundingReached(bounty_id));
    });
}

#[test]
fn multiple_fund_bounty_succeed() {
    build_test_externalities().execute_with(|| {
        set_council_budget(500);

        let max_amount = 5000;
        let amount = 100;
        let account_id = 1;
        let member_id = 1;
        let initial_balance = 500;
        let cherry = DEFAULT_BOUNTY_CHERRY;

        increase_total_balance_issuance_using_account_id(account_id, initial_balance);
        increase_total_balance_issuance_using_account_id(
            COUNCIL_BUDGET_ACCOUNT_ID,
            initial_balance,
        );

        CreateBountyFixture::default()
            .with_max_amount(max_amount)
            .with_cherry(cherry)
            .call_and_assert(Ok(()));

        let bounty_id = 1u64;

        FundBountyFixture::default()
            .with_bounty_id(bounty_id)
            .with_amount(amount)
            .with_member_id(member_id)
            .with_origin(RawOrigin::Signed(account_id))
            .call_and_assert(Ok(()));

        FundBountyFixture::default()
            .with_bounty_id(bounty_id)
            .with_amount(amount)
            .with_member_id(member_id)
            .with_origin(RawOrigin::Signed(account_id))
            .call_and_assert(Ok(()));

        assert_eq!(
            balances::Module::<Test>::usable_balance(&account_id),
            initial_balance - 2 * amount
        );

        assert_eq!(
            balances::Module::<Test>::usable_balance(&Bounty::bounty_account_id(bounty_id)),
            2 * amount + cherry
        );
    });
}

#[test]
fn fund_bounty_fails_with_invalid_bounty_id() {
    build_test_externalities().execute_with(|| {
        let invalid_bounty_id = 11u64;

        FundBountyFixture::default()
            .with_bounty_id(invalid_bounty_id)
            .call_and_assert(Err(Error::<Test>::BountyDoesntExist.into()));
    });
}

#[test]
fn fund_bounty_fails_with_invalid_origin() {
    build_test_externalities().execute_with(|| {
        set_council_budget(500);

        CreateBountyFixture::default()
            .with_origin(RawOrigin::Root)
            .call_and_assert(Ok(()));

        let bounty_id = 1u64;

        FundBountyFixture::default()
            .with_bounty_id(bounty_id)
            .with_origin(RawOrigin::Root)
            .call_and_assert(Err(DispatchError::BadOrigin));
    });
}

#[test]
fn fund_bounty_fails_with_insufficient_balance() {
    build_test_externalities().execute_with(|| {
        set_council_budget(500);

        let member_id = 1;
        let account_id = 1;
        let amount = 100;

        CreateBountyFixture::default()
            .with_origin(RawOrigin::Root)
            .call_and_assert(Ok(()));

        FundBountyFixture::default()
            .with_origin(RawOrigin::Signed(account_id))
            .with_member_id(member_id)
            .with_amount(amount)
            .call_and_assert(Err(Error::<Test>::InsufficientBalanceForBounty.into()));
    });
}

#[test]
fn fund_bounty_fails_with_zero_amount() {
    build_test_externalities().execute_with(|| {
        set_council_budget(500);

        let member_id = 1;
        let account_id = 1;
        let amount = 0;

        CreateBountyFixture::default()
            .with_origin(RawOrigin::Root)
            .call_and_assert(Ok(()));

        FundBountyFixture::default()
            .with_origin(RawOrigin::Signed(account_id))
            .with_member_id(member_id)
            .with_amount(amount)
            .call_and_assert(Err(Error::<Test>::ZeroFundingAmount.into()));
    });
}

#[test]
fn fund_bounty_fails_with_less_than_minimum_amount() {
    build_test_externalities().execute_with(|| {
        set_council_budget(500);

        let member_id = 1;
        let account_id = 1;
        let amount = 10;

        CreateBountyFixture::default()
            .with_origin(RawOrigin::Root)
            .call_and_assert(Ok(()));

        FundBountyFixture::default()
            .with_origin(RawOrigin::Signed(account_id))
            .with_member_id(member_id)
            .with_amount(amount)
            .call_and_assert(Err(Error::<Test>::FundingLessThenMinimumAllowed.into()));
    });
}

#[test]
fn fund_bounty_fails_with_invalid_stage() {
    build_test_externalities().execute_with(|| {
        set_council_budget(500);

        let amount = 100;
        let account_id = 1;
        let member_id = 1;
        let initial_balance = 500;

        increase_total_balance_issuance_using_account_id(account_id, initial_balance);

        CreateBountyFixture::default().call_and_assert(Ok(()));

        let bounty_id = 1u64;

        CancelBountyFixture::default()
            .with_bounty_id(bounty_id)
            .call_and_assert(Ok(()));

        FundBountyFixture::default()
            .with_origin(RawOrigin::Signed(account_id))
            .with_member_id(member_id)
            .with_amount(amount)
            .call_and_assert(Err(Error::<Test>::InvalidBountyStage.into()));
    });
}

#[test]
fn fund_bounty_fails_with_expired_funding_period() {
    build_test_externalities().execute_with(|| {
        set_council_budget(500);

        let amount = 100;
        let account_id = 1;
        let member_id = 1;
        let initial_balance = 500;
        let funding_period = 10;

        increase_total_balance_issuance_using_account_id(account_id, initial_balance);

        CreateBountyFixture::default()
            .with_origin(RawOrigin::Root)
            .with_funding_period(funding_period)
            .call_and_assert(Ok(()));

        run_to_block(funding_period + 1);

        FundBountyFixture::default()
            .with_origin(RawOrigin::Signed(account_id))
            .with_member_id(member_id)
            .with_amount(amount)
            .call_and_assert(Err(Error::<Test>::InvalidBountyStage.into()));
    });
}

#[test]
fn withdraw_member_funding_succeeds() {
    build_test_externalities().execute_with(|| {
        let starting_block = 1;
        run_to_block(starting_block);

        let max_amount = 500;
        let amount = 100;
        let account_id = 1;
        let member_id = 1;
        let initial_balance = 500;
        let cherry = 200;
        let funding_period = 10;

        increase_account_balance(&COUNCIL_BUDGET_ACCOUNT_ID, initial_balance);
        increase_account_balance(&account_id, initial_balance);

        CreateBountyFixture::default()
            .with_max_amount(max_amount)
            .with_min_amount(max_amount)
            .with_funding_period(funding_period)
            .with_cherry(cherry)
            .call_and_assert(Ok(()));

        let bounty_id = 1u64;

        FundBountyFixture::default()
            .with_origin(RawOrigin::Signed(account_id))
            .with_member_id(member_id)
            .with_amount(amount)
            .call_and_assert(Ok(()));

        run_to_block(funding_period + starting_block + 1);

        WithdrawFundingFixture::default()
            .with_bounty_id(bounty_id)
            .with_member_id(member_id)
            .with_origin(RawOrigin::Signed(account_id))
            .call_and_assert(Ok(()));

        assert_eq!(
            balances::Module::<Test>::usable_balance(&account_id),
            initial_balance + cherry
        );

        assert_eq!(
            balances::Module::<Test>::usable_balance(&COUNCIL_BUDGET_ACCOUNT_ID),
            initial_balance - cherry
        );

        assert_eq!(
            balances::Module::<Test>::usable_balance(&Bounty::bounty_account_id(bounty_id)),
            0
        );

        EventFixture::assert_last_crate_event(RawEvent::BountyRemoved(bounty_id));
    });
}

#[test]
fn withdraw_council_funding_succeeds() {
    build_test_externalities().execute_with(|| {
        let starting_block = 1;
        run_to_block(starting_block);

        let max_amount = 500;
        let amount = 100;
        let initial_balance = 500;
        let cherry = 200;
        let funding_period = 10;

        increase_account_balance(&COUNCIL_BUDGET_ACCOUNT_ID, initial_balance);

        CreateBountyFixture::default()
            .with_max_amount(max_amount)
            .with_min_amount(max_amount)
            .with_funding_period(funding_period)
            .with_cherry(cherry)
            .call_and_assert(Ok(()));

        let bounty_id = 1u64;

        FundBountyFixture::default()
            .with_origin(RawOrigin::Root)
            .with_council()
            .with_amount(amount)
            .call_and_assert(Ok(()));

        run_to_block(funding_period + starting_block + 1);

        WithdrawFundingFixture::default()
            .with_bounty_id(bounty_id)
            .with_council()
            .with_origin(RawOrigin::Root)
            .call_and_assert(Ok(()));

        assert_eq!(
            balances::Module::<Test>::usable_balance(&COUNCIL_BUDGET_ACCOUNT_ID),
            initial_balance
        );

        assert_eq!(
            balances::Module::<Test>::usable_balance(&Bounty::bounty_account_id(bounty_id)),
            0
        );

        EventFixture::assert_last_crate_event(RawEvent::BountyRemoved(bounty_id));
    });
}

#[test]
fn withdraw_member_funding_with_half_cherry() {
    build_test_externalities().execute_with(|| {
        let starting_block = 1;
        run_to_block(starting_block);

        let max_amount = 500;
        let amount = 100;
        let account_id1 = 1;
        let member_id1 = 1;
        let account_id2 = 2;
        let member_id2 = 2;
        let initial_balance = 500;
        let cherry = 200;
        let funding_period = 10;

        increase_account_balance(&COUNCIL_BUDGET_ACCOUNT_ID, initial_balance);
        increase_account_balance(&account_id1, initial_balance);
        increase_account_balance(&account_id2, initial_balance);

        CreateBountyFixture::default()
            .with_max_amount(max_amount)
            .with_min_amount(max_amount)
            .with_funding_period(funding_period)
            .with_cherry(cherry)
            .call_and_assert(Ok(()));

        let bounty_id = 1u64;

        FundBountyFixture::default()
            .with_origin(RawOrigin::Signed(account_id1))
            .with_member_id(member_id1)
            .with_amount(amount)
            .call_and_assert(Ok(()));

        FundBountyFixture::default()
            .with_origin(RawOrigin::Signed(account_id2))
            .with_member_id(member_id2)
            .with_amount(amount)
            .call_and_assert(Ok(()));

        run_to_block(funding_period + starting_block + 1);

        WithdrawFundingFixture::default()
            .with_bounty_id(bounty_id)
            .with_member_id(member_id1)
            .with_origin(RawOrigin::Signed(account_id1))
            .call_and_assert(Ok(()));

        // A half of the cherry
        assert_eq!(
            balances::Module::<Test>::usable_balance(&account_id1),
            initial_balance + cherry / 2
        );

        // On funding amount + creation funding + half of the cherry left.
        assert_eq!(
            balances::Module::<Test>::usable_balance(&Bounty::bounty_account_id(bounty_id)),
            amount + cherry / 2
        );

        EventFixture::assert_last_crate_event(RawEvent::BountyFundingWithdrawal(
            bounty_id,
            BountyActor::Member(member_id1),
        ));
    });
}

#[test]
fn withdraw_member_funding_removes_bounty() {
    build_test_externalities().execute_with(|| {
        let starting_block = 1;
        run_to_block(starting_block);

        let max_amount = 500;
        let amount = 100;
        let account_id = 1;
        let member_id = 1;
        let initial_balance = 500;
        let cherry = 200;
        let funding_period = 10;

        increase_account_balance(&COUNCIL_BUDGET_ACCOUNT_ID, initial_balance);
        increase_account_balance(&account_id, initial_balance);

        CreateBountyFixture::default()
            .with_max_amount(max_amount)
            .with_min_amount(max_amount)
            .with_funding_period(funding_period)
            .with_cherry(cherry)
            .call_and_assert(Ok(()));

        let bounty_id = 1u64;

        FundBountyFixture::default()
            .with_origin(RawOrigin::Signed(account_id))
            .with_member_id(member_id)
            .with_amount(amount)
            .call_and_assert(Ok(()));

        run_to_block(funding_period + starting_block + 1);

        WithdrawFundingFixture::default()
            .with_bounty_id(bounty_id)
            .with_member_id(member_id)
            .with_origin(RawOrigin::Signed(account_id))
            .call_and_assert(Ok(()));

        EventFixture::assert_last_crate_event(RawEvent::BountyRemoved(bounty_id));
    });
}

#[test]
fn withdraw_member_funding_fails_with_invalid_bounty_id() {
    build_test_externalities().execute_with(|| {
        let invalid_bounty_id = 11u64;

        WithdrawFundingFixture::default()
            .with_bounty_id(invalid_bounty_id)
            .call_and_assert(Err(Error::<Test>::BountyDoesntExist.into()));
    });
}

#[test]
fn withdraw_member_funding_fails_with_invalid_origin() {
    build_test_externalities().execute_with(|| {
        set_council_budget(500);

        CreateBountyFixture::default()
            .with_origin(RawOrigin::Root)
            .call_and_assert(Ok(()));

        let bounty_id = 1u64;

        WithdrawFundingFixture::default()
            .with_bounty_id(bounty_id)
            .with_origin(RawOrigin::Root)
            .call_and_assert(Err(DispatchError::BadOrigin));
    });
}

#[test]
fn withdraw_member_funding_fails_with_invalid_stage() {
    build_test_externalities().execute_with(|| {
        let max_amount = 500;
        let amount = 100;
        let account_id = 1;
        let member_id = 1;
        let initial_balance = 500;
        let cherry = 200;
        let funding_period = 10;

        increase_account_balance(&COUNCIL_BUDGET_ACCOUNT_ID, initial_balance);
        increase_account_balance(&account_id, initial_balance);

        CreateBountyFixture::default()
            .with_max_amount(max_amount)
            .with_min_amount(max_amount)
            .with_funding_period(funding_period)
            .with_cherry(cherry)
            .call_and_assert(Ok(()));

        let bounty_id = 1u64;

        FundBountyFixture::default()
            .with_origin(RawOrigin::Signed(account_id))
            .with_member_id(member_id)
            .with_amount(amount)
            .call_and_assert(Ok(()));

        WithdrawFundingFixture::default()
            .with_bounty_id(bounty_id)
            .with_member_id(member_id)
            .with_origin(RawOrigin::Signed(account_id))
            .call_and_assert(Err(Error::<Test>::InvalidBountyStage.into()));
    });
}

#[test]
fn withdraw_member_funding_fails_with_invalid_bounty_funder() {
    build_test_externalities().execute_with(|| {
        let starting_block = 1;
        run_to_block(starting_block);

        let max_amount = 500;
        let amount = 100;
        let account_id = 1;
        let member_id = 1;
        let initial_balance = 500;
        let cherry = 200;
        let funding_period = 10;

        increase_account_balance(&COUNCIL_BUDGET_ACCOUNT_ID, initial_balance);
        increase_account_balance(&account_id, initial_balance);

        CreateBountyFixture::default()
            .with_max_amount(max_amount)
            .with_min_amount(max_amount)
            .with_funding_period(funding_period)
            .with_cherry(cherry)
            .call_and_assert(Ok(()));

        let bounty_id = 1u64;

        FundBountyFixture::default()
            .with_origin(RawOrigin::Signed(account_id))
            .with_member_id(member_id)
            .with_amount(amount)
            .call_and_assert(Ok(()));

        // Bounty failed because of the funding period
        run_to_block(starting_block + funding_period + 1);

        let invalid_account_id = 2;
        let invalid_member_id = 2;

        WithdrawFundingFixture::default()
            .with_bounty_id(bounty_id)
            .with_member_id(invalid_member_id)
            .with_origin(RawOrigin::Signed(invalid_account_id))
            .call_and_assert(Err(Error::<Test>::NoBountyContributionFound.into()));
    });
}

#[test]
fn withdraw_creator_cherry_by_council_succeeds() {
    build_test_externalities().execute_with(|| {
        let account_id = 1;
        let funding_period = 10;
        let max_amount = 500;
        let initial_balance = 500;
        let cherry = 200;

        increase_account_balance(&COUNCIL_BUDGET_ACCOUNT_ID, initial_balance);
        increase_account_balance(&account_id, initial_balance);

        let starting_block = 1;
        run_to_block(starting_block);

        CreateBountyFixture::default()
            .with_max_amount(max_amount)
            .with_min_amount(max_amount)
            .with_funding_period(funding_period)
            .with_cherry(cherry)
            .call_and_assert(Ok(()));

        let bounty_id = 1u64;

        assert_eq!(
            balances::Module::<Test>::usable_balance(&COUNCIL_BUDGET_ACCOUNT_ID),
            initial_balance - cherry
        );

        // Bounty failed because of the funding period
        run_to_block(starting_block + funding_period + 1);

        WithdrawCreatorCherryFixture::default()
            .with_bounty_id(bounty_id)
            .call_and_assert(Ok(()));

        assert_eq!(
            balances::Module::<Test>::usable_balance(&COUNCIL_BUDGET_ACCOUNT_ID),
            initial_balance
        );

        assert_eq!(
            balances::Module::<Test>::usable_balance(&Bounty::bounty_account_id(bounty_id)),
            0
        );

        EventFixture::assert_last_crate_event(RawEvent::BountyRemoved(bounty_id));
    });
}

#[test]
fn withdraw_creator_cherry_removes_the_bounty() {
    build_test_externalities().execute_with(|| {
        let max_amount = 500;
        let initial_balance = 500;
        let cherry = 200;

        increase_account_balance(&COUNCIL_BUDGET_ACCOUNT_ID, initial_balance);

        let starting_block = 1;
        run_to_block(starting_block);

        CreateBountyFixture::default()
            .with_max_amount(max_amount)
            .with_min_amount(max_amount)
            .with_cherry(cherry)
            .call_and_assert(Ok(()));

        let bounty_id = 1u64;

        assert_eq!(
            balances::Module::<Test>::usable_balance(&COUNCIL_BUDGET_ACCOUNT_ID),
            initial_balance - cherry
        );

        CancelBountyFixture::default()
            .with_bounty_id(bounty_id)
            .call_and_assert(Ok(()));

        WithdrawCreatorCherryFixture::default()
            .with_bounty_id(bounty_id)
            .call_and_assert(Ok(()));

        assert_eq!(
            balances::Module::<Test>::usable_balance(&COUNCIL_BUDGET_ACCOUNT_ID),
            initial_balance
        );

        EventFixture::assert_last_crate_event(RawEvent::BountyRemoved(bounty_id));
    });
}

#[test]
fn withdraw_creator_cherry_by_member_succeeds() {
    build_test_externalities().execute_with(|| {
        let max_amount = 500;
        let initial_balance = 500;
        let cherry = 200;
        let account_id = 1;
        let member_id = 1;
        let funding_period = 10;

        let funding_account_id = 2;

        increase_account_balance(&account_id, initial_balance);
        increase_account_balance(&funding_account_id, initial_balance);

        let starting_block = 1;
        run_to_block(starting_block);

        CreateBountyFixture::default()
            .with_max_amount(max_amount)
            .with_min_amount(max_amount)
            .with_origin(RawOrigin::Signed(account_id))
            .with_creator_member_id(member_id)
            .with_cherry(cherry)
            .with_funding_period(funding_period)
            .call_and_assert(Ok(()));

        let bounty_id = 1u64;

        assert_eq!(
            balances::Module::<Test>::usable_balance(&account_id),
            initial_balance - cherry
        );

        // Bounty failed because of the funding period
        run_to_block(starting_block + funding_period + 1);

        WithdrawCreatorCherryFixture::default()
            .with_origin(RawOrigin::Signed(account_id))
            .with_creator_member_id(member_id)
            .with_bounty_id(bounty_id)
            .call_and_assert(Ok(()));

        assert_eq!(
            balances::Module::<Test>::usable_balance(&account_id),
            initial_balance
        );

        assert_eq!(
            balances::Module::<Test>::usable_balance(&Bounty::bounty_account_id(bounty_id)),
            0
        );

        EventFixture::assert_last_crate_event(RawEvent::BountyRemoved(bounty_id));
    });
}

#[test]
fn withdraw_creator_cherry_fails_with_invalid_bounty_id() {
    build_test_externalities().execute_with(|| {
        let invalid_bounty_id = 11u64;

        CancelBountyFixture::default()
            .with_bounty_id(invalid_bounty_id)
            .call_and_assert(Err(Error::<Test>::BountyDoesntExist.into()));
    });
}

#[test]
fn withdraw_creator_cherry_fails_with_invalid_origin() {
    build_test_externalities().execute_with(|| {
        let initial_balance = 500;
        let member_id = 1;
        let account_id = 1;

        increase_account_balance(&account_id, initial_balance);
        set_council_budget(initial_balance);

        // Created by council - try to cancel with bad origin
        CreateBountyFixture::default()
            .with_origin(RawOrigin::Root)
            .call_and_assert(Ok(()));

        let bounty_id = 1u64;

        CancelBountyFixture::default()
            .with_bounty_id(bounty_id)
            .with_origin(RawOrigin::Root)
            .call_and_assert(Ok(()));

        WithdrawCreatorCherryFixture::default()
            .with_bounty_id(bounty_id)
            .with_origin(RawOrigin::Signed(account_id))
            .call_and_assert(Err(DispatchError::BadOrigin));

        // Created by a member - try to cancel with invalid member_id
        CreateBountyFixture::default()
            .with_origin(RawOrigin::Signed(account_id))
            .with_creator_member_id(member_id)
            .call_and_assert(Ok(()));

        let bounty_id = 2u64;

        CancelBountyFixture::default()
            .with_bounty_id(bounty_id)
            .with_origin(RawOrigin::Signed(account_id))
            .with_creator_member_id(member_id)
            .call_and_assert(Ok(()));

        let invalid_member_id = 2;

        WithdrawCreatorCherryFixture::default()
            .with_bounty_id(bounty_id)
            .with_origin(RawOrigin::Signed(account_id))
            .with_creator_member_id(invalid_member_id)
            .call_and_assert(Err(Error::<Test>::NotBountyActor.into()));

        // Created by a member - try to cancel with bad origin
        CreateBountyFixture::default()
            .with_origin(RawOrigin::Signed(account_id))
            .with_creator_member_id(member_id)
            .call_and_assert(Ok(()));

        let bounty_id = 3u64;

        CancelBountyFixture::default()
            .with_bounty_id(bounty_id)
            .with_origin(RawOrigin::Signed(account_id))
            .with_creator_member_id(member_id)
            .call_and_assert(Ok(()));

        WithdrawCreatorCherryFixture::default()
            .with_bounty_id(bounty_id)
            .with_origin(RawOrigin::None)
            .call_and_assert(Err(DispatchError::BadOrigin));

        // Created by a member  - try to cancel by council
        CreateBountyFixture::default()
            .with_origin(RawOrigin::Signed(account_id))
            .with_creator_member_id(member_id)
            .call_and_assert(Ok(()));

        let bounty_id = 4u64;

        CancelBountyFixture::default()
            .with_bounty_id(bounty_id)
            .with_origin(RawOrigin::Signed(account_id))
            .with_creator_member_id(member_id)
            .call_and_assert(Ok(()));

        WithdrawCreatorCherryFixture::default()
            .with_bounty_id(bounty_id)
            .with_origin(RawOrigin::Root)
            .call_and_assert(Err(Error::<Test>::NotBountyActor.into()));
    });
}

#[test]
fn withdraw_creator_cherry_fails_with_invalid_stage() {
    build_test_externalities().execute_with(|| {
        set_council_budget(500);

        CreateBountyFixture::default().call_and_assert(Ok(()));

        let bounty_id = 1u64;

        WithdrawCreatorCherryFixture::default()
            .with_bounty_id(bounty_id)
            .call_and_assert(Err(Error::<Test>::InvalidBountyStage.into()));
    });
}

#[test]
fn withdraw_creator_cherry_fails_when_nothing_to_withdraw() {
    build_test_externalities().execute_with(|| {
        let max_amount = 500;
        let funding_amount = 100;
        let initial_balance = 500;
        let cherry = 100;
        let account_id = 1;
        let member_id = 1;
        let funding_period = 10;

        increase_account_balance(&account_id, initial_balance);
        increase_account_balance(&COUNCIL_BUDGET_ACCOUNT_ID, initial_balance);

        // No creator funding and cherry goes to another funder.
        // Create bounty
        CreateBountyFixture::default()
            .with_max_amount(max_amount)
            .with_min_amount(max_amount)
            .with_cherry(cherry)
            .with_funding_period(funding_period)
            .call_and_assert(Ok(()));

        let bounty_id = 1u64;

        FundBountyFixture::default()
            .with_bounty_id(bounty_id)
            .with_amount(funding_amount)
            .with_member_id(member_id)
            .with_origin(RawOrigin::Signed(account_id))
            .call_and_assert(Ok(()));

        // Bounty failed.
        run_to_block(funding_period + 1);

        // Cannot withdraw cherry.
        WithdrawCreatorCherryFixture::default()
            .with_bounty_id(bounty_id)
            .call_and_assert(Err(Error::<Test>::NothingToWithdraw.into()));
    });
}

#[test]
fn bounty_removal_succeeds() {
    build_test_externalities().execute_with(|| {
        let max_amount = 500;
        let amount = 100;
        let initial_balance = 500;
        let cherry = 100;
        let account_id = 1;
        let member_id = 1;
        let funding_period = 10;

        increase_account_balance(&account_id, initial_balance);

        // Increment block in order to get Substrate events (no events on block 0).
        let starting_block = 1;
        run_to_block(starting_block);

        // Create bounty
        CreateBountyFixture::default()
            .with_max_amount(max_amount)
            .with_min_amount(max_amount)
            .with_origin(RawOrigin::Signed(account_id))
            .with_creator_member_id(member_id)
            .with_cherry(cherry)
            .with_funding_period(funding_period)
            .call_and_assert(Ok(()));

        let bounty_id = 1u64;

        // Member funding
        let funding_account_id1 = 2;
        let funding_member_id1 = 2;
        increase_account_balance(&funding_account_id1, initial_balance);

        FundBountyFixture::default()
            .with_bounty_id(bounty_id)
            .with_amount(amount)
            .with_member_id(funding_member_id1)
            .with_origin(RawOrigin::Signed(funding_account_id1))
            .call_and_assert(Ok(()));

        let funding_account_id2 = 3;
        let funding_member_id2 = 3;
        increase_account_balance(&funding_account_id2, initial_balance);

        FundBountyFixture::default()
            .with_bounty_id(bounty_id)
            .with_amount(amount)
            .with_member_id(funding_member_id2)
            .with_origin(RawOrigin::Signed(funding_account_id2))
            .call_and_assert(Ok(()));

        let funding_account_id3 = 4;
        let funding_member_id3 = 4;
        increase_account_balance(&funding_account_id3, initial_balance);

        FundBountyFixture::default()
            .with_bounty_id(bounty_id)
            .with_amount(amount)
            .with_member_id(funding_member_id3)
            .with_origin(RawOrigin::Signed(funding_account_id3))
            .call_and_assert(Ok(()));

        // Bounty failed because of the funding period
        run_to_block(starting_block + funding_period + 1);

        // Withdraw member funding
        WithdrawFundingFixture::default()
            .with_bounty_id(bounty_id)
            .with_member_id(funding_member_id1)
            .with_origin(RawOrigin::Signed(funding_account_id1))
            .call_and_assert(Ok(()));

        WithdrawFundingFixture::default()
            .with_bounty_id(bounty_id)
            .with_member_id(funding_member_id2)
            .with_origin(RawOrigin::Signed(funding_account_id2))
            .call_and_assert(Ok(()));

        let cherry_remaining_fraction = cherry - (cherry * 2 / 3) + amount;
        assert_eq!(
            balances::Module::<Test>::usable_balance(&Bounty::bounty_account_id(bounty_id)),
            cherry_remaining_fraction
        );

        WithdrawFundingFixture::default()
            .with_bounty_id(bounty_id)
            .with_member_id(funding_member_id3)
            .with_origin(RawOrigin::Signed(funding_account_id3))
            .call_and_assert(Ok(()));

        assert_eq!(
            balances::Module::<Test>::usable_balance(&account_id),
            initial_balance - cherry
        );

        // Bounty removal effects.
        assert_eq!(
            balances::Module::<Test>::usable_balance(&Bounty::bounty_account_id(bounty_id)),
            0
        );

        assert!(!crate::Bounties::<Test>::contains_key(bounty_id));
        assert!(!Bounty::contributions_exist(&bounty_id));

        EventFixture::assert_last_crate_event(RawEvent::BountyRemoved(bounty_id));
    });
}

#[test]
fn announce_work_entry_succeeded() {
    build_test_externalities().execute_with(|| {
        let starting_block = 1;
        run_to_block(starting_block);

        let initial_balance = 500;
        let max_amount = 100;
        let entrant_stake = 37;

        <mocks::CouncilBudgetManager as CouncilBudgetManager<u64>>::set_budget(initial_balance);

        CreateBountyFixture::default()
            .with_max_amount(max_amount)
            .with_entrant_stake(entrant_stake)
            .call_and_assert(Ok(()));

        let bounty_id = 1;

        FundBountyFixture::default()
            .with_bounty_id(bounty_id)
            .with_amount(max_amount)
            .with_council()
            .with_origin(RawOrigin::Root)
            .call_and_assert(Ok(()));

        let member_id = 1;
        let account_id = 1;

        increase_account_balance(&account_id, initial_balance);

        AnnounceWorkEntryFixture::default()
            .with_origin(RawOrigin::Signed(account_id))
            .with_member_id(member_id)
            .with_staking_account_id(account_id)
            .with_bounty_id(bounty_id)
            .call_and_assert(Ok(()));

        assert_eq!(
            Balances::usable_balance(&account_id),
            initial_balance - entrant_stake
        );

        let entry_id = 1;

        EventFixture::assert_last_crate_event(RawEvent::WorkEntryAnnounced(
            entry_id,
            bounty_id,
            member_id,
            Some(account_id),
        ));
    });
}

#[test]
fn announce_work_entry_failed_with_closed_contract() {
    build_test_externalities().execute_with(|| {
        let initial_balance = 500;
        let max_amount = 100;
        let entrant_stake = 37;

        let closed_contract_member_ids = vec![2, 3];

        <mocks::CouncilBudgetManager as CouncilBudgetManager<u64>>::set_budget(initial_balance);

        CreateBountyFixture::default()
            .with_max_amount(max_amount)
            .with_entrant_stake(entrant_stake)
            .with_closed_contract(closed_contract_member_ids)
            .call_and_assert(Ok(()));

        let bounty_id = 1;

        FundBountyFixture::default()
            .with_bounty_id(bounty_id)
            .with_amount(max_amount)
            .with_council()
            .with_origin(RawOrigin::Root)
            .call_and_assert(Ok(()));

        let member_id = 1;
        let account_id = 1;

        increase_account_balance(&account_id, initial_balance);

        AnnounceWorkEntryFixture::default()
            .with_origin(RawOrigin::Signed(account_id))
            .with_member_id(member_id)
            .with_staking_account_id(account_id)
            .with_bounty_id(bounty_id)
            .call_and_assert(Err(
                Error::<Test>::CannotSubmitWorkToClosedContractBounty.into()
            ));
    });
}

#[test]
fn announce_work_entry_fails_with_exceeding_the_entry_limit() {
    build_test_externalities().execute_with(|| {
        let starting_block = 1;
        run_to_block(starting_block);

        let initial_balance = 500;
        let entrant_stake = 0;
        let amount = 100;

        <mocks::CouncilBudgetManager as CouncilBudgetManager<u64>>::set_budget(initial_balance);

        CreateBountyFixture::default()
            .with_max_amount(0)
            .with_entrant_stake(entrant_stake)
            .call_and_assert(Ok(()));

        let bounty_id = 1;
        let member_id = 1;
        let account_id = 1;

        FundBountyFixture::default()
            .with_bounty_id(bounty_id)
            .with_amount(amount)
            .with_council()
            .with_origin(RawOrigin::Root)
            .call_and_assert(Ok(()));

        increase_account_balance(&account_id, initial_balance);

        AnnounceWorkEntryFixture::default()
            .with_origin(RawOrigin::Signed(account_id))
            .with_member_id(member_id)
            .with_staking_account_id(account_id)
            .with_bounty_id(bounty_id)
            .call_and_assert(Ok(()));

        AnnounceWorkEntryFixture::default()
            .with_origin(RawOrigin::Signed(account_id))
            .with_member_id(member_id)
            .with_staking_account_id(account_id)
            .with_bounty_id(bounty_id)
            .call_and_assert(Ok(()));

        AnnounceWorkEntryFixture::default()
            .with_origin(RawOrigin::Signed(account_id))
            .with_member_id(member_id)
            .with_staking_account_id(account_id)
            .with_bounty_id(bounty_id)
            .call_and_assert(Err(Error::<Test>::MaxWorkEntryLimitReached.into()));
    });
}

#[test]
fn announce_work_entry_fails_with_invalid_bounty_id() {
    build_test_externalities().execute_with(|| {
        let invalid_bounty_id = 11u64;

        AnnounceWorkEntryFixture::default()
            .with_bounty_id(invalid_bounty_id)
            .call_and_assert(Err(Error::<Test>::BountyDoesntExist.into()));
    });
}

#[test]
fn announce_work_entry_fails_with_invalid_origin() {
    build_test_externalities().execute_with(|| {
        set_council_budget(500);

        CreateBountyFixture::default()
            .with_origin(RawOrigin::Root)
            .call_and_assert(Ok(()));

        let bounty_id = 1u64;

        AnnounceWorkEntryFixture::default()
            .with_bounty_id(bounty_id)
            .with_origin(RawOrigin::Root)
            .call_and_assert(Err(DispatchError::BadOrigin));
    });
}

#[test]
fn announce_work_entry_fails_with_invalid_stage() {
    build_test_externalities().execute_with(|| {
        set_council_budget(500);

        CreateBountyFixture::default().call_and_assert(Ok(()));

        let bounty_id = 1u64;

        AnnounceWorkEntryFixture::default()
            .with_bounty_id(bounty_id)
            .call_and_assert(Err(Error::<Test>::InvalidBountyStage.into()));
    });
}

#[test]
fn announce_work_entry_fails_with_invalid_staking_data() {
    build_test_externalities().execute_with(|| {
        let starting_block = 1;
        run_to_block(starting_block);

        let initial_balance = 500;
        let max_amount = 100;
        let entrant_stake = 37;

        <mocks::CouncilBudgetManager as CouncilBudgetManager<u64>>::set_budget(initial_balance);

        CreateBountyFixture::default()
            .with_max_amount(max_amount)
            .with_entrant_stake(entrant_stake)
            .call_and_assert(Ok(()));

        let bounty_id = 1;

        FundBountyFixture::default()
            .with_bounty_id(bounty_id)
            .with_amount(max_amount)
            .with_council()
            .with_origin(RawOrigin::Root)
            .call_and_assert(Ok(()));

        let member_id = 1;
        let account_id = 1;

        AnnounceWorkEntryFixture::default()
            .with_origin(RawOrigin::Signed(account_id))
            .with_member_id(member_id)
            .with_bounty_id(bounty_id)
            .call_and_assert(Err(Error::<Test>::NoStakingAccountProvided.into()));

        AnnounceWorkEntryFixture::default()
            .with_origin(RawOrigin::Signed(account_id))
            .with_member_id(member_id)
            .with_staking_account_id(account_id)
            .with_bounty_id(bounty_id)
            .call_and_assert(Err(Error::<Test>::InsufficientBalanceForStake.into()));

        increase_account_balance(&account_id, initial_balance);

        AnnounceWorkEntryFixture::default()
            .with_origin(RawOrigin::Signed(account_id))
            .with_member_id(member_id)
            .with_staking_account_id(account_id)
            .with_bounty_id(bounty_id)
            .call_and_assert(Ok(()));

        AnnounceWorkEntryFixture::default()
            .with_origin(RawOrigin::Signed(account_id))
            .with_member_id(member_id)
            .with_staking_account_id(account_id)
            .with_bounty_id(bounty_id)
            .call_and_assert(Err(Error::<Test>::ConflictingStakes.into()));
    });
}

#[test]
fn withdraw_work_entry_succeeded() {
    build_test_externalities().execute_with(|| {
        let starting_block = 1;
        run_to_block(starting_block);

        let initial_balance = 500;
        let max_amount = 100;
        let entrant_stake = 37;

        <mocks::CouncilBudgetManager as CouncilBudgetManager<u64>>::set_budget(initial_balance);

        CreateBountyFixture::default()
            .with_max_amount(max_amount)
            .with_entrant_stake(entrant_stake)
            .call_and_assert(Ok(()));

        let bounty_id = 1;
        let member_id = 1;
        let account_id = 1;

        FundBountyFixture::default()
            .with_bounty_id(bounty_id)
            .with_amount(max_amount)
            .with_council()
            .with_origin(RawOrigin::Root)
            .call_and_assert(Ok(()));

        increase_account_balance(&account_id, initial_balance);

        AnnounceWorkEntryFixture::default()
            .with_origin(RawOrigin::Signed(account_id))
            .with_member_id(member_id)
            .with_staking_account_id(account_id)
            .with_bounty_id(bounty_id)
            .call_and_assert(Ok(()));

        assert_eq!(
            Balances::usable_balance(&account_id),
            initial_balance - entrant_stake
        );

        let entry_id = 1;

        WithdrawWorkEntryFixture::default()
            .with_origin(RawOrigin::Signed(account_id))
            .with_member_id(member_id)
            .with_entry_id(entry_id)
            .call_and_assert(Ok(()));

        assert_eq!(Balances::usable_balance(&account_id), initial_balance);

        EventFixture::assert_last_crate_event(RawEvent::WorkEntryWithdrawn(
            bounty_id, entry_id, member_id,
        ));
    });
}

#[test]
fn withdraw_work_slashes_successfully1() {
    build_test_externalities().execute_with(|| {
        let starting_block = 1;
        run_to_block(starting_block);

        let initial_balance = 500;
        let max_amount = 100;
        let entrant_stake = 100;
        let work_period = 1000;

        <mocks::CouncilBudgetManager as CouncilBudgetManager<u64>>::set_budget(initial_balance);

        CreateBountyFixture::default()
            .with_max_amount(max_amount)
            .with_entrant_stake(entrant_stake)
            .with_work_period(work_period)
            .call_and_assert(Ok(()));

        let bounty_id = 1;

        FundBountyFixture::default()
            .with_bounty_id(bounty_id)
            .with_amount(max_amount)
            .with_council()
            .with_origin(RawOrigin::Root)
            .call_and_assert(Ok(()));

        // Announcing entry with no slashes
        let member_id1 = 1;
        let account_id1 = 1;

        increase_account_balance(&account_id1, initial_balance);

        AnnounceWorkEntryFixture::default()
            .with_origin(RawOrigin::Signed(account_id1))
            .with_member_id(member_id1)
            .with_staking_account_id(account_id1)
            .with_bounty_id(bounty_id)
            .call_and_assert(Ok(()));

        assert_eq!(
            Balances::usable_balance(&account_id1),
            initial_balance - entrant_stake
        );

        let entry_id1 = 1;

        // Announcing entry with half slashing.

        let member_id2 = 2;
        let account_id2 = 2;

        increase_account_balance(&account_id2, initial_balance);

        AnnounceWorkEntryFixture::default()
            .with_origin(RawOrigin::Signed(account_id2))
            .with_member_id(member_id2)
            .with_staking_account_id(account_id2)
            .with_bounty_id(bounty_id)
            .call_and_assert(Ok(()));

        assert_eq!(
            Balances::usable_balance(&account_id2),
            initial_balance - entrant_stake
        );

        let entry_id2 = 2;

        // No slashes
        WithdrawWorkEntryFixture::default()
            .with_origin(RawOrigin::Signed(account_id1))
            .with_member_id(member_id1)
            .with_entry_id(entry_id1)
            .call_and_assert(Ok(()));

        assert_eq!(Balances::usable_balance(&account_id1), initial_balance);

        // Slashes half.
        let half_period = work_period / 2;
        run_to_block(starting_block + half_period);

        WithdrawWorkEntryFixture::default()
            .with_origin(RawOrigin::Signed(account_id2))
            .with_member_id(member_id2)
            .with_entry_id(entry_id2)
            .call_and_assert(Ok(()));

        assert_eq!(
            Balances::usable_balance(&account_id2),
            initial_balance - entrant_stake / 2
        );
    });
}

#[test]
fn withdraw_work_slashes_successfully2() {
    build_test_externalities().execute_with(|| {
        let starting_block = 1;
        run_to_block(starting_block);

        let initial_balance = 500;
        let max_amount = 100;
        let entrant_stake = 100;
        let work_period = 1000;

        <mocks::CouncilBudgetManager as CouncilBudgetManager<u64>>::set_budget(initial_balance);

        CreateBountyFixture::default()
            .with_max_amount(max_amount)
            .with_entrant_stake(entrant_stake)
            .with_work_period(work_period)
            .call_and_assert(Ok(()));

        let bounty_id = 1;

        FundBountyFixture::default()
            .with_bounty_id(bounty_id)
            .with_amount(max_amount)
            .with_council()
            .with_origin(RawOrigin::Root)
            .call_and_assert(Ok(()));

        // Announcing entry with 33%
        let member_id1 = 1;
        let account_id1 = 1;

        increase_account_balance(&account_id1, initial_balance);

        AnnounceWorkEntryFixture::default()
            .with_origin(RawOrigin::Signed(account_id1))
            .with_member_id(member_id1)
            .with_staking_account_id(account_id1)
            .with_bounty_id(bounty_id)
            .call_and_assert(Ok(()));

        assert_eq!(
            Balances::usable_balance(&account_id1),
            initial_balance - entrant_stake
        );

        let entry_id1 = 1;

        // Announcing entry with full slashing.

        let member_id2 = 2;
        let account_id2 = 2;

        increase_account_balance(&account_id2, initial_balance);

        AnnounceWorkEntryFixture::default()
            .with_origin(RawOrigin::Signed(account_id2))
            .with_member_id(member_id2)
            .with_staking_account_id(account_id2)
            .with_bounty_id(bounty_id)
            .call_and_assert(Ok(()));

        assert_eq!(
            Balances::usable_balance(&account_id2),
            initial_balance - entrant_stake
        );

        let entry_id2 = 2;

        // Slashes half.
        let one_third_period = work_period / 3;
        run_to_block(starting_block + one_third_period);

        WithdrawWorkEntryFixture::default()
            .with_origin(RawOrigin::Signed(account_id1))
            .with_member_id(member_id1)
            .with_entry_id(entry_id1)
            .call_and_assert(Ok(()));

        assert_eq!(
            Balances::usable_balance(&account_id1),
            initial_balance - entrant_stake / 3
        );

        // Slashes all.
        run_to_block(starting_block + work_period);

        WithdrawWorkEntryFixture::default()
            .with_origin(RawOrigin::Signed(account_id2))
            .with_member_id(member_id2)
            .with_entry_id(entry_id2)
            .call_and_assert(Ok(()));

        assert_eq!(
            Balances::usable_balance(&account_id2),
            initial_balance - entrant_stake
        );
    });
}

#[test]
fn withdraw_work_entry_fails_with_invalid_bounty_id() {
    build_test_externalities().execute_with(|| {
        let invalid_bounty_id = 11u64;

        WithdrawWorkEntryFixture::default()
            .with_bounty_id(invalid_bounty_id)
            .call_and_assert(Err(Error::<Test>::BountyDoesntExist.into()));
    });
}

#[test]
fn withdraw_work_entry_fails_with_invalid_entry_id() {
    build_test_externalities().execute_with(|| {
        let starting_block = 1;
        run_to_block(starting_block);

        let initial_balance = 500;
        let max_amount = 100;
        let entrant_stake = 37;

        <mocks::CouncilBudgetManager as CouncilBudgetManager<u64>>::set_budget(initial_balance);

        CreateBountyFixture::default()
            .with_max_amount(max_amount)
            .with_entrant_stake(entrant_stake)
            .call_and_assert(Ok(()));

        let bounty_id = 1;

        FundBountyFixture::default()
            .with_bounty_id(bounty_id)
            .with_amount(max_amount)
            .with_council()
            .with_origin(RawOrigin::Root)
            .call_and_assert(Ok(()));

        let invalid_entry_id = 11u64;

        WithdrawWorkEntryFixture::default()
            .with_bounty_id(bounty_id)
            .with_entry_id(invalid_entry_id)
            .call_and_assert(Err(Error::<Test>::WorkEntryDoesntExist.into()));
    });
}

#[test]
fn withdraw_work_entry_fails_with_invalid_origin() {
    build_test_externalities().execute_with(|| {
        let starting_block = 1;
        run_to_block(starting_block);

        let initial_balance = 500;
        let max_amount = 100;

        <mocks::CouncilBudgetManager as CouncilBudgetManager<u64>>::set_budget(initial_balance);

        CreateBountyFixture::default()
            .with_max_amount(max_amount)
            .call_and_assert(Ok(()));

        let bounty_id = 1;
        let member_id = 1;
        let account_id = 1;

        FundBountyFixture::default()
            .with_bounty_id(bounty_id)
            .with_amount(max_amount)
            .with_council()
            .with_origin(RawOrigin::Root)
            .call_and_assert(Ok(()));

        AnnounceWorkEntryFixture::default()
            .with_origin(RawOrigin::Signed(account_id))
            .with_member_id(member_id)
            .with_bounty_id(bounty_id)
            .call_and_assert(Ok(()));

        let entry_id = 1;

        WithdrawWorkEntryFixture::default()
            .with_entry_id(entry_id)
            .with_bounty_id(bounty_id)
            .with_origin(RawOrigin::Root)
            .call_and_assert(Err(DispatchError::BadOrigin));
    });
}

#[test]
fn withdraw_work_entry_fails_with_invalid_stage() {
    build_test_externalities().execute_with(|| {
        let starting_block = 1;
        run_to_block(starting_block);

        let initial_balance = 500;
        let max_amount = 100;
        let entrant_stake = 37;
        let work_period = 10;

        <mocks::CouncilBudgetManager as CouncilBudgetManager<u64>>::set_budget(initial_balance);

        CreateBountyFixture::default()
            .with_max_amount(max_amount)
            .with_entrant_stake(entrant_stake)
            .with_work_period(work_period)
            .call_and_assert(Ok(()));

        let bounty_id = 1;
        let member_id = 1;
        let account_id = 1;

        FundBountyFixture::default()
            .with_bounty_id(bounty_id)
            .with_amount(max_amount)
            .with_council()
            .with_origin(RawOrigin::Root)
            .call_and_assert(Ok(()));

        increase_account_balance(&account_id, initial_balance);

        AnnounceWorkEntryFixture::default()
            .with_origin(RawOrigin::Signed(account_id))
            .with_member_id(member_id)
            .with_staking_account_id(account_id)
            .with_bounty_id(bounty_id)
            .call_and_assert(Ok(()));

        assert_eq!(
            Balances::usable_balance(&account_id),
            initial_balance - entrant_stake
        );

        let entry_id = 1;

        run_to_block(starting_block + work_period + 1);

        WithdrawWorkEntryFixture::default()
            .with_origin(RawOrigin::Signed(account_id))
            .with_member_id(member_id)
            .with_entry_id(entry_id)
            .with_bounty_id(bounty_id)
            .call_and_assert(Err(Error::<Test>::InvalidBountyStage.into()));
    });
}

#[test]
fn submit_work_succeeded() {
    build_test_externalities().execute_with(|| {
        let starting_block = 1;
        run_to_block(starting_block);

        let initial_balance = 500;
        let max_amount = 100;
        let entrant_stake = 37;

        <mocks::CouncilBudgetManager as CouncilBudgetManager<u64>>::set_budget(initial_balance);

        CreateBountyFixture::default()
            .with_max_amount(max_amount)
            .with_entrant_stake(entrant_stake)
            .call_and_assert(Ok(()));

        let bounty_id = 1;
        let member_id = 1;
        let account_id = 1;

        FundBountyFixture::default()
            .with_bounty_id(bounty_id)
            .with_amount(max_amount)
            .with_council()
            .with_origin(RawOrigin::Root)
            .call_and_assert(Ok(()));

        increase_account_balance(&account_id, initial_balance);

        AnnounceWorkEntryFixture::default()
            .with_origin(RawOrigin::Signed(account_id))
            .with_member_id(member_id)
            .with_staking_account_id(account_id)
            .with_bounty_id(bounty_id)
            .call_and_assert(Ok(()));

        let entry_id = 1;

        let work_data = b"Work submitted".to_vec();
        SubmitWorkFixture::default()
            .with_origin(RawOrigin::Signed(account_id))
            .with_member_id(member_id)
            .with_entry_id(entry_id)
            .with_work_data(work_data.clone())
            .call_and_assert(Ok(()));

        EventFixture::assert_last_crate_event(RawEvent::WorkSubmitted(
            bounty_id, entry_id, member_id, work_data,
        ));
    });
}

#[test]
fn submit_work_fails_with_invalid_bounty_id() {
    build_test_externalities().execute_with(|| {
        let invalid_bounty_id = 11u64;

        SubmitWorkFixture::default()
            .with_bounty_id(invalid_bounty_id)
            .call_and_assert(Err(Error::<Test>::BountyDoesntExist.into()));
    });
}

#[test]
fn submit_work_fails_with_invalid_entry_id() {
    build_test_externalities().execute_with(|| {
        let starting_block = 1;
        run_to_block(starting_block);

        let initial_balance = 500;
        let max_amount = 100;
        let entrant_stake = 37;

        <mocks::CouncilBudgetManager as CouncilBudgetManager<u64>>::set_budget(initial_balance);

        CreateBountyFixture::default()
            .with_max_amount(max_amount)
            .with_entrant_stake(entrant_stake)
            .call_and_assert(Ok(()));

        let bounty_id = 1;

        FundBountyFixture::default()
            .with_bounty_id(bounty_id)
            .with_amount(max_amount)
            .with_council()
            .with_origin(RawOrigin::Root)
            .call_and_assert(Ok(()));

        let invalid_entry_id = 11u64;

        SubmitWorkFixture::default()
            .with_bounty_id(bounty_id)
            .with_entry_id(invalid_entry_id)
            .call_and_assert(Err(Error::<Test>::WorkEntryDoesntExist.into()));
    });
}

#[test]
fn submit_work_fails_with_invalid_origin() {
    build_test_externalities().execute_with(|| {
        let starting_block = 1;
        run_to_block(starting_block);

        let initial_balance = 500;
        let max_amount = 100;

        <mocks::CouncilBudgetManager as CouncilBudgetManager<u64>>::set_budget(initial_balance);

        CreateBountyFixture::default()
            .with_max_amount(max_amount)
            .call_and_assert(Ok(()));

        let bounty_id = 1;
        let member_id = 1;
        let account_id = 1;

        FundBountyFixture::default()
            .with_bounty_id(bounty_id)
            .with_amount(max_amount)
            .with_council()
            .with_origin(RawOrigin::Root)
            .call_and_assert(Ok(()));

        AnnounceWorkEntryFixture::default()
            .with_origin(RawOrigin::Signed(account_id))
            .with_member_id(member_id)
            .with_bounty_id(bounty_id)
            .call_and_assert(Ok(()));

        let entry_id = 1;

        SubmitWorkFixture::default()
            .with_entry_id(entry_id)
            .with_bounty_id(bounty_id)
            .with_origin(RawOrigin::Root)
            .call_and_assert(Err(DispatchError::BadOrigin));
    });
}

#[test]
fn submit_work_fails_with_invalid_stage() {
    build_test_externalities().execute_with(|| {
        let starting_block = 1;
        run_to_block(starting_block);

        let initial_balance = 500;
        let max_amount = 100;
        let entrant_stake = 37;
        let work_period = 10;

        <mocks::CouncilBudgetManager as CouncilBudgetManager<u64>>::set_budget(initial_balance);

        CreateBountyFixture::default()
            .with_max_amount(max_amount)
            .with_entrant_stake(entrant_stake)
            .with_work_period(work_period)
            .call_and_assert(Ok(()));

        let bounty_id = 1;
        let member_id = 1;
        let account_id = 1;

        FundBountyFixture::default()
            .with_bounty_id(bounty_id)
            .with_amount(max_amount)
            .with_council()
            .with_origin(RawOrigin::Root)
            .call_and_assert(Ok(()));

        increase_account_balance(&account_id, initial_balance);

        AnnounceWorkEntryFixture::default()
            .with_origin(RawOrigin::Signed(account_id))
            .with_member_id(member_id)
            .with_staking_account_id(account_id)
            .with_bounty_id(bounty_id)
            .call_and_assert(Ok(()));

        assert_eq!(
            Balances::usable_balance(&account_id),
            initial_balance - entrant_stake
        );

        let entry_id = 1;

        run_to_block(starting_block + work_period + 1);

        SubmitWorkFixture::default()
            .with_origin(RawOrigin::Signed(account_id))
            .with_member_id(member_id)
            .with_entry_id(entry_id)
            .with_bounty_id(bounty_id)
            .call_and_assert(Err(Error::<Test>::InvalidBountyStage.into()));
    });
}

#[test]
fn submit_judgement_for_council_succeeded() {
    build_test_externalities().execute_with(|| {
        let starting_block = 1;
        run_to_block(starting_block);

        let initial_balance = 500;
        let max_amount = 100;
        let entrant_stake = 37;
        let working_period = 10;
        let judging_period = 10;

        <mocks::CouncilBudgetManager as CouncilBudgetManager<u64>>::set_budget(initial_balance);

        CreateBountyFixture::default()
            .with_max_amount(max_amount)
            .with_entrant_stake(entrant_stake)
            .with_work_period(working_period)
            .with_judging_period(judging_period)
            .call_and_assert(Ok(()));

        let bounty_id = 1;
        let member_id = 1;
        let account_id = 1;

        FundBountyFixture::default()
            .with_bounty_id(bounty_id)
            .with_amount(max_amount)
            .with_council()
            .with_origin(RawOrigin::Root)
            .call_and_assert(Ok(()));

        increase_account_balance(&account_id, initial_balance);

        AnnounceWorkEntryFixture::default()
            .with_origin(RawOrigin::Signed(account_id))
            .with_member_id(member_id)
            .with_staking_account_id(account_id)
            .with_bounty_id(bounty_id)
            .call_and_assert(Ok(()));

        let entry_id = 1;

        let work_data = b"Work submitted".to_vec();
        SubmitWorkFixture::default()
            .with_origin(RawOrigin::Signed(account_id))
            .with_member_id(member_id)
            .with_entry_id(entry_id)
            .with_work_data(work_data.clone())
            .call_and_assert(Ok(()));

        run_to_block(starting_block + working_period + 1);

        let judgement = OracleJudgement {
            winners: vec![member_id].iter().cloned().collect::<BTreeSet<u64>>(),
            legitimate_participants: BTreeSet::new(),
        };

        let bounty = Bounty::bounties(bounty_id);

        println!("{:?}", Bounty::current_block());
        println!("{:?}", bounty);
        println!("{:?}", Bounty::get_bounty_stage(&bounty));

        SubmitJudgementFixture::default()
            .with_bounty_id(bounty_id)
            .with_judgement(judgement.clone())
            .call_and_assert(Ok(()));

        EventFixture::assert_last_crate_event(RawEvent::OracleJudgementSubmitted(
            bounty_id,
            BountyActor::Council,
            judgement,
        ));
    });
}

// #[test]
// fn cancel_bounty_by_council_succeeds() {
//     build_test_externalities().execute_with(|| {
//         set_council_budget(500);
//
//         let starting_block = 1;
//         run_to_block(starting_block);
//
//         CreateBountyFixture::default().call_and_assert(Ok(()));
//
//         let bounty_id = 1u64;
//
//         CancelBountyFixture::default()
//             .with_bounty_id(bounty_id)
//             .call_and_assert(Ok(()));
//
//         EventFixture::assert_last_crate_event(RawEvent::BountyCanceled(
//             bounty_id,
//             BountyActor::Council,
//         ));
//     });
// }
//
// #[test]
// fn cancel_bounty_by_member_succeeds() {
//     build_test_externalities().execute_with(|| {
//         let starting_block = 1;
//         run_to_block(starting_block);
//
//         let member_id = 1;
//         let account_id = 1;
//         let initial_balance = 500;
//
//         increase_total_balance_issuance_using_account_id(account_id, initial_balance);
//
//         CreateBountyFixture::default()
//             .with_origin(RawOrigin::Signed(account_id))
//             .with_creator_member_id(member_id)
//             .call_and_assert(Ok(()));
//
//         let bounty_id = 1u64;
//
//         CancelBountyFixture::default()
//             .with_origin(RawOrigin::Signed(account_id))
//             .with_creator_member_id(member_id)
//             .with_bounty_id(bounty_id)
//             .call_and_assert(Ok(()));
//
//         EventFixture::assert_last_crate_event(RawEvent::BountyCanceled(
//             bounty_id,
//             BountyActor::Member(member_id),
//         ));
//     });
// }

#[test]
fn submit_judgement_fails_with_invalid_bounty_id() {
    build_test_externalities().execute_with(|| {
        let invalid_bounty_id = 11u64;

        SubmitJudgementFixture::default()
            .with_bounty_id(invalid_bounty_id)
            .call_and_assert(Err(Error::<Test>::BountyDoesntExist.into()));
    });
}

#[test]
fn submit_judgement_fails_with_invalid_origin() {
    build_test_externalities().execute_with(|| {
        let member_id = 1;
        let account_id = 1;
        let initial_balance = 500;

        increase_account_balance(&account_id, initial_balance);
        set_council_budget(initial_balance);

        // Oracle is set to a council - try to submit judgement with bad origin
        CreateBountyFixture::default()
            .with_origin(RawOrigin::Root)
            .call_and_assert(Ok(()));

        let bounty_id = 1u64;
        SubmitJudgementFixture::default()
            .with_bounty_id(bounty_id)
            .with_origin(RawOrigin::Signed(account_id))
            .call_and_assert(Err(DispatchError::BadOrigin));

        // Oracle is set to a member - try to submit judgement with invalid member_id
        CreateBountyFixture::default()
            .with_oracle_member_id(member_id)
            .call_and_assert(Ok(()));

        let bounty_id = 2u64;
        let invalid_member_id = 2;

        SubmitJudgementFixture::default()
            .with_bounty_id(bounty_id)
            .with_origin(RawOrigin::Signed(account_id))
            .with_oracle_member_id(invalid_member_id)
            .call_and_assert(Err(Error::<Test>::NotBountyActor.into()));

        // Oracle is set to a member - try to submit judgement with bad origin
        CreateBountyFixture::default()
            .with_oracle_member_id(member_id)
            .call_and_assert(Ok(()));

        let bounty_id = 3u64;

        SubmitJudgementFixture::default()
            .with_bounty_id(bounty_id)
            .with_origin(RawOrigin::None)
            .call_and_assert(Err(DispatchError::BadOrigin));

        // Oracle is set to a member - try to submit judgement as a council
        CreateBountyFixture::default()
            .with_oracle_member_id(member_id)
            .call_and_assert(Ok(()));

        let bounty_id = 4u64;

        SubmitJudgementFixture::default()
            .with_bounty_id(bounty_id)
            .with_origin(RawOrigin::Root)
            .call_and_assert(Err(Error::<Test>::NotBountyActor.into()));
    });
}

#[test]
fn submit_judgement_fails_with_invalid_stage() {
    build_test_externalities().execute_with(|| {
        set_council_budget(500);

        // Test already cancelled bounty.
        CreateBountyFixture::default().call_and_assert(Ok(()));

        let bounty_id = 1u64;

        SubmitJudgementFixture::default()
            .with_bounty_id(bounty_id)
            .call_and_assert(Err(Error::<Test>::InvalidBountyStage.into()));
    });
}

#[test]
fn validate_funding_bounty_stage() {
    build_test_externalities().execute_with(|| {
        let created_at = 10;

        // Perpetual funding period
        // No contributions.
        let bounty = BountyRecord {
            creation_params: BountyCreationParameters::<Test> {
                funding_period: None,
                ..Default::default()
            },
            milestone: BountyMilestone::Created {
                created_at,
                has_contributions: false,
            },
            ..Default::default()
        };

        assert_eq!(
            Bounty::get_bounty_stage(&bounty),
            BountyStage::Funding {
                has_contributions: false
            }
        );

        // Has contributions
        let bounty = BountyRecord {
            creation_params: BountyCreationParameters::<Test> {
                funding_period: None,
                ..Default::default()
            },
            milestone: BountyMilestone::Created {
                created_at,
                has_contributions: true,
            },
            ..Default::default()
        };

        assert_eq!(
            Bounty::get_bounty_stage(&bounty),
            BountyStage::Funding {
                has_contributions: true
            }
        );

        // Limited funding period
        let funding_period = 10;

        let bounty = BountyRecord {
            creation_params: BountyCreationParameters::<Test> {
                funding_period: Some(funding_period),
                ..Default::default()
            },
            milestone: BountyMilestone::Created {
                created_at,
                has_contributions: false,
            },
            ..Default::default()
        };

        System::set_block_number(created_at + 1);

        assert_eq!(
            Bounty::get_bounty_stage(&bounty),
            BountyStage::Funding {
                has_contributions: false
            }
        );

        let bounty = BountyRecord {
            creation_params: BountyCreationParameters::<Test> {
                funding_period: Some(funding_period),
                ..Default::default()
            },
            milestone: BountyMilestone::Created {
                created_at,
                has_contributions: true,
            },
            ..Default::default()
        };

        System::set_block_number(created_at + 2);

        assert_eq!(
            Bounty::get_bounty_stage(&bounty),
            BountyStage::Funding {
                has_contributions: true
            }
        );
    });
}

#[test]
fn validate_work_submission_bounty_stage() {
    build_test_externalities().execute_with(|| {
        let created_at = 10;
        let funding_period = 10;
        let work_period = 10;
        let judging_period = 10;
        let min_funding_amount = 100;
        let work_period_started_at = created_at + funding_period;

        // Limited funding period
        let params = BountyCreationParameters::<Test> {
            funding_period: Some(funding_period),
            work_period,
            min_amount: min_funding_amount,
            ..Default::default()
        };

        let bounty = BountyRecord {
            creation_params: params.clone(),
            milestone: BountyMilestone::Created {
                created_at,
                has_contributions: true,
            },
            total_funding: min_funding_amount,
            ..Default::default()
        };

        System::set_block_number(created_at + funding_period + 1);

        assert_eq!(
            Bounty::get_bounty_stage(&bounty),
            BountyStage::WorkSubmission
        );

        // Max funding reached.
        let max_funding_reached_at = 30;

        let bounty = BountyRecord {
            creation_params: params,
            milestone: BountyMilestone::BountyMaxFundingReached {
                max_funding_reached_at,
            },
            ..Default::default()
        };

        System::set_block_number(max_funding_reached_at + 1);

        assert_eq!(
            Bounty::get_bounty_stage(&bounty),
            BountyStage::WorkSubmission
        );

        // Work period is not expired.
        let bounty = BountyRecord {
            creation_params: BountyCreationParameters::<Test> {
                funding_period: Some(funding_period),
                work_period,
                judging_period,
                min_amount: min_funding_amount,
                ..Default::default()
            },
            milestone: BountyMilestone::WorkSubmitted {
                work_period_started_at,
            },
            ..Default::default()
        };

        System::set_block_number(work_period_started_at + 1);

        assert_eq!(
            Bounty::get_bounty_stage(&bounty),
            BountyStage::WorkSubmission
        );
    });
}

#[test]
fn validate_judgement_bounty_stage() {
    build_test_externalities().execute_with(|| {
        let created_at = 10;
        let funding_period = 10;
        let work_period = 10;
        let judging_period = 10;
        let min_funding_amount = 100;
        let work_period_started_at = created_at + funding_period;

        // Work period is not expired.
        let bounty = BountyRecord {
            creation_params: BountyCreationParameters::<Test> {
                funding_period: Some(funding_period),
                work_period,
                judging_period,
                min_amount: min_funding_amount,
                ..Default::default()
            },
            milestone: BountyMilestone::WorkSubmitted {
                work_period_started_at,
            },
            ..Default::default()
        };

        System::set_block_number(work_period_started_at + work_period + 1);

        assert_eq!(Bounty::get_bounty_stage(&bounty), BountyStage::Judgement);
    });
}

#[test]
fn validate_withdrawal_bounty_stage() {
    build_test_externalities().execute_with(|| {
        let created_at = 10;
        let max_funding_reached_at = 10;
        let funding_period = 10;
        let judging_period = 10;
        let work_period = 10;
        let total_amount = 50;
        let min_funding_amount = 100;
        let work_period_started_at = created_at + funding_period;

        // Expired funding period with not enough funding.
        // Has contributions.
        let bounty = BountyRecord {
            creation_params: BountyCreationParameters::<Test> {
                funding_period: Some(funding_period),
                work_period,
                min_amount: min_funding_amount,
                ..Default::default()
            },
            milestone: BountyMilestone::Created {
                created_at,
                has_contributions: true,
            },
            total_funding: total_amount,
            ..Default::default()
        };

        System::set_block_number(created_at + funding_period + 1);

        assert_eq!(
            Bounty::get_bounty_stage(&bounty),
            BountyStage::Withdrawal {
                cherry_needs_withdrawal: false
            }
        );

        // No work submissions.
        let bounty = BountyRecord {
            creation_params: BountyCreationParameters::<Test> {
                funding_period: Some(funding_period),
                work_period,
                min_amount: min_funding_amount,
                ..Default::default()
            },
            milestone: BountyMilestone::BountyMaxFundingReached {
                max_funding_reached_at,
            },
            total_funding: total_amount,
            ..Default::default()
        };

        System::set_block_number(max_funding_reached_at + work_period + 1);

        assert_eq!(
            Bounty::get_bounty_stage(&bounty),
            BountyStage::Withdrawal {
                cherry_needs_withdrawal: true
            }
        );

        // Judging period has passed.
        let bounty = BountyRecord {
            creation_params: BountyCreationParameters::<Test> {
                funding_period: Some(funding_period),
                work_period,
                judging_period,
                min_amount: min_funding_amount,
                ..Default::default()
            },
            milestone: BountyMilestone::WorkSubmitted {
                work_period_started_at,
            },
            total_funding: min_funding_amount,
            ..Default::default()
        };

        System::set_block_number(created_at + funding_period + work_period + judging_period + 1);

        assert_eq!(
            Bounty::get_bounty_stage(&bounty),
            BountyStage::Withdrawal {
                cherry_needs_withdrawal: true
            }
        );

        // Canceled bounty
        let bounty = BountyRecord {
            milestone: BountyMilestone::Canceled,
            ..Default::default()
        };

        assert_eq!(
            Bounty::get_bounty_stage(&bounty),
            BountyStage::Withdrawal {
                cherry_needs_withdrawal: true
            }
        );

        // Creator cherry was withdrawn.
        let bounty = BountyRecord {
            milestone: BountyMilestone::CreatorCherryWithdrawn,
            ..Default::default()
        };

        assert_eq!(
            Bounty::get_bounty_stage(&bounty),
            BountyStage::Withdrawal {
                cherry_needs_withdrawal: false
            }
        );
    });
}
