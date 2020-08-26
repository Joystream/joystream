// commented out to use in other crates
// #![cfg(test)]

use crate::genesis_member;
use crate::{GenesisConfig, Trait};
use common::currency::BalanceOf;

/// Builder fo membership module genesis configuration.
pub struct GenesisConfigBuilder<T: Trait> {
    default_paid_membership_fee: BalanceOf<T>,
    members: Vec<(T::MemberId, T::AccountId)>,
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
    pub fn members(mut self, members: Vec<(T::MemberId, T::AccountId)>) -> Self {
        self.members = members;
        self
    }

    /// Construct GenesisConfig for mocked testing purposes only
    pub fn build(&self) -> GenesisConfig<T> {
        GenesisConfig::<T> {
            default_paid_membership_fee: self.default_paid_membership_fee,
            members: self
                .members
                .iter()
                .map(|(ref member_id, ref account_id)| genesis_member::Member {
                    member_id: *member_id,
                    root_account: account_id.clone(),
                    controller_account: account_id.clone(),
                    handle: "".into(),
                    avatar_uri: "".into(),
                    about: "".into(),
                    registered_at_time: T::Moment::from(0),
                })
                .collect(),
        }
    }
}
