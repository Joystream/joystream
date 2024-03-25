//! Staking handler module.
//! Contains StakingHandler trait and its implementation - StakingManager.
//! StakingHandler is responsible for staking logic in the Joystream runtime:
//! https://joystream.gitbook.io/joystream-handbook/key-concepts/stakingmock.rs

// Ensure we're `no_std` when compiling for Wasm.
#![cfg_attr(not(feature = "std"), no_std)]
#![cfg_attr(
    not(any(test, feature = "runtime-benchmarks")),
    deny(clippy::panic),
    deny(clippy::panic_in_result_fn),
    deny(clippy::unwrap_used),
    deny(clippy::expect_used),
    deny(clippy::indexing_slicing),
    deny(clippy::integer_arithmetic),
    deny(clippy::match_on_vec_items),
    deny(clippy::unreachable)
)]

#[cfg(not(any(test, feature = "runtime-benchmarks")))]
#[allow(unused_imports)]
#[macro_use]
extern crate common;

use frame_support::dispatch::{DispatchError, DispatchResult};
use frame_support::ensure;
use frame_support::traits::{Currency, Get, LockIdentifier, LockableCurrency, WithdrawReasons};
use sp_arithmetic::traits::Zero;
use sp_std::marker::PhantomData;
use sp_std::vec::Vec;

#[cfg(test)]
mod mock;
#[cfg(test)]
mod test;

/// Config for (dis)allowing certain stake locks combinations.
pub trait LockComparator<Balance> {
    /// Checks if stake lock that is about to be used is conflicting with existing locks.
    fn are_locks_conflicting(new_lock: &LockIdentifier, existing_locks: &[LockIdentifier]) -> bool;
}

/// Defines abstract staking handler to manage user stakes for different activities
/// like adding a proposal. Implementation should use built-in LockableCurrency
/// and LockIdentifier to lock balance consistently with pallet_staking.
pub trait StakingHandler<AccountId, Balance, MemberId, LockIdentifier> {
    /// Locks the specified balance on the account using specific lock identifier.
    /// It locks for all withdraw reasons.
    fn lock(account_id: &AccountId, amount: Balance);

    /// Locks the specified balance on the account using specific lock identifier.
    fn lock_with_reasons(account_id: &AccountId, amount: Balance, reasons: WithdrawReasons);

    /// Removes the specified lock on the account.
    fn unlock(account_id: &AccountId);

    /// Slash the specified balance on the account using specific lock identifier.
    /// No limits, no actions on zero stake.
    /// If slashing balance greater than the existing stake - stake is slashed to zero.
    /// Returns actually slashed balance.
    fn slash(account_id: &AccountId, amount: Option<Balance>) -> Balance;

    /// Sets the new stake to a given amount.
    fn set_stake(account_id: &AccountId, new_stake: Balance) -> DispatchResult;

    /// Verifies that there no conflicting stakes on the staking account.
    fn is_account_free_of_conflicting_stakes(account_id: &AccountId) -> bool;

    /// Verifies that staking account balance is sufficient for staking.
    /// During the balance check we should consider already locked stake. Effective balance to check
    /// is 'already locked funds' + 'usable funds'.
    fn is_enough_balance_for_stake(account_id: &AccountId, amount: Balance) -> bool;

    /// Returns lock identifier
    fn lock_id() -> LockIdentifier;

    /// Returns the current stake on the account.
    fn current_stake(account_id: &AccountId) -> Balance;
}

/// Implementation of the StakingHandler.
pub struct StakingManager<
    T: frame_system::Config
        + pallet_balances::Config
        + common::membership::MembershipTypes
        + LockComparator<<T as pallet_balances::Config>::Balance>,
    LockId: Get<LockIdentifier>,
> {
    trait_marker: PhantomData<T>,
    lock_id_marker: PhantomData<LockId>,
}

impl<
        T: frame_system::Config
            + pallet_balances::Config
            + common::membership::MembershipTypes
            + LockComparator<<T as pallet_balances::Config>::Balance>,
        LockId: Get<LockIdentifier>,
    >
    StakingHandler<
        <T as frame_system::Config>::AccountId,
        <T as pallet_balances::Config>::Balance,
        <T as common::membership::MembershipTypes>::MemberId,
        LockIdentifier,
    > for StakingManager<T, LockId>
{
    fn lock(
        account_id: &<T as frame_system::Config>::AccountId,
        amount: <T as pallet_balances::Config>::Balance,
    ) {
        Self::lock_with_reasons(account_id, amount, WithdrawReasons::all())
    }

    fn lock_with_reasons(
        account_id: &<T as frame_system::Config>::AccountId,
        amount: <T as pallet_balances::Config>::Balance,
        reasons: WithdrawReasons,
    ) {
        <pallet_balances::Pallet<T>>::set_lock(LockId::get(), account_id, amount, reasons)
    }

    fn unlock(account_id: &<T as frame_system::Config>::AccountId) {
        <pallet_balances::Pallet<T>>::remove_lock(LockId::get(), account_id);
    }

    fn slash(
        account_id: &<T as frame_system::Config>::AccountId,
        amount: Option<<T as pallet_balances::Config>::Balance>,
    ) -> <T as pallet_balances::Config>::Balance {
        let locks = pallet_balances::Pallet::<T>::locks(account_id);

        let existing_lock = locks.iter().find(|lock| lock.id == LockId::get());

        let mut actually_slashed_balance = Default::default();
        if let Some(existing_lock) = existing_lock {
            Self::unlock(account_id);

            let mut slashable_amount = existing_lock.amount;
            if let Some(amount) = amount {
                if existing_lock.amount > amount {
                    let new_amount = existing_lock.amount - amount;
                    Self::lock(account_id, new_amount);

                    slashable_amount = amount;
                }
            }

            let _ = pallet_balances::Pallet::<T>::slash(account_id, slashable_amount);

            actually_slashed_balance = slashable_amount
        }

        actually_slashed_balance
    }

    fn set_stake(
        account_id: &<T as frame_system::Config>::AccountId,
        new_stake: <T as pallet_balances::Config>::Balance,
    ) -> DispatchResult {
        let current_stake = Self::current_stake(account_id);

        // setting zero stake?
        if new_stake == Zero::zero() {
            // unlock stake if any
            if current_stake > Zero::zero() {
                Self::unlock(account_id);
            }

            return Ok(());
        }

        ensure!(
            Self::is_enough_balance_for_stake(account_id, new_stake),
            DispatchError::Other("Not enough balance for a new stake.")
        );

        Self::lock(account_id, new_stake);

        Ok(())
    }

    fn is_account_free_of_conflicting_stakes(account_id: &T::AccountId) -> bool {
        let locks = <pallet_balances::Pallet<T>>::locks(account_id);
        let lock_ids: Vec<LockIdentifier> =
            locks.iter().map(|balance_lock| balance_lock.id).collect();

        !T::are_locks_conflicting(&LockId::get(), lock_ids.as_slice())
    }

    fn is_enough_balance_for_stake(
        account_id: &<T as frame_system::Config>::AccountId,
        amount: <T as pallet_balances::Config>::Balance,
    ) -> bool {
        <pallet_balances::Pallet<T>>::free_balance(account_id) >= amount
    }

    fn lock_id() -> LockIdentifier {
        LockId::get()
    }

    fn current_stake(
        account_id: &<T as frame_system::Config>::AccountId,
    ) -> <T as pallet_balances::Config>::Balance {
        let locks = <pallet_balances::Pallet<T>>::locks(account_id);

        let existing_lock = locks.iter().find(|lock| lock.id == LockId::get());

        existing_lock.map_or(Zero::zero(), |lock| lock.amount)
    }
}
