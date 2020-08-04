#![cfg(test)]

use common::currency::BalanceOf;

use crate::{GenesisConfig, Trait};

/// Builder fo membership module genesis configuration.
pub struct GenesisConfigBuilder<T: Trait> {
    default_paid_membership_fee: BalanceOf<T>,
    members: Vec<T::AccountId>,
}

impl<T: Trait> Default for GenesisConfigBuilder<T> {
    fn default() -> Self {
        Self {
            default_paid_membership_fee: BalanceOf::<T>::default(), // Was 100, will this break any tests??
            members: vec![],
        }
    }
}

impl<T: Trait> GenesisConfigBuilder<T> {
    pub fn default_paid_membership_fee(
        mut self,
        default_paid_membership_fee: BalanceOf<T>,
    ) -> Self {
        self.default_paid_membership_fee = default_paid_membership_fee;
        self
    }
    pub fn members(mut self, members: Vec<T::AccountId>) -> Self {
        self.members = members;
        self
    }

    pub fn build(&self) -> GenesisConfig<T> {
        GenesisConfig::<T> {
            default_paid_membership_fee: self.default_paid_membership_fee,
            members: self
                .members
                .iter()
                .map(|account_id| (account_id.clone(), "".into(), "".into(), "".into()))
                .collect(),
        }
    }
}
