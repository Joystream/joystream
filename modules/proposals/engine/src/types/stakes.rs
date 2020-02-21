use super::{BalanceOf, CurrencyOf, NegativeImbalance};
use crate::Trait;
use rstd::convert::From;
use rstd::marker::PhantomData;
use rstd::rc::Rc;
use runtime_primitives::traits::{One};
// use runtime_primitives::traits::{OnFinalize};
use srml_support::traits::{Currency, ExistenceRequirement, WithdrawReasons};

// Mocking dependencies for testing
#[cfg(test)]
use mockall::predicate::*;
#[cfg(test)]
use mockall::*;

/// Returns registered stake handler. This is scaffolds for the mocking of the stake module.
pub trait StakeHandlerProvider<T: Trait> {
    /// Returns stake logic handler
    fn stakes() -> Rc<dyn StakeHandler<T>>;
}

/// Default implementation of the stake module logic provider. Returns actual implementation
/// dependent on the stake module.
pub struct DefaultStakeHandlerProvider;
impl<T: Trait> StakeHandlerProvider<T> for DefaultStakeHandlerProvider {
    /// Returns stake logic handler
    fn stakes() -> Rc<dyn StakeHandler<T>> {
        Rc::new(DefaultStakeHandler {
            marker: PhantomData::<T>::default(),
        })
    }
}

/// Stake logic handler.
#[cfg_attr(test, automock)] // attributes creates mocks in tesing environment
pub trait StakeHandler<T: Trait> {
    /// Creates a stake using stake balance and source account.
    /// Returns created stake id or an error.
    fn create_stake(
        &self,
        stake_balance: BalanceOf<T>,
        source_account_id: T::AccountId,
    ) -> Result<T::StakeId, &'static str>;

    /// Execute unstaking and removes stake
    fn remove_stake(&self, stake_id: T::StakeId) -> Result<(), &'static str>;

    /// Slash balance from the existing stake
    fn slash(&self, stake_id: T::StakeId, slash_balance: BalanceOf<T>) -> Result<(), &'static str>;
}

/// Default implementation of the stake logic. Uses actual stake module.
/// 'marker' responsible for the 'Trait' binding.
pub(crate) struct DefaultStakeHandler<T> {
    pub marker: PhantomData<T>,
}

impl<T: Trait> StakeHandler<T> for DefaultStakeHandler<T> {
    /// Creates a stake using stake balance and source account.
    /// Returns created stake id or an error.
    fn create_stake(
        &self,
        stake_balance: BalanceOf<T>,
        source_account_id: T::AccountId,
    ) -> Result<T::StakeId, &'static str> {
        let stake_id = stake::Module::<T>::create_stake();

        let stake_imbalance = Self::make_stake_imbalance(stake_balance, &source_account_id)?;

        stake::Module::<T>::stake(&stake_id, stake_imbalance).map_err(WrappedError)?;

        Ok(stake_id)
    }

    /// Slash balance from the existing stake
    fn slash(&self, stake_id: T::StakeId, slash_balance: BalanceOf<T>) -> Result<(), &'static str> {
        let _slash_id =
            stake::Module::<T>::initiate_slashing(&stake_id, slash_balance, T::BlockNumber::one())
                .map_err(WrappedError)?;

//        stake::Module::<T>::on_finalize(<system::Module<T>>::block_number());

        Ok(())
    }

    /// Execute unstaking and removes the stake
    fn remove_stake(&self, stake_id: T::StakeId) -> Result<(), &'static str> {
        stake::Module::<T>::initiate_unstaking(&stake_id, Some(T::BlockNumber::one())).map_err(WrappedError)?;

        stake::Module::<T>::remove_stake(&stake_id).map_err(WrappedError)?;

        Ok(())
    }
}

impl<T: Trait> DefaultStakeHandler<T> {
    // Withdraw some balance from the source account and create stake imbalance
    fn make_stake_imbalance(
        balance: BalanceOf<T>,
        source_account_id: &T::AccountId,
    ) -> Result<NegativeImbalance<T>, &'static str> {
        CurrencyOf::<T>::withdraw(
            source_account_id,
            balance,
            WithdrawReasons::all(),
            ExistenceRequirement::AllowDeath,
        )
    }
}

// 'New type' pattern for the error
// https://doc.rust-lang.org/book/ch19-03-advanced-traits.html#using-the-newtype-pattern-to-implement-external-traits-on-external-types
struct WrappedError<E>(E);

// error conversion for the Wrapped StakeActionError with the inner InitiateUnstakingError
impl From<WrappedError<stake::StakeActionError<stake::InitiateUnstakingError>>> for &str {
    fn from(wrapper: WrappedError<stake::StakeActionError<stake::InitiateUnstakingError>>) -> Self {
        {
            match wrapper.0 {
                stake::StakeActionError::StakeNotFound => "StakeNotFound",
                stake::StakeActionError::Error(err) => match err {
                    stake::InitiateUnstakingError::UnstakingPeriodShouldBeGreaterThanZero => {
                        "UnstakingPeriodShouldBeGreaterThanZero"
                    }
                    stake::InitiateUnstakingError::UnstakingError(e) => match e {
                        stake::UnstakingError::NotStaked => "NotStaked",
                        stake::UnstakingError::AlreadyUnstaking => "AlreadyUnstaking",
                        stake::UnstakingError::CannotUnstakeWhileSlashesOngoing => {
                            "CannotUnstakeWhileSlashesOngoing"
                        }
                    },
                },
            }
        }
    }
}

// error conversion for the Wrapped StakeActionError with the inner StakingError
impl From<WrappedError<stake::StakeActionError<stake::StakingError>>> for &str {
    fn from(wrapper: WrappedError<stake::StakeActionError<stake::StakingError>>) -> Self {
        {
            match wrapper.0 {
                stake::StakeActionError::StakeNotFound => "StakeNotFound",
                stake::StakeActionError::Error(err) => match err {
                    stake::StakingError::CannotStakeZero => "CannotStakeZero",
                    stake::StakingError::CannotStakeLessThanMinimumBalance => {
                        "CannotStakeLessThanMinimumBalance"
                    }
                    stake::StakingError::AlreadyStaked => "AlreadyStaked",
                },
            }
        }
    }
}

// error conversion for the Wrapped StakeActionError with the inner InitiateSlashingError
impl From<WrappedError<stake::StakeActionError<stake::InitiateSlashingError>>> for &str {
    fn from(wrapper: WrappedError<stake::StakeActionError<stake::InitiateSlashingError>>) -> Self {
        {
            match wrapper.0 {
                stake::StakeActionError::StakeNotFound => "StakeNotFound",
                stake::StakeActionError::Error(err) => match err {
                    stake::InitiateSlashingError::NotStaked => "NotStaked",
                    stake::InitiateSlashingError::SlashPeriodShouldBeGreaterThanZero => {
                        "SlashPeriodShouldBeGreaterThanZero"
                    }
                    stake::InitiateSlashingError::SlashAmountShouldBeGreaterThanZero => {
                        "SlashAmountShouldBeGreaterThanZero"
                    }
                },
            }
        }
    }
}
