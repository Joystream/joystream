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
    /// Try to freeze specified amount
    pub(crate) fn try_freeze(&mut self, amount: T::Balance) -> DispatchResult {
        ensure!(
            self.free_balance >= amount,
            crate::Error::<T>::InsufficientFreeBalanceForFreezing,
        );
        self.freeze(amount);
        Ok(())
    }

    /// Try to freeze specified amount
    pub(crate) fn try_unfreeze(&mut self, amount: T::Balance) -> DispatchResult {
        ensure!(
            self.frozen_balance >= amount,
            crate::Error::<T>::InsufficientFrozenBalance
        );
        self.unfreeze(amount);
        Ok(())
    }

    /// freeze specified amount: unfallible
    pub(crate) fn freeze(&mut self, amount: T::Balance) {
        self.free_balance = self.free_balance.saturating_sub(amount);
        self.frozen_balance = self.frozen_balance.saturating_add(amount);
    }

    /// freeze specified amount: unfallible
    pub(crate) fn unfreeze(&mut self, amount: T::Balance) {
        self.free_balance = self.free_balance.saturating_add(amount);
        self.frozen_balance = self.frozen_balance.saturating_sub(amount);
    }

    /// Retrieve free balance amount
    pub fn free_balance(&self) -> T::Balance {
        self.free_balance
    }

    /// Retrieve frozen balance amount    
    pub fn frozen_balance(&self) -> T::Balance {
        self.frozen_balance
    }

    /// Add amount to free balance : unfallible
    pub fn add_to_free_balance(&mut self, amount: T::Balance) {
        self.free_balance = self.free_balance.saturating_add(amount);
    }
}
