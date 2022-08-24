use crate::locks::InvitedMemberLockId;
use frame_support::traits::StoredMap;
use frame_support::traits::{
    fungible::{Inspect, Mutate},
    tokens::WithdrawConsequence,
    Currency, Get,
};
use sp_arithmetic::traits::Saturating;
use sp_runtime::{traits::Zero, DispatchError};

// Check whether an account has sufficinet balance to exchange JOY for some kind of an asset,
// for example: an nft, a membership, creator tokens, a channel that's being transferred...
// This does not apply to any costs that are considered fees for network's processing or storage
// resources (like bloat bonds or data size fee)
// The balance is sufficient if `usable_balance(account) >= amount + existential_deposit`
pub fn has_sufficient_balance_for_payment<T: frame_system::Config + balances::Config>(
    account: &T::AccountId,
    amount: T::Balance,
) -> bool {
    balances::Pallet::<T>::can_withdraw(account, amount) == WithdrawConsequence::Success
}

// Check whether an account has sufficient balance to cover fees related to transaction processing
// or storage costs. For example: bloat bonds, data size fee.
// Those fees are coverable with invitation-locked balance.
// The balance is sufficient if:
// `free_balance(account) - greatest_value_lock_excluding_invitation_lock >= amount + existential_deposit`
pub fn has_sufficient_balance_for_fees<T: frame_system::Config + balances::Config>(
    account: &T::AccountId,
    amount: T::Balance,
) -> bool {
    if amount == Zero::zero() {
        return true;
    }

    let locks = balances::Pallet::<T>::locks(account);
    let free_balance = balances::Pallet::<T>::free_balance(account);
    let total_balance = balances::Pallet::<T>::total_balance(account);

    // Balance suitable for covering fees is equal to free_balnce
    // minus the highest lock excluding the invitation lock
    let unusable_free_balance = locks
        .iter()
        .map(|lock| {
            if lock.id == InvitedMemberLockId::get() {
                Zero::zero()
            } else {
                lock.amount
            }
        })
        .max()
        .unwrap_or_else(Zero::zero);
    let usable_funds = free_balance.saturating_sub(unusable_free_balance);

    usable_funds >= amount && total_balance >= amount.saturating_add(T::ExistentialDeposit::get())
}

// Pay a certain fee associated with a transaction (for example: a bloat bond, data size fee).
// Fees are assumed to be payable w/ invitation-locked balance.
// This call should be preceded with `ensure!(has_sufficient_balance_for_fees(account))`
// Returns the amount that was covered from the invitation-locked balance (between 0 and `amount`).
pub fn pay_fee<T: frame_system::Config + balances::Config>(
    payer: &T::AccountId,
    reciever: Option<&T::AccountId>,
    amount: T::Balance,
) -> Result<T::Balance, DispatchError> {
    if amount == Zero::zero() {
        return Ok(Zero::zero());
    }

    let account_data = T::AccountStore::get(payer);
    let usable_balance = balances::Pallet::<T>::usable_balance(payer);

    debug_assert!(
        has_sufficient_balance_for_fees::<T>(payer, amount),
        "pay_fee: Insufficient balance!\nAccount data: {:?}\nAmount: {:?}",
        account_data,
        amount
    );

    // Get the amount of locked balance that will be consumed
    let locked_balance_consumed = amount.saturating_sub(usable_balance);

    // Slash the amount from payer's account
    let (_, not_slashed) = <balances::Pallet<T> as Currency<T::AccountId>>::slash(payer, amount);

    debug_assert!(
        not_slashed == Zero::zero(),
        "pay_fee: Unexpected value of not_slashed: {:?}",
        not_slashed
    );

    // If there's a reciever - deposit the funds into reciever's account
    if let Some(reciever) = reciever {
        let _ = balances::Pallet::<T>::deposit_creating(reciever, amount);
    }

    Ok(locked_balance_consumed)
}

// Burn funds from account's usable balance, possibly causing the account to be reaped.
// Returns actually burned amount (possibly increased due to dusting)
pub fn burn_from_usable<T: frame_system::Config + balances::Config>(
    account: &T::AccountId,
    amount: T::Balance,
) -> Result<T::Balance, DispatchError> {
    balances::Pallet::<T>::burn_from(account, amount)
}
