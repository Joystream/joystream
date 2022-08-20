use crate::locks::InvitedMemberLockId;
use frame_support::{
    ensure,
    traits::{
        fungible::{Inspect, Mutate},
        tokens::WithdrawConsequence,
        Currency, Get, Imbalance, SignedImbalance,
    },
};
use sp_arithmetic::traits::{CheckedSub, Saturating};
use sp_runtime::{traits::Zero, DispatchError, DispatchResult};

pub fn has_sufficient_balance_for_payment<T: frame_system::Config + balances::Config>(
    account: &T::AccountId,
    amount: T::Balance,
) -> bool {
    balances::Pallet::<T>::can_withdraw(account, amount) == WithdrawConsequence::Success
}

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

pub fn pay_fee<T: frame_system::Config + balances::Config>(
    payer: &T::AccountId,
    reciever: Option<&T::AccountId>,
    amount: T::Balance,
) -> DispatchResult {
    if amount == Zero::zero() {
        return Ok(());
    }

    let free_balance = balances::Pallet::<T>::free_balance(payer);

    ensure!(
        has_sufficient_balance_for_fees::<T>(payer, amount),
        DispatchError::Other("pay_fee: Insufficient balance")
    );

    // Calculate payer's new free balance
    let new_free_balance = free_balance
        .checked_sub(&amount)
        .ok_or(DispatchError::Other("pay_fee: Free balance underflow"))?;

    // Set payer's new free_balance
    let withdraw_imbalance = balances::Pallet::<T>::make_free_balance_be(payer, new_free_balance);

    // Check balance update result
    // Make sure that the expected amount was withdrawn from payer's free_balance
    match withdraw_imbalance {
        SignedImbalance::Negative(negative_imbalance) if negative_imbalance.peek() != amount => {
            Err(DispatchError::Other(
                "pay_cost: Unexpected withdrawal imbalance - Amount does not match cost.amount",
            ))
        }
        SignedImbalance::Positive(_) => Err(DispatchError::Other(
            "pay_cost: Unexpected withdrawal imbalance - Positive",
        )),
        _ => Ok(()),
    }?;

    if let Some(reciever) = reciever {
        // Deposit funds into reciever's account
        let deposit_imbalance = balances::Pallet::<T>::deposit_creating(reciever, amount);

        // Check deposit result
        ensure!(
            deposit_imbalance.peek() == amount,
            DispatchError::Other("pay_cost: Unexpected deposit imbalance")
        );
    }

    Ok(())
}

pub fn burn_from_usable<T: frame_system::Config + balances::Config>(
    account: &T::AccountId,
    amount: T::Balance,
    allow_death: bool,
) -> DispatchResult {
    let burned = balances::Pallet::<T>::burn_from(account, amount)?;

    ensure!(
        allow_death
            || balances::Pallet::<T>::total_balance(account) >= T::ExistentialDeposit::get(),
        DispatchError::Other("burn_from_usable: Keep alive")
    );

    ensure!(
        burned == amount
            || (allow_death
                && burned > amount
                && burned <= amount.saturating_add(T::ExistentialDeposit::get())),
        DispatchError::Other("burn_from_usable: Unexpected burned amount")
    );

    Ok(())
}
