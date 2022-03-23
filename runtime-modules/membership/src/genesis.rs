//! Membership genesis module.

#![cfg(feature = "std")]

use crate::{GenesisConfig, Trait};
use serde::{Deserialize, Serialize};

#[derive(Clone, Serialize, Deserialize)]
pub struct Member<MemberId, AccountId> {
    pub member_id: MemberId,
    pub root_account: AccountId,
    pub controller_account: AccountId,
    pub handle: String,
    pub avatar_uri: String,
    pub about: String,
}

/// Builder fo membership module genesis configuration.
pub struct GenesisConfigBuilder<T: Trait> {
    members: Vec<(T::MemberId, T::AccountId)>,
}

impl<T: Trait> Default for GenesisConfigBuilder<T> {
    fn default() -> Self {
        Self { members: vec![] }
    }
}

impl<T: Trait> GenesisConfigBuilder<T> {
    /// Assign a collection of MemberId and AccountId pairs, used to derive mock member at genesis
    pub fn members(mut self, members: Vec<(T::MemberId, T::AccountId)>) -> Self {
        self.members = members;
        self
    }

    /// Generates a Vec of `Member`s from pairs of MemberId and AccountId
    fn generate_mock_members(&self) -> Vec<Member<T::MemberId, T::AccountId>> {
        self.members
            .iter()
            .enumerate()
            .map(|(ix, (ref member_id, ref account_id))| Member {
                member_id: *member_id,
                root_account: account_id.clone(),
                controller_account: account_id.clone(),
                // hack to get min handle length to 5
                handle: (10000 + ix).to_string(),
                avatar_uri: "".into(),
                about: "".into(),
            })
            .collect()
    }

    /// Construct GenesisConfig for mocked testing purposes only
    pub fn build(&self) -> GenesisConfig<T> {
        GenesisConfig::<T> {
            members: self.generate_mock_members(),
        }
    }
}
