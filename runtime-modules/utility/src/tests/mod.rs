#![cfg(test)]

pub(crate) mod mocks;

use crate::*;
use frame_system::RawOrigin;
use mocks::{assert_last_event, initial_test_ext, BurnTokensFixture, Test, Utilities};
use sp_arithmetic::traits::{One, Zero};
use sp_runtime::DispatchError;
use strum::IntoEnumIterator;

#[test]
fn execute_signal_proposal_fails() {
    initial_test_ext().execute_with(|| {
        assert_eq!(
            Utilities::<Test>::execute_signal_proposal(RawOrigin::Signed(0).into(), vec![0]),
            Err(DispatchError::BadOrigin)
        );
    });
}

#[test]
fn execute_signal_proposal_succeds() {
    initial_test_ext().execute_with(|| {
        let signal = vec![0];
        assert_eq!(
            Utilities::<Test>::execute_signal_proposal(RawOrigin::Root.into(), signal.clone()),
            Ok(())
        );

        assert_last_event(RawEvent::Signaled(signal).into());
    });
}

#[test]
fn execute_runtime_upgrade_proposal_fails() {
    initial_test_ext().execute_with(|| {
        assert_eq!(
            Utilities::<Test>::execute_runtime_upgrade_proposal(
                RawOrigin::Signed(0).into(),
                vec![0]
            ),
            Err(DispatchError::BadOrigin)
        );
    });
}

#[test]
fn update_working_group_budget_fails_permissions() {
    for wg in WorkingGroup::iter() {
        run_update_working_group_budget_fails_permissions(wg);
    }
}

fn run_update_working_group_budget_fails_permissions(wg: WorkingGroup) {
    initial_test_ext().execute_with(|| {
        assert_eq!(
            Utilities::<Test>::update_working_group_budget(
                RawOrigin::Signed(0).into(),
                wg,
                Zero::zero(),
                BalanceKind::Positive
            ),
            Err(DispatchError::BadOrigin)
        );
    });
}

#[test]
fn update_working_group_budget_fails_positive() {
    for wg in WorkingGroup::iter() {
        run_update_working_group_budget_fails_positive(wg);
    }
}

fn run_update_working_group_budget_fails_positive(wg: WorkingGroup) {
    initial_test_ext().execute_with(|| {
        assert_eq!(council::Module::<Test>::budget(), 0);
        assert_eq!(
            Utilities::<Test>::update_working_group_budget(
                RawOrigin::Root.into(),
                wg,
                One::one(),
                BalanceKind::Positive
            ),
            Err(Error::<Test>::InsufficientFundsForBudgetUpdate.into())
        );
    });
}

#[test]
fn update_working_group_budget_fails_negative() {
    for wg in WorkingGroup::iter() {
        run_update_working_group_budget_fails_negative(wg);
    }
}

fn run_update_working_group_budget_fails_negative(wg: WorkingGroup) {
    initial_test_ext().execute_with(|| {
        assert_eq!(<Test as Config>::get_working_group_budget(wg), 0);
        assert_eq!(
            Utilities::<Test>::update_working_group_budget(
                RawOrigin::Root.into(),
                wg,
                One::one(),
                BalanceKind::Negative
            ),
            Err(Error::<Test>::InsufficientFundsForBudgetUpdate.into())
        );
    });
}

#[test]
fn update_working_group_budget_succeeds_positive() {
    for wg in WorkingGroup::iter() {
        run_update_working_group_budget_succeeds_positive(wg);
    }
}

fn run_update_working_group_budget_succeeds_positive(wg: WorkingGroup) {
    initial_test_ext().execute_with(|| {
        let budget = 100000;
        let funding_amount = 1;
        council::Module::<Test>::set_budget(RawOrigin::Root.into(), budget).unwrap();
        assert_eq!(council::Module::<Test>::budget(), budget);
        assert_eq!(<Test as Config>::get_working_group_budget(wg), 0);
        assert_eq!(
            Utilities::<Test>::update_working_group_budget(
                RawOrigin::Root.into(),
                wg,
                funding_amount,
                BalanceKind::Positive
            ),
            Ok(())
        );

        assert_eq!(council::Module::<Test>::budget(), budget - funding_amount);
        assert_eq!(
            <Test as Config>::get_working_group_budget(wg),
            funding_amount
        );
        assert_last_event(
            RawEvent::UpdatedWorkingGroupBudget(wg, funding_amount, BalanceKind::Positive).into(),
        );
    });
}

#[test]
fn update_working_group_budget_succeeds_negative() {
    for wg in WorkingGroup::iter() {
        run_update_working_group_budget_succeeds_negative(wg);
    }
}

fn run_update_working_group_budget_succeeds_negative(wg: WorkingGroup) {
    initial_test_ext().execute_with(|| {
        let budget = 100000;
        let funding_amount = 1;
        <Test as Config>::set_working_group_budget(wg, budget);
        assert_eq!(council::Module::<Test>::budget(), 0);
        assert_eq!(<Test as Config>::get_working_group_budget(wg), budget);

        assert_eq!(
            Utilities::<Test>::update_working_group_budget(
                RawOrigin::Root.into(),
                wg,
                funding_amount,
                BalanceKind::Negative,
            ),
            Ok(())
        );

        assert_eq!(council::Module::<Test>::budget(), funding_amount);
        assert_eq!(
            <Test as Config>::get_working_group_budget(wg),
            budget - funding_amount
        );
        assert_last_event(
            RawEvent::UpdatedWorkingGroupBudget(wg, funding_amount, BalanceKind::Negative).into(),
        );
    });
}

#[test]
fn burn_account_tokens_succeeds() {
    initial_test_ext().execute_with(|| {
        BurnTokensFixture::default().execute_and_assert(Ok(()));
    });
}

#[test]
fn burn_account_tokens_fails_zero() {
    initial_test_ext().execute_with(|| {
        BurnTokensFixture::default()
            .with_burn_balance(0)
            .execute_and_assert(Err(Error::<Test>::ZeroTokensBurn.into()));
    });
}

#[test]
fn burn_account_tokens_fails_insufficient() {
    initial_test_ext().execute_with(|| {
        BurnTokensFixture::default()
            .with_account_initial_balance(0)
            .execute_and_assert(Err(Error::<Test>::InsufficientFundsForBurn.into()));
    });
}
