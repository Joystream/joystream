use codec::{Decode, Encode};
use frame_support::{dispatch::DispatchResult, ensure};
use sp_arithmetic::traits::{Saturating, Zero};
use sp_runtime::traits::Hash;

#[derive(Encode, Decode, Clone, PartialEq, Eq)]
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
#[derive(Encode, Decode, Clone, PartialEq, Eq)]
pub enum MaxTotalIssuance<Balance> {
    Unlimited,
    Limited(Balance),
}

impl<Balance> Default for MaxTotalIssuance<Balance> {
    fn default() -> Self {
        MaxTotalIssuance::<Balance>::Unlimited
    }
}

#[derive(Encode, Decode, Clone, PartialEq, Eq, Default)]
pub struct TokenData<Balance, Hash> {
    /// Current token issuanc
    current_total_issuance: Balance,

    /// Max total issuance allowed for the token
    max_total_issuance: MaxTotalIssuance<Balance>,

    /// Hash of a human-readable description
    description: Hash,
}

/// Default trait for AccountData
impl<Balance: Zero> Default for AccountData<Balance> {
    fn default() -> Self {
        Self {
            free_balance: Balance::zero(),
            frozen_balance: Balance::zero(),
        }
    }
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

    /// checks whether free balance has enough amount to freeze
    pub(crate) fn can_freeze<T: crate::Trait>(&self, amount: Balance) -> DispatchResult {
        ensure!(
            self.free_balance >= amount,
            crate::Error::<T>::InsufficientFreeBalanceForFreezing,
        );
        Ok(())
    }

    /// freeze specified amount: infallible
    pub(crate) fn freeze(&mut self, amount: Balance) {
        self.free_balance = self.free_balance.saturating_sub(amount);
        self.frozen_balance = self.frozen_balance.saturating_add(amount);
    }

    /// checks whether account has enough frozen balance to unfreeze
    pub(crate) fn can_unfreeze<T: crate::Trait>(&self, amount: Balance) -> DispatchResult {
        ensure!(
            self.frozen_balance >= amount,
            crate::Error::<T>::InsufficientFrozenBalance
        );
        Ok(())
    }

    /// freeze specified amount: infallible
    pub(crate) fn unfreeze(&mut self, amount: Balance) {
        self.free_balance = self.free_balance.saturating_add(amount);
        self.frozen_balance = self.frozen_balance.saturating_sub(amount);
    }

    /// Add amount to free balance : infallible
    pub(crate) fn deposit(&mut self, amount: Balance) {
        self.free_balance = self.free_balance.saturating_add(amount);
    }

    /// checks whether account has enough free balance to slash
    pub(crate) fn can_slash<T: crate::Trait>(&self, amount: Balance) -> DispatchResult {
        ensure!(
            self.free_balance >= amount,
            crate::Error::<T>::InsufficientFreeBalanceForSlashing
        );
        Ok(())
    }

    /// Slash amount from free balance : infallible
    pub(crate) fn slash(&mut self, amount: Balance) {
        self.free_balance = self.free_balance.saturating_sub(amount);
    }
}

/// Interface for interacting with TokenData
impl<Balance: Copy + PartialOrd + Saturating, Hash: Copy> TokenData<Balance, Hash> {
    /// Get the treasury account for the token
    pub(crate) fn treasury_account(&self) -> Balance {
        self.current_total_issuance
    }

    /// Get current total issuance for the token
    pub(crate) fn current_issuance(&self) -> Balance {
        self.current_total_issuance
    }

    /// checks whether token issuance can be increased by amount
    pub(crate) fn can_increase_issuance<T: crate::Trait>(&self, amount: Balance) -> DispatchResult {
        match self.max_total_issuance {
            MaxTotalIssuance::<Balance>::Unlimited => (),
            MaxTotalIssuance::<Balance>::Limited(max_issuance) => {
                let attempted_issuance_value = self.current_total_issuance.saturating_add(amount);
                ensure!(
                    attempted_issuance_value <= max_issuance,
                    crate::Error::<T>::CannotExceedMaxIssuanceValue
                );
            }
        }
        Ok(())
    }

    /// Incrase current token issuance: infallible
    pub(crate) fn increase_issuance(&mut self, amount: Balance) {
        self.current_total_issuance = self.current_total_issuance.saturating_add(amount);
    }

    /// checks whether token issuance can be decreased by amount
    pub(crate) fn can_decrease_issuance<T: crate::Trait>(&self, amount: Balance) -> DispatchResult {
        ensure!(
            self.current_total_issuance >= amount,
            crate::Error::<T>::InsufficientIssuanceToDecreaseByAmount
        );
        Ok(())
    }

    /// decrease total issuance: infallible
    pub(crate) fn decrease_issuance(&mut self, amount: Balance) {
        self.current_total_issuance = self.current_total_issuance.saturating_sub(amount);
    }
}

// Aliases
/// Alias for Account Data
pub(crate) type AccountDataOf<T> = AccountData<<T as crate::Trait>::Balance>;

/// Alias for Token Data
pub(crate) type TokenDataOf<T> =
    TokenData<<T as crate::Trait>::Balance, <T as frame_system::Trait>::Hash>;
