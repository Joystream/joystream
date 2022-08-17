use balances::BalanceLock;
use frame_support::{
    ensure,
    traits::{
        fungible::{Inspect, Mutate},
        tokens::WithdrawConsequence,
        Currency, Get, Imbalance, LockIdentifier, SignedImbalance,
    },
};
use sp_arithmetic::traits::{CheckedAdd, CheckedSub, Saturating};
use sp_runtime::{traits::Zero, DispatchError, DispatchResult};
use sp_std::collections::btree_set::BTreeSet;

// Describes a single cost (for example: a bloat bond) associated with an extrinsic
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Cost<Balance> {
    // Identifiers of locked balances that can be included for covering the cost
    allowed_locks: BTreeSet<LockIdentifier>,

    // Amount to be paid
    amount: Balance,
}

impl<Balance> Cost<Balance> {
    pub fn new(amount: Balance, allowed_locks: &[LockIdentifier]) -> Self {
        Self {
            amount,
            allowed_locks: allowed_locks.iter().cloned().collect(),
        }
    }
}

fn ensure_cost_can_be_covered_with<T: frame_system::Config + balances::Config>(
    cost: &Cost<T::Balance>,
    free_balance: T::Balance,
    locks: &[BalanceLock<T::Balance>],
) -> DispatchResult {
    // Balance suitable for covering given cost is equal to free_balnce
    // minus the highest lock excluding cost.allowed_locks
    let unusable_free_balance = locks
        .iter()
        .map(|lock| {
            if cost.allowed_locks.contains(&lock.id) {
                Zero::zero()
            } else {
                lock.amount
            }
        })
        .max()
        .unwrap_or_else(Zero::zero);
    let usable_funds = free_balance.saturating_sub(unusable_free_balance);

    ensure!(
        usable_funds >= cost.amount,
        DispatchError::Other("Insufficient balance to cover the cost")
    );

    Ok(())
}

// Ensure all given costs can be covered by a given account
pub fn ensure_can_cover_costs<T: frame_system::Config + balances::Config>(
    account_id: &T::AccountId,
    costs: &[Cost<T::Balance>],
) -> Result<T::Balance, DispatchError> {
    let total_cost = costs
        .iter()
        .fold(Some(T::Balance::zero()), |acc, cost| {
            acc.and_then(|a| a.checked_add(&cost.amount))
        })
        .ok_or(DispatchError::Other(
            "ensure_can_cover_costs: Unexpected overflow",
        ))?;

    let mut remaining_free_balance = balances::Pallet::<T>::free_balance(account_id);
    let locks = balances::Pallet::<T>::locks(account_id);
    let total_balance = balances::Pallet::<T>::total_balance(account_id);

    if total_cost == Zero::zero() {
        return Ok(remaining_free_balance);
    }

    ensure!(
        remaining_free_balance >= total_cost,
        "ensure_can_cover_costs: Insufficient balance"
    );

    ensure!(
        total_balance >= total_cost.saturating_add(T::ExistentialDeposit::get()),
        "ensure_can_cover_costs: Insufficient balance (KeepAlive)"
    );

    for cost in costs {
        ensure!(
            ensure_cost_can_be_covered_with::<T>(cost, remaining_free_balance, &locks).is_ok(),
            DispatchError::Other("ensure_can_cover_costs: Insufficient balance")
        );
        remaining_free_balance =
            remaining_free_balance
                .checked_sub(&cost.amount)
                .ok_or(DispatchError::Other(
                    "ensure_can_cover_costs: Unexpected underflow",
                ))?;
    }

    Ok(remaining_free_balance)
}

pub fn pay_cost<T: frame_system::Config + balances::Config>(
    payer: &T::AccountId,
    reciever: Option<&T::AccountId>,
    cost: Cost<T::Balance>,
) -> DispatchResult {
    if cost.amount == Zero::zero() {
        return Ok(());
    }

    let locks = balances::Pallet::<T>::locks(payer);
    let free_balance = balances::Pallet::<T>::free_balance(payer);
    let total_balance = balances::Pallet::<T>::total_balance(payer);

    // Ensure the cost can actually be covered by the `payer`
    ensure_cost_can_be_covered_with::<T>(&cost, free_balance, &locks)?;

    // KeepAlive check
    ensure!(
        total_balance.saturating_sub(cost.amount) >= T::ExistentialDeposit::get(),
        DispatchError::Other("pay_cost: KeepAlive violated")
    );

    // Calculate payer's new free balance
    let new_free_balance = free_balance
        .checked_sub(&cost.amount)
        .ok_or(DispatchError::Other("pay_cost: Free balance underflow"))?;

    // Set payer's new free_balance
    let withdraw_imbalance = balances::Pallet::<T>::make_free_balance_be(payer, new_free_balance);

    // Check balance update result
    // Make sure that the expected amount was withdrawn from payer's free_balance
    match withdraw_imbalance {
        SignedImbalance::Negative(negative_imbalance)
            if negative_imbalance.peek() != cost.amount =>
        {
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
        let deposit_imbalance = balances::Pallet::<T>::deposit_creating(reciever, cost.amount);

        // Check deposit result
        ensure!(
            deposit_imbalance.peek() == cost.amount,
            DispatchError::Other("pay_cost: Unexpected deposit imbalance")
        );
    }

    Ok(())
}

pub fn has_sufficient_usable_balance_and_stays_alive<T: frame_system::Config + balances::Config>(
    account: &T::AccountId,
    amount: T::Balance,
) -> bool {
    balances::Pallet::<T>::can_withdraw(account, amount) == WithdrawConsequence::Success
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
