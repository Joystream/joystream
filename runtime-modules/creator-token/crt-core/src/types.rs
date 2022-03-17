use codec::{Decode, Encode};
use frame_support::{dispatch::DispatchResult, ensure};
use sp_arithmetic::traits::Saturating;
use sp_runtime::traits::Hash;

#[derive(Encode, Decode, Clone, PartialEq, Eq, Default)]
pub struct AccountData<Balance> {
    /// Non-reserved part of the balance. There may still be restrictions
    /// on this, but it is the total pool what may in principle be
    /// transferred, reserved and used for tipping.
    free_balance: Balance,

    /// This balance is a 'reserve' balance that other subsystems use
    /// in order to set aside tokens that are still 'owned' by the
    /// account holder, but which are not usable in any case.
    frozen_balance: Balance,
}

#[derive(Encode, Decode, Clone, PartialEq, Eq, Default)]
pub struct TokenData<Balance, Hash> {
    /// Current token issuanc
    current_total_issuance: Balance,

    /// Max total issuance allowed for the token
    max_total_issuance: Balance,

    /// Hash of a human-readable description
    description: Hash,

    /// Hash of a human-readable Ticker
    ticker: Hash,
}

/// Interface for interacting with AccountData
impl<Balance: Copy + PartialOrd + Saturating> AccountData<Balance> {
    /// Retrieve free balance amount
    pub(crate) fn free_balance(&self) -> Balance {
        self.free_balance
    }

    /// Retrieve frozen balance amount
    pub(crate) fn frozen_balance(&self) -> Balance {
        self.frozen_balance
    }

    /// check wheather `self.freeze(amount)` is possible to execute
    pub(crate) fn can_freeze<T: crate::Trait>(&mut self, amount: Balance) -> DispatchResult {
        ensure!(
            self.free_balance >= amount,
            crate::Error::<T>::InsufficientFreeBalanceForFreezing,
        );
        Ok(())
    }

    /// freeze specified amount: unfallible
    pub(crate) fn freeze(&mut self, amount: Balance) {
        self.free_balance = self.free_balance.saturating_sub(amount);
        self.frozen_balance = self.frozen_balance.saturating_add(amount);
    }

    /// check wheather `self.unfreeze(amount)` is possible to execute
    pub(crate) fn can_unfreeze<T: crate::Trait>(&mut self, amount: Balance) -> DispatchResult {
        ensure!(
            self.frozen_balance >= amount,
            crate::Error::<T>::InsufficientFrozenBalance
        );
        Ok(())
    }

    /// freeze specified amount: unfallible
    pub(crate) fn unfreeze(&mut self, amount: Balance) {
        self.free_balance = self.free_balance.saturating_add(amount);
        self.frozen_balance = self.frozen_balance.saturating_sub(amount);
    }

    /// Add amount to free balance : unfallible
    pub(crate) fn deposit(&mut self, amount: Balance) {
        self.free_balance = self.free_balance.saturating_add(amount);
    }

    /// check wheather `self.slash(amount)` is possible to execute    
    pub(crate) fn can_slash<T: crate::Trait>(&mut self, amount: Balance) -> DispatchResult {
        ensure!(
            self.free_balance >= amount,
            crate::Error::<T>::InsufficientFreeBalanceForSlashing
        );
        Ok(())
    }

    /// Slash amount from free balance : unfallible
    pub(crate) fn slash(&mut self, amount: Balance) {
        self.free_balance = self.free_balance.saturating_sub(amount);
    }
}

// Aliases
/// Alias for Account Data
pub(crate) type AccountDataOf<T> = AccountData<<T as crate::Trait>::Balance>;

/// Alias for Token Data
pub(crate) type TokenDataOf<T> =
    TokenData<<T as crate::Trait>::Balance, <T as frame_system::Trait>::Hash>;
