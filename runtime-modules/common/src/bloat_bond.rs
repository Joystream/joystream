use codec::{Decode, Encode};
use frame_support::{
    dispatch::DispatchResult,
    pallet_prelude::MaybeSerializeDeserialize,
    traits::{Currency, ExistenceRequirement},
};
use scale_info::TypeInfo;
#[cfg(feature = "std")]
use serde::{Deserialize, Serialize};
use sp_std::fmt::Debug;

#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Clone, Debug, PartialEq, Eq, PartialOrd, Ord, TypeInfo)]
pub struct RepayableBloatBond<AccountId, Balance> {
    /// Account where the bloat should be repaid (if restricted).
    pub repayment_restricted_to: Option<AccountId>,
    /// Repayable amount
    pub amount: Balance,
}

pub type RepayableBloatBondOf<T> =
    RepayableBloatBond<<T as frame_system::Config>::AccountId, <T as balances::Config>::Balance>;

impl<AccountId, Balance: Default> Default for RepayableBloatBond<AccountId, Balance> {
    fn default() -> Self {
        Self {
            repayment_restricted_to: None,
            amount: Default::default(),
        }
    }
}

impl<AccountId: Clone, Balance: Copy + Debug + MaybeSerializeDeserialize>
    RepayableBloatBond<AccountId, Balance>
{
    pub fn new(amount: Balance, repayment_restricted_to: Option<AccountId>) -> Self {
        Self {
            amount,
            repayment_restricted_to,
        }
    }

    pub fn get_recipient(&self, fallback_to: &AccountId) -> AccountId {
        self.repayment_restricted_to
            .clone()
            .unwrap_or_else(|| fallback_to.clone())
    }

    // Repay the bloat bond.
    // Payment will be sent from `from` account into either:
    // - `self.repayment_restricted_to` account (if set)
    // - `fallback_to` account (if `self.repayment_restricted_to` is not set)
    pub fn repay<T>(
        &self,
        from: &T::AccountId,
        fallback_to: &T::AccountId,
        allow_death: bool,
    ) -> DispatchResult
    where
        T: frame_system::Config<AccountId = AccountId> + balances::Config<Balance = Balance>,
    {
        let to = self.get_recipient(fallback_to);

        <balances::Pallet<T> as Currency<T::AccountId>>::transfer(
            from,
            &to,
            self.amount,
            match allow_death {
                true => ExistenceRequirement::AllowDeath,
                false => ExistenceRequirement::KeepAlive,
            },
        )
    }
}
