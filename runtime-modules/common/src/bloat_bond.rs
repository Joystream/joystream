use codec::{Decode, Encode};
use frame_support::{
    dispatch::DispatchResult,
    pallet_prelude::MaybeSerializeDeserialize,
    traits::{Currency, ExistenceRequirement},
};
use scale_info::TypeInfo;
#[cfg(feature = "std")]
use serde::{Deserialize, Serialize};
use sp_runtime::DispatchError;
use sp_std::fmt::Debug;

#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Clone, Debug, PartialEq, Eq, PartialOrd, Ord, TypeInfo)]
pub struct RepayableBloatBond<AccountId, Balance> {
    /// Account where the bloat bond will be repaid.
    account: Option<AccountId>, // We're using Option to sidestep the Default impl issue
    /// Repayable amount
    pub amount: Balance,
}

impl<AccountId, Balance: Default> Default for RepayableBloatBond<AccountId, Balance> {
    fn default() -> Self {
        Self {
            account: None,
            amount: Default::default(),
        }
    }
}

impl<AccountId, Balance: Copy + Debug + MaybeSerializeDeserialize>
    RepayableBloatBond<AccountId, Balance>
{
    pub fn new(account: AccountId, amount: Balance) -> Self {
        Self {
            account: Some(account),
            amount,
        }
    }

    pub fn get_recipient(&self) -> Option<&AccountId> {
        self.account.as_ref()
    }

    pub fn repay<T>(&self, from: &T::AccountId, allow_death: bool) -> DispatchResult
    where
        T: frame_system::Config<AccountId = AccountId> + balances::Config<Balance = Balance>,
    {
        if let Some(recipient) = self.account.as_ref() {
            <balances::Pallet<T> as Currency<T::AccountId>>::transfer(
                from,
                recipient,
                self.amount,
                match allow_death {
                    true => ExistenceRequirement::AllowDeath,
                    false => ExistenceRequirement::KeepAlive,
                },
            )
        } else {
            Err(DispatchError::Other(
                "Cannot repay bloat bond: Missing destination",
            ))
        }
    }
}
