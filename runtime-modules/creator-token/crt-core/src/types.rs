use codec::{Decode, Encode};
use frame_support::{dispatch::DispatchResult, ensure};
use sp_arithmetic::traits::Saturating;

#[derive(Encode, Decode, Clone, PartialEq, Eq, Default)]
pub(crate) struct AccountData<T: crate::Trait> {
    /// Non-reserved part of the balance. There may still be restrictions on this, but it is the
    /// total pool what may in principle be transferred, reserved and used for tipping.
    free_balance: T::Balance,

    /// This balance is a 'reserve' balance that other subsystems use in order to set aside tokens
    /// that are still 'owned' by the account holder, but which are not usable in any case.
    frozen_balance: T::Balance,
}

/// Interface for interacting with AccountData
impl<T: crate::Trait> AccountData<T> {
    pub fn freeze(&mut self, amount: T::Balance) -> DispatchResult {
        ensure!(
            self.free_balance >= amount,
            crate::Error::<T>::InsufficientFreeBalanceForFreezing
        );
        self.free_balance = self.free_balance.saturating_sub(amount);
        self.frozen_balance = self.frozen_balance.saturating_add(amount);
        Ok(())
    }

    pub fn unfreeze(&mut self, amount: T::Balance) -> DispatchResult {
        ensure!(
            self.frozen_balance >= amount,
            crate::Error::<T>::InsufficientFrozenBalance
        );
        self.free_balance = self.free_balance.saturating_add(amount);
        self.frozen_balance = self.frozen_balance.saturating_sub(amount);
        Ok(())
    }

    pub fn free_balance(&self) -> T::Balance {
        self.free_balance
    }

    pub fn frozen_balance(&self) -> T::Balance {
        self.frozen_balance
    }
}
