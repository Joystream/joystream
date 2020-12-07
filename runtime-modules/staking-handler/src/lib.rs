//! Staking handler module.
//! Contains StakingHandler trait and its implementation - StakingManager.
//! StakingHandler is responsible for staking logic in the Joystream runtime:
//! https://joystream.gitbook.io/joystream-handbook/key-concepts/stakingmock.rs

// Ensure we're `no_std` when compiling for Wasm.
#![cfg_attr(not(feature = "std"), no_std)]

use frame_support::dispatch::{DispatchError, DispatchResult};
use frame_support::traits::{Currency, Get, LockIdentifier, LockableCurrency, WithdrawReasons};
use sp_arithmetic::traits::Zero;
use sp_std::marker::PhantomData;

#[cfg(test)]
mod mock;
#[cfg(test)]
mod test;

/// Type alias for member id.
pub type MemberId<T> = <T as membership::Trait>::MemberId;

/// Balance alias for `balances` module.
pub type BalanceOf<T> = <T as pallet_balances::Trait>::Balance;

/// Defines abstract staking handler to manage user stakes for different activities
/// like adding a proposal. Implementation should use built-in LockableCurrency
/// and LockIdentifier to lock balance consistently with pallet_staking.
pub trait StakingHandler<T: frame_system::Trait + membership::Trait + pallet_balances::Trait> {
    /// Locks the specified balance on the account using specific lock identifier.
    fn lock(account_id: &T::AccountId, amount: BalanceOf<T>);

    /// Removes the specified lock on the account.
    fn unlock(account_id: &T::AccountId);

    /// Slash the specified balance on the account using specific lock identifier.
    /// No limits, no actions on zero stake.
    /// If slashing balance greater than the existing stake - stake is slashed to zero.
    /// Returns actually slashed balance.
    fn slash(account_id: &T::AccountId, amount: Option<BalanceOf<T>>) -> BalanceOf<T>;

    /// Sets the new stake to a given amount.
    fn set_stake(account_id: &T::AccountId, new_stake: BalanceOf<T>) -> DispatchResult;

    /// Verifies that staking account bound to the member.
    fn is_member_staking_account(member_id: &MemberId<T>, account_id: &T::AccountId) -> bool;

    /// Verifies that there no conflicting stakes on the staking account.
    fn is_account_free_of_conflicting_stakes(account_id: &T::AccountId) -> bool;

    /// Verifies that staking account balance is sufficient for staking.
    /// During the balance check we should consider already locked stake. Effective balance to check
    /// is 'already locked funds' + 'usable funds'.
    fn is_enough_balance_for_stake(account_id: &T::AccountId, amount: BalanceOf<T>) -> bool;

    /// Returns the current stake on the account.
    fn current_stake(account_id: &T::AccountId) -> BalanceOf<T>;
}

/// Implementation of the StakingHandler.
pub struct StakingManager<
    T: frame_system::Trait + membership::Trait + pallet_balances::Trait,
    LockId: Get<LockIdentifier>,
> {
    trait_marker: PhantomData<T>,
    lock_id_marker: PhantomData<LockId>,
}

impl<
        T: frame_system::Trait + membership::Trait + pallet_balances::Trait,
        LockId: Get<LockIdentifier>,
    > StakingHandler<T> for StakingManager<T, LockId>
{
    fn lock(account_id: &T::AccountId, amount: BalanceOf<T>) {
        <pallet_balances::Module<T>>::set_lock(
            LockId::get(),
            &account_id,
            amount,
            WithdrawReasons::all(),
        )
    }

    fn unlock(account_id: &T::AccountId) {
        <pallet_balances::Module<T>>::remove_lock(LockId::get(), &account_id);
    }

    fn slash(account_id: &T::AccountId, amount: Option<BalanceOf<T>>) -> BalanceOf<T> {
        let locks = <pallet_balances::Module<T>>::locks(&account_id);

        let existing_lock = locks.iter().find(|lock| lock.id == LockId::get());

        let mut actually_slashed_balance = Default::default();
        if let Some(existing_lock) = existing_lock {
            Self::unlock(&account_id);

            let mut slashable_amount = existing_lock.amount;
            if let Some(amount) = amount {
                if existing_lock.amount > amount {
                    let new_amount = existing_lock.amount - amount;
                    Self::lock(&account_id, new_amount);

                    slashable_amount = amount;
                }
            }

            let _ = <pallet_balances::Module<T>>::slash(&account_id, slashable_amount);

            actually_slashed_balance = slashable_amount
        }

        actually_slashed_balance
    }

    fn set_stake(account_id: &T::AccountId, new_stake: BalanceOf<T>) -> DispatchResult {
        let current_stake = Self::current_stake(account_id);

        //Unlock previous stake if its not zero.
        if current_stake > Zero::zero() {
            Self::unlock(account_id);
        }

        if !Self::is_enough_balance_for_stake(account_id, new_stake) {
            //Restore previous stake if its not zero.
            if current_stake > Zero::zero() {
                Self::lock(account_id, current_stake);
            }
            return Err(DispatchError::Other("Not enough balance for a new stake."));
        }

        Self::lock(account_id, new_stake);

        Ok(())
    }

    // Membership support for staking accounts required.
    fn is_member_staking_account(_member_id: &MemberId<T>, _account_id: &T::AccountId) -> bool {
        true
    }

    fn is_account_free_of_conflicting_stakes(account_id: &T::AccountId) -> bool {
        let locks = <pallet_balances::Module<T>>::locks(&account_id);

        let existing_lock = locks.iter().find(|lock| lock.id == LockId::get());

        existing_lock.is_none()
    }

    fn is_enough_balance_for_stake(account_id: &T::AccountId, amount: BalanceOf<T>) -> bool {
        <pallet_balances::Module<T>>::usable_balance(account_id) >= amount
    }

    fn current_stake(account_id: &T::AccountId) -> BalanceOf<T> {
        let locks = <pallet_balances::Module<T>>::locks(&account_id);

        let existing_lock = locks.iter().find(|lock| lock.id == LockId::get());

        existing_lock.map_or(Zero::zero(), |lock| lock.amount)
    }
}
