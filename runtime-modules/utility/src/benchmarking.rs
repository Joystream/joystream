#![cfg(feature = "runtime-benchmarks")]

use super::*;
use frame_benchmarking::{account, benchmarks};
use frame_system::Module as System;
use frame_system::{EventRecord, RawOrigin};
use sp_runtime::traits::One;
use sp_std::boxed::Box;
use sp_std::convert::TryInto;
use sp_std::vec;
use sp_std::vec::Vec;

fn assert_last_event<T: Config>(generic_event: <T as Config>::Event) {
    let events = System::<T>::events();
    let system_event: <T as frame_system::Config>::Event = generic_event.into();
    // compare to the last event record
    let EventRecord { event, .. } = &events[events.len() - 1];
    assert_eq!(event, &system_event);
}

fn set_wg_and_council_budget<T: Config>(budget: u32, group: WorkingGroup) {
    Council::<T>::set_budget(RawOrigin::Root.into(), BalanceOf::<T>::from(budget)).unwrap();

    T::set_working_group_budget(group, BalanceOf::<T>::from(budget));

    assert_eq!(
        Council::<T>::budget(),
        BalanceOf::<T>::from(budget),
        "Council budget not updated"
    );

    assert_eq!(
        T::get_working_group_budget(group),
        BalanceOf::<T>::from(budget),
        "Working Group budget not updated"
    );
}

fn assert_new_budgets<T: Config>(
    new_budget_council: u32,
    new_budget_working_group: u32,
    group: WorkingGroup,
    amount: u32,
    balance_kind: BalanceKind,
) {
    assert_eq!(
        Council::<T>::budget(),
        BalanceOf::<T>::from(new_budget_council),
        "Council budget not updated"
    );

    assert_eq!(
        T::get_working_group_budget(group),
        BalanceOf::<T>::from(new_budget_working_group),
        "Working Group budget not updated"
    );

    assert_last_event::<T>(
        RawEvent::UpdatedWorkingGroupBudget(group, BalanceOf::<T>::from(amount), balance_kind)
            .into(),
    );
}

const MAX_BYTES: u32 = 50000;

benchmarks! {
    _{ }

    execute_signal_proposal {
        let i in 1 .. MAX_BYTES;
        let signal = vec![0u8; i.try_into().unwrap()];
    }: _(RawOrigin::Root, signal.clone())
    verify {
        assert_last_event::<T>(RawEvent::Signaled(signal).into());
    }

    update_working_group_budget_positive_forum {
        set_wg_and_council_budget::<T>(100, WorkingGroup::Forum);
    }: update_working_group_budget(
        RawOrigin::Root,
        WorkingGroup::Forum,
        One::one(),
        BalanceKind::Positive
    )
    verify {
        assert_new_budgets::<T>(99, 101, WorkingGroup::Forum, 1, BalanceKind::Positive);
    }

    update_working_group_budget_negative_forum {
        set_wg_and_council_budget::<T>(100, WorkingGroup::Forum);
    }: update_working_group_budget(
        RawOrigin::Root,
        WorkingGroup::Forum,
        One::one(),
        BalanceKind::Negative
    )
    verify{
        assert_new_budgets::<T>(101, 99, WorkingGroup::Forum, 1, BalanceKind::Negative);
    }

    update_working_group_budget_positive_storage {
        set_wg_and_council_budget::<T>(100, WorkingGroup::Storage);
    }: update_working_group_budget(
        RawOrigin::Root,
        WorkingGroup::Storage,
        One::one(),
        BalanceKind::Positive
    )
    verify {
        assert_new_budgets::<T>(99, 101, WorkingGroup::Storage, 1, BalanceKind::Positive);
    }

    update_working_group_budget_negative_storage {
        set_wg_and_council_budget::<T>(100, WorkingGroup::Storage);
    }: update_working_group_budget(
        RawOrigin::Root,
        WorkingGroup::Storage,
        One::one(),
        BalanceKind::Negative
    )
    verify {
        assert_new_budgets::<T>(101, 99, WorkingGroup::Storage, 1, BalanceKind::Negative);
    }

    update_working_group_budget_positive_content {
        set_wg_and_council_budget::<T>(100, WorkingGroup::Content);
    }: update_working_group_budget(
        RawOrigin::Root,
        WorkingGroup::Content,
        One::one(),
        BalanceKind::Positive
    )
    verify {
        assert_new_budgets::<T>(99, 101, WorkingGroup::Content, 1, BalanceKind::Positive);
    }

    update_working_group_budget_negative_content {
        set_wg_and_council_budget::<T>(100, WorkingGroup::Content);
    }: update_working_group_budget(RawOrigin::Root, WorkingGroup::Content, One::one(),
    BalanceKind::Negative)
    verify {
        assert_new_budgets::<T>(101, 99, WorkingGroup::Content, 1, BalanceKind::Negative);
    }

    update_working_group_budget_positive_membership {
        set_wg_and_council_budget::<T>(100, WorkingGroup::Membership);
    }: update_working_group_budget(
        RawOrigin::Root,
        WorkingGroup::Membership,
        One::one(),
        BalanceKind::Positive
    )
    verify {
        assert_new_budgets::<T>(99, 101, WorkingGroup::Membership, 1, BalanceKind::Positive);
    }

    update_working_group_budget_negative_membership {
        set_wg_and_council_budget::<T>(100, WorkingGroup::Membership);
    }: update_working_group_budget(
        RawOrigin::Root,
        WorkingGroup::Membership,
        One::one(),
        BalanceKind::Negative
    )
    verify {
        assert_new_budgets::<T>(101, 99, WorkingGroup::Membership, 1, BalanceKind::Negative);
    }

    burn_account_tokens {
        let account_id = account::<T::AccountId>("caller", 0, 0);
        let initial_issuance = Balances::<T>::total_issuance();
        let initial_balance: BalanceOf<T> = 15.into();
        let _ = Balances::<T>::make_free_balance_be(&account_id, initial_balance);

        assert_eq!(Balances::<T>::free_balance(&account_id), initial_balance);
        assert_eq!(Balances::<T>::total_issuance(), initial_issuance + initial_balance);
    }: _ (RawOrigin::Signed(account_id.clone()), initial_balance)
    verify {
        assert_eq!(Balances::<T>::free_balance(&account_id), Zero::zero());
        assert_eq!(Balances::<T>::total_issuance(),  initial_issuance);
        assert_last_event::<T>(RawEvent::TokensBurned(account_id, initial_balance).into());
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::tests::mocks::{initial_test_ext, Test};
    use frame_support::assert_ok;

    #[test]
    fn test_execute_signal_proposal() {
        initial_test_ext().execute_with(|| {
            assert_ok!(test_benchmark_execute_signal_proposal::<Test>());
        });
    }

    #[test]
    fn test_update_working_group_budget_positive_forum() {
        initial_test_ext().execute_with(|| {
            assert_ok!(test_benchmark_update_working_group_budget_positive_forum::<
                Test,
            >());
        });
    }

    #[test]
    fn test_update_working_group_budget_negative_forum() {
        initial_test_ext().execute_with(|| {
            assert_ok!(test_benchmark_update_working_group_budget_negative_forum::<
                Test,
            >());
        });
    }

    #[test]
    fn test_update_working_group_budget_positive_storage() {
        initial_test_ext().execute_with(|| {
            assert_ok!(test_benchmark_update_working_group_budget_positive_storage::<Test>());
        });
    }

    #[test]
    fn test_update_working_group_budget_negative_storage() {
        initial_test_ext().execute_with(|| {
            assert_ok!(test_benchmark_update_working_group_budget_negative_storage::<Test>());
        });
    }

    #[test]
    fn test_update_working_group_budget_positive_content() {
        initial_test_ext().execute_with(|| {
            assert_ok!(test_benchmark_update_working_group_budget_positive_content::<Test>());
        });
    }

    #[test]
    fn test_update_working_group_budget_negative_content() {
        initial_test_ext().execute_with(|| {
            assert_ok!(test_benchmark_update_working_group_budget_negative_content::<Test>());
        });
    }

    #[test]
    fn test_update_working_group_budget_positive_membership() {
        initial_test_ext().execute_with(|| {
            assert_ok!(test_benchmark_update_working_group_budget_positive_membership::<Test>());
        });
    }

    #[test]
    fn test_update_working_group_budget_negative_membership() {
        initial_test_ext().execute_with(|| {
            assert_ok!(test_benchmark_update_working_group_budget_negative_membership::<Test>());
        });
    }

    #[test]
    fn test_burn_tokens() {
        initial_test_ext().execute_with(|| {
            assert_ok!(test_benchmark_burn_account_tokens::<Test>());
        });
    }
}
