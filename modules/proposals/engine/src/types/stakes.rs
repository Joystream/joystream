use super::{BalanceOf, CurrencyOf, NegativeImbalance};
use crate::Trait;
use rstd::marker::PhantomData;
use srml_support::traits::{Currency, ExistenceRequirement, WithdrawReasons};

/// Returns registered stake handler. This is scaffolds for the mocking of the stake module.
pub trait StakeHandlerProvider<T: Trait> {
    /// Returns stake logic handler
    fn stakes() -> Box<dyn StakeHandler<T>>;
}

/// Default implementation of the stake module logic provider. Returns actual implementation
/// dependent on the stake module.
pub struct DefaultStakeHandlerProvider;
impl<T: Trait> StakeHandlerProvider<T> for DefaultStakeHandlerProvider {
    /// Returns stake logic handler
    fn stakes() -> Box<dyn StakeHandler<T>> {
        Box::new(DefaultStakeHandler {
            marker: PhantomData::<T>::default(),
        })
    }
}

/// Stake logic handler.
pub trait StakeHandler<T: Trait> {
    /// Creates a stake using stake balance and source account.
    /// Returns created stake id or an error.
    fn create_stake(
        &self,
        stake_balance: BalanceOf<T>,
        source_account_id: T::AccountId,
    ) -> Result<T::StakeId, &'static str>;
}

/// Default implementation of the stake logic. Uses actual stake module.
/// 'marker' responsible for the 'Trait' binding.
pub struct DefaultStakeHandler<T> {
    marker: PhantomData<T>,
}

impl<T: Trait> StakeHandler<T> for DefaultStakeHandler<T> {
    /// Creates a stake using stake balance and source account.
    /// Returns created stake id or an error.
    fn create_stake(
        &self,
        stake_balance: BalanceOf<T>,
        source_account_id: T::AccountId,
    ) -> Result<T::StakeId, &'static str> {
        // error conversion for the stake() operation
        fn convert_stake_action_error(
            err: stake::StakeActionError<stake::StakingError>,
        ) -> &'static str {
            match err {
                stake::StakeActionError::StakeNotFound => "StakeNotFound",
                stake::StakeActionError::Error(e) => match e {
                    stake::StakingError::CannotStakeZero => "CannotStakeZero",
                    stake::StakingError::CannotStakeLessThanMinimumBalance => {
                        "CannotStakeLessThanMinimumBalance"
                    }
                    stake::StakingError::AlreadyStaked => "AlreadyStaked",
                },
            }
        };

        let stake_id = stake::Module::<T>::create_stake();

        let stake_imbalance = Self::make_stake_imbalance(stake_balance, &source_account_id)?;

        stake::Module::<T>::stake(&stake_id, stake_imbalance)
            .map_err(convert_stake_action_error)?;

        Ok(stake_id)
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
