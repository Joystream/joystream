use codec::{Decode, Encode};
use frame_support::{
    dispatch::{DispatchError, DispatchResult},
    ensure,
};
use sp_arithmetic::traits::{Saturating, Zero};

#[derive(Encode, Decode, Clone, PartialEq, Eq)]
pub struct AccountData<Balance> {
    /// Non-reserved part of the balance. There may still be restrictions
    /// on this, but it is the total pool what may in principle be
    /// transferred, reserved and used for tipping.
    free_balance: Balance,

    /// This balance is a 'reserve' balance that other subsystems use
    /// in order to set aside tokens that are still 'owned' by the
    /// account holder, but which are not usable in any case.
    reserved_balance: Balance,
}

#[derive(Encode, Decode, Clone, PartialEq, Eq, Default)]
pub struct TokenData<Balance, AccountId> {
    /// Current token issuance
    current_total_issuance: Balance,

    /// Existential deposit allowed for the token
    existential_deposit: Balance,

    /// Initial issuance state
    issuance_state: IssuanceState,

    /// Account for the token owner
    owner_account: AccountId,
}

/// The possible issuance variants: This is a stub
#[derive(Encode, Decode, Clone, PartialEq, Eq)]
enum IssuanceState {
    /// Initial idle state
    Idle,

    /// Initial state sale (this has to be defined)
    Sale,

    /// state for IBCO, it might get decorated with the JOY reserve
    /// amount for the token
    BondingCurve,
}

/// Builder for the token data struct
#[derive(Encode, Decode, Clone, PartialEq, Eq, Default)]
pub struct TokenIssuanceParameters<Balance, AccountId> {
    /// Initial issuance
    initial_issuance: Balance,

    /// Token account for the token itself
    owner_account: AccountId,

    /// Initial State builder: stub
    initial_state: IssuanceState,

    /// Initial existential deposit
    existential_deposit: Balance,
}

/// Default trait for Issuance state
impl Default for IssuanceState {
    fn default() -> Self {
        IssuanceState::Idle
    }
}

/// Default trait for AccountData
impl<Balance: Zero> Default for AccountData<Balance> {
    fn default() -> Self {
        Self {
            free_balance: Balance::zero(),
            reserved_balance: Balance::zero(),
        }
    }
}

/// Interface for interacting with AccountData
impl<Balance: Copy + PartialOrd + Saturating + Zero> AccountData<Balance> {
    /// Retrieve free balance amount
    pub(crate) fn free_balance(&self) -> Balance {
        self.free_balance
    }

    /// Retrieve reserved balance amount
    pub(crate) fn reserved_balance(&self) -> Balance {
        self.reserved_balance
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
        self.reserved_balance = self.reserved_balance.saturating_add(amount);
    }

    /// checks whether account has enough reserved balance to unfreeze
    pub(crate) fn can_unfreeze<T: crate::Trait>(&self, amount: Balance) -> DispatchResult {
        ensure!(
            self.reserved_balance >= amount,
            crate::Error::<T>::InsufficientReservedBalance
        );
        Ok(())
    }

    /// freeze specified amount: infallible
    pub(crate) fn unfreeze(&mut self, amount: Balance) {
        self.free_balance = self.free_balance.saturating_add(amount);
        self.reserved_balance = self.reserved_balance.saturating_sub(amount);
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
    pub(crate) fn slash(&mut self, amount: Balance, existential_deposit: Balance) {
        let new_amount = self.free_balance.saturating_sub(amount);
        let new_total = self.reserved_balance.saturating_add(new_amount);
        self.free_balance = if new_total > existential_deposit {
            new_amount
        } else {
            Balance::zero()
        };
    }
}

/// Interface for interacting with TokenData
impl<Balance: Copy + PartialOrd + Saturating, AccountId> TokenData<Balance, AccountId> {
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
    /// Retrieve free balance amount
    pub fn existential_deposit(&self) -> Balance {
        self.existential_deposit
    }
}

/// Encapsules parameters validation + TokenData construction
impl<Balance: Zero + Copy + PartialOrd, AccountId> TokenIssuanceParameters<Balance, AccountId> {
    /// Forward `self` state
    pub fn try_build<T: crate::Trait>(
        self,
    ) -> Result<TokenData<Balance, AccountId>, DispatchError> {
        ensure!(
            self.initial_issuance >= self.existential_deposit,
            crate::Error::<T>::ExistentialDepositExceedsInitialIssuance,
        );
        Ok(TokenData::<Balance, AccountId> {
            current_total_issuance: self.initial_issuance,
            owner_account: self.owner_account,
            issuance_state: self.initial_state,
            existential_deposit: self.existential_deposit,
        })
    }
}

// Aliases
/// Alias for Account Data
pub(crate) type AccountDataOf<T> = AccountData<<T as crate::Trait>::Balance>;

/// Alias for Token Data
pub(crate) type TokenDataOf<T> =
    TokenData<<T as crate::Trait>::Balance, <T as frame_system::Trait>::AccountId>;

/// Alias for Token Issuance Parameters
pub(crate) type TokenIssuanceParametersOf<T> =
    TokenIssuanceParameters<<T as crate::Trait>::Balance, <T as frame_system::Trait>::AccountId>;
