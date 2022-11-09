#![cfg(feature = "runtime-benchmarks")]

use super::*;
use frame_benchmarking::{account, benchmarks};
use frame_system::Pallet as System;
use frame_system::{EventRecord, RawOrigin};
use sp_runtime::traits::One;
use sp_std::convert::TryInto;
use sp_std::vec;

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

const MAX_KILOBYTES_METADATA: u32 = 100;

benchmarks! {

    execute_signal_proposal {
        let i in 1 .. MAX_KILOBYTES_METADATA;
        let signal = vec![0u8; (i * 1000).try_into().unwrap()];
    }: _(RawOrigin::Root, signal.clone())
    verify {
        assert_last_event::<T>(RawEvent::Signaled(signal).into());
    }

    update_working_group_budget_positive {
        set_wg_and_council_budget::<T>(100, WorkingGroup::Forum); // All groups are similar
    }: update_working_group_budget(
        RawOrigin::Root,
        WorkingGroup::Forum,
        One::one(),
        BalanceKind::Positive
    )
    verify {
        assert_new_budgets::<T>(99, 101, WorkingGroup::Forum, 1, BalanceKind::Positive);
    }

    update_working_group_budget_negative {
        set_wg_and_council_budget::<T>(100, WorkingGroup::Forum); // All groups are similar
    }: update_working_group_budget(
        RawOrigin::Root,
        WorkingGroup::Forum,
        One::one(),
        BalanceKind::Negative
    )
    verify{
        assert_new_budgets::<T>(101, 99, WorkingGroup::Forum, 1, BalanceKind::Negative);
    }

    burn_account_tokens {
        let account_id = account::<T::AccountId>("caller", 0, 0);
        let initial_issuance = Balances::<T>::total_issuance();
        let initial_balance: BalanceOf<T> = <T as balances::Config>::ExistentialDeposit::get() + 100_000_000u32.into(); // should be larger than existential deposit

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
    use crate::tests::mocks::{initial_test_ext, Test};
    use frame_support::assert_ok;
    type Utility = crate::Module<Test>;

    #[test]
    fn test_execute_signal_proposal() {
        initial_test_ext().execute_with(|| {
            assert_ok!(Utility::test_benchmark_execute_signal_proposal());
        });
    }

    #[test]
    fn test_update_working_group_budget_positive() {
        initial_test_ext().execute_with(|| {
            assert_ok!(Utility::test_benchmark_update_working_group_budget_positive());
        });
    }

    #[test]
    fn test_update_working_group_budget_negative() {
        initial_test_ext().execute_with(|| {
            assert_ok!(Utility::test_benchmark_update_working_group_budget_negative());
        });
    }

    #[test]
    fn test_burn_tokens() {
        initial_test_ext().execute_with(|| {
            assert_ok!(Utility::test_benchmark_burn_account_tokens());
        });
    }
}
