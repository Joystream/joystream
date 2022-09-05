use frame_support::traits::{
    fungible::{Inspect, Mutate},
    tokens::WithdrawConsequence,
    Currency, Get,
};
use frame_support::traits::{ExistenceRequirement, Imbalance, StoredMap, WithdrawReasons};
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
// Those fees are coverable with usable and misc_frozen balance (but not fee_frozen).
// The balance is sufficient if:
// `account.free - account.fee_frozen >= amount && account.total() >= amount + existential_deposit`
pub fn has_sufficient_balance_for_fees<T: frame_system::Config + balances::Config>(
    account: &T::AccountId,
    amount: T::Balance,
) -> bool {
    if amount == Zero::zero() {
        return true;
    }

    let account_data = T::AccountStore::get(account);

    account_data.free.saturating_sub(account_data.fee_frozen) >= amount
        && account_data.free.saturating_add(account_data.reserved)
            >= amount.saturating_add(T::ExistentialDeposit::get())
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

    // Withdraw the amount from payer's account with WithdrawReasons::TRANSACTION_PAYMENT
    let withdrawn = balances::Pallet::<T>::withdraw(
        payer,
        amount,
        WithdrawReasons::TRANSACTION_PAYMENT,
        ExistenceRequirement::KeepAlive,
    )?;

    debug_assert!(
        withdrawn.peek() == amount,
        "pay_fee: Unexpected withdrawn value! Expected: {:?}, Got: {:?}.",
        amount,
        withdrawn.peek()
    );

    // If there's a reciever - deposit the funds into reciever's account
    // Note: This will be a no-op if reciever's account doesn't exist
    // and `amount < existential_deposit`!
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
